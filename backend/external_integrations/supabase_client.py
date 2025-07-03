from __future__ import annotations

import json
import logging
import os
import re
import threading
import time
import uuid
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

# Thread-safe cache for JWT-authenticated clients with expiration tracking
_jwt_clients_cache: Dict[str, Client] = {}
_jwt_cache_timestamps: Dict[str, float] = {}
_jwt_cache_lock = threading.RLock()
JWT_CACHE_EXPIRY_SECONDS = 3600  # 1 hour expiry for cached JWT clients


def _cleanup_expired_jwt_cache() -> None:
    """Remove expired JWT clients from cache"""
    current_time = time.time()
    expired_tokens = []
    
    for token, timestamp in _jwt_cache_timestamps.items():
        if current_time - timestamp > JWT_CACHE_EXPIRY_SECONDS:
            expired_tokens.append(token)
    
    for token in expired_tokens:
        _jwt_clients_cache.pop(token, None)
        _jwt_cache_timestamps.pop(token, None)
        logger.debug(f"Removed {len(expired_tokens)} expired JWT client(s) from cache")


def _client_for_token(jwt: Optional[str]) -> Client:
    """Get Supabase client with optional JWT token for RLS"""
    if not supabase:
        raise RuntimeError("Supabase client not configured")
    
    if jwt:
        with _jwt_cache_lock:
            # Clean up expired tokens periodically
            _cleanup_expired_jwt_cache()
            
            # Check cache first to reuse existing client instances
            if jwt in _jwt_clients_cache:
                return _jwt_clients_cache[jwt]
            
            # Create new client with JWT and cache it
            jwt_client = create_client(
                SUPABASE_URL,
                SUPABASE_KEY,
                options={"global": {"headers": {"Authorization": f"Bearer {jwt}"}}},
            )
            _jwt_clients_cache[jwt] = jwt_client
            _jwt_cache_timestamps[jwt] = time.time()
            return jwt_client
    
    return supabase


def get_service_client() -> Client:
    """Get service role client (bypasses RLS)"""
    if not supabase:
        raise RuntimeError("Supabase client not configured")
    return supabase


def clear_jwt_client_cache(jwt: Optional[str] = None) -> None:
    """Clear JWT client cache - useful for expired tokens or memory management"""
    
    with _jwt_cache_lock:
        if jwt:
            # Clear specific JWT client
            _jwt_clients_cache.pop(jwt, None)
            _jwt_cache_timestamps.pop(jwt, None)
            logger.debug(f"Cleared cached client for specific JWT")
        else:
            # Clear all cached clients
            _jwt_clients_cache.clear()
            _jwt_cache_timestamps.clear()
            logger.debug("Cleared all JWT client cache")


# ============================================================================
# GENERIC CRUD OPERATIONS
# ============================================================================

def insert(table: str, data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    """Insert data into table"""
    try:
        client = _client_for_token(jwt)
        result = client.table(table).insert(data).execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to insert data into table '{table}': {str(e)}", 
                    extra={"table": table, "data_keys": list(data.keys()) if data else []})
        raise RuntimeError(f"Database insert operation failed for table '{table}': {str(e)}") from e


def select(table: str, query: Optional[Dict[str, Any]] = None, jwt: Optional[str] = None) -> Any:
    """Select data from table"""
    try:
        client = _client_for_token(jwt)
        q = client.table(table).select("*")
        if query:
            q = q.match(query)
        result = q.execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to select data from table '{table}': {str(e)}", 
                    extra={"table": table, "query": query})
        raise RuntimeError(f"Database select operation failed for table '{table}': {str(e)}") from e


def update(table: str, query: Dict[str, Any], data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    """Update data in table"""
    try:
        client = _client_for_token(jwt)
        result = client.table(table).update(data).match(query).execute()
        return result.data
    except Exception as e:
        logger.error(f"Failed to update data in table '{table}': {str(e)}", 
                    extra={"table": table, "query": query, "data_keys": list(data.keys()) if data else []})
        raise RuntimeError(f"Database update operation failed for table '{table}': {str(e)}") from e


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
    # Validate email format
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    if not re.match(email_pattern, email):
        raise ValueError(f"Invalid email format: {email}")
    
    # Validate role (define allowed roles)
    allowed_roles = {"admin", "manager", "engineer", "viewer", "scheduler"}
    if role not in allowed_roles:
        raise ValueError(f"Invalid role '{role}'. Allowed roles are: {', '.join(allowed_roles)}")
    
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

# Kanban board status columns
KANBAN_STATUSES = {
    "backlog": "Backlog",
    "todo": "To Do", 
    "in_progress": "In Progress",
    "review_dic": "Review DIC",
    "review_idc": "Review IDC",
    "review_dcc": "Review DCC",
    "done": "Done"
}

def get_discipline_kanban(discipline_id: str, project_id: str, jwt: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Get kanban board data for a discipline"""
    try:
        tasks = get_project_tasks(project_id, discipline_id, jwt) or []
    except Exception as e:
        logger.error(f"Error getting tasks for kanban: {str(e)}")
        tasks = []
    
    # Group by status
    kanban = {status: [] for status in KANBAN_STATUSES}
    
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
    
    try:
        task = client.table("tasks").select("*, projects(org_id)").eq("id", task_id).single().execute().data
    except Exception as e:
        logger.error(f"Task not found with ID {task_id}: {str(e)}")
        raise ValueError(f"Task with ID '{task_id}' not found") from e
    
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
        "path_nodes": json.dumps(path_nodes),  # Explicitly serialize to JSON
        "total_duration": total_duration
    }
    
    # Upsert (insert or update)
    client = get_service_client()
    return client.table("critical_paths").upsert(path_data).execute().data
