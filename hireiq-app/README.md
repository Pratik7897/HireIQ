# HireIQ — AI-Powered Talent Analytics & Scoring Platform

HireIQ is a premium, state-of-the-art recruitment automation and screening application that eliminates manual resume vetting. Built with **Next.js 16 (App Router)**, **Supabase SSR**, and **Google Gemini AI (via structured parsing/embedding matching)**, it ranks applicants securely and identifies recruiting biases.

---

## 🚀 Key Features

*   **⚡ Automated Resume Vetting**: Drag-and-drop resumes (PDF, DOCX) to automatically extract text, identify skills, experiences, contact info, and match scores.
*   **🎯 Semantic Matching Engine**: Scored matches calculated using weighted AI skill alignments and vector/keyword similarity against structured job descriptions.
*   **⚖️ Unbiased Recruitment Vetting**: Features AI-driven bias flags for recruiters (checking gender pronouns, age indications, ethnicity clues) to guarantee equal-opportunity hiring.
*   **📊 Live Hiring Analytics**: Fully interactive charts monitoring pipeline distributions, top skill clusters, avg scoring metrics, and vetting conversion rates.
*   **📋 Onboarding checklist**: Guided dashboard workflows keeping first-time users on track to get value immediately.
*   **📱 Universal Mobile Responsive**: Engineered with premium CSS variables, flex box, and grid media rules for flawless desktop and mobile performance.

---

## 🛠️ Technology Stack

1.  **Frontend**: Next.js 16, React, TypeScript.
2.  **Database**: Supabase PostgreSQL with SSR authentication handling.
3.  **Styling**: Premium custom CSS variables mapped to a beautiful glassmorphic olive & off-white color palette.
4.  **AI Engine**: Google Gemini structured JSON schemas for resume parser and interview question generator.

---

## ⚡ Getting Started

### 1. Configure Environment Variables

Create a `.env.local` file inside the `hireiq-app/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
GEMINI_API_KEY=your-gemini-api-key
```

### 2. Local Setup & Startup

Ensure all dependencies are fully installed, then start the development server:

```bash
# Install NPM dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the interface.

### 3. Production Build

To test production bundle compilation and type checking:

```bash
npm run build
```

---

## 🛡️ Directory Structure

```text
hireiq-app/
├── src/
│   ├── app/
│   │   ├── api/             # Supabase data hooks, score-all pipelines, and Gemini integrations
│   │   ├── auth/            # Cookie-based social login callback routes
│   │   ├── candidates/      # Candidate listings, detailed profiles, and AI bias scorecards
│   │   ├── compare/         # Multi-candidate comparison metrics
│   │   ├── jobs/            # Job specifications and pipeline leaderboards
│   │   └── page.tsx         # Guided recruitment control center
│   ├── components/          # Shared components (Sidebar, TopNav, Avatar, ScoreBar)
│   └── lib/                 # Utility libraries, Supabase clients, and text extractors
```

---

## 🛠️ Troubleshooting

### 🐳 Docker Compose AI Backend Setup
If executing scoring pipelines locally, ensure your Python embedding backend is active. You can spin up a pre-configured docker instance via:
```bash
docker compose up -d python-ai-backend
```
Ensure it matches the target `AI_BACKEND_URL` environment parameter.

### ⚠️ Supabase Connection Failures
Ensure that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are correct. If you receive network errors, confirm your internet access is uninterrupted and check the Supabase project dashboard to see if the database instance is currently paused or inactive.

---

## 📄 License

This software is developed for internal screening and recruitment automation. All rights reserved.
