from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict, Any, Union
from enum import Enum
from datetime import datetime, date
import uuid


class Discipline(str, Enum):
    """Engineering disciplines typically found in EPC projects"""
    PROCESS = "PROCESS"
    MECHANICAL = "MECHANICAL"
    PIPING = "PIPING"
    ELECTRICAL = "ELECTRICAL"
    INSTRUMENTATION = "INSTRUMENTATION"
    CIVIL = "CIVIL"
    STRUCTURAL = "STRUCTURAL"
    HVAC = "HVAC"
    ARCHITECTURE = "ARCHITECTURE"
    HSE = "HSE"
    PROCUREMENT = "PROCUREMENT"
    CONSTRUCTION = "CONSTRUCTION"
    COMMISSIONING = "COMMISSIONING"
    PROJECT_MANAGEMENT = "PROJECT_MANAGEMENT"
    QUALITY = "QUALITY"
    OTHER = "OTHER"


class TaskStatus(str, Enum):
    """Status options for tasks in the WBS"""
    NOT_STARTED = "NOT_STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ON_HOLD = "ON_HOLD"
    CANCELLED = "CANCELLED"


class TaskType(str, Enum):
    """Types of tasks in the WBS"""
    MILESTONE = "MILESTONE"
    TASK = "TASK"
    SUMMARY = "SUMMARY"
    HAMMOCK = "HAMMOCK"
    LEVEL_OF_EFFORT = "LEVEL_OF_EFFORT"


class DocumentType(str, Enum):
    """Types of documents in the MDR"""
    DRAWING = "DRAWING"
    SPECIFICATION = "SPECIFICATION"
    PROCEDURE = "PROCEDURE"
    REPORT = "REPORT"
    CALCULATION = "CALCULATION"
    DATA_SHEET = "DATA_SHEET"
    MANUAL = "MANUAL"
    LIST = "LIST"
    OTHER = "OTHER"


class DocumentStatus(str, Enum):
    """Status options for documents in the MDR"""
    DRAFT = "DRAFT"
    ISSUED_FOR_REVIEW = "ISSUED_FOR_REVIEW"
    ISSUED_FOR_APPROVAL = "ISSUED_FOR_APPROVAL"
    APPROVED = "APPROVED"
    ISSUED_FOR_CONSTRUCTION = "ISSUED_FOR_CONSTRUCTION"
    AS_BUILT = "AS_BUILT"


# CTR Models
class Resource(BaseModel):
    """Resource model representing personnel or equipment"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: Optional[str] = None
    type: str  # e.g., Labor, Equipment, Material
    rate: float  # Cost rate per hour/unit
    unit: str  # e.g., hour, day, piece
    discipline: Optional[Discipline] = None
    description: Optional[str] = None
    availability: Optional[Dict[str, Any]] = None  # Calendar or availability info


class Task(BaseModel):
    """Task model representing work to be done"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: Optional[str] = None
    description: Optional[str] = None
    type: TaskType = TaskType.TASK
    status: TaskStatus = TaskStatus.NOT_STARTED
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    discipline: Optional[Discipline] = None
    priority: int = 0
    progress: float = 0  # 0 to 100
    parent_id: Optional[str] = None  # For hierarchical structure
    predecessors: List[str] = []  # List of task IDs this task depends on
    successors: List[str] = []  # List of task IDs that depend on this task
    constraints: Optional[Dict[str, Any]] = None


class TaskResource(BaseModel):
    """Links tasks with resources and specifies approved man-hours"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    task_id: str
    resource_id: str
    approved_hours: float
    actual_hours: Optional[float] = None
    cost_code: Optional[str] = None
    notes: Optional[str] = None


class CTRData(BaseModel):
    """Complete data structure extracted from a CTR file"""
    tasks: List[Task] = []
    resources: List[Resource] = []
    task_resources: List[TaskResource] = []
    metadata: Dict[str, Any] = {}  # Additional data from the CTR file


# MDR Models
class Document(BaseModel):
    """Document model representing items in the Master Document Register"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    code: str  # Document identification code
    document_type: DocumentType
    discipline: Discipline
    revision: str = "A"
    status: DocumentStatus = DocumentStatus.DRAFT
    issue_date: Optional[date] = None
    due_date: Optional[date] = None
    responsible_person: Optional[str] = None
    review_by: Optional[str] = None
    approve_by: Optional[str] = None
    remarks: Optional[str] = None
    related_tasks: List[str] = []  # List of related task IDs
    metadata: Dict[str, Any] = {}  # Additional metadata


class MDRData(BaseModel):
    """Complete data structure extracted from an MDR file"""
    documents: List[Document] = []
    metadata: Dict[str, Any] = {}  # Additional data from the MDR file


# WBS Models
class WBSElement(BaseModel):
    """Element in the Work Breakdown Structure"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str  # WBS code (e.g., 1.2.3)
    level: int = 1  # Hierarchy level
    description: Optional[str] = None
    parent_id: Optional[str] = None
    children_ids: List[str] = []
    task_ids: List[str] = []  # Associated tasks
    document_ids: List[str] = []  # Associated documents
    weight: float = 0  # Weight for progress calculation
    progress: float = 0  # 0 to 100
    planned_start_date: Optional[date] = None
    planned_end_date: Optional[date] = None
    actual_start_date: Optional[date] = None
    actual_end_date: Optional[date] = None
    approved_hours: float = 0
    actual_hours: float = 0
    discipline: Optional[Discipline] = None
    metadata: Dict[str, Any] = {}


class WBSStructure(BaseModel):
    """Complete Work Breakdown Structure"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: Optional[str] = None
    project_id: str
    elements: List[WBSElement] = []
    root_element_ids: List[str] = []
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    version: str = "1.0"
    metadata: Dict[str, Any] = {}


# File Upload and Processing Models
class FileUploadResponse(BaseModel):
    """Response model for file upload endpoints"""
    file_id: str
    filename: str
    file_type: str
    upload_time: datetime
    status: str
    message: Optional[str] = None


class ParseFileResponse(BaseModel):
    """Response model for file parsing endpoints"""
    file_id: str
    parsed_data_id: str
    file_type: str
    parse_time: datetime
    status: str
    summary: Dict[str, Any]
    message: Optional[str] = None


class WBSGenerationRequest(BaseModel):
    """Request model for WBS generation"""
    ctr_data_id: str
    mdr_data_id: Optional[str] = None
    project_id: str
    name: str
    description: Optional[str] = None
    options: Dict[str, Any] = {}


class WBSGenerationResponse(BaseModel):
    """Response model for WBS generation"""
    wbs_id: str
    project_id: str
    generation_time: datetime
    status: str
    summary: Dict[str, Any]
    message: Optional[str] = None
