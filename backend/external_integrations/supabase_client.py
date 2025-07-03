from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional, Union

from supabase import Client, create_client

logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    logger.warning(
        "SUPABASE_URL or SUPABASE_KEY not set; Supabase client not initialized"
    )


def _client_for_token(jwt: Optional[str]) -> Client:
    """Get Supabase client with optional JWT token for RLS"""
    if not supabase:
        raise RuntimeError("Supabase client not configured")
    if jwt:
        return create_client(
            SUPABASE_URL,
            SUPABASE_KEY,
            options={"global": {"headers": {"Authorization": f"Bearer {jwt}"}}},
        )
    return supabase


def get_service_client() -> Client:
    """Get service role client (bypasses RLS)"""
    if not supabase:
        raise RuntimeError("Supabase client not configured")
    return supabase


# ============================================================================
# GENERIC CRUD OPERATIONS
# ============================================================================

def insert(table: str, data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    """Insert data into table"""
    client = _client_for_token(jwt)
    return client.table(table).insert(data).execute().data


def select(table: str, query: Optional[Dict[str, Any]] = None, jwt: Optional[str] = None) -> Any:
    """Select data from table"""
    client = _client_for_token(jwt)
    q = client.table(table).select("*")
    if query:
        q = q.match(query)
    return q.execute().data


def update(table: str, query: Dict[str, Any], data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    """Update data in table"""
    client = _client_for_token(jwt)
    return client.table(table).update(data).match(query).execute().data


# ============================================================================
# WORKFLOW-SPECIFIC HELPERS
# ============================================================================

def create_organization(name: str) -> Dict[str, Any]:
    """Create a new organization"""
    org_data = {"name": name}
    result = insert("orgs", org_data)
    return result[0] if isinstance(result, list) and result else result


def create_user(org_id: str, email: str, full_name: str, role: str, discipline_id: Optional[str] = None) -> Dict[str, Any]:
    """Create a new user"""
    import uuid
    user_data = {
        "id": str(uuid.uuid4()),  # Generate UUID for user ID
        "org_id": org_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "discipline_id": discipline_id
    }
    result = insert("users", user_data)
    return result[0] if isinstance(result, list) and result else result


def create_project(org_id: str, name: str, owner_id: str, **kwargs) -> Dict[str, Any]:
    """Create a new project"""
    project_data = {
        "org_id": org_id,
        "name": name,
        "owner_id": owner_id,
        **kwargs
    }
    result = insert("projects", project_data)
    return result[0] if isinstance(result, list) and result else result


def create_discipline(org_id: str, name: str, code: str, color_hex: str = "#6366f1") -> Dict[str, Any]:
    """Create a new discipline"""
    discipline_data = {
        "org_id": org_id,
        "name": name,
        "code": code,
        "color_hex": color_hex
    }
    result = insert("disciplines", discipline_data)
    return result[0] if isinstance(result, list) and result else result


def get_project_tasks(project_id: str, discipline_id: Optional[str] = None, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get tasks for a project, optionally filtered by discipline"""
    client = _client_for_token(jwt)
    query = client.table("tasks").select("*").eq("project_id", project_id)
    
    if discipline_id:
        query = query.eq("discipline_id", discipline_id)
    
    return query.execute().data


def update_task_status(task_id: str, status: str, jwt: Optional[str] = None) -> Dict[str, Any]:
    """Update task status (for kanban workflow)"""
    return update("tasks", {"id": task_id}, {"status": status}, jwt)


def assign_task(task_id: str, assignee_id: str, jwt: Optional[str] = None) -> Dict[str, Any]:
    """Assign task to user"""
    return update("tasks", {"id": task_id}, {"assignee_id": assignee_id, "status": "todo"}, jwt)


def get_discipline_kanban(discipline_id: str, project_id: str, jwt: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Get kanban board data for a discipline"""
    try:
        tasks = get_project_tasks(project_id, discipline_id, jwt) or []
    except Exception as e:
        logger.error(f"Error getting tasks for kanban: {str(e)}")
        tasks = []
    
    # Group by status
    kanban = {
        "backlog": [],
        "todo": [],
        "in_progress": [],
        "review_dic": [],
        "review_idc": [],
        "review_dcc": [],
        "done": []
    }
    
    for task in tasks:
        status = task.get("status", "backlog")
        if status in kanban:
            kanban[status].append(task)
        else:
            # Put tasks with unknown status in backlog
            kanban["backlog"].append(task)
    
    return kanban


def create_document(task_id: str, file_data: Dict[str, Any], jwt: Optional[str] = None) -> Dict[str, Any]:
    """Create document metadata for uploaded file"""
    # Get task details to populate document fields
    client = _client_for_token(jwt)
    task = client.table("tasks").select("*, projects(org_id)").eq("id", task_id).single().execute().data
    
    document_data = {
        "task_id": task_id,
        "org_id": task["projects"]["org_id"],
        "project_id": task["project_id"],
        "discipline_id": task["discipline_id"],
        **file_data
    }
    
    return insert("documents", document_data, jwt)


def log_activity(org_id: str, actor_id: str, entity_type: str, entity_id: str, action: str, details: Optional[Dict] = None):
    """Log user activity"""
    activity_data = {
        "org_id": org_id,
        "actor_id": actor_id,
        "entity_type": entity_type,
        "entity_id": entity_id,
        "action": action,
        "details": details or {}
    }
    return insert("activity_log", activity_data)


def create_notification(user_id: str, title: str, message: str, entity_type: Optional[str] = None, entity_id: Optional[str] = None):
    """Create user notification"""
    notification_data = {
        "user_id": user_id,
        "title": title,
        "message": message,
        "entity_type": entity_type,
        "entity_id": entity_id
    }
    return insert("notifications", notification_data)


# ============================================================================
# WBS & CPM HELPERS
# ============================================================================

def create_wbs_node(project_id: str, code: str, name: str, **kwargs) -> Dict[str, Any]:
    """Create WBS node"""
    wbs_data = {
        "project_id": project_id,
        "code": code,
        "name": name,
        **kwargs
    }
    return insert("wbs_nodes", wbs_data)


def get_project_wbs(project_id: str, jwt: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get WBS structure for project"""
    client = _client_for_token(jwt)
    return client.table("wbs_nodes").select("*").eq("project_id", project_id).order("sequence").execute().data


def save_critical_path(project_id: str, path_nodes: List[str], total_duration: float):
    """Save critical path calculation results"""
    path_data = {
        "project_id": project_id,
        "path_nodes": path_nodes,
        "total_duration": total_duration
    }
    
    # Upsert (insert or update)
    client = get_service_client()
    return client.table("critical_paths").upsert(path_data).execute().data
