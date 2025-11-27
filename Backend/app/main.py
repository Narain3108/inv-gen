"""
FastAPI Application Entry Point
Invoice Management System REST API
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.firebase import initialize_firebase, get_firestore_db
from app.api import api_router

# Cloudinary import (optional, standalone version)
try:
    from app.services.cloudinary_standalone import initialize_cloudinary
except:
    initialize_cloudinary = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan events - startup and shutdown
    """
    # Startup
    print("🚀 Starting Invoice Management API...")
    print(f"📊 Environment: {settings.ENVIRONMENT}")
    print(f"🗄️  Database: Firebase Firestore")
    
    # Initialize Firebase Admin SDK
    initialize_firebase()
    
    # Test Firestore connection
    try:
        db = get_firestore_db()
        print("✅ Firebase Firestore connected")
    except Exception as e:
        print(f"⚠️  Firestore connection failed: {str(e)}")
    
    # Initialize Cloudinary
    if initialize_cloudinary and settings.CLOUDINARY_API_KEY and settings.CLOUDINARY_API_SECRET:
        try:
            initialize_cloudinary()
            print("✅ Cloudinary initialized")
        except:
            print("⚠️  Cloudinary initialization failed (optional)")
    else:
        print("⚠️  Cloudinary credentials not configured (optional)")
    
    yield
    
    # Shutdown
    print("👋 Shutting down Invoice Management API...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="REST API for Invoice, Quotation, and Billing Management System",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    lifespan=lifespan
)


# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include API routers
app.include_router(api_router, prefix=settings.API_V1_PREFIX)


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """API root endpoint"""
    return {
        "message": "Invoice Management API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "redoc": "/redoc",
        "status": "operational"
    }


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "environment": settings.ENVIRONMENT,
        "version": settings.APP_VERSION
    }


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle unexpected exceptions"""
    if settings.DEBUG:
        raise exc
    
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal server error",
            "message": "An unexpected error occurred"
        }
    )


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level="info"
    )
