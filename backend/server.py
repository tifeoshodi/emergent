from fastapi import FastAPI, APIRouter, HTTPException, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from enum import Enum

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

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    role: UserRole
    discipline: Optional[str] = None  # e.g., "Mechanical", "Electrical", "Process"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    role: UserRole
    discipline: Optional[str] = None

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

class Task(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    status: TaskStatus = TaskStatus.TODO
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None  # user_id
    project_id: Optional[str] = None  # None for independent tasks
    created_by: str
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
    tags: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TaskCreate(BaseModel):
    title: str
    description: str
    priority: TaskPriority = TaskPriority.MEDIUM
    assigned_to: Optional[str] = None
    project_id: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    tags: List[str] = []

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    estimated_hours: Optional[float] = None
    actual_hours: Optional[float] = None
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
