"""
HireIQ Python AI Backend
Replaces Claude API with free local stack:
  - Ollama + Mistral 7B  → structured extraction & summarisation
  - spaCy en_core_web_sm → NER, entity recognition
  - Sentence Transformers → semantic embeddings for matching
  - Custom regex         → bias detection
"""

import os, re, json, logging, io
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import requests
import spacy
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import PyPDF2
import docx
from dotenv import load_dotenv

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s: %(message)s")
log = logging.getLogger("hireiq")

# ─── Global model handles (loaded once at startup) ────────────────────────────
nlp: Optional[spacy.language.Language] = None
embedder: Optional[SentenceTransformer] = None

OLLAMA_BASE = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral:7b-instruct-v0.2")
OLLAMA_AVAILABLE = False


def check_ollama() -> bool:
    try:
        r = requests.get(f"{OLLAMA_BASE}/api/tags", timeout=3)
        models = [m["name"] for m in r.json().get("models", [])]
        available = any(OLLAMA_MODEL.split(":")[0] in m for m in models)
        if available:
            log.info(f"✅ Ollama ready — model: {OLLAMA_MODEL}")
        else:
            log.warning(f"⚠️  Ollama running but {OLLAMA_MODEL} not pulled yet. Run: ollama pull {OLLAMA_MODEL}")
        return available
    except Exception as e:
        log.warning(f"⚠️  Ollama not reachable ({e}). Falling back to spaCy-only mode.")
        return False


@asynccontextmanager
async def lifespan(app: FastAPI):
    global nlp, embedder, OLLAMA_AVAILABLE
    log.info("Loading spaCy model...")
    try:
        nlp = spacy.load("en_core_web_sm")
        log.info("✅ spaCy en_core_web_sm loaded")
    except OSError:
        log.error("spaCy model not found. Run: python -m spacy download en_core_web_sm")
        raise

    log.info("Loading Sentence Transformer (all-MiniLM-L6-v2)...")
    embedder = SentenceTransformer("all-MiniLM-L6-v2")
    log.info("✅ Sentence Transformer loaded")

    OLLAMA_AVAILABLE = check_ollama()
    yield
    log.info("Shutting down HireIQ AI backend")


app = FastAPI(
    title="HireIQ AI Backend",
    description="Free, local AI for resume screening — Ollama + spaCy + Sentence Transformers",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Helpers ──────────────────────────────────────────────────────────────────

def extract_text_from_pdf(contents: bytes) -> str:
    reader = PyPDF2.PdfReader(io.BytesIO(contents))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def extract_text_from_docx(contents: bytes) -> str:
    doc = docx.Document(io.BytesIO(contents))
    return "\n".join(p.text for p in doc.paragraphs)


def ollama_generate(prompt: str, max_tokens: int = 800) -> Optional[str]:
    """Call local Ollama API. Returns raw text or None on failure."""
    if not OLLAMA_AVAILABLE:
        return None
    try:
        r = requests.post(
            f"{OLLAMA_BASE}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": max_tokens, "temperature": 0.1},
            },
            timeout=90,
        )
        return r.json().get("response", "").strip()
    except Exception as e:
        log.warning(f"Ollama call failed: {e}")
        return None


def parse_json_from_llm(raw: str) -> dict:
    """Strip markdown fences and parse JSON from LLM response."""
    text = raw.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    # Find first { and last }
    start, end = text.find("{"), text.rfind("}")
    if start != -1 and end != -1:
        text = text[start : end + 1]
    return json.loads(text)


# ─── spaCy fallback parsers ───────────────────────────────────────────────────

SKILL_KEYWORDS = {
    "python", "javascript", "typescript", "java", "c++", "c#", "go", "rust", "ruby",
    "react", "next.js", "vue", "angular", "node.js", "fastapi", "django", "flask",
    "sql", "postgresql", "mysql", "mongodb", "redis", "elasticsearch",
    "docker", "kubernetes", "aws", "gcp", "azure", "terraform", "ci/cd",
    "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn",
    "nlp", "data science", "pandas", "numpy", "spark", "kafka",
    "git", "linux", "agile", "scrum", "rest", "graphql", "microservices",
    "figma", "photoshop", "illustrator", "ui/ux", "product management",
    "communication", "leadership", "teamwork", "problem solving", "critical thinking",
}

def spacy_parse_resume(text: str, doc=None) -> dict:
    """Extract resume fields using spaCy NER + regex + keyword matching."""
    if doc is None:
        doc = nlp(text)

    name, email, phone, location = None, None, None, None
    companies, titles = [], []

    # Email & phone via regex
    email_m = re.search(r"[\w.+-]+@[\w-]+\.\w+", text)
    if email_m:
        email = email_m.group(0)

    phone_m = re.search(r"(\+?\d[\d\s\-().]{7,}\d)", text)
    if phone_m:
        phone = phone_m.group(0).strip()

    # NER
    for ent in doc.ents:
        if ent.label_ == "PERSON" and not name:
            name = ent.text
        elif ent.label_ in ("GPE", "LOC") and not location:
            location = ent.text
        elif ent.label_ == "ORG":
            companies.append(ent.text)

    # Skills from keyword list
    text_lower = text.lower()
    found_skills = [s for s in SKILL_KEYWORDS if s in text_lower]

    # Years of experience
    years = 0
    yr_match = re.search(r"(\d+)\+?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)", text_lower)
    if yr_match:
        years = int(yr_match.group(1))

    # Build experience blocks (heuristic)
    experience = []
    for comp in list(dict.fromkeys(companies))[:5]:  # deduplicated, max 5
        experience.append({"company": comp, "title": "", "duration": "", "description": ""})

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "location": location,
        "skills": found_skills,
        "experience": experience,
        "education": [],
        "total_years_experience": years,
        "_source": "spacy_fallback",
    }


def ollama_parse_resume(text: str) -> dict:
    """Use Ollama + Mistral to extract structured resume data."""
    prompt = f"""You are a resume parser. Extract structured data from the resume below.
Return ONLY valid JSON with these exact keys:
{{
  "name": string,
  "email": string,
  "phone": string,
  "location": string,
  "skills": [list of strings],
  "experience": [list of {{"company": string, "title": string, "duration": string, "description": string}}],
  "education": [list of {{"degree": string, "institution": string, "year": string}}],
  "total_years_experience": number
}}

Resume text (first 3000 chars):
{text[:3000]}

Return ONLY the JSON object, no markdown, no explanation:"""

    raw = ollama_generate(prompt, max_tokens=900)
    if not raw:
        return {}
    try:
        parsed = parse_json_from_llm(raw)
        parsed["_source"] = "ollama"
        return parsed
    except Exception as e:
        log.warning(f"Failed to parse Ollama resume response: {e}\nRaw: {raw[:200]}")
        return {}


def ollama_parse_jd(text: str) -> dict:
    """Use Ollama + Mistral to extract structured JD data."""
    prompt = f"""You are a job description parser. Extract structured data from the JD below.
Return ONLY valid JSON with these exact keys:
{{
  "title": string,
  "department": string,
  "company": string,
  "seniority_level": "entry"|"mid"|"senior"|"lead"|"executive",
  "required_skills": [list of strings],
  "preferred_skills": [list of strings],
  "summary": string
}}

Job Description:
{text[:3000]}

Return ONLY the JSON object, no markdown:"""

    raw = ollama_generate(prompt, max_tokens=600)
    if not raw:
        return {}
    try:
        return parse_json_from_llm(raw)
    except Exception as e:
        log.warning(f"Failed to parse Ollama JD response: {e}")
        return {}


def spacy_parse_jd(text: str) -> dict:
    """Fallback JD parser using regex + keywords."""
    text_lower = text.lower()
    required_skills = [s for s in SKILL_KEYWORDS if s in text_lower]

    # Seniority heuristic
    seniority = "mid"
    if any(w in text_lower for w in ["senior", "sr.", "sr "]):
        seniority = "senior"
    elif any(w in text_lower for w in ["lead", "principal", "staff"]):
        seniority = "lead"
    elif any(w in text_lower for w in ["manager", "director", "head of"]):
        seniority = "executive"
    elif any(w in text_lower for w in ["junior", "entry", "associate", "intern"]):
        seniority = "entry"

    # Title: first non-blank line
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    title = lines[0] if lines else "Untitled Position"

    return {
        "title": title,
        "department": None,
        "company": None,
        "seniority_level": seniority,
        "required_skills": required_skills[:20],
        "preferred_skills": [],
        "summary": lines[1] if len(lines) > 1 else "",
        "_source": "spacy_fallback",
    }


def ollama_score_candidate(
    candidate_name: str,
    candidate_skills: list,
    experience_years: float,
    job_title: str,
    required_skills: list,
    preferred_skills: list,
    semantic_score: float,
) -> dict:
    """Use Ollama to generate scoring reasoning on top of semantic similarity."""
    prompt = f"""You are a technical recruiter. Score this candidate for the job.

Candidate: {candidate_name}
Skills: {', '.join(candidate_skills[:30])}
Experience: {experience_years} years

Job: {job_title}
Required Skills: {', '.join(required_skills[:20])}
Preferred Skills: {', '.join(preferred_skills[:10])}
Semantic Similarity Score: {semantic_score:.0f}/100

Return ONLY valid JSON:
{{
  "match_score": number (0-100, incorporate semantic_score),
  "matched_skills": [list of strings],
  "missing_skills": [list of strings],
  "bonus_skills": [list of strings],
  "score_reasoning": "one sentence explanation"
}}"""

    raw = ollama_generate(prompt, max_tokens=400)
    if raw:
        try:
            return parse_json_from_llm(raw)
        except Exception:
            pass

    # Fallback: compute purely from set intersection + semantic score
    cand_set = {s.lower() for s in candidate_skills}
    req_set = {s.lower() for s in required_skills}
    pref_set = {s.lower() for s in preferred_skills}

    matched = list(cand_set & req_set)
    missing = list(req_set - cand_set)
    bonus = list(cand_set & pref_set - req_set)

    skill_score = (len(matched) / max(len(req_set), 1)) * 100
    final = round(0.6 * semantic_score + 0.4 * skill_score)

    return {
        "match_score": min(100, final),
        "matched_skills": matched[:15],
        "missing_skills": missing[:15],
        "bonus_skills": bonus[:10],
        "score_reasoning": f"Matched {len(matched)}/{len(req_set)} required skills with {semantic_score:.0f}% semantic similarity.",
        "_source": "fallback",
    }


def ollama_summarise(
    name: str, skills: list, exp: list, edu: list, years: float, job_title: str, score: int
) -> str:
    """Generate 2-paragraph candidate summary."""
    prompt = f"""Write a 2-paragraph recruiter-friendly summary for this candidate.
Be specific and professional. No markdown.

Candidate: {name}
Skills: {', '.join(skills[:20])}
Experience: {', '.join(f"{e.get('title','')} at {e.get('company','')}" for e in exp[:3])}
Education: {', '.join(f"{e.get('degree','')} from {e.get('institution','')}" for e in edu[:2])}
Total experience: {years} years
Applying for: {job_title}
Match score: {score}/100"""

    raw = ollama_generate(prompt, max_tokens=350)
    if raw:
        return raw
    return f"{name} brings {years} years of experience with skills including {', '.join(skills[:5])}. This candidate has a match score of {score}/100 for the {job_title} role."


def detect_bias(text: str) -> dict:
    """Free bias detection: regex keyword flagging + spaCy NER for names/locations."""
    BIAS_PATTERNS = {
        "age_bias": {
            "keywords": ["digital native", "fresh graduate", "young", "energetic rockstar",
                         "new grad", "recent graduate", "must be", "under 30"],
            "severity": "high",
            "guidance": "Avoid age-related language; focus on skills and experience level.",
        },
        "gender_bias": {
            "keywords": [" he ", " she ", " his ", " her ", "guys", "ladies", "manpower",
                         "man the", "chairman", "salesman"],
            "severity": "high",
            "guidance": "Use gender-neutral pronouns and job titles.",
        },
        "disability_bias": {
            "keywords": ["able-bodied", "physically fit", "high energy", "always available",
                         "no health issues"],
            "severity": "high",
            "guidance": "Describe job requirements without implying physical prerequisites.",
        },
        "education_gatekeeping": {
            "keywords": ["ivy league", "top-tier university", "elite university",
                         "prestigious school"],
            "severity": "medium",
            "guidance": "Focus on skills and demonstrated competency, not institution prestige.",
        },
        "culture_fit_vague": {
            "keywords": ["culture fit", "beer test", "like-minded", "one of us",
                         "native english"],
            "severity": "medium",
            "guidance": "Replace vague culture-fit criteria with specific, measurable traits.",
        },
    }

    text_lower = " " + text.lower() + " "
    flags = []

    for bias_type, data in BIAS_PATTERNS.items():
        for kw in data["keywords"]:
            if kw in text_lower:
                flags.append({
                    "flag_type": bias_type,
                    "flag_text": f'Found "{kw}" — {bias_type.replace("_", " ")} indicator',
                    "severity": data["severity"],
                    "guidance": data["guidance"],
                })

    if flags:
        severities = [f["severity"] for f in flags]
        overall = "high" if "high" in severities else "medium" if "medium" in severities else "low"
    else:
        overall = "low"

    return {"flags": flags, "overall_risk": overall}


def ollama_interview_questions(missing_skills: list, job_title: str, candidate_name: str) -> list:
    prompt = f"""Generate exactly 5 targeted interview questions for a candidate applying for {job_title}.
Focus on assessing their potential in these missing skill areas: {', '.join(missing_skills[:10])}.
Questions should assess learning ability and transferable skills.
Candidate: {candidate_name}
Return ONLY a JSON array of 5 strings:
["Question 1?", "Question 2?", "Question 3?", "Question 4?", "Question 5?"]"""

    raw = ollama_generate(prompt, max_tokens=400)
    if raw:
        try:
            # Find JSON array
            start = raw.find("[")
            end = raw.rfind("]")
            if start != -1 and end != -1:
                return json.loads(raw[start: end + 1])
        except Exception:
            pass

    # Fallback questions
    questions = []
    for skill in (missing_skills or ["the required skills"])[:5]:
        questions.append(
            f"Can you describe a time you had to quickly learn {skill}? What was your approach?"
        )
    return questions[:5]


# ─── API Routes ───────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "ollama_available": OLLAMA_AVAILABLE,
        "ollama_model": OLLAMA_MODEL,
        "spacy_loaded": nlp is not None,
        "embedder_loaded": embedder is not None,
    }


@app.post("/api/parse-resume")
async def parse_resume(file: UploadFile = File(...)):
    """
    Upload PDF or DOCX resume → extract text → parse with Ollama (or spaCy fallback).
    Returns structured JSON + embedding vector.
    """
    if not file.filename:
        raise HTTPException(400, "No filename")

    contents = await file.read()
    fname = file.filename.lower()

    # Extract raw text
    if fname.endswith(".pdf"):
        raw_text = extract_text_from_pdf(contents)
    elif fname.endswith((".docx", ".doc")):
        raw_text = extract_text_from_docx(contents)
    else:
        raise HTTPException(400, "Unsupported file type. Use PDF or DOCX.")

    if not raw_text.strip():
        raise HTTPException(400, "Could not extract text. Ensure the PDF is not scanned/image-only.")

    # Parse with Ollama (preferred) or spaCy fallback
    parsed = {}
    if OLLAMA_AVAILABLE:
        parsed = ollama_parse_resume(raw_text)

    if not parsed or not parsed.get("name"):
        doc = nlp(raw_text)
        fallback = spacy_parse_resume(raw_text, doc)
        # Merge: use Ollama for fields it got, spaCy for the rest
        for key in ("name", "email", "phone", "location", "skills", "experience", "education", "total_years_experience"):
            if not parsed.get(key):
                parsed[key] = fallback.get(key)

    # Generate embedding for semantic matching
    text_for_embedding = " ".join([
        parsed.get("name") or "",
        " ".join(parsed.get("skills") or []),
        " ".join(
            f"{e.get('title','')} {e.get('description','')}"
            for e in (parsed.get("experience") or [])
        ),
    ])
    embedding = embedder.encode(text_for_embedding).tolist()

    return {
        "success": True,
        "parsed": parsed,
        "raw_text": raw_text[:50000],
        "embedding": embedding,
    }


@app.post("/api/parse-jd")
async def parse_jd(payload: dict):
    """
    Parse job description text → extract title, required_skills, etc.
    Body: { "text": "..." }
    """
    text = payload.get("text", "").strip()
    if len(text) < 30:
        raise HTTPException(400, "JD text too short")

    parsed = {}
    if OLLAMA_AVAILABLE:
        parsed = ollama_parse_jd(text)

    if not parsed or not parsed.get("required_skills"):
        fallback = spacy_parse_jd(text)
        for key in ("title", "department", "company", "seniority_level", "required_skills", "preferred_skills", "summary"):
            if not parsed.get(key):
                parsed[key] = fallback.get(key)

    # JD embedding for matching
    jd_embed_text = " ".join([
        parsed.get("title") or "",
        " ".join(parsed.get("required_skills") or []),
        " ".join(parsed.get("preferred_skills") or []),
    ])
    embedding = embedder.encode(jd_embed_text).tolist()

    return {"success": True, "parsed": parsed, "embedding": embedding}


class ScoreRequest(BaseModel):
    candidate_name: str
    candidate_skills: list
    candidate_embedding: list
    experience_years: float = 0
    job_title: str
    required_skills: list
    preferred_skills: list = []
    jd_embedding: list


@app.post("/api/score")
async def score_candidate(req: ScoreRequest):
    """
    Compute match score using:
    1. Cosine similarity of embeddings (semantic match)
    2. Skill set intersection
    3. Ollama reasoning (optional enhancement)
    """
    c_emb = np.array(req.candidate_embedding).reshape(1, -1)
    j_emb = np.array(req.jd_embedding).reshape(1, -1)
    semantic_sim = float(cosine_similarity(c_emb, j_emb)[0][0]) * 100

    result = ollama_score_candidate(
        candidate_name=req.candidate_name,
        candidate_skills=req.candidate_skills,
        experience_years=req.experience_years,
        job_title=req.job_title,
        required_skills=req.required_skills,
        preferred_skills=req.preferred_skills,
        semantic_score=semantic_sim,
    )
    result["semantic_similarity"] = round(semantic_sim, 2)
    return {"success": True, **result}


class SummaryRequest(BaseModel):
    candidate_name: str
    skills: list
    experience: list
    education: list
    total_years_experience: float = 0
    job_title: str
    match_score: int


@app.post("/api/summarise")
async def summarise(req: SummaryRequest):
    summary = ollama_summarise(
        name=req.candidate_name,
        skills=req.skills,
        exp=req.experience,
        edu=req.education,
        years=req.total_years_experience,
        job_title=req.job_title,
        score=req.match_score,
    )
    return {"success": True, "summary": summary}


class BiasRequest(BaseModel):
    text: str


@app.post("/api/detect-bias")
async def detect_bias_route(req: BiasRequest):
    result = detect_bias(req.text)
    return {"success": True, **result}


class InterviewRequest(BaseModel):
    missing_skills: list
    job_title: str
    candidate_name: str = "Candidate"


@app.post("/api/interview-questions")
async def interview_questions(req: InterviewRequest):
    questions = ollama_interview_questions(
        missing_skills=req.missing_skills,
        job_title=req.job_title,
        candidate_name=req.candidate_name,
    )
    return {"success": True, "questions": questions}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
