import os

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

from app.rag.router import router as rag_router
from app.resume.router import router as resume_router
from app.interview.router import router as interview_router
from app.interview.chat.router import router as chat_interview_router
from app.history.router import router as history_router
from app.database import engine, Base
import app.models

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AI Interview RAG",
    description="RAG-powered adaptive technical interview system",
    version="0.1.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:5500",
        "http://localhost:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "message": "AI Interview RAG API is running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }


@app.get("/config")
def get_public_config():
    clerk_publishable_key = os.getenv("CLERK_PUBLISHABLE_KEY")
    if not clerk_publishable_key:
        raise HTTPException(
            status_code=500,
            detail="Clerk publishable key is not configured.",
        )

    return {
        "clerk_publishable_key": clerk_publishable_key,
    }


app.include_router(chat_interview_router)
app.include_router(interview_router)
app.include_router(resume_router)
app.include_router(rag_router)
app.include_router(history_router)