# HireIQ Database Schema & Security Guidelines

HireIQ is built with a security-first posture, utilising Supabase Row Level Security (RLS) policies and Next.js middleware token checks to isolate candidate personal identifiable information (PII) and ensure bias vetting integrity.

---

## 💾 Database Schema

The platform relies on four primary PostgreSQL tables:

### 1. `jobs` Table
Stores open and draft job descriptions:

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  department TEXT,
  seniority_level TEXT,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_skills TEXT[] NOT NULL DEFAULT '{}',
  summary TEXT,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 2. `candidates` Table
Holds applicant details and structured JSON resume extractions:

```sql
CREATE TABLE candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  location TEXT,
  phone TEXT,
  total_years_experience NUMERIC,
  parsed_json JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'applied' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 3. `scores` Table
Maps candidate qualifications to job requirements using AI evaluation metrics:

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  match_score INT NOT NULL,
  skill_match_pct INT NOT NULL,
  matched_skills TEXT[] DEFAULT '{}',
  missing_skills TEXT[] DEFAULT '{}',
  bonus_skills TEXT[] DEFAULT '{}',
  score_reasoning TEXT,
  semantic_similarity NUMERIC,
  scored_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### 4. `bias_checks` Table
Isolates vetting checks to audit hiring biases without exposing identifiers to the ML model:

```sql
CREATE TABLE bias_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  category TEXT NOT NULL, -- 'gender', 'age', 'ethnicity', etc.
  snippet TEXT NOT NULL, -- Specific text matching the bias check
  explanation TEXT NOT NULL,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

---

## 🛡️ Security Policies (RLS)

By default, Row Level Security (RLS) is enabled on all tables in production:

```sql
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE bias_checks ENABLE ROW LEVEL SECURITY;
```

### Recruiter Access Rules

1.  **Select**: Recruiter must be authenticated (`auth.uid() IS NOT NULL`) to see applicants, scores, and open roles.
2.  **Insert/Update/Delete**: Restrict writing permissions to recruiters belonging to the matching workspace identifier.

---

## 🔒 Security Best Practices

*   **🚫 Never Expose API Keys**: Always run Gemini scoring prompts server-side in API routes. Never expose `GEMINI_API_KEY` to the browser client.
*   **🧩 Bias Anonymization**: When calling Gemini to compute the structured `bias_checks` database entries, candidate names, emails, and phone numbers are stripped to preserve objective auditing.
*   **🔑 JWT & Session Invalidation**: Supabase access tokens are valid for 1 hour. Refresh tokens are used inside Next.js SSR to acquire new tokens. When logging out, sessions are globally invalidated in the Auth schema to prevent replay attacks.
*   **🛡️ Next.js Middleware**: Session validation runs inside Next.js Edge Middleware to intercept unauthorized API hooks before resolving Route Handler functions.
