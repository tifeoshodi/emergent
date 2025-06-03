from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

class P6ConnectionStatus(str, Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"
    ERROR = "error"
    TESTING = "testing"

class P6SyncStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"

class P6ConnectionConfig(BaseModel):
    host: str
    client_id: str
    client_secret: str
    username: str
    password: str
    use_mock: bool = True
    timeout: int = 60

class P6Project(BaseModel):
    ObjectId: int
    Name: str
    Id: str
    StartDate: Optional[str] = None
    FinishDate: Optional[str] = None
    Status: Optional[str] = None
    ProjectManager: Optional[str] = None
    Description: Optional[str] = None
    Priority: Optional[str] = None
    # PMFusion mapping fields
    pmfusion_project_id: Optional[str] = None
    last_sync: Optional[datetime] = None
    sync_status: P6SyncStatus = P6SyncStatus.PENDING

class P6Activity(BaseModel):
    ObjectId: int
    Name: str
    Id: str
    ProjectObjectId: int
    StartDate: Optional[str] = None
    FinishDate: Optional[str] = None
    Duration: Optional[float] = None
    PercentComplete: Optional[float] = None
    Status: Optional[str] = None
    Priority: Optional[str] = None
    ResourceId: Optional[str] = None
    ActivityType: Optional[str] = None
    # PMFusion mapping fields
    pmfusion_task_id: Optional[str] = None
    last_sync: Optional[datetime] = None
    sync_status: P6SyncStatus = P6SyncStatus.PENDING

class P6Resource(BaseModel):
    ObjectId: int
    Name: str
    Id: str
    Type: Optional[str] = None
    MaxUnitsPerTime: Optional[float] = None
    DefaultUnitsPerTime: Optional[float] = None
    CostPerUnit: Optional[float] = None
    CalendarObjectId: Optional[int] = None
    # PMFusion mapping fields
    pmfusion_user_id: Optional[str] = None
    last_sync: Optional[datetime] = None
    sync_status: P6SyncStatus = P6SyncStatus.PENDING

class SyncRequest(BaseModel):
    project_ids: Optional[List[int]] = None
    sync_projects: bool = True
    sync_activities: bool = True
    sync_resources: bool = True
    sync_direction: str = "both"  # "p6_to_pmfusion", "pmfusion_to_p6", "both"
    force_sync: bool = False

class SyncResult(BaseModel):
    status: P6SyncStatus
    message: str
    projects_synced: int = 0
    activities_synced: int = 0
    resources_synced: int = 0
    errors: List[str] = []
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_seconds: Optional[float] = None

class P6ConnectionTest(BaseModel):
    status: P6ConnectionStatus
    host: str
    mock_mode: bool
    projects_available: Optional[int] = None
    message: str
    error: Optional[str] = None
    tested_at: datetime = Field(default_factory=datetime.utcnow)

class P6DataMapping(BaseModel):
    """Mapping configuration between P6 and PMFusion data models"""
    
    # Project field mappings
    project_mappings: Dict[str, str] = {
        "Name": "name",
        "Id": "external_id", 
        "StartDate": "start_date",
        "FinishDate": "end_date",
        "Status": "status",
        "ProjectManager": "project_manager_name",
        "Description": "description"
    }
    
    # Activity to Task field mappings
    activity_mappings: Dict[str, str] = {
        "Name": "title",
        "Id": "external_id",
        "StartDate": "start_date", 
        "FinishDate": "end_date",
        "Duration": "duration_days",
        "PercentComplete": "progress_percent",
        "Status": "status",
        "Priority": "priority"
    }
    
    # Resource to User field mappings
    resource_mappings: Dict[str, str] = {
        "Name": "name",
        "Id": "external_id",
        "Type": "role",
        "CostPerUnit": "hourly_rate"
    }
    
    # Status mappings
    status_mappings: Dict[str, str] = {
        # P6 -> PMFusion
        "Not Started": "todo",
        "In Progress": "in_progress", 
        "Completed": "done",
        "Nearly Complete": "review",
        "Active": "active",
        "Planning": "planning",
        "On Hold": "on_hold",
        "Cancelled": "cancelled"
    }
    
    # Priority mappings
    priority_mappings: Dict[str, str] = {
        # P6 -> PMFusion
        "Top": "critical",
        "High": "high",
        "Normal": "medium", 
        "Low": "low"
    }

class PMFusionToP6Export(BaseModel):
    """Request model for exporting PMFusion data to P6"""
    project_id: str
    include_tasks: bool = True
    include_resources: bool = True
    p6_project_id: Optional[str] = None  # If updating existing P6 project
    create_new_project: bool = True

class P6ImportRequest(BaseModel):
    """Request model for importing P6 data to PMFusion"""
    p6_project_ids: List[int]
    create_pmfusion_projects: bool = True
    update_existing: bool = False
    import_activities_as_tasks: bool = True
    import_resources_as_users: bool = False  # Usually false to avoid user conflicts

class SyncSchedule(BaseModel):
    """Scheduled sync configuration"""
    enabled: bool = False
    interval_minutes: int = 60  # Sync every hour by default
    sync_projects: bool = True
    sync_activities: bool = True
    sync_resources: bool = False
    last_run: Optional[datetime] = None
    next_run: Optional[datetime] = None

class P6Analytics(BaseModel):
    """P6 integration analytics"""
    total_projects: int = 0
    synced_projects: int = 0
    total_activities: int = 0
    synced_activities: int = 0
    total_resources: int = 0
    synced_resources: int = 0
    last_sync_time: Optional[datetime] = None
    sync_success_rate: float = 0.0
    average_sync_duration: float = 0.0
