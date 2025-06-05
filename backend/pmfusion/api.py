from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends, Query, Path
from fastapi.responses import JSONResponse
from typing import List, Optional, Dict, Any, Union
from datetime import datetime
import os
import uuid
import json
import shutil
from pathlib import Path
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from .models import (
    CTRData, MDRData, WBSStructure, FileUploadResponse, ParseFileResponse,
    WBSGenerationRequest, WBSGenerationResponse
)
from .parsers import parse_file, detect_file_type, FileType
from .wbs_generator import generate_wbs_from_data

# Configure logging
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(
    prefix="/pmfusion",
    tags=["PMFusion"],
    responses={404: {"description": "Not found"}},
)

# Database connection
async def get_database() -> AsyncIOMotorDatabase:
    """Get database connection"""
    # MongoDB connection string from environment variable or use default
    mongo_url = os.environ.get("MONGODB_URL", "mongodb://localhost:27017")
    client = AsyncIOMotorClient(mongo_url)
    return client.pmfusion_db

# File storage paths
UPLOAD_DIR = Path("backend/documents/uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Ensure upload directories exist
CTR_UPLOAD_DIR = UPLOAD_DIR / "ctr"
CTR_UPLOAD_DIR.mkdir(exist_ok=True)
MDR_UPLOAD_DIR = UPLOAD_DIR / "mdr"
MDR_UPLOAD_DIR.mkdir(exist_ok=True)

# Data storage paths
DATA_DIR = Path("backend/documents/data")
DATA_DIR.mkdir(parents=True, exist_ok=True)

CTR_DATA_DIR = DATA_DIR / "ctr"
CTR_DATA_DIR.mkdir(exist_ok=True)
MDR_DATA_DIR = DATA_DIR / "mdr"
MDR_DATA_DIR.mkdir(exist_ok=True)
WBS_DATA_DIR = DATA_DIR / "wbs"
WBS_DATA_DIR.mkdir(exist_ok=True)


@router.post("/upload/ctr", response_model=FileUploadResponse)
async def upload_ctr_file(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    description: Optional[str] = Form(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Upload a CTR (Cost, Task, Resource) file
    
    - **file**: The CTR file to upload (Excel or CSV)
    - **project_id**: ID of the project this file belongs to
    - **description**: Optional description of the file
    """
    return await _upload_file(file, project_id, description, FileType.CTR, db)


@router.post("/upload/mdr", response_model=FileUploadResponse)
async def upload_mdr_file(
    file: UploadFile = File(...),
    project_id: str = Form(...),
    description: Optional[str] = Form(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Upload an MDR (Master Document Register) file
    
    - **file**: The MDR file to upload (Excel or CSV)
    - **project_id**: ID of the project this file belongs to
    - **description**: Optional description of the file
    """
    return await _upload_file(file, project_id, description, FileType.MDR, db)


async def _upload_file(
    file: UploadFile,
    project_id: str,
    description: Optional[str],
    expected_type: FileType,
    db: AsyncIOMotorDatabase
) -> FileUploadResponse:
    """
    Helper function to handle file uploads
    """
    # Validate file extension
    if not file.filename.lower().endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Please upload Excel (.xlsx, .xls) or CSV (.csv) files."
        )
    
    try:
        # Generate unique file ID and determine file path
        file_id = str(uuid.uuid4())
        file_extension = os.path.splitext(file.filename)[1]
        
        # Select upload directory based on file type
        upload_dir = CTR_UPLOAD_DIR if expected_type == FileType.CTR else MDR_UPLOAD_DIR
        file_path = upload_dir / f"{file_id}{file_extension}"
        
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Create file metadata
        file_metadata = {
            "id": file_id,
            "original_filename": file.filename,
            "file_path": str(file_path),
            "file_type": expected_type,
            "project_id": project_id,
            "description": description,
            "upload_time": datetime.now(),
            "size_bytes": os.path.getsize(file_path),
            "status": "uploaded",
            "parsed": False,
            "parsed_data_id": None
        }
        
        # Save metadata to database
        await db.files.insert_one(file_metadata)
        
        return FileUploadResponse(
            file_id=file_id,
            filename=file.filename,
            file_type=expected_type,
            upload_time=file_metadata["upload_time"],
            status="success",
            message="File uploaded successfully"
        )
        
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error uploading file: {str(e)}"
        )


@router.post("/parse/file/{file_id}", response_model=ParseFileResponse)
async def parse_uploaded_file(
    file_id: str = Path(..., description="ID of the uploaded file to parse"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Parse an uploaded file (CTR or MDR) to extract structured data
    
    - **file_id**: ID of the previously uploaded file
    """
    try:
        # Get file metadata from database
        file_metadata = await db.files.find_one({"id": file_id})
        if not file_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"File with ID {file_id} not found"
            )
        
        file_path = file_metadata["file_path"]
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404,
                detail=f"File not found on server"
            )
        
        # Detect file type if not already determined
        file_type = file_metadata.get("file_type")
        if not file_type:
            detected_type = detect_file_type(file_path)
            file_type = detected_type
        else:
            file_type = FileType(file_type)
        
        # Parse the file
        parsed_data = parse_file(file_path)
        
        # Generate unique ID for the parsed data
        parsed_data_id = str(uuid.uuid4())
        
        # Determine where to save the parsed data
        if isinstance(parsed_data, CTRData):
            data_dir = CTR_DATA_DIR
            data_type = "CTR"
            summary = {
                "tasks": len(parsed_data.tasks),
                "resources": len(parsed_data.resources),
                "task_resources": len(parsed_data.task_resources)
            }
        elif isinstance(parsed_data, MDRData):
            data_dir = MDR_DATA_DIR
            data_type = "MDR"
            summary = {
                "documents": len(parsed_data.documents)
            }
        else:
            raise ValueError(f"Unknown parsed data type: {type(parsed_data)}")
        
        # Save parsed data to file
        data_path = data_dir / f"{parsed_data_id}.json"
        with open(data_path, "w") as f:
            f.write(parsed_data.json())
        
        # Update file metadata in database
        await db.files.update_one(
            {"id": file_id},
            {"$set": {
                "parsed": True,
                "parsed_data_id": parsed_data_id,
                "parsed_time": datetime.now(),
                "parsed_data_path": str(data_path),
                "parsed_data_type": data_type,
                "parsed_data_summary": summary
            }}
        )
        
        # Save parsed data metadata to database
        parsed_data_metadata = {
            "id": parsed_data_id,
            "file_id": file_id,
            "project_id": file_metadata["project_id"],
            "data_type": data_type,
            "data_path": str(data_path),
            "parse_time": datetime.now(),
            "summary": summary
        }
        await db.parsed_data.insert_one(parsed_data_metadata)
        
        return ParseFileResponse(
            file_id=file_id,
            parsed_data_id=parsed_data_id,
            file_type=data_type,
            parse_time=parsed_data_metadata["parse_time"],
            status="success",
            summary=summary,
            message="File parsed successfully"
        )
        
    except Exception as e:
        logger.error(f"Error parsing file: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error parsing file: {str(e)}"
        )


@router.post("/generate/wbs", response_model=WBSGenerationResponse)
async def generate_wbs(
    request: WBSGenerationRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Generate a Work Breakdown Structure (WBS) from parsed CTR and MDR data
    
    - **ctr_data_id**: ID of the parsed CTR data
    - **mdr_data_id**: Optional ID of the parsed MDR data
    - **project_id**: ID of the project
    - **name**: Name of the WBS
    - **description**: Optional description of the WBS
    - **options**: Optional configuration options
    """
    try:
        # Get CTR data
        ctr_data_metadata = await db.parsed_data.find_one({"id": request.ctr_data_id})
        if not ctr_data_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"CTR data with ID {request.ctr_data_id} not found"
            )
        
        ctr_data_path = ctr_data_metadata["data_path"]
        if not os.path.exists(ctr_data_path):
            raise HTTPException(
                status_code=404,
                detail=f"CTR data file not found on server"
            )
        
        # Load CTR data
        with open(ctr_data_path, "r") as f:
            ctr_data = CTRData.parse_raw(f.read())
        
        # Get MDR data if provided
        mdr_data = None
        if request.mdr_data_id:
            mdr_data_metadata = await db.parsed_data.find_one({"id": request.mdr_data_id})
            if not mdr_data_metadata:
                raise HTTPException(
                    status_code=404,
                    detail=f"MDR data with ID {request.mdr_data_id} not found"
                )
            
            mdr_data_path = mdr_data_metadata["data_path"]
            if not os.path.exists(mdr_data_path):
                raise HTTPException(
                    status_code=404,
                    detail=f"MDR data file not found on server"
                )
            
            # Load MDR data
            with open(mdr_data_path, "r") as f:
                mdr_data = MDRData.parse_raw(f.read())
        
        # Generate WBS
        wbs = generate_wbs_from_data(
            ctr_data=ctr_data,
            project_id=request.project_id,
            name=request.name,
            description=request.description,
            mdr_data=mdr_data,
            options=request.options
        )
        
        # Generate unique ID for the WBS
        wbs_id = str(uuid.uuid4())
        
        # Save WBS to file
        wbs_path = WBS_DATA_DIR / f"{wbs_id}.json"
        with open(wbs_path, "w") as f:
            f.write(wbs.json())
        
        # Create summary
        summary = {
            "total_elements": len(wbs.elements),
            "root_elements": len(wbs.root_element_ids),
            "max_level": max(element.level for element in wbs.elements),
            "total_tasks": sum(len(element.task_ids) for element in wbs.elements),
            "total_documents": sum(len(element.document_ids) for element in wbs.elements),
            "total_approved_hours": sum(element.approved_hours for element in wbs.elements if element.level == 1),
            "total_actual_hours": sum(element.actual_hours for element in wbs.elements if element.level == 1),
            "overall_progress": sum(element.progress * element.approved_hours for element in wbs.elements if element.level == 1) / 
                               sum(element.approved_hours for element in wbs.elements if element.level == 1) 
                               if sum(element.approved_hours for element in wbs.elements if element.level == 1) > 0 else 0
        }
        
        # Save WBS metadata to database
        wbs_metadata = {
            "id": wbs_id,
            "project_id": request.project_id,
            "name": request.name,
            "description": request.description,
            "ctr_data_id": request.ctr_data_id,
            "mdr_data_id": request.mdr_data_id,
            "data_path": str(wbs_path),
            "generation_time": datetime.now(),
            "summary": summary
        }
        await db.wbs_data.insert_one(wbs_metadata)
        
        return WBSGenerationResponse(
            wbs_id=wbs_id,
            project_id=request.project_id,
            generation_time=wbs_metadata["generation_time"],
            status="success",
            summary=summary,
            message="WBS generated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error generating WBS: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error generating WBS: {str(e)}"
        )


@router.get("/data/ctr/{data_id}", response_model=CTRData)
async def get_ctr_data(
    data_id: str = Path(..., description="ID of the CTR data to retrieve"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get parsed CTR data by ID
    
    - **data_id**: ID of the parsed CTR data
    """
    try:
        # Get data metadata from database
        data_metadata = await db.parsed_data.find_one({"id": data_id, "data_type": "CTR"})
        if not data_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"CTR data with ID {data_id} not found"
            )
        
        data_path = data_metadata["data_path"]
        if not os.path.exists(data_path):
            raise HTTPException(
                status_code=404,
                detail=f"CTR data file not found on server"
            )
        
        # Load data
        with open(data_path, "r") as f:
            ctr_data = CTRData.parse_raw(f.read())
        
        return ctr_data
        
    except Exception as e:
        logger.error(f"Error retrieving CTR data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving CTR data: {str(e)}"
        )


@router.get("/data/mdr/{data_id}", response_model=MDRData)
async def get_mdr_data(
    data_id: str = Path(..., description="ID of the MDR data to retrieve"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get parsed MDR data by ID
    
    - **data_id**: ID of the parsed MDR data
    """
    try:
        # Get data metadata from database
        data_metadata = await db.parsed_data.find_one({"id": data_id, "data_type": "MDR"})
        if not data_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"MDR data with ID {data_id} not found"
            )
        
        data_path = data_metadata["data_path"]
        if not os.path.exists(data_path):
            raise HTTPException(
                status_code=404,
                detail=f"MDR data file not found on server"
            )
        
        # Load data
        with open(data_path, "r") as f:
            mdr_data = MDRData.parse_raw(f.read())
        
        return mdr_data
        
    except Exception as e:
        logger.error(f"Error retrieving MDR data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving MDR data: {str(e)}"
        )


@router.get("/data/wbs/{wbs_id}", response_model=WBSStructure)
async def get_wbs_data(
    wbs_id: str = Path(..., description="ID of the WBS to retrieve"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get generated WBS data by ID
    
    - **wbs_id**: ID of the generated WBS
    """
    try:
        # Get WBS metadata from database
        wbs_metadata = await db.wbs_data.find_one({"id": wbs_id})
        if not wbs_metadata:
            raise HTTPException(
                status_code=404,
                detail=f"WBS with ID {wbs_id} not found"
            )
        
        wbs_path = wbs_metadata["data_path"]
        if not os.path.exists(wbs_path):
            raise HTTPException(
                status_code=404,
                detail=f"WBS data file not found on server"
            )
        
        # Load WBS
        with open(wbs_path, "r") as f:
            wbs = WBSStructure.parse_raw(f.read())
        
        return wbs
        
    except Exception as e:
        logger.error(f"Error retrieving WBS data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving WBS data: {str(e)}"
        )


@router.get("/project/{project_id}/files", response_model=List[Dict[str, Any]])
async def get_project_files(
    project_id: str = Path(..., description="ID of the project"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all files for a project
    
    - **project_id**: ID of the project
    """
    try:
        # Get files from database
        cursor = db.files.find({"project_id": project_id})
        files = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for file in files:
            if "_id" in file:
                file["_id"] = str(file["_id"])
        
        return files
        
    except Exception as e:
        logger.error(f"Error retrieving project files: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving project files: {str(e)}"
        )


@router.get("/project/{project_id}/parsed-data", response_model=List[Dict[str, Any]])
async def get_project_parsed_data(
    project_id: str = Path(..., description="ID of the project"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all parsed data for a project
    
    - **project_id**: ID of the project
    """
    try:
        # Get parsed data from database
        cursor = db.parsed_data.find({"project_id": project_id})
        parsed_data = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for data in parsed_data:
            if "_id" in data:
                data["_id"] = str(data["_id"])
        
        return parsed_data
        
    except Exception as e:
        logger.error(f"Error retrieving project parsed data: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving project parsed data: {str(e)}"
        )


@router.get("/project/{project_id}/wbs", response_model=List[Dict[str, Any]])
async def get_project_wbs_list(
    project_id: str = Path(..., description="ID of the project"),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Get all WBS for a project
    
    - **project_id**: ID of the project
    """
    try:
        # Get WBS from database
        cursor = db.wbs_data.find({"project_id": project_id})
        wbs_list = await cursor.to_list(length=100)
        
        # Convert ObjectId to string for JSON serialization
        for wbs in wbs_list:
            if "_id" in wbs:
                wbs["_id"] = str(wbs["_id"])
        
        return wbs_list
        
    except Exception as e:
        logger.error(f"Error retrieving project WBS list: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving project WBS list: {str(e)}"
        )
