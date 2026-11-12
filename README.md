# SkillBridge AI

**"Your Skills Are Worth More Than Your CV."**

An AI-powered opportunity intelligence platform that bridges the gap between your existing skills, employment opportunities, and the learning pathways needed to improve employability.

Built for **IBM Bobathon 2026: Build for Bengaluru** under the theme *"More Opportunity, Greater Together"*.

---

## What It Does

1. **Build your profile** — education, projects, certifications, career interests
2. **AI extracts your skills** — you review and confirm every suggestion
3. **Discover matched opportunities** — ranked by explainable skill-match scores
4. **Understand your gaps** — present skills ✓, missing skills ✗, transferable skills ~
5. **Follow a personalised roadmap** — ordered learning steps with free resource links
6. **Track your progress** — mark steps complete and watch your readiness score grow

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 |
| Routing | React Router 6 |
| Backend | Node.js + Express 4 |
| Database | SQLite via @libsql/client (WASM, no native compilation) |
| AI | OpenAI GPT-4o-mini (server-side only) |

---

## Project Structure

```
skillbridge-ai/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/       # Button, Card, Badge
│   │   │   └── layout/   # SiteHeader, SiteFooter, PageShell
│   │   ├── pages/        # LandingPage, OnboardingPage, etc.
│   │   └── services/     # api.js — fetch wrapper
│   └── ...
├── server/          # Node.js + Express backend
│   └── src/
│       ├── routes/  # health, session (+ profile, skills, opportunities… Day 2+)
│       ├── services/# AI orchestration (Day 3+)
│       └── db/      # SQLite init, schema, seed
├── shared/          # skillTaxonomy.json — skill name normalisation
└── docs/            # bob-story.md, api.md
```

---

## Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later
- An **OpenAI API key** (get one at [platform.openai.com](https://platform.openai.com/api-keys))

---

## Local Development Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/skillbridge-ai.git
cd skillbridge-ai
```

### 2. Install backend dependencies

```bash
cd server
npm install
```

### 3. Configure backend environment

```bash
cp .env.example .env
```

Open `server/.env` and set your values:

```env
PORT=3001
CLIENT_URL=http://localhost:5173
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
DEMO_USER_NAME=Demo User
DEMO_USER_EMAIL=demo@skillbridge.ai
```

⚠️ **Never commit `.env` to version control.** It is already in `.gitignore`.

### 4. Start the backend

```bash
# From the server/ directory
npm run dev
```

You should see:
```
📦  Database ready at .../server/skillbridge.db
🌱  Demo user seeded (id: ...)
✅  SkillBridge AI server running on http://localhost:3001
```

### 5. Install frontend dependencies

```bash
# From the project root
cd ../client
npm install
```

### 6. Start the frontend

```bash
# From the client/ directory
npm run dev
```

Vite will start at **http://localhost:5173**. API calls to `/api/*` are automatically proxied to `http://localhost:3001`.

---

## Verification

Once both servers are running, verify the setup:

```bash
# Health check
curl http://localhost:3001/api/health

# Session endpoint
curl http://localhost:3001/api/session
```

Expected responses:
```json
// Health
{ "status": "ok", "service": "SkillBridge AI API", "timestamp": "..." }

// Session
{ "session": { "id": "...", "email": "demo@skillbridge.ai", "fullName": "Demo User", "profile": { ... } } }
```

Then open **http://localhost:5173** in your browser and click **Start Demo**.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `3001` | Express server port |
| `CLIENT_URL` | No | `http://localhost:5173` | Frontend URL for CORS |
| `OPENAI_API_KEY` | **Yes** (for AI features) | — | OpenAI API key |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model to use |
| `DEMO_USER_NAME` | No | `Demo User` | Display name for demo user |
| `DEMO_USER_EMAIL` | No | `demo@skillbridge.ai` | Email for demo user |

---

## Important Disclaimer

All opportunities shown in this application are **fictional demonstration data** created for the IBM Bobathon hackathon. They are not real job vacancies, and the companies named are not real employers. This is not a recruitment or placement service.

---

## Built With IBM Bob

This project was designed, implemented, and refined with [IBM Bob](https://www.ibm.com/products/bob). See [`docs/bob-story.md`](docs/bob-story.md) for a full record of how Bob contributed to each development day.

---

## Licence

MIT
