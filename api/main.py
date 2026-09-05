"""FastAPI entrypoint.

Run: uvicorn api.main:app --reload
The deterministic engine loads on first request and works with NO Claude key.
"""
from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import router

load_dotenv()

app = FastAPI(
    title="Ring Sentinel API",
    version="1.0.0",
    description="Deterministic network-abuse detection with optional Claude "
                "narration and a mandatory human gate. Nothing auto-blocks.",
)

# Vite dev server origins (no auth by design — out of scope per spec).
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ.get(
        "RING_SENTINEL_CORS",
        "http://localhost:5173,http://localhost:8443,http://127.0.0.1:5173",
    ).split(","),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "narration": "enabled" if os.environ.get("ANTHROPIC_API_KEY") else "disabled",
    }
