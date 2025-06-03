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
import sys

# Add the current directory to the Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# P6 Integration imports
from p6_service import P6Service
from p6_models import (
    SyncRequest, SyncResult, PMFusionToP6Export, P6ImportRequest,
    P6ConnectionConfig, P6ConnectionTest
)

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

# Initialize P6 Service
p6_service = P6Service(db)

# Root endpoint for API health check
@api_router.get("/")
async def api_health():
    return {"status": "ok", "message": "EPC Project Management API is running"}

# Enums
class TaskStatus(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    REVIEW = "review"
    DONE = "done"

class TaskPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class UserRole(str, Enum):
    PROJECT_MANAGER = "project_manager"
    ENGINEERING_MANAGER = "engineering_manager"
    CONTRACTOR = "contractor"
    SENIOR_ENGINEER_1 = "senior_engineer_1"
    SENIOR_ENGINEER_2 = "senior_engineer_2"
    INTERMEDIATE_ENGINEER = "intermediate_engineer"
    JUNIOR_ENGINEER = "junior_engineer"

class ProjectStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    ON_HOLD = "on_hold"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SprintStatus(str, Enum):
    PLANNING = "planning"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class EpicStatus(str, Enum):
    BACKLOG = "backlog"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"

class DocumentStatus(str, Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    SUPERSEDED = "superseded"
    ARCHIVED = "archived"

class DocumentCategory(str, Enum):
    ENGINEERING_DRAWING = "engineering_drawing"
    PIPING_DRAWING = "piping_drawing"
    ELECTRICAL_DRAWING = "electrical_drawing"
    INSTRUMENT_DRAWING = "instrument_drawing"
    TECHNICAL_SPECIFICATION = "technical_specification"
    PROJECT_REPORT = "project_report"
    SAFETY_DOCUMENT = "safety_document"
    COMPLIANCE_DOCUMENT = "compliance_document"
    MEETING_MINUTES = "meeting_minutes"
    VENDOR_DOCUMENT = "vendor_document"
    AS_BUILT_DOCUMENT = "as_built_document"
    PROCEDURE = "procedure"
    MANUAL = "manual"
    CERTIFICATE = "certificate"
    OTHER = "other"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: UserRole
    discipline: Optional[str] = None  # e.g., "Mechanical", "Electrical", "Process"
    hourly_rate: Optional[float] = None  # For resource costing
    availability: Optional[float] = 1.0  # 0.0 to 1.0, default full availability
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    role: UserRole
    discipline: Optional[str] = None
    hourly_rate: Optional[float] = None
    availability: Optional[float] = 1.0

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    status: ProjectStatus
    start_date: datetime
    end_date: Optional[datetime] = None
    project_manager_id: str
    created_by: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    name: str
    description: str
    start_date: datetime
    end_date: Optional[datetime] = None
    project_manager_id: str

class Epic(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: EpicStatus = EpicStatus.BACKLOG
    project_id: str
    created_by: str
    assigned_to: Optional[str] = None  # Epic owner
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    story_points: Optional[int] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    labels: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class EpicCreate(BaseModel):
    title: str
    description: str
    project_id: str
    assigned_to: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    story_points: Optional[int] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    labels: List[str] = []

class Sprint(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    status: SprintStatus = SprintStatus.PLANNING
    project_id: str
    start_date: datetime
    end_date: datetime
    goal: Optional[str] = None
    created_by: str
    capacity_hours: Optional[float] = None  # Total team capacity for sprint
    velocity_target: Optional[int] = None  # Target story points
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SprintCreate(BaseModel):
    name: str
    description: str
    project_id: str
    start_date: datetime
    end_date: datetime
    goal: Optional[str] = None
    capacity_hours: Optional[float] = None
    velocity_target: Optional[int] = None

class Document(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    category: DocumentCategory
    status: DocumentStatus = DocumentStatus.DRAFT
    project_id: Optional[str] = None  # Associated project
    task_id: Optional[str] = None  # Associated task
    file_name: str
    file_size: int  # Size in bytes
    file_type: str  # MIME type
    file_path: str  # Storage path
    version: str = "1.0"
    revision: Optional[str] = None
    discipline: Optional[str] = None  # Engineering discipline
    document_number: Optional[str] = None  # Unique document identifier
    created_by: str
    reviewed_by: Optional[str] = None
    approved_by: Optional[str] = None
    tags: List[str] = []
    is_confidential: bool = False
    expiry_date: Optional[datetime] = None  # For certificates, etc.
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentCreate(BaseModel):
    title: str
    description: str
    category: DocumentCategory
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    file_name: str
    file_size: int
    file_type: str
    file_path: str
    version: str = "1.0"
    revision: Optional[str] = None
    discipline: Optional[str] = None
    document_number: Optional[str] = None
    tags: List[str] = []
    is_confidential: bool = False
    expiry_date: Optional[datetime] = None

class DocumentUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[DocumentCategory] = None
    status: Optional[DocumentStatus] = None
    project_id: Optional[str] = None
    task_id: Optional[str] = None
    version: Optional[str] = None
    revision: Optional[str] = None
    discipline: Optional[str] = None
    document_number: Optional[str] = None
    reviewed_by: Optional[str] = None
    approved_by: Optional[str] = None
    tags: Optional[List[str]] = None
    is_confidential: Optional[bool] = None
    expiry_date: Optional[datetime] = None

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None  # user_id
    project_id: Optional[str] = None  # None for independent tasks
    epic_id: Optional[str] = None  # Epic this task belongs to
    sprint_id: Optional[str] = None  # Sprint this task is assigned to
    story_points: Optional[int] = None  # Agile story points
    created_by: str
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    # Gantt Chart fields
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: Optional[float] = None
    predecessor_tasks: List[str] = []  # List of task IDs this task depends on
    is_milestone: bool = False
    progress_percent: Optional[float] = 0.0  # 0-100
    # Resource allocation
    required_resources: List[str] = []  # List of user IDs required for this task
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None
    project_id: Optional[str] = None
    epic_id: Optional[str] = None
    sprint_id: Optional[str] = None
    story_points: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    # Gantt fields
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: Optional[float] = None
    predecessor_tasks: List[str] = []
    is_milestone: bool = False
    required_resources: List[str] = []
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[str] = None
    epic_id: Optional[str] = None
    sprint_id: Optional[str] = None
    story_points: Optional[int] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    # Gantt fields
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_days: Optional[float] = None
    predecessor_tasks: Optional[List[str]] = None
    is_milestone: Optional[bool] = None
    progress_percent: Optional[float] = None
    required_resources: Optional[List[str]] = None
    tags: Optional[List[str]] = None

# Dashboard stats model
class DashboardStats(BaseModel):
    total_projects: int
    active_projects: int
    total_tasks: int
    completed_tasks: int
    in_progress_tasks: int
    overdue_tasks: int
    my_tasks: int

# Gantt Chart models
class GanttTask(BaseModel):
    id: str
    title: str
    start_date: datetime
    end_date: datetime
    duration_days: float
    progress_percent: float
    assigned_to: Optional[str] = None
    predecessor_tasks: List[str] = []
    is_milestone: bool = False
    status: TaskStatus
    priority: TaskPriority

class GanttData(BaseModel):
    tasks: List[GanttTask]
    project_start: datetime
    project_end: datetime
    critical_path: List[str] = []  # Task IDs on critical path

# Resource allocation models
class ResourceAllocation(BaseModel):
    user_id: str
    user_name: str
    discipline: str
    total_allocated_hours: float
    available_hours: float
    utilization_percent: float
    tasks: List[dict]

class ProjectResource(BaseModel):
    project_id: str
    project_name: str
    total_hours_required: float
    total_hours_allocated: float
    resources: List[ResourceAllocation]

# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user: UserCreate):
    user_dict = user.dict()
    user_obj = User(**user_dict)
    await db.users.insert_one(user_obj.dict())
    return user_obj

@api_router.get("/users", response_model=List[User])
async def get_users():
    users = await db.users.find().to_list(1000)
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: dict):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Remove fields that shouldn't be updated or are empty
    update_data = {k: v for k, v in user_update.items() if v is not None and v != ''}
    
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

# Project endpoints
@api_router.post("/projects", response_model=Project)
async def create_project(project: ProjectCreate):
    # Verify project manager exists
    pm = await db.users.find_one({"id": project.project_manager_id})
    if not pm:
        raise HTTPException(status_code=404, detail="Project manager not found")
    
    project_dict = project.dict()
    project_dict["created_by"] = project.project_manager_id  # For now, assume creator is PM
    project_dict["status"] = ProjectStatus.PLANNING
    project_obj = Project(**project_dict)
    await db.projects.insert_one(project_obj.dict())
    return project_obj

@api_router.get("/projects", response_model=List[Project])
async def get_projects():
    projects = await db.projects.find().to_list(1000)
    return [Project(**project) for project in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**project)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_update: dict):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project_update["updated_at"] = datetime.utcnow()
    await db.projects.update_one({"id": project_id}, {"$set": project_update})
    
    updated_project = await db.projects.find_one({"id": project_id})
    return Project(**updated_project)

# Task endpoints
@api_router.post("/tasks", response_model=Task)
async def create_task(task: TaskCreate):
    # If assigned to someone, verify user exists
    if task.assigned_to:
        user = await db.users.find_one({"id": task.assigned_to})
        if not user:
            raise HTTPException(status_code=404, detail="Assigned user not found")
    
    # If part of project, verify project exists
    if task.project_id:
        project = await db.projects.find_one({"id": task.project_id})
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
    
    task_dict = task.dict()
    task_dict["created_by"] = "default_user"  # TODO: Get from auth
    task_obj = Task(**task_dict)
    await db.tasks.insert_one(task_obj.dict())
    return task_obj

@api_router.get("/tasks", response_model=List[Task])
async def get_tasks(project_id: Optional[str] = None, assigned_to: Optional[str] = None):
    query = {}
    if project_id is not None:
        if project_id == "independent":
            query["project_id"] = None
        else:
            query["project_id"] = project_id
    if assigned_to:
        query["assigned_to"] = assigned_to
    
    tasks = await db.tasks.find(query).to_list(1000)
    return [Task(**task) for task in tasks]

@api_router.get("/tasks/{task_id}", response_model=Task)
async def get_task(task_id: str):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return Task(**task)

@api_router.put("/tasks/{task_id}", response_model=Task)
async def update_task(task_id: str, task_update: TaskUpdate):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {k: v for k, v in task_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**updated_task)

@api_router.delete("/tasks/{task_id}")
async def delete_task(task_id: str):
    result = await db.tasks.delete_one({"id": task_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str):
    # Check if user is assigned to any tasks
    assigned_tasks = await db.tasks.count_documents({"assigned_to": user_id})
    if assigned_tasks > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete user. User is assigned to {assigned_tasks} task(s). Please reassign or delete these tasks first.")
    
    # Check if user is a project manager
    managed_projects = await db.projects.count_documents({"project_manager_id": user_id})
    if managed_projects > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete user. User is managing {managed_projects} project(s). Please reassign project management first.")
    
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"message": "User deleted successfully"}

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str):
    # Check if project has tasks
    project_tasks = await db.tasks.count_documents({"project_id": project_id})
    if project_tasks > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete project. Project has {project_tasks} task(s). Please delete all tasks first or use force delete.")
    
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}

@api_router.delete("/projects/{project_id}/force")
async def force_delete_project(project_id: str):
    # Delete all tasks in the project first
    await db.tasks.delete_many({"project_id": project_id})
    
    # Delete the project
    result = await db.projects.delete_one({"id": project_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project and all associated tasks deleted successfully"}

# Dashboard endpoint
@api_router.get("/dashboard/stats", response_model=DashboardStats)
async def get_dashboard_stats():
    # Count projects
    total_projects = await db.projects.count_documents({})
    active_projects = await db.projects.count_documents({"status": ProjectStatus.ACTIVE})
    
    # Count tasks
    total_tasks = await db.tasks.count_documents({})
    completed_tasks = await db.tasks.count_documents({"status": TaskStatus.DONE})
    in_progress_tasks = await db.tasks.count_documents({"status": TaskStatus.IN_PROGRESS})
    
    # Count overdue tasks (simplified - tasks with due_date in past and not done)
    current_time = datetime.utcnow()
    overdue_tasks = await db.tasks.count_documents({
        "due_date": {"$lt": current_time},
        "status": {"$ne": TaskStatus.DONE}
    })
    
    # My tasks (placeholder - would normally use authenticated user)
    my_tasks = await db.tasks.count_documents({"assigned_to": "default_user"})
    
    return DashboardStats(
        total_projects=total_projects,
        active_projects=active_projects,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        overdue_tasks=overdue_tasks,
        my_tasks=my_tasks
    )

# Project-specific dashboard endpoint
@api_router.get("/projects/{project_id}/dashboard", response_model=DashboardStats)
async def get_project_dashboard_stats(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # Count tasks for this project only
    total_tasks = await db.tasks.count_documents({"project_id": project_id})
    completed_tasks = await db.tasks.count_documents({"project_id": project_id, "status": TaskStatus.DONE})
    in_progress_tasks = await db.tasks.count_documents({"project_id": project_id, "status": TaskStatus.IN_PROGRESS})
    
    # Count overdue tasks for this project
    current_time = datetime.utcnow()
    overdue_tasks = await db.tasks.count_documents({
        "project_id": project_id,
        "due_date": {"$lt": current_time},
        "status": {"$ne": TaskStatus.DONE}
    })
    
    # Count milestones
    milestones = await db.tasks.count_documents({"project_id": project_id, "is_milestone": True})
    
    return DashboardStats(
        total_projects=1,  # Always 1 for project-specific
        active_projects=1 if project["status"] == ProjectStatus.ACTIVE else 0,
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        in_progress_tasks=in_progress_tasks,
        overdue_tasks=overdue_tasks,
        my_tasks=milestones  # Reuse this field for milestones in project view
    )

# Kanban board data for projects
@api_router.get("/projects/{project_id}/kanban")
async def get_project_kanban(project_id: str):
    tasks = await db.tasks.find({"project_id": project_id}).to_list(1000)
    
    kanban_data = {
        "todo": [],
        "in_progress": [],
        "review": [],
        "done": []
    }
    
    for task in tasks:
        task_obj = Task(**task)
        kanban_data[task_obj.status.value].append(task_obj.dict())
    
    return kanban_data

# Gantt Chart endpoints
@api_router.get("/projects/{project_id}/gantt", response_model=GanttData)
async def get_project_gantt(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = await db.tasks.find({"project_id": project_id}).to_list(1000)
    
    gantt_tasks = []
    project_start = datetime.utcnow()
    project_end = datetime.utcnow()
    
    for task in tasks:
        task_obj = Task(**task)
        if task_obj.start_date and task_obj.end_date:
            gantt_task = GanttTask(
                id=task_obj.id,
                title=task_obj.title,
                start_date=task_obj.start_date,
                end_date=task_obj.end_date,
                duration_days=task_obj.duration_days or 1.0,
                progress_percent=task_obj.progress_percent or 0.0,
                assigned_to=task_obj.assigned_to,
                predecessor_tasks=task_obj.predecessor_tasks,
                is_milestone=task_obj.is_milestone,
                status=task_obj.status,
                priority=task_obj.priority
            )
            gantt_tasks.append(gantt_task)
            
            # Update project timeline
            if task_obj.start_date < project_start:
                project_start = task_obj.start_date
            if task_obj.end_date > project_end:
                project_end = task_obj.end_date
    
    # Simple critical path calculation (can be enhanced)
    critical_path = calculate_critical_path(gantt_tasks)
    
    return GanttData(
        tasks=gantt_tasks,
        project_start=project_start,
        project_end=project_end,
        critical_path=critical_path
    )

def calculate_critical_path(tasks: List[GanttTask]) -> List[str]:
    """Simple critical path calculation - can be enhanced with proper algorithm"""
    # For now, return tasks with longest duration and dependencies
    sorted_tasks = sorted(tasks, key=lambda t: t.duration_days, reverse=True)
    return [task.id for task in sorted_tasks[:3]]  # Return top 3 longest tasks

@api_router.put("/tasks/{task_id}/progress")
async def update_task_progress(task_id: str, progress: dict):
    task = await db.tasks.find_one({"id": task_id})
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    
    update_data = {
        "progress_percent": progress.get("progress_percent", 0),
        "updated_at": datetime.utcnow()
    }
    
    # Auto-update status based on progress
    if progress.get("progress_percent", 0) == 100:
        update_data["status"] = TaskStatus.DONE
    elif progress.get("progress_percent", 0) > 0:
        update_data["status"] = TaskStatus.IN_PROGRESS
    
    await db.tasks.update_one({"id": task_id}, {"$set": update_data})
    
    updated_task = await db.tasks.find_one({"id": task_id})
    return Task(**updated_task)

# Resource Management endpoints
@api_router.get("/projects/{project_id}/resources", response_model=ProjectResource)
async def get_project_resources(project_id: str):
    project = await db.projects.find_one({"id": project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = await db.tasks.find({"project_id": project_id}).to_list(1000)
    users = await db.users.find().to_list(1000)
    
    # Calculate resource allocation
    resource_map = {}
    total_hours_required = 0
    total_hours_allocated = 0
    
    for task in tasks:
        task_obj = Task(**task)
        if task_obj.assigned_to:
            user_id = task_obj.assigned_to
            if user_id not in resource_map:
                user = next((u for u in users if u["id"] == user_id), None)
                if user:
                    resource_map[user_id] = {
                        "user_id": user_id,
                        "user_name": user["name"],
                        "discipline": user.get("discipline", "General"),
                        "allocated_hours": 0,
                        "available_hours": 40,  # Default 40 hours per week
                        "tasks": []
                    }
            
            if user_id in resource_map:
                task_hours = task_obj.estimated_hours or 8  # Default 8 hours
                resource_map[user_id]["allocated_hours"] += task_hours
                resource_map[user_id]["tasks"].append({
                    "id": task_obj.id,
                    "title": task_obj.title,
                    "hours": task_hours,
                    "status": task_obj.status
                })
                total_hours_allocated += task_hours
        
        total_hours_required += task_obj.estimated_hours or 8
    
    # Convert to ResourceAllocation objects
    resources = []
    for resource_data in resource_map.values():
        utilization = (resource_data["allocated_hours"] / resource_data["available_hours"]) * 100
        resources.append(ResourceAllocation(
            user_id=resource_data["user_id"],
            user_name=resource_data["user_name"],
            discipline=resource_data["discipline"],
            total_allocated_hours=resource_data["allocated_hours"],
            available_hours=resource_data["available_hours"],
            utilization_percent=min(utilization, 100),  # Cap at 100%
            tasks=resource_data["tasks"]
        ))
    
    return ProjectResource(
        project_id=project_id,
        project_name=project["name"],
        total_hours_required=total_hours_required,
        total_hours_allocated=total_hours_allocated,
        resources=resources
    )

@api_router.get("/resources/overview")
async def get_resources_overview():
    users = await db.users.find().to_list(1000)
    tasks = await db.tasks.find({"assigned_to": {"$ne": None}}).to_list(1000)
    
    resource_summary = []
    
    for user in users:
        user_tasks = [t for t in tasks if t.get("assigned_to") == user["id"]]
        total_hours = sum(t.get("estimated_hours", 8) for t in user_tasks)
        
        # Use user's availability or default to 40 hours
        user_availability = user.get("availability", 1.0)
        available_hours = 40 * user_availability  # 40 hours * availability percentage
        
        resource_summary.append({
            "user_id": user["id"],
            "name": user["name"],
            "role": user["role"],
            "discipline": user.get("discipline", "General"),
            "hourly_rate": user.get("hourly_rate"),
            "allocated_hours": total_hours,
            "available_hours": available_hours,
            "utilization_percent": min((total_hours / available_hours) * 100, 100) if available_hours > 0 else 0,
            "active_tasks": len([t for t in user_tasks if t.get("status") != "done"])
        })
    
    return {"resources": resource_summary}

# Epic endpoints
@api_router.post("/epics", response_model=Epic)
async def create_epic(epic: EpicCreate):
    # Verify project exists
    project = await db.projects.find_one({"id": epic.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    epic_dict = epic.dict()
    epic_dict["created_by"] = "default_user"  # TODO: Get from auth
    epic_obj = Epic(**epic_dict)
    await db.epics.insert_one(epic_obj.dict())
    return epic_obj

@api_router.get("/epics", response_model=List[Epic])
async def get_epics(project_id: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    epics = await db.epics.find(query).to_list(1000)
    return [Epic(**epic) for epic in epics]

@api_router.get("/epics/{epic_id}", response_model=Epic)
async def get_epic(epic_id: str):
    epic = await db.epics.find_one({"id": epic_id})
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")
    return Epic(**epic)

@api_router.put("/epics/{epic_id}", response_model=Epic)
async def update_epic(epic_id: str, epic_update: dict):
    epic = await db.epics.find_one({"id": epic_id})
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")
    
    update_data = {k: v for k, v in epic_update.items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.epics.update_one({"id": epic_id}, {"$set": update_data})
    
    updated_epic = await db.epics.find_one({"id": epic_id})
    return Epic(**updated_epic)

@api_router.delete("/epics/{epic_id}")
async def delete_epic(epic_id: str):
    # Check if epic has tasks
    epic_tasks = await db.tasks.count_documents({"epic_id": epic_id})
    if epic_tasks > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete epic. Epic has {epic_tasks} task(s). Please move or delete these tasks first.")
    
    result = await db.epics.delete_one({"id": epic_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Epic not found")
    return {"message": "Epic deleted successfully"}

# Sprint endpoints
@api_router.post("/sprints", response_model=Sprint)
async def create_sprint(sprint: SprintCreate):
    # Verify project exists
    project = await db.projects.find_one({"id": sprint.project_id})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    sprint_dict = sprint.dict()
    sprint_dict["created_by"] = "default_user"  # TODO: Get from auth
    sprint_obj = Sprint(**sprint_dict)
    await db.sprints.insert_one(sprint_obj.dict())
    return sprint_obj

@api_router.get("/sprints", response_model=List[Sprint])
async def get_sprints(project_id: Optional[str] = None, status: Optional[SprintStatus] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    if status:
        query["status"] = status
    
    sprints = await db.sprints.find(query).to_list(1000)
    return [Sprint(**sprint) for sprint in sprints]

@api_router.get("/sprints/{sprint_id}", response_model=Sprint)
async def get_sprint(sprint_id: str):
    sprint = await db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return Sprint(**sprint)

@api_router.put("/sprints/{sprint_id}", response_model=Sprint)
async def update_sprint(sprint_id: str, sprint_update: dict):
    sprint = await db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    update_data = {k: v for k, v in sprint_update.items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.sprints.update_one({"id": sprint_id}, {"$set": update_data})
    
    updated_sprint = await db.sprints.find_one({"id": sprint_id})
    return Sprint(**updated_sprint)

@api_router.delete("/sprints/{sprint_id}")
async def delete_sprint(sprint_id: str):
    # Remove sprint assignment from all tasks
    await db.tasks.update_many({"sprint_id": sprint_id}, {"$unset": {"sprint_id": ""}})
    
    result = await db.sprints.delete_one({"id": sprint_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Sprint not found")
    return {"message": "Sprint deleted successfully and tasks unassigned"}

# Sprint Board (Kanban with sprint filtering)
@api_router.get("/sprints/{sprint_id}/board")
async def get_sprint_board(sprint_id: str):
    sprint = await db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    tasks = await db.tasks.find({"sprint_id": sprint_id}).to_list(1000)
    
    sprint_board = {
        "todo": [],
        "in_progress": [],
        "review": [],
        "done": []
    }
    
    for task in tasks:
        task_obj = Task(**task)
        sprint_board[task_obj.status.value].append(task_obj.dict())
    
    return {
        "sprint": Sprint(**sprint).dict(),
        "board": sprint_board
    }

# Sprint analytics
@api_router.get("/sprints/{sprint_id}/analytics")
async def get_sprint_analytics(sprint_id: str):
    sprint = await db.sprints.find_one({"id": sprint_id})
    if not sprint:
        raise HTTPException(status_code=404, detail="Sprint not found")
    
    tasks = await db.tasks.find({"sprint_id": sprint_id}).to_list(1000)
    
    total_story_points = sum(task.get("story_points", 0) for task in tasks if task.get("story_points"))
    completed_story_points = sum(task.get("story_points", 0) for task in tasks if task.get("story_points") and task.get("status") == "done")
    
    total_tasks = len(tasks)
    completed_tasks = len([task for task in tasks if task.get("status") == "done"])
    
    # Calculate days elapsed and remaining
    start_date = datetime.fromisoformat(sprint["start_date"])
    end_date = datetime.fromisoformat(sprint["end_date"])
    current_date = datetime.utcnow()
    
    total_days = (end_date - start_date).days
    elapsed_days = max(0, (current_date - start_date).days)
    remaining_days = max(0, (end_date - current_date).days)
    
    return {
        "sprint_id": sprint_id,
        "total_story_points": total_story_points,
        "completed_story_points": completed_story_points,
        "remaining_story_points": total_story_points - completed_story_points,
        "completion_percentage": (completed_story_points / total_story_points * 100) if total_story_points > 0 else 0,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "remaining_tasks": total_tasks - completed_tasks,
        "task_completion_percentage": (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0,
        "total_days": total_days,
        "elapsed_days": elapsed_days,
        "remaining_days": remaining_days,
        "burndown_data": calculate_burndown_data(tasks, start_date, end_date)
    }

def calculate_burndown_data(tasks, start_date, end_date):
    """Calculate burndown chart data"""
    # Simplified burndown calculation
    total_story_points = sum(task.get("story_points", 0) for task in tasks if task.get("story_points"))
    
    # Generate ideal burndown line
    total_days = (end_date - start_date).days
    if total_days <= 0:
        return []
    
    burndown_data = []
    daily_burndown = total_story_points / total_days if total_days > 0 else 0
    
    for day in range(total_days + 1):
        current_date = start_date + timedelta(days=day)
        ideal_remaining = max(0, total_story_points - (day * daily_burndown))
        
        # Calculate actual remaining (simplified - in real app, would track daily completion)
        completed_points = sum(task.get("story_points", 0) for task in tasks 
                             if task.get("story_points") and task.get("status") == "done")
        actual_remaining = total_story_points - completed_points
        
        burndown_data.append({
            "date": current_date.isoformat(),
            "ideal_remaining": ideal_remaining,
            "actual_remaining": actual_remaining if current_date <= datetime.utcnow() else None
        })
    
    return burndown_data

# Document Management endpoints
@api_router.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    title: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    project_id: Optional[str] = Form(None),
    task_id: Optional[str] = Form(None),
    discipline: Optional[str] = Form(None),
    document_number: Optional[str] = Form(None),
    is_confidential: bool = Form(False),
    tags: str = Form("")  # Comma-separated tags
):
    try:
        # Create documents directory if it doesn't exist
        documents_dir = ROOT_DIR / "documents"
        documents_dir.mkdir(exist_ok=True)
        
        # Generate unique filename
        file_extension = file.filename.split('.')[-1] if '.' in file.filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = documents_dir / unique_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = file_path.stat().st_size
        
        # Parse tags
        tag_list = [tag.strip() for tag in tags.split(',') if tag.strip()] if tags else []
        
        # Create document record
        document_data = {
            "title": title,
            "description": description,
            "category": category,
            "project_id": project_id,
            "task_id": task_id,
            "file_name": file.filename,
            "file_size": file_size,
            "file_type": file.content_type,
            "file_path": str(file_path),
            "discipline": discipline,
            "document_number": document_number,
            "created_by": "default_user",  # TODO: Get from auth
            "tags": tag_list,
            "is_confidential": is_confidential
        }
        
        document_obj = Document(**document_data)
        await db.documents.insert_one(document_obj.dict())
        
        return document_obj
        
    except Exception as e:
        # Clean up file if document creation failed
        if 'file_path' in locals() and file_path.exists():
            file_path.unlink()
        raise HTTPException(status_code=500, detail=f"Failed to upload document: {str(e)}")

@api_router.get("/documents", response_model=List[Document])
async def get_documents(
    project_id: Optional[str] = None,
    category: Optional[str] = None,
    status: Optional[str] = None,
    discipline: Optional[str] = None,
    search: Optional[str] = None
):
    query = {}
    
    if project_id:
        query["project_id"] = project_id
    if category:
        query["category"] = category
    if status:
        query["status"] = status
    if discipline:
        query["discipline"] = discipline
    
    # Add text search
    if search:
        query["$or"] = [
            {"title": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}},
            {"document_number": {"$regex": search, "$options": "i"}},
            {"tags": {"$in": [{"$regex": search, "$options": "i"}]}}
        ]
    
    documents = await db.documents.find(query).to_list(1000)
    return [Document(**doc) for doc in documents]

@api_router.get("/documents/{document_id}", response_model=Document)
async def get_document(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    return Document(**document)

@api_router.get("/documents/{document_id}/download")
async def download_document(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    file_path = Path(document["file_path"])
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(
        path=file_path,
        filename=document["file_name"],
        media_type=document["file_type"]
    )

@api_router.put("/documents/{document_id}", response_model=Document)
async def update_document(document_id: str, document_update: DocumentUpdate):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    update_data = {k: v for k, v in document_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.documents.update_one({"id": document_id}, {"$set": update_data})
    
    updated_document = await db.documents.find_one({"id": document_id})
    return Document(**updated_document)

@api_router.put("/documents/{document_id}/status")
async def update_document_status(document_id: str, status_update: dict):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    new_status = status_update.get("status")
    reviewed_by = status_update.get("reviewed_by")
    approved_by = status_update.get("approved_by")
    
    update_data = {"updated_at": datetime.utcnow()}
    
    if new_status:
        update_data["status"] = new_status
    if reviewed_by:
        update_data["reviewed_by"] = reviewed_by
    if approved_by:
        update_data["approved_by"] = approved_by
    
    await db.documents.update_one({"id": document_id}, {"$set": update_data})
    
    updated_document = await db.documents.find_one({"id": document_id})
    return Document(**updated_document)

@api_router.delete("/documents/{document_id}")
async def delete_document(document_id: str):
    document = await db.documents.find_one({"id": document_id})
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Delete file from disk
    file_path = Path(document["file_path"])
    if file_path.exists():
        file_path.unlink()
    
    # Delete document record
    result = await db.documents.delete_one({"id": document_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    
    return {"message": "Document deleted successfully"}

# Document analytics
@api_router.get("/documents/analytics/summary")
async def get_document_analytics(project_id: Optional[str] = None):
    query = {}
    if project_id:
        query["project_id"] = project_id
    
    # Get document counts by category
    pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$category",
            "count": {"$sum": 1},
            "total_size": {"$sum": "$file_size"}
        }}
    ]
    
    category_stats = await db.documents.aggregate(pipeline).to_list(100)
    
    # Get document counts by status
    status_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": "$status", 
            "count": {"$sum": 1}
        }}
    ]
    
    status_stats = await db.documents.aggregate(status_pipeline).to_list(100)
    
    # Get total counts
    total_documents = await db.documents.count_documents(query)
    
    # Calculate total storage size
    size_pipeline = [
        {"$match": query},
        {"$group": {
            "_id": None,
            "total_size": {"$sum": "$file_size"}
        }}
    ]
    
    size_result = await db.documents.aggregate(size_pipeline).to_list(1)
    total_size = size_result[0]["total_size"] if size_result else 0
    
    return {
        "total_documents": total_documents,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "by_category": {stat["_id"]: stat for stat in category_stats},
        "by_status": {stat["_id"]: stat for stat in status_stats}
    }

# =============================================================================
# P6 INTEGRATION ENDPOINTS
# =============================================================================

@api_router.get("/p6/connection/test")
async def test_p6_connection():
    """Test P6 connection and return status"""
    try:
        connection_test = await p6_service.test_connection()
        return connection_test
    except Exception as e:
        logger.error(f"P6 connection test failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Connection test failed: {str(e)}",
            "error": str(e)
        }

@api_router.post("/p6/connection/configure")
async def configure_p6_connection(config: P6ConnectionConfig):
    """Configure P6 connection (for future use)"""
    try:
        # Store configuration securely (in production, use encrypted storage)
        config_doc = {
            "host": config.host,
            "username": config.username,
            "use_mock": config.use_mock,
            "timeout": config.timeout,
            "configured_at": datetime.utcnow(),
            "configured_by": "admin"  # TODO: Get from auth
        }
        
        # Don't store sensitive credentials in database in production
        await db.p6_config.replace_one({}, config_doc, upsert=True)
        
        return {
            "status": "success",
            "message": "P6 connection configured successfully",
            "host": config.host,
            "mock_mode": config.use_mock
        }
    except Exception as e:
        logger.error(f"P6 configuration failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Configuration failed: {str(e)}"
        }

@api_router.get("/p6/projects")
async def get_p6_projects():
    """Get projects directly from P6"""
    try:
        projects = await p6_service.p6_client.get_projects()
        return {
            "status": "success",
            "projects": projects,
            "count": len(projects)
        }
    except Exception as e:
        logger.error(f"Failed to fetch P6 projects: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to fetch P6 projects: {str(e)}",
            "projects": [],
            "count": 0
        }

@api_router.get("/p6/projects/{project_id}/activities")
async def get_p6_project_activities(project_id: int):
    """Get activities for a specific P6 project"""
    try:
        activities = await p6_service.p6_client.get_project_activities(project_id)
        return {
            "status": "success",
            "activities": activities,
            "count": len(activities),
            "project_id": project_id
        }
    except Exception as e:
        logger.error(f"Failed to fetch P6 activities for project {project_id}: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to fetch activities: {str(e)}",
            "activities": [],
            "count": 0,
            "project_id": project_id
        }

@api_router.get("/p6/resources")
async def get_p6_resources():
    """Get resources directly from P6"""
    try:
        resources = await p6_service.p6_client.get_resources()
        return {
            "status": "success",
            "resources": resources,
            "count": len(resources)
        }
    except Exception as e:
        logger.error(f"Failed to fetch P6 resources: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to fetch P6 resources: {str(e)}",
            "resources": [],
            "count": 0
        }

@api_router.post("/p6/sync")
async def sync_from_p6(sync_request: SyncRequest):
    """Sync data from P6 to PMFusion"""
    try:
        logger.info(f"Starting P6 sync with request: {sync_request}")
        
        # Start the sync process
        sync_result = await p6_service.sync_from_p6(sync_request)
        
        return {
            "status": "success",
            "message": "P6 sync completed",
            "sync_result": sync_result.dict()
        }
    except Exception as e:
        logger.error(f"P6 sync failed: {str(e)}")
        return {
            "status": "error",
            "message": f"P6 sync failed: {str(e)}",
            "sync_result": None
        }

@api_router.post("/p6/export")
async def export_to_p6(export_request: PMFusionToP6Export):
    """Export PMFusion project to P6"""
    try:
        logger.info(f"Starting P6 export for project: {export_request.project_id}")
        
        result = await p6_service.export_to_p6(export_request)
        
        return {
            "status": "success",
            "message": "PMFusion project exported to P6",
            "export_result": result
        }
    except Exception as e:
        logger.error(f"P6 export failed: {str(e)}")
        return {
            "status": "error",
            "message": f"P6 export failed: {str(e)}",
            "export_result": None
        }

@api_router.get("/p6/status")
async def get_p6_status():
    """Get P6 integration status and analytics"""
    try:
        status = await p6_service.get_sync_status()
        return {
            "status": "success",
            "p6_status": status
        }
    except Exception as e:
        logger.error(f"Failed to get P6 status: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to get P6 status: {str(e)}",
            "p6_status": None
        }

@api_router.get("/p6/sync/history")
async def get_sync_history(limit: int = 10):
    """Get P6 sync history"""
    try:
        sync_results = await db.p6_sync_results.find().sort("started_at", -1).limit(limit).to_list(limit)
        return {
            "status": "success",
            "sync_history": sync_results,
            "count": len(sync_results)
        }
    except Exception as e:
        logger.error(f"Failed to get sync history: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to get sync history: {str(e)}",
            "sync_history": [],
            "count": 0
        }

@api_router.post("/p6/activities/{activity_id}/progress")
async def update_p6_activity_progress(activity_id: int, progress_data: dict):
    """Update activity progress in P6"""
    try:
        percent_complete = progress_data.get("percent_complete", 0)
        
        result = await p6_service.p6_client.update_activity_progress(activity_id, percent_complete)
        
        return {
            "status": "success",
            "message": f"Activity {activity_id} progress updated to {percent_complete}%",
            "result": result
        }
    except Exception as e:
        logger.error(f"Failed to update P6 activity progress: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to update activity progress: {str(e)}"
        }

@api_router.get("/p6/mapping/preview")
async def preview_p6_mapping():
    """Preview P6 to PMFusion data mapping"""
    try:
        # Get sample P6 data
        sample_projects = await p6_service.p6_client.get_projects()
        sample_activities = []
        if sample_projects:
            sample_activities = await p6_service.p6_client.get_project_activities(sample_projects[0]["ObjectId"])
        
        # Show mapping examples
        mapping_preview = {
            "project_mappings": p6_service.data_mapping.project_mappings,
            "activity_mappings": p6_service.data_mapping.activity_mappings,
            "status_mappings": p6_service.data_mapping.status_mappings,
            "priority_mappings": p6_service.data_mapping.priority_mappings,
            "sample_p6_project": sample_projects[0] if sample_projects else None,
            "sample_p6_activity": sample_activities[0] if sample_activities else None
        }
        
        return {
            "status": "success",
            "mapping_preview": mapping_preview
        }
    except Exception as e:
        logger.error(f"Failed to generate mapping preview: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to generate mapping preview: {str(e)}"
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
