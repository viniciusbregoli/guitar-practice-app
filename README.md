# Guitar Practice

A full-stack guitar practice app with:

- React + Vite frontend (`client/`)
- Express + TypeScript API (`server/`)
- File-based persistence in `data/*.json`
- Optional HTTP Basic Auth for private self-hosting

## Prerequisites

- Node.js 20+ (recommended)
- npm
- Docker + Docker Compose (optional)

## Environment

Copy `.env.example` to `.env` and set your credentials before deploying:

```bash
cp .env.example .env
```

If `BASIC_AUTH_USERNAME` and `BASIC_AUTH_PASSWORD` are set, the entire app is protected with HTTP Basic Auth. `/health` stays public for container health checks.

## Run With Docker

From the repo root:

```bash
docker compose up --build
```

This starts the production container that serves both frontend and backend on the same port.

- App: `http://localhost:3001`
- Health check: `http://localhost:3001/health`

To stop:

```bash
docker compose down
```

## Install

Run installs in all three package roots:

```bash
npm install
cd client && npm install
cd ../server && npm install
cd ..
```

## Run In Development

From the repo root:

```bash
npm run dev
```

This starts both frontend and backend concurrently.

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

## Build

### Frontend build

From the repo root:

```bash
npm run build
```

Build output is written to `client/dist`.

### Backend build

```bash
cd server
npm run build
```

### Full production build

```bash
npm run build:all
```

## Run Backend In Production Mode

```bash
cd server
npm run build
npm start
```

## Data Storage

App data is stored in local JSON files under `data/`, for example:

- Songs: `data/songs/library.json`
- Sessions: `data/sessions/history.json`
- Progress: `data/progress/*.json`
- Settings: `data/settings/user-preferences.json`

If these files are committed and pushed, cloning the repo on another machine will include that data.

## Coolify

Use the root `Dockerfile` as the build target in Coolify.

- Exposed port: `3001`
- Health check path: `/health`
- Persistent volumes: mount `/app/data` and `/app/videos`
- Required env vars for auth: `BASIC_AUTH_USERNAME`, `BASIC_AUTH_PASSWORD`
- First boot seeds missing files in `/app/data` from the bundled defaults

The container serves the built React app, the API under `/api`, and uploaded videos under `/videos` from the same domain.
