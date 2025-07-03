from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/v2", tags=["pmfusion-workflow"])

class HealthResponse(BaseModel):
    """Response model for health check endpoint."""
    status: str
    version: str

import os

API_VERSION = os.getenv("API_VERSION", "2.0")

@router.get("/health", response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """
    Health check endpoint to verify API service status.
    
    Returns the current status and version of the PMFusion API service.
    """
    return HealthResponse(status="healthy", version=API_VERSION)
