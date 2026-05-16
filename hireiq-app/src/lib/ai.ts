/**
 * HireIQ AI Client
 * All AI calls go to the local Python FastAPI backend (http://localhost:8000)
 * which uses: Ollama + Mistral 7B, spaCy, Sentence Transformers — ZERO API COST
 */

const AI_BASE = process.env.AI_BACKEND_URL || 'http://localhost:8000';

async function aiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${AI_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120_000), // 2-minute timeout for LLM calls
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI backend error (${res.status}): ${err}`);
  }
  return res.json() as Promise<T>;
}

// ─── Health check ──────────────────────────────────────────────────────────
export async function checkAIHealth(): Promise<{
  status: string;
  ollama_available: boolean;
  ollama_model: string;
  spacy_loaded: boolean;
  embedder_loaded: boolean;
}> {
  const res = await fetch(`${AI_BASE}/health`, { signal: AbortSignal.timeout(5000) });
  return res.json();
}

// ─── Types ─────────────────────────────────────────────────────────────────
export interface ParsedResume {
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  skills: string[];
  experience: { company: string; title: string; duration: string; description: string }[];
  education: { degree: string; institution: string; year: string }[];
  total_years_experience: number;
  _source?: string;
}

export interface ParsedJD {
  title: string;
  department: string | null;
  company: string | null;
  seniority_level: string | null;
  required_skills: string[];
  preferred_skills: string[];
  summary: string | null;
  _source?: string;
}

export interface ScoreResult {
  match_score: number;
  matched_skills: string[];
  missing_skills: string[];
  bonus_skills: string[];
  score_reasoning: string;
  semantic_similarity: number;
  _source?: string;
}

export interface BiasResult {
  flags: { flag_type: string; flag_text: string; severity: string; guidance: string }[];
  overall_risk: 'low' | 'medium' | 'high';
}

// ─── Resume Parser via FastAPI (uses Ollama + spaCy) ─────────────────────
export async function parseResumeWithAI(fileBuffer: Buffer, filename: string): Promise<{
  parsed: ParsedResume;
  raw_text: string;
  embedding: number[];
}> {
  const formData = new FormData();
  formData.append('file', new Blob([fileBuffer]), filename);

  const res = await fetch(`${AI_BASE}/api/parse-resume`, {
    method: 'POST',
    body: formData,
    signal: AbortSignal.timeout(120_000),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resume parse error: ${err}`);
  }
  return res.json();
}

// ─── JD Parser via FastAPI ────────────────────────────────────────────────
export async function parseJDWithAI(text: string): Promise<{
  parsed: ParsedJD;
  embedding: number[];
}> {
  return aiPost('/api/parse-jd', { text });
}

// ─── Match Scorer via FastAPI (Sentence Transformers + Ollama) ────────────
export async function scoreCandidate(params: {
  candidate_name: string;
  candidate_skills: string[];
  candidate_embedding: number[];
  experience_years: number;
  job_title: string;
  required_skills: string[];
  preferred_skills: string[];
  jd_embedding: number[];
}): Promise<ScoreResult> {
  return aiPost('/api/score', params);
}

// ─── AI Summary (Ollama) ──────────────────────────────────────────────────
export async function generateCandidateSummary(params: {
  candidate_name: string;
  skills: string[];
  experience: { company: string; title: string; duration: string; description: string }[];
  education: { degree: string; institution: string; year: string }[];
  total_years_experience: number;
  job_title: string;
  match_score: number;
}): Promise<string> {
  const data = await aiPost<{ summary: string }>('/api/summarise', params);
  return data.summary;
}

// ─── Bias Detector (regex + spaCy NER) ───────────────────────────────────
export async function analyseResumeForBias(text: string): Promise<BiasResult> {
  return aiPost('/api/detect-bias', { text });
}

// ─── Interview Question Generator (Ollama) ────────────────────────────────
export async function generateInterviewQuestions(params: {
  missing_skills: string[];
  job_title: string;
  candidate_name: string;
}): Promise<string[]> {
  const data = await aiPost<{ questions: string[] }>('/api/interview-questions', params);
  return data.questions;
}
