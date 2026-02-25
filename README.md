# Guitar Practice

A full-stack guitar practice app with:

- React + Vite frontend (`client/`)
- Express + TypeScript API (`server/`)
- File-based persistence in `data/*.json`

## Prerequisites

- Node.js 20+ (recommended)
- npm
- Docker + Docker Compose (optional)

## Run With Docker

From the repo root:

```bash
docker compose up --build
```

This starts both frontend and backend containers.

- Frontend: `http://localhost:5173`
- API: `http://localhost:3001`

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
