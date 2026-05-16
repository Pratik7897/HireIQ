import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types
export interface Candidate {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  raw_text: string | null;
  parsed_json: ParsedResume | null;
  file_url: string | null;
  file_name: string | null;
  total_years_experience: number | null;
  uploaded_at: string;
  created_at: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  location: string;
  skills: string[];
  experience: { company: string; title: string; duration: string; description: string }[];
  education: { degree: string; institution: string; year: string }[];
  total_years_experience: number;
}

export interface Job {
  id: string;
  title: string;
  department: string | null;
  company: string | null;
  seniority_level: string | null;
  raw_jd_text: string | null;
  required_skills: string[] | null;
  preferred_skills: string[] | null;
  file_url: string | null;
  created_at: string;
}

export interface CandidateScore {
  id: string;
  candidate_id: string;
  job_id: string;
  match_score: number;
  skill_match_pct: number;
  matched_skills: string[];
  missing_skills: string[];
  bonus_skills: string[];
  score_reasoning: string;
  ai_summary: string | null;
  scored_at: string;
}

export interface BiasFlag {
  id: string;
  candidate_id: string;
  job_id: string | null;
  flag_type: string;
  flag_text: string;
  severity: 'low' | 'medium' | 'high';
  guidance: string;
  overall_risk: 'low' | 'medium' | 'high';
  created_at: string;
}

export interface HiringEvent {
  id: string;
  candidate_id: string;
  job_id: string | null;
  event_type: string;
  event_data: Record<string, unknown> | null;
  created_at: string;
}
