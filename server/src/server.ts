import express from 'express';
import cors from 'cors';
import path from 'path';
import { existsSync } from 'fs';
import fs from 'fs/promises';
import multer from 'multer';
import crypto from 'crypto';

const app = express();
const PORT = Number(process.env.PORT ?? 3001);
const DATA_DIR = path.join(__dirname, '../../data');
const DEFAULT_DATA_DIR = path.join(__dirname, '../../default-data');
const VIDEOS_DIR = path.join(__dirname, '../../videos');
const CLIENT_DIST_DIR = path.join(__dirname, '../../client/dist');
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
const BASIC_AUTH_REALM = process.env.BASIC_AUTH_REALM ?? 'Guitar Practice';
const basicAuthEnabled = Boolean(BASIC_AUTH_USERNAME && BASIC_AUTH_PASSWORD);

if (Boolean(BASIC_AUTH_USERNAME) !== Boolean(BASIC_AUTH_PASSWORD)) {
  console.warn('Basic auth is disabled because both BASIC_AUTH_USERNAME and BASIC_AUTH_PASSWORD must be set.');
}

app.use(cors());
app.use(express.json());
app.disable('x-powered-by');

function safeCompare(value: string, expected: string): boolean {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(valueBuffer, expectedBuffer);
}

function parseBasicAuthHeader(header?: string): { username: string; password: string } | null {
  if (!header?.startsWith('Basic ')) {
    return null;
  }

  try {
    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf-8');
    const separatorIndex = decoded.indexOf(':');

    if (separatorIndex === -1) {
      return null;
    }

    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
}

function requireBasicAuth(req: express.Request, res: express.Response, next: express.NextFunction): void {
  if (!basicAuthEnabled) {
    next();
    return;
  }

  const credentials = parseBasicAuthHeader(req.headers.authorization);
  const isAuthenticated = credentials
    && safeCompare(credentials.username, BASIC_AUTH_USERNAME!)
    && safeCompare(credentials.password, BASIC_AUTH_PASSWORD!);

  if (isAuthenticated) {
    next();
    return;
  }

  res.setHeader('WWW-Authenticate', `Basic realm="${BASIC_AUTH_REALM}", charset="UTF-8"`);
  res.status(401).send('Authentication required');
}

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    authEnabled: basicAuthEnabled,
    timestamp: new Date().toISOString(),
  });
});

app.use(requireBasicAuth);

// Serve video files
app.use('/videos', express.static(VIDEOS_DIR));

// Video upload
const storage = multer.diskStorage({
  destination: VIDEOS_DIR,
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, '-');
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});
const upload = multer({ storage });

// ─── Helper: read/write JSON ───

async function readJSON(filePath: string): Promise<any> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function writeJSON(filePath: string, data: any): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2));
}

async function seedDirectory(sourceDir: string, targetDir: string): Promise<void> {
  if (!existsSync(sourceDir)) {
    return;
  }

  await fs.mkdir(targetDir, { recursive: true });
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await seedDirectory(sourcePath, targetPath);
      continue;
    }

    try {
      await fs.access(targetPath);
    } catch {
      await fs.copyFile(sourcePath, targetPath);
    }
  }
}

async function ensureRuntimeStorage(): Promise<void> {
  await seedDirectory(DEFAULT_DATA_DIR, DATA_DIR);
  await fs.mkdir(path.join(DATA_DIR, 'routines'), { recursive: true });
  await fs.mkdir(VIDEOS_DIR, { recursive: true });
}

// ─── Routines ───

app.get('/api/routines', async (_req, res) => {
  try {
    const routines = [];
    const routinesDir = path.join(DATA_DIR, 'routines');

    try {
      const files = await fs.readdir(routinesDir);
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await readJSON(path.join(routinesDir, file));
          if (data) routines.push(data);
        }
      }
    } catch {
      // routines dir may not exist yet
    }

    // Also read custom routines
    try {
      const customDir = path.join(routinesDir, 'custom');
      const customFiles = await fs.readdir(customDir);
      for (const file of customFiles) {
        if (file.endsWith('.json')) {
          const data = await readJSON(path.join(customDir, file));
          if (data) routines.push(data);
        }
      }
    } catch {
      // custom dir may not exist
    }
    res.json(routines);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read routines' });
  }
});

app.get('/api/routines/:id', async (req, res) => {
  const filePath = path.join(DATA_DIR, 'routines', `${req.params.id}.json`);
  const data = await readJSON(filePath);
  if (data) res.json(data);
  else res.status(404).json({ error: 'Not found' });
});

app.post('/api/routines', async (req, res) => {
  const routine = req.body;
  const filePath = path.join(DATA_DIR, 'routines', 'custom', `${routine.id}.json`);
  await writeJSON(filePath, routine);
  res.status(201).json(routine);
});

app.put('/api/routines/:id', async (req, res) => {
  const routine = req.body;
  // Check if it's a default routine or custom
  let filePath = path.join(DATA_DIR, 'routines', `${req.params.id}.json`);
  try {
    await fs.access(filePath);
  } catch {
    filePath = path.join(DATA_DIR, 'routines', 'custom', `${req.params.id}.json`);
  }
  await writeJSON(filePath, routine);
  res.json(routine);
});

// ─── Songs ───

const SONGS_FILE = path.join(DATA_DIR, 'songs', 'library.json');

app.get('/api/songs', async (_req, res) => {
  const data = await readJSON(SONGS_FILE);
  res.json(data || { songs: [], updatedAt: new Date().toISOString() });
});

app.put('/api/songs', async (req, res) => {
  await writeJSON(SONGS_FILE, req.body);
  res.json(req.body);
});

// ─── Sessions ───

const SESSIONS_FILE = path.join(DATA_DIR, 'sessions', 'history.json');

app.get('/api/sessions', async (_req, res) => {
  const data = await readJSON(SESSIONS_FILE);
  res.json(data || { sessions: [] });
});

app.post('/api/sessions', async (req, res) => {
  const data = await readJSON(SESSIONS_FILE) || { sessions: [] };
  data.sessions.push(req.body);
  await writeJSON(SESSIONS_FILE, data);
  res.status(201).json(req.body);
});

// ─── Progress ───

const STREAKS_FILE = path.join(DATA_DIR, 'progress', 'streaks.json');
const TOPICS_FILE = path.join(DATA_DIR, 'progress', 'topic-rotation.json');

app.get('/api/progress/streaks', async (_req, res) => {
  const data = await readJSON(STREAKS_FILE);
  res.json(data || { currentStreak: 0, longestStreak: 0, totalSessions: 0, totalPracticeTime: 0, lastPracticeDate: '', calendar: {} });
});

app.put('/api/progress/streaks', async (req, res) => {
  await writeJSON(STREAKS_FILE, req.body);
  res.json(req.body);
});

app.get('/api/progress/topics', async (_req, res) => {
  const data = await readJSON(TOPICS_FILE);
  res.json(data || {});
});

app.put('/api/progress/topics', async (req, res) => {
  await writeJSON(TOPICS_FILE, req.body);
  res.json(req.body);
});

// ─── Settings ───

const SETTINGS_FILE = path.join(DATA_DIR, 'settings', 'user-preferences.json');

app.get('/api/settings', async (_req, res) => {
  const data = await readJSON(SETTINGS_FILE);
  res.json(data || {});
});

app.put('/api/settings', async (req, res) => {
  await writeJSON(SETTINGS_FILE, req.body);
  res.json(req.body);
});

// ─── Video upload ───

app.post('/api/videos/upload', upload.single('video'), (req: any, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'No file uploaded' });
    return;
  }
  res.json({ path: `/videos/${req.file.filename}` });
});

if (existsSync(CLIENT_DIST_DIR)) {
  app.use(express.static(CLIENT_DIST_DIR));

  app.get(/^(?!\/api(?:\/|$)|\/videos(?:\/|$)|\/health$).*/, (_req, res) => {
    res.sendFile(path.join(CLIENT_DIST_DIR, 'index.html'));
  });
}

// ─── Start ───

ensureRuntimeStorage()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Guitar Practice server running on http://localhost:${PORT}`);
      console.log(`Basic auth ${basicAuthEnabled ? 'enabled' : 'disabled'}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize runtime storage', error);
    process.exit(1);
  });
