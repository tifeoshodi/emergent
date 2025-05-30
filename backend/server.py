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
from datetime import datetime, timedelta
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
