# ⚡ Ticket Triage Muscle Memory

An intelligent AI customer support triage system featuring **System-1 (Fast Heuristic Rules)** and **System-2 (Google Gemini Classifier)**.

The system mirrors human **muscle memory**:
- When incoming tickets are new, **System-2 (Gemini)** classifies them and extracts salient keywords (`~380ms` latency).
- Once keywords appear consistently ($\ge 2$ occurrences), they crystallize into **System-1 Rules** (`~1.1ms` latency).
- Future tickets matching these learned rules bypass Gemini entirely, resulting in **zero token cost, zero quota usage, and instantaneous response times**.

---

## 🏗️ Architecture

```
                                  +------------------------------+
                                  |   Customer Support Ticket    |
                                  +--------------+---------------+
                                                 |
                                                 v
                                  +------------------------------+
                                  |  System-1: Keyword Rules     |
                                  |    (Threshold >= 2 hits)     |
                                  +--------------+---------------+
                                                 |
                       +-------------------------+-------------------------+
                       |                                                   |
             Rule Hit (Matched)                                  No Rule (Unmatched)
                       |                                                   |
                       v                                                   v
         +---------------------------+                       +---------------------------+
         |     System-1 Fast Path    |                       |    System-2 Deep Triage   |
         |     ~1.1ms latency        |                       |    Google Gemini 2.5 Flash|
         |     0 Gemini Quota used   |                       |    ~380ms latency         |
         +---------------------------+                       +-------------+-------------+
                                                                           |
                                                                           v
                                                             +---------------------------+
                                                             |   Keyword Extraction &    |
                                                             |   Rule Reinforcement      |
                                                             +---------------------------+
```

---

## 🚀 Key Features

- **Decoupled & Hybrid Frontend**: Interactive React + Tailwind CSS dashboard with live API connection to FastAPI and graceful offline fallback.
- **Quota Saver Engine**: Automatically offloads Gemini calls as patterns repeat, protecting your API limits while maintaining high classification accuracy.
- **Real-Time Chronological Stream**: Live classification feed displaying badge distinction (`RULE (SYSTEM-1)` vs. `GEMINI (SYSTEM-2)`), matched keywords, and latency benchmarks.
- **Active Rules Index**: Categorized view of graduated keyword rules (`Billing`, `Technical`, `Account`, `Other`) with live hit counts (`2x`, `3x`).
- **Nielsen's UX & Fitts's Law Compliance**:
  - `Ctrl + Enter` / `Cmd + Enter` quick submission.
  - Automated 10-message demo batch simulation with step-by-step progress tracking.
  - One-click **Reset Demo State** button to test the learning cycle repeatedly.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Tailwind CSS, Vite, NGINX
- **Backend**: FastAPI, Google GenAI SDK (`gemini-2.5-flash`), SQLAlchemy, SQLite / PostgreSQL (Neon)
- **Deployment**: Docker & Docker Compose

---

## 🏃 Quickstart

### 1. Prerequisites
- Docker & Docker Compose (or Python 3.11+ and Node.js 18+)
- A Google Gemini API key

### 2. Environment Setup
Copy `.env.example` to `backend/.env` (or project root `.env`):
```bash
cp .env.example backend/.env
```
Fill in your `GEMINI_API_KEY`:
```env
GEMINI_API_KEY="your-gemini-api-key"
DATABASE_URL="sqlite:///./ticket_triage.db"
GEMINI_MODEL="gemini-2.5-flash"
```

---

## 🐳 Running with Docker

Run both backend and frontend with a single command:
```bash
docker compose up --build
```
- **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 💻 Manual Local Development

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Or on Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing

Run backend tests verifying System-1 rule graduation and Gemini quota protection:
```bash
python -m unittest backend.test_triage
```

---

## 📊 10-Message Demo Sequence

Click **"Run 10-Message Demo Batch"** in the console:
1. **Tickets 1–6**: Triggers Gemini AI classification, learns keywords (`charged`, `login`, `crash`).
2. **Tickets 7–10**: Rules hit System-1 threshold ($\ge 2$) and classify instantly (`~1.1ms`) with **0 new Gemini API calls**.
