#!/bin/bash
# HireIQ AI Backend — startup script
set -e

# Always use the Python where packages were installed
PY=/Library/Frameworks/Python.framework/Versions/3.13/bin/python3

echo "🚀 Starting HireIQ AI Backend..."
echo "   Python: $PY"
echo ""

# Check if spaCy model is installed
$PY -c "import spacy; spacy.load('en_core_web_sm')" 2>/dev/null || {
  echo "📦 Downloading spaCy model..."
  $PY -m spacy download en_core_web_sm
}

# Check Ollama
if command -v ollama &>/dev/null; then
  echo "🦙 Ollama found. Checking if server is running..."
  if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "🦙 Starting Ollama server in background..."
    ollama serve &
    sleep 3
  fi
  echo "🦙 Checking Mistral model..."
  ollama list | grep -q "mistral" || {
    echo "📥 Pulling mistral (first time only, ~4GB)..."
    ollama pull mistral
  }
else
  echo "⚠️  Ollama not found. Running in spaCy-only mode."
  echo "   Install: brew install ollama && ollama pull mistral"
fi

echo ""
echo "✅ Starting FastAPI on http://localhost:8000"
echo "   Docs: http://localhost:8000/docs"
echo ""
cd "$(dirname "$0")"
$PY -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
