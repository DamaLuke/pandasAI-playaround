"""
PandasAI Backend API Server
FastAPI application entry point
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

import pandasai as pai
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.api import router as api_router
from backend.config import Settings, get_settings

# Load environment variables
load_dotenv()

def setup_pandasai(settings: Settings) -> None:
    """Configure PandasAI with LLM settings"""
    from pandasai_openai import OpenAI

    llm = OpenAI(
        api_token=Settings.API_TOKEN,
        api_base='https://dashscope.aliyuncs.com/compatible-mode/v1',
        
    )

    pai.config.set(
        {
            "llm": llm,
            'model': 'deepseek-r1',
            "verbose": settings.VERBOSE,
            "enable_cache": settings.ENABLE_CACHE,
        }
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager"""
    # Startup
    settings = get_settings()
    setup_pandasai(settings)
    print(f"🚀 PandasAI API Server starting...")
    print(f"   Environment: {settings.environment}")
    print(f"   Model: {settings.model}")
    print(f"   Temp Directory: {settings.temp_dir}")
    print(f"   Max Upload Size: {settings.max_upload_size_mb}MB")

    yield

    # Shutdown
    print("👋 PandasAI API Server shutting down...")


def create_application() -> FastAPI:
    """Application factory"""
    settings = get_settings()

    app = FastAPI(
        title="PandasAI Backend API",
        description="API for data analysis with natural language using PandasAI",
        version="1.0.0",
        docs_url="/docs" if settings.debug else None,
        redoc_url="/redoc" if settings.debug else None,
        lifespan=lifespan,
    )

    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Include API routes
    app.include_router(api_router)

    # Mount static files for frontend
    frontend_dir = Path(__file__).parent.parent / "frontend"
    if frontend_dir.exists():
        app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")
        
        # Serve index.html at root
        @app.get("/", tags=["root"])
        async def serve_index():
            from fastapi.responses import FileResponse
            return FileResponse(str(frontend_dir / "index.html"))
    else:
        # Root endpoint (no frontend)
        @app.get("/", tags=["root"])
        async def root():
            return {
                "message": "PandasAI Backend API",
                "version": "1.0.0",
                "docs": "/docs",
                "health": "/api/v1/health",
            }

    # Exception handlers
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "message": str(exc)},
        )

    return app


# Create application instance
app = create_application()
