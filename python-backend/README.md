# HireIQ Python AI Backend

This FastAPI application provides the AI core for the HireIQ recruitment platform. It leverages state-of-the-art embedding models to parse, analyze, and score candidate resumes against job descriptions.

## Architecture

The backend exposes several endpoints to the Next.js frontend:

1.  **Parse and Extract:** Extracts structured JSON data (skills, experience, contact info) from raw unstructured text (PDFs, DOCX).
2.  **Semantic Embedding:** Converts the parsed text into vector embeddings using SentenceTransformers for semantic similarity matching.
3.  **Bias Detection:** Scans text for potentially biased language (gender, age, race, etc.) and provides actionable feedback.

## Setup

Ensure you have Python 3.9+ installed.

```bash
# Create a virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the server
uvicorn main:app --reload
```

## API Endpoints

### `POST /parse`
Extracts structured information from raw text.
- **Body:** `{"text": "Raw resume text here..."}`
- **Response:** `{"parsed": {...json...}, "raw_text": "...", "embedding": [...]}`

### `POST /score`
Scores a candidate's resume against a job description.
- **Body:** `{"candidate_embedding": [...], "job_embedding": [...]}`
- **Response:** `{"score": 85, "semantic_match": 88, ...}`

### `POST /detect-bias`
Analyzes text for potentially biased language.
- **Body:** `{"text": "Looking for a young, energetic rockstar developer."}`
- **Response:** `{"flags": [{"category": "age", "flag_text": "young", "severity": "high", "guidance": "Use 'entry-level' instead."}]}`

## Performance

The AI backend uses `all-MiniLM-L6-v2` for embeddings. This model is lightweight and designed to run efficiently on CPU for fast response times.
