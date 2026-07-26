# TattooPlacement

> Where would you put your tattoo? Click the body, confirm your pick, and see the heatmap of everyone's choices.

Live at **https://phasic.github.io/TattooPlacement/**

## Stack

- **Vite + React + TypeScript** — SPA, no SSR
- **Inline SVG** — body outline, click coordinates normalized to viewBox (0–1)
- **Firebase Firestore** — stores click points (`x`, `y`, `createdAt`); client-only, no server
- **heatmap.js** — canvas heatmap rendered over the SVG
- **GitHub Actions** — auto-deploys `dist/` to `gh-pages` branch on every push to `main`

## Local Setup

### 1. Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project.
2. Add a **Web app** and copy the config values.
3. Enable **Firestore** in production mode, then paste the rules below.

#### Firestore security rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /placements/{doc} {
      allow read: if true;
      allow create: if request.resource.data.x is number
        && request.resource.data.x >= 0 && request.resource.data.x <= 1
        && request.resource.data.y is number
        && request.resource.data.y >= 0 && request.resource.data.y <= 1;
      allow update, delete: if false;
    }
  }
}
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in your Firebase values:

```bash
cp .env.example .env.local
```

`.env.local` is gitignored — never commit it.

### 3. Run locally

```bash
npm install
npm run dev
```

## Deployment (GitHub Actions — automatic)

The workflow at `.github/workflows/deploy.yml` builds on every push to `main` and publishes `dist/` to the `gh-pages` branch.

**Add these secrets to your repo** (`Settings → Secrets → Actions`):

| Secret | Value |
|--------|-------|
| `VITE_FIREBASE_API_KEY` | from Firebase console |
| `VITE_FIREBASE_AUTH_DOMAIN` | |
| `VITE_FIREBASE_PROJECT_ID` | |
| `VITE_FIREBASE_STORAGE_BUCKET` | |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | |
| `VITE_FIREBASE_APP_ID` | |

After the first deploy, enable **GitHub Pages** in repo settings → source: `gh-pages` branch.

## Manual deploy

```bash
npm run deploy   # builds and pushes dist/ to gh-pages
```

## Abuse prevention

Each browser gets **one submission per hour** (stored in `localStorage`). This is not robust anti-spam — it's just enough to keep demo data clean. The tradeoff: it's trivially bypassed via private browsing or clearing storage, but requires zero authentication and no user friction for honest visitors.

## Data model

**Collection:** `placements`

```ts
{
  x: number        // 0–1, normalized to SVG viewBox width
  y: number        // 0–1, normalized to SVG viewBox height
  createdAt: Timestamp
}
```
