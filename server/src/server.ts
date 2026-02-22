import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import multer from 'multer';

const app = express();
const PORT = 3001;
const DATA_DIR = path.join(__dirname, '../../data');
const VIDEOS_DIR = path.join(__dirname, '../../videos');

app.use(cors());
app.use(express.json());

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

// ─── Routines ───

app.get('/api/routines', async (_req, res) => {
  try {
    const routinesDir = path.join(DATA_DIR, 'routines');
    const files = await fs.readdir(routinesDir);
    const routines = [];
    for (const file of files) {
      if (file.endsWith('.json')) {
        const data = await readJSON(path.join(routinesDir, file));
        if (data) routines.push(data);
      }
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

// ─── Start ───

app.listen(PORT, () => {
  console.log(`Guitar Practice API running on http://localhost:${PORT}`);
});
