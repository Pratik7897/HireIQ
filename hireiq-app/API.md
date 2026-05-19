# HireIQ Platform API Documentation

This document describes the API endpoints available within the HireIQ recruitment platform. All APIs are Next.js Route Handlers utilizing JSON as the exchange format and connecting to Supabase for persistence.

---

## 🔐 Authentication & Headers

All API calls must be authenticated via Supabase session cookies or authorization headers.

### Standard Response Headers
*   `Content-Type`: `application/json; charset=utf-8`
*   `Cache-Control`: `no-store, max-age=0, must-revalidate` (for all real-time scoring data)
*   `X-Content-Type-Options`: `nosniff` (security hardening)

---

## 📌 Endpoint Reference

### 1. Candidates API

#### `GET /api/candidates`
Retrieve candidates currently uploaded to the workspace.

*   **Query Parameters:**
    *   `search` (string, optional): Filter by name, email, or experience keywords.
    *   `status` (string, optional): Filter by candidate pipeline status (`applied`, `screening`, `interviewing`, `offered`, `rejected`).
*   **Response (200 OK):**
    ```json
    {
      "candidates": [
        {
          "id": "c-123",
          "name": "Jane Doe",
          "email": "jane@example.com",
          "location": "San Francisco, CA",
          "total_years_experience": 6,
          "status": "screening",
          "created_at": "2026-05-18T12:00:00Z"
        }
      ],
      "total": 1
    }
    ```

#### `GET /api/candidates/[id]`
Retrieve detailed profile, parsed resume metadata, and scoring records for a candidate.

*   **Response (200 OK):**
    ```json
    {
      "candidate": {
        "id": "c-123",
        "name": "Jane Doe",
        "email": "jane@example.com",
        "parsed_json": {
          "skills": ["React", "TypeScript", "Node.js"],
          "experience": ["Senior React Developer at Acme"]
        }
      }
    }
    ```

---

### 2. Jobs API

#### `GET /api/jobs`
List all job descriptions uploaded to the platform.

*   **Response (200 OK):**
    ```json
    {
      "jobs": [
        {
          "id": "j-456",
          "title": "Senior Frontend Engineer",
          "department": "Engineering",
          "seniority_level": "Senior",
          "required_skills": ["React", "TypeScript", "Next.js"]
        }
      ]
    }
    ```

#### `GET /api/jobs/[id]`
Retrieve job specifications, pipeline conversion rates, and the applicant match leaderboard.

*   **Response (200 OK):**
    ```json
    {
      "job": {
        "id": "j-456",
        "title": "Senior Frontend Engineer"
      },
      "leaderboard": [
        {
          "id": "s-789",
          "match_score": 85,
          "candidates": {
            "name": "Jane Doe"
          }
        }
      ]
    }
    ```

---

### 3. AI Scoring & Analytics

#### `POST /api/score-all`
Trigger structured Google Gemini AI parsing and semantic scoring for all active applicants against a specific job role.

*   **Request Body:**
    ```json
    {
      "job_id": "j-456"
    }
    ```
*   **Response (200 OK):**
    ```json
    {
      "scored": 12,
      "errors": 0
    }
    ```

#### `GET /api/analytics`
Fetch aggregate system-wide stats, pipeline distributions, and candidate conversion metrics.

*   **Response (200 OK):**
    ```json
    {
      "totalJobs": 4,
      "totalCandidates": 48,
      "pipelineDistribution": [
        { "name": "Applied", "value": 15 },
        { "name": "Screening", "value": 18 }
      ]
    }
    ```
