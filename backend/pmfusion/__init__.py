"""
PMFusion - EPC Project Management Tool

A module for parsing CTR (Costs, Tasks, Resources) and MDR (Master Document Register) files,
and automatically generating Work Breakdown Structures (WBS) in Primavera P6 style.
"""

__version__ = "0.1.0"

# Import models
from .models import (
    CTRData, MDRData, WBSStructure, WBSElement,
    Task, Resource, TaskResource, Document,
    Discipline, TaskStatus, TaskType, DocumentType, DocumentStatus,
    FileUploadResponse, ParseFileResponse, WBSGenerationRequest, WBSGenerationResponse
)

# Import parsers
from .parsers import (
    parse_file, parse_ctr_file, parse_mdr_file, 
    detect_file_type, FileType
)

# Import WBS generator
from .wbs_generator import (
    WBSGenerator, generate_wbs_from_data
)

# Import API router
from .api import router as pmfusion_router

# Define what's available when using "from pmfusion import *"
__all__ = [
    # Models
    'CTRData', 'MDRData', 'WBSStructure', 'WBSElement',
    'Task', 'Resource', 'TaskResource', 'Document',
    'Discipline', 'TaskStatus', 'TaskType', 'DocumentType', 'DocumentStatus',
    'FileUploadResponse', 'ParseFileResponse', 'WBSGenerationRequest', 'WBSGenerationResponse',
    
    # Parsers
    'parse_file', 'parse_ctr_file', 'parse_mdr_file', 
    'detect_file_type', 'FileType',
    
    # WBS Generator
    'WBSGenerator', 'generate_wbs_from_data',
    
    # API
    'pmfusion_router',
]
