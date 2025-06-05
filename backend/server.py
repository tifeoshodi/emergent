from fastapi import FastAPI, APIRouter, HTTPException, Depends, File, UploadFile, Form
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from enum import Enum
import shutil
import aiofiles

# Import PMFusion router
from pmfusion.api import router as pmfusion_router

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()
    ]
)

# Document storage directory
DOCUMENTS_DIR = ROOT_DIR / "documents"
DOCUMENTS_DIR.mkdir(exist_ok=True)

# Define models
class DocumentType(str, Enum):
    PDF = "pdf"
    WORD = "doc"
    EXCEL = "xls"
    DRAWING = "dwg"

class DocumentMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    document_type: DocumentType
    upload_time: datetime = Field(default_factory=datetime.now)
    file_path: str
    size_bytes: int
    user_id: Optional[str] = None
    description: Optional[str] = None

class DocumentResponse(BaseModel):
    id: str
    filename: str
    document_type: DocumentType
    upload_time: datetime
    size_bytes: int
    description: Optional[str] = None

# Document endpoints
@api_router.post("/documents/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    description: Optional[str] = Form(None)
):
    # Validate file extension
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension == ".pdf":
        document_type = DocumentType.PDF
    elif file_extension == ".doc" or file_extension == ".docx":
        document_type = DocumentType.WORD
    elif file_extension == ".xls" or file_extension == ".xlsx":
        document_type = DocumentType.EXCEL
    elif file_extension == ".dwg":
        document_type = DocumentType.DRAWING
    else:
        raise HTTPException(
            status_code=400,
            detail="Unsupported file format. Please upload PDF, Word, Excel, or DWG files."
        )
    
    # Generate unique ID and save file
    document_id = str(uuid.uuid4())
    file_path = DOCUMENTS_DIR / f"{document_id}{file_extension}"
    
    async with aiofiles.open(file_path, 'wb') as out_file:
        content = await file.read()
        await out_file.write(content)
    
    # Create document metadata
    document = DocumentMetadata(
        id=document_id,
        filename=file.filename,
        document_type=document_type,
        file_path=str(file_path),
        size_bytes=os.path.getsize(file_path),
        description=description
    )
    
    # Save metadata to database
    await db.documents.insert_one(document.dict())
    
    return DocumentResponse(
        id=document.id,
        filename=document.filename,
        document_type=document.document_type,
        upload_time=document.upload_time,
        size_bytes=document.size_bytes,
        description=document.description
    )

@api_router.get("/documents", response_model=List[DocumentResponse])
async def get_documents():
    cursor = db.documents.find()
    documents = await cursor.to_list(length=100)
    return [
        DocumentResponse(
            id=doc["id"],
            filename=doc["filename"],
            document_type=doc["document_type"],
            upload_time=doc["upload_time"],
            size_bytes=doc["size_bytes"],
            description=doc.get("description")
        )
        for doc in documents
    ]

@api_router.get("/documents/{document_id}")
async def get_document(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    
    if not document:
        raise HTTPException(
            status_code=404,
            detail=f"Document with ID {document_id} not found"
        )
    
    file_path = Path(document["file_path"])
    
    if not file_path.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Document file not found on server"
        )
    
    return FileResponse(
        path=file_path,
        filename=document["filename"],
        media_type="application/octet-stream"
    )

# Include PMFusion router
api_router.include_router(pmfusion_router)

# Include the API router in the main app
app.include_router(api_router)

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Welcome to the Document Management API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
