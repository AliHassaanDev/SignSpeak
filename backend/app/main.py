"""
SignBridge PK - FastAPI Backend Entrypoint

This module serves as the primary entry point for the backend server.
It configures the FastAPI application, sets up CORS middleware for frontend communication,
and registers all the API routers (translation, speech, animations).
"""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

# Import application routers
from app.api import translation, speech, urdu_psl_router

# Initialize the main FastAPI application instance
app = FastAPI(
    title="SignBridge PK API",
    description="Two-Way Pakistani Sign Language (PSL) Communication Assistant API with urdutopsl model pipeline",
    version="1.0.0"
)

# --------------------------------------------------------------------------
# Middleware Configuration
# --------------------------------------------------------------------------
# Enable CORS (Cross-Origin Resource Sharing) to allow the Next.js frontend
# (running on a different port/domain) to communicate with this API.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (can be restricted in production)
    allow_credentials=True,
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],  # Allows all HTTP headers
)

# --------------------------------------------------------------------------
# Router Registration
# --------------------------------------------------------------------------
# Include modular routers to keep the codebase organized.
# Each router handles a specific domain of endpoints (e.g. /api/translate/psl-to-urdu).
app.include_router(translation.router)
app.include_router(speech.router)
app.include_router(urdu_psl_router.router)

# Mount the videos directory as static files
import os
os.makedirs("data/videos", exist_ok=True)
app.mount("/videos", StaticFiles(directory="data/videos"), name="videos")


@app.get("/")
def root():
    """
    Endpoint: GET /
    Health check endpoint that returns the status of the service and active models.
    """
    return {
        "service": "SignBridge PK - PSL Communication API",
        "status": "online",
        "models": {
            "psl_to_urdu": {
                "name": "gemini-3.6-flash",
                "mode": "gemini_multimodal_vision",
                "status": "active (Gemini vision only; custom model terminated)"
            },
            "urdu_to_psl": {
                "name": "urdutopsl",
                "artifact": "urdutopsl.onnx",
                "version": "1.0.0-hybrid",
                "status": "ready"
            }
        }
    }

# Entry point for running the server directly via Python (e.g., `python main.py`)
if __name__ == "__main__":
    import uvicorn
    # Start the Uvicorn ASGI server with hot-reloading enabled
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
