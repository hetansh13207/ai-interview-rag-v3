# AI Interview RAG

## 1. Project Overview

AI Interview RAG is an AI-powered technical interview platform that uses candidate resume data, target role information, retrieval-augmented generation, adaptive questioning, and AI-based evaluation to assess a candidate's technical readiness. The system stores interview transcripts and reports against the authenticated user identity so each person can review their own interview history.

The application combines a static frontend with a FastAPI backend. The frontend handles resume upload, interview setup, auth state, and result presentation. The backend validates resumes, extracts candidate profile data, indexes resume content in Qdrant, generates interview questions, evaluates candidate responses, and persists interview records in PostgreSQL.

## 2. Main Features

### Feature 1 — Resume-Based Technical Interview

The resume-driven interview flow is implemented in the backend and frontend as follows:

1. A candidate uploads a PDF resume from the frontend.
2. The backend validates that the uploaded file is a PDF and that the document appears to be a resume or CV.
3. The PDF is extracted into text with PyMuPDF.
4. The resume is analyzed with an OpenAI-based resume parsing step that extracts structured candidate details such as name, skills, target roles, projects, and experience.
5. The resume text is chunked and embedded for retrieval using the Qdrant vector store.
6. The user selects a target role and begins the interview.
7. The interview uses the selected role and the retrieved resume evidence to ask role-relevant questions.
8. The candidate answers each question, and those answers are analyzed for technical relevance and quality.
9. The system produces a final interview evaluation and report after the interview finishes.
10. The completed interview transcript and evaluation are saved to user-specific history.

The core flow is implemented around the resume upload routes and interview routes in the backend, with RAG retrieval used to ground follow-up questions and evaluation in the actual resume content.

### Feature 2 — Adaptive AI Interview

The project supports adaptive interviewing in two related modes:

- A structured interview flow that creates a plan and advances through planned questions
- A conversational chat interview that asks follow-up questions based on the prior candidate response and time remaining

In the structured interview flow, the backend creates an interview plan from the candidate profile and target role, then uses interview state to track the current question, turn history, and completion status. Each candidate answer is analyzed and passed back into question generation so the next question is influenced by the candidate's previous response and by the resume context retrieved from Qdrant.

In the chat interview flow, the backend maintains a session state that includes the target role, duration, conversation message history, completion status, and evaluation result. The interviewer begins with an opening message, asks clarifying questions when needed, and moves toward a closing question as the session approaches the time limit. A final evaluation is generated after the interview completes, and the stored session is saved to the user's history.

### Interview History

Interview history is stored in PostgreSQL through the `InterviewHistory` model. Each record contains:

- the authenticated Clerk user ID
- the created timestamp
- the complete message transcript for the interview
- the final evaluation or report, when available

The history API filters records by the current signed-in user, so each user can access only their own interview records. The frontend loads those records from the API and displays them in a per-session history view.

### Authentication

Authentication is handled with Clerk.

- The frontend uses a Clerk publishable key in the browser to initialize the Clerk client SDK.
- The backend verifies incoming requests using the Clerk secret key and Clerk JWT verification configuration.
- Protected endpoints require an authenticated user and attach the signed-in Clerk user ID to the interview history entries.
- The application uses allowed origins configured through `CLERK_AUTHORIZED_PARTIES` to validate the application origin for backend requests.

## 3. Architecture

The architecture follows a simple full-stack pattern:

Frontend
↓
FastAPI backend
↓
AI services / RAG / PostgreSQL

The frontend is a static site built with HTML, CSS, and vanilla JavaScript. It is responsible for the user-facing interview experience and auth UI. The backend exposes the application APIs for resume upload, interview flow, evaluation, and history retrieval. AI and retrieval services are called from the backend to generate interview questions, analyze candidate responses, parse resumes, and retrieve relevant resume context from Qdrant. PostgreSQL stores the user-scoped interview history records.

## 4. Technology Stack

### Frontend

- HTML
- CSS
- Vanilla JavaScript
- Clerk JavaScript SDK

### Backend

- Python
- FastAPI
- SQLAlchemy
- PyMuPDF
- OpenAI Python SDK
- Qdrant client
- python-dotenv
- python-multipart

### Database

- Neon PostgreSQL

### Authentication

- Clerk

## 5. Project Structure

```text
ai-interview-rag-v3/
├── backend/
│   ├── app/
│   │   ├── analyzer/
│   │   ├── history/
│   │   ├── interview/
│   │   ├── rag/
│   │   ├── resume/
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── __pycache__/
│   ├── .env.example
│   ├── .env
│   ├── requirements.txt
│   └── venv/
├── frontend/
│   ├── auth.js
│   ├── background-effects.css
│   ├── background-effects.js
│   ├── chat/
│   ├── interview/
│   ├── history.html
│   ├── history.js
│   ├── index.html
│   ├── script.js
│   ├── style.css
│   └── ...
├── .gitignore
├── README.md
└── .git/
```

The `backend/app` package contains the FastAPI application modules for resume processing, interview logic, Qdrant retrieval, AI evaluation, and user history. The `frontend` directory contains the static pages and JavaScript used by the home page, interview setup screens, chat interview screens, and the history dashboard.

## 6. Backend Structure

The backend is organized around functional modules:

- `app/auth.py` handles Clerk authentication and JWT validation for protected routes.
- `app/database.py` creates the SQLAlchemy engine and session factory and reads `DATABASE_URL` from the environment.
- `app/models.py` defines the `InterviewHistory` table used for storing per-user interview records.
- `app/resume/` contains PDF validation, text extraction, and resume processing routes.
- `app/rag/` handles chunking, embedding, Qdrant insertion, and retrieval of relevant resume context.
- `app/interview/` contains planning, question generation, state tracking, and answer analysis for the structured interview flow.
- `app/interview/chat/` holds the conversational chat interview state machine, follow-up question generation, time handling, and evaluation logic.
- `app/analyzer/` parses the resume into a structured `CandidateProfile`.
- `app/history/` exposes the history endpoints for saving and retrieving authenticated user interview records.
- `app/main.py` initializes the FastAPI app, middleware, health endpoints, and includes the feature routers.

## 7. Frontend Structure

The frontend is a static application organized around the main experience and feature pages:

- `frontend/index.html` is the main landing page and entry point for feature access.
- `frontend/interview/index.html` and `frontend/interview/script.js` are used for the resume-based, role-driven interview setup and interview flow.
- `frontend/chat/index.html`, `frontend/chat/chat.html`, `frontend/chat/result.html`, and their associated JavaScript files handle the conversational chat interview, evaluation result display, and session flow.
- `frontend/history.html` and `frontend/history.js` load user-specific interview history from the backend.
- `frontend/auth.js` initializes the Clerk browser SDK and enforces sign-in behavior for protected pages.
- `frontend/style.css`, `frontend/interview/style.css`, and `frontend/chat/style.css` provide the shared and section-specific styling.
- `frontend/background-effects.js` and `frontend/background-effects.css` add the visual background effects used across the site.

## 8. Environment Variables

The backend expects a local `backend/.env` file created from `backend/.env.example`.

`backend/.env.example` is the safe template for local development. It contains placeholder values only and should not be checked in with real credentials. Developers must create their own `backend/.env` and fill in the secret values for their own environment.

The environment variables used by the current backend are:

- `CLERK_AUTHORIZED_PARTIES`  
  Allowed frontend origins for the backend Clerk validation flow.

- `QDRANT_URL`  
  The base URL of the Qdrant instance used for resume indexing and retrieval.

- `QDRANT_API_KEY`  
  Authentication for the Qdrant service.

- `OPENAI_API_KEY`  
  API key used to authenticate OpenAI calls for resume analysis, interview generation, and evaluation.

- `OPENAI_MODEL`  
  Primary chat/completion model used for interview planning and evaluation.

- `OPENAI_EMBEDDING_MODEL`  
  Embedding model used for resume chunks and retrieval queries.

- `CLERK_SECRET_KEY`  
  Backend Clerk secret used for server-side auth verification.

- `CLERK_JWT_KEY`  
  Public key used by the backend to validate Clerk-issued JWTs.

- `DATABASE_URL`  
  PostgreSQL connection string for the application's interview history database.

The frontend uses a separate Clerk publishable key in browser HTML and JavaScript. That key is public by design and is not the same as the backend `CLERK_SECRET_KEY` or `CLERK_JWT_KEY` values.

## 9. Security

The project should never commit or expose the following values:

- `backend/.env`
- OpenAI API keys
- Qdrant API keys
- Clerk secret keys
- Clerk JWT keys
- PostgreSQL credentials
- passwords
- private tokens

`backend/.env.example` is intentionally a template with placeholders only. It is safe to commit because it does not contain live credentials.

The Clerk publishable key may appear in frontend HTML and JavaScript because it is intentionally meant for client-side initialization. It is not a secret and should not be confused with the backend Clerk secret or JWT configuration.

## 10. Local Development Setup

### Clone

```bash
git clone <repository-url>
cd ai-interview-rag-v3
```

### Backend setup

```bash
python -m venv backend/venv
# Windows PowerShell
backend\venv\Scripts\Activate.ps1
# macOS / Linux
source backend/venv/bin/activate

pip install -r backend/requirements.txt
cp backend/.env.example backend/.env
```

Then fill in the values in `backend/.env` for your own local OpenAI, Qdrant, Clerk, and database configuration.

### Run the backend

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Run the frontend

Serve the `frontend` directory as a static site, for example:

```bash
cd frontend
python -m http.server 3000
```

Then open the app in a browser using the served frontend URL. The pages use the Clerk browser SDK and authenticate against the backend APIs as configured in your local environment.
