import requests
import json
from datetime import datetime, timedelta
import time
import uuid
import sys
import os

# Get Backend URL from frontend/.env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.strip().split('=')[1].strip('"\'') + '/api'
    except Exception as e:
        print(f"Error reading .env file: {e}")
        # Fallback to the existing URL if we can't read the .env file
        return "https://526b0f27-3b4b-4c49-a6fe-78e71b675c83.preview.emergentagent.com/api"

BACKEND_URL = get_backend_url()
print(f"Using backend URL: {BACKEND_URL}")

# Test results tracking
test_results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def log_test(name, passed, message=""):
    """Log test results"""
    status = "PASS" if passed else "FAIL"
    print(f"{status}: {name} - {message}")
    test_results["tests"].append({
        "name": name,
        "passed": passed,
        "message": message
    })
    if passed:
        test_results["passed"] += 1
    else:
        test_results["failed"] += 1

def test_api_health():
    """Test API health endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/")
        log_test("API Health Check", response.status_code == 200, f"Status code: {response.status_code}")
    except Exception as e:
        log_test("API Health Check", False, f"Exception: {str(e)}")

# User data for testing
users_data = [
    {
        "name": "John Smith",
        "email": "john.smith@epc.com",
        "role": "project_manager",
        "discipline": "Management",
        "hourly_rate": 150.0,
        "availability": 1.0
    },
    {
        "name": "Sarah Johnson",
        "email": "sarah.johnson@epc.com",
        "role": "engineering_manager",
        "discipline": "Engineering",
        "hourly_rate": 125.0,
        "availability": 0.9
    },
    {
        "name": "Mike Chen",
        "email": "mike.chen@epc.com",
        "role": "senior_engineer_1",
        "discipline": "Mechanical",
        "hourly_rate": 110.0,
        "availability": 0.8
    },
    {
        "name": "Lisa Anderson",
        "email": "lisa.anderson@epc.com",
        "role": "senior_engineer_2",
        "discipline": "Electrical",
        "hourly_rate": 100.0,
        "availability": 1.0
    },
    {
        "name": "Tom Wilson",
        "email": "tom.wilson@epc.com",
        "role": "intermediate_engineer",
        "discipline": "Process",
        "hourly_rate": 85.0,
        "availability": 0.75
    },
    {
        "name": "Emma Davis",
        "email": "emma.davis@epc.com",
        "role": "junior_engineer",
        "discipline": "Civil",
        "hourly_rate": 65.0,
        "availability": 1.0
    },
    {
        "name": "David Brown",
        "email": "david.brown@epc.com",
        "role": "contractor",
        "discipline": "Instrumentation",
        "hourly_rate": 95.0,
        "availability": 0.5
    }
]

# Store created users
created_users = []

def test_create_users():
    """Test creating users with different roles"""
    for user_data in users_data:
        try:
            response = requests.post(f"{BACKEND_URL}/users", json=user_data)
            if response.status_code == 200:
                user = response.json()
                created_users.append(user)
                log_test(f"Create User: {user_data['name']}", True, f"Created user with ID: {user['id']}")
            else:
                log_test(f"Create User: {user_data['name']}", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Create User: {user_data['name']}", False, f"Exception: {str(e)}")

def test_get_users():
    """Test getting all users"""
    try:
        response = requests.get(f"{BACKEND_URL}/users")
        if response.status_code == 200:
            users = response.json()
            log_test("Get All Users", True, f"Retrieved {len(users)} users")
        else:
            log_test("Get All Users", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Users", False, f"Exception: {str(e)}")

def test_get_user_by_id():
    """Test getting a user by ID"""
    if not created_users:
        log_test("Get User by ID", False, "No users created to test with")
        return
    
    user_id = created_users[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/users/{user_id}")
        if response.status_code == 200:
            user = response.json()
            log_test("Get User by ID", True, f"Retrieved user: {user['name']}")
        else:
            log_test("Get User by ID", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get User by ID", False, f"Exception: {str(e)}")

def test_update_user():
    """Test updating a user profile"""
    if not created_users:
        log_test("Update User", False, "No users created to test with")
        return
    
    user_id = created_users[0]["id"]
    update_data = {
        "name": "John Smith Updated",
        "email": "john.smith.updated@epc.com",
        "role": "project_manager",
        "discipline": "Project Management",
        "hourly_rate": 160.0,
        "availability": 0.9
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", json=update_data)
        if response.status_code == 200:
            user = response.json()
            log_test("Update User", True, f"Updated user: {user['name']}")
            
            # Verify all fields were updated correctly
            for key, value in update_data.items():
                if user[key] != value:
                    log_test(f"Update User Field: {key}", False, f"Expected {value}, got {user[key]}")
                else:
                    log_test(f"Update User Field: {key}", True, f"Field updated correctly")
        else:
            log_test("Update User", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update User", False, f"Exception: {str(e)}")

def test_partial_user_updates():
    """Test partial updates to user profiles"""
    if not created_users or len(created_users) < 2:
        log_test("Partial User Updates", False, "Not enough users created to test with")
        return
    
    user_id = created_users[1]["id"]
    
    # First, get the current user data
    try:
        response = requests.get(f"{BACKEND_URL}/users/{user_id}")
        if response.status_code != 200:
            log_test("Partial User Updates - Get Original", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        original_user = response.json()
    except Exception as e:
        log_test("Partial User Updates - Get Original", False, f"Exception: {str(e)}")
        return
    
    # Test updating only the hourly_rate
    partial_update = {
        "hourly_rate": 130.0
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", json=partial_update)
        if response.status_code == 200:
            updated_user = response.json()
            
            # Verify only hourly_rate was updated
            if updated_user["hourly_rate"] == partial_update["hourly_rate"]:
                log_test("Partial User Update - hourly_rate", True, f"hourly_rate updated to {updated_user['hourly_rate']}")
            else:
                log_test("Partial User Update - hourly_rate", False, f"Expected {partial_update['hourly_rate']}, got {updated_user['hourly_rate']}")
            
            # Verify other fields remained unchanged
            unchanged_fields = ["name", "email", "role", "discipline", "availability"]
            for field in unchanged_fields:
                if updated_user[field] == original_user[field]:
                    log_test(f"Partial User Update - Unchanged {field}", True, f"{field} remained unchanged")
                else:
                    log_test(f"Partial User Update - Unchanged {field}", False, f"Expected {original_user[field]}, got {updated_user[field]}")
        else:
            log_test("Partial User Update", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Partial User Update", False, f"Exception: {str(e)}")
    
    # Test updating only the availability
    partial_update = {
        "availability": 0.8
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", json=partial_update)
        if response.status_code == 200:
            updated_user = response.json()
            
            # Verify only availability was updated
            if updated_user["availability"] == partial_update["availability"]:
                log_test("Partial User Update - availability", True, f"availability updated to {updated_user['availability']}")
            else:
                log_test("Partial User Update - availability", False, f"Expected {partial_update['availability']}, got {updated_user['availability']}")
        else:
            log_test("Partial User Update - availability", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Partial User Update - availability", False, f"Exception: {str(e)}")

def test_user_hourly_rate_and_availability():
    """Test hourly rate and availability fields for users"""
    if not created_users:
        log_test("User Hourly Rate and Availability", False, "No users created to test with")
        return
    
    # Verify all users have hourly_rate and availability fields
    for user in created_users:
        if "hourly_rate" not in user:
            log_test(f"User Hourly Rate - {user['name']}", False, "hourly_rate field missing")
        else:
            log_test(f"User Hourly Rate - {user['name']}", True, f"hourly_rate: {user['hourly_rate']}")
        
        if "availability" not in user:
            log_test(f"User Availability - {user['name']}", False, "availability field missing")
        else:
            log_test(f"User Availability - {user['name']}", True, f"availability: {user['availability']}")
    
    # Create a new user with specific hourly_rate and availability
    new_user_data = {
        "name": "Test Rate User",
        "email": "test.rate@epc.com",
        "role": "senior_engineer_1",
        "discipline": "Testing",
        "hourly_rate": 115.50,
        "availability": 0.75
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/users", json=new_user_data)
        if response.status_code == 200:
            user = response.json()
            created_users.append(user)
            
            # Verify hourly_rate and availability were stored correctly
            if user["hourly_rate"] == new_user_data["hourly_rate"]:
                log_test("Create User with Hourly Rate", True, f"hourly_rate stored correctly: {user['hourly_rate']}")
            else:
                log_test("Create User with Hourly Rate", False, f"Expected {new_user_data['hourly_rate']}, got {user['hourly_rate']}")
            
            if user["availability"] == new_user_data["availability"]:
                log_test("Create User with Availability", True, f"availability stored correctly: {user['availability']}")
            else:
                log_test("Create User with Availability", False, f"Expected {new_user_data['availability']}, got {user['availability']}")
        else:
            log_test("Create User with Rate and Availability", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Create User with Rate and Availability", False, f"Exception: {str(e)}")

# Project data for testing
def get_project_data():
    """Generate project data using created users"""
    if len(created_users) < 2:
        return []
    
    # Find project managers
    project_managers = [user for user in created_users if user["role"] == "project_manager"]
    if not project_managers:
        project_managers = [created_users[0]]  # Use first user if no PM found
    
    start_date = datetime.now().isoformat()
    end_date = (datetime.now() + timedelta(days=90)).isoformat()
    
    return [
        {
            "name": "Oil Refinery Expansion",
            "description": "Expansion of the existing oil refinery to increase production capacity by 25%",
            "start_date": start_date,
            "end_date": end_date,
            "project_manager_id": project_managers[0]["id"]
        },
        {
            "name": "Gas Pipeline Installation",
            "description": "Installation of a new 50km gas pipeline connecting the refinery to the distribution network",
            "start_date": start_date,
            "end_date": end_date,
            "project_manager_id": project_managers[0]["id"] if len(project_managers) == 1 else project_managers[1]["id"]
        },
        {
            "name": "Offshore Platform Maintenance",
            "description": "Scheduled maintenance and upgrades for offshore drilling platform",
            "start_date": start_date,
            "end_date": end_date,
            "project_manager_id": project_managers[0]["id"]
        }
    ]

# Store created projects
created_projects = []

def test_create_projects():
    """Test creating projects"""
    projects_data = get_project_data()
    if not projects_data:
        log_test("Create Projects", False, "Not enough users created to test with")
        return
    
    for project_data in projects_data:
        try:
            response = requests.post(f"{BACKEND_URL}/projects", json=project_data)
            if response.status_code == 200:
                project = response.json()
                created_projects.append(project)
                log_test(f"Create Project: {project_data['name']}", True, f"Created project with ID: {project['id']}")
            else:
                log_test(f"Create Project: {project_data['name']}", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Create Project: {project_data['name']}", False, f"Exception: {str(e)}")

def test_get_projects():
    """Test getting all projects"""
    try:
        response = requests.get(f"{BACKEND_URL}/projects")
        if response.status_code == 200:
            projects = response.json()
            log_test("Get All Projects", True, f"Retrieved {len(projects)} projects")
        else:
            log_test("Get All Projects", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Projects", False, f"Exception: {str(e)}")

def test_get_project_by_id():
    """Test getting a project by ID"""
    if not created_projects:
        log_test("Get Project by ID", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}")
        if response.status_code == 200:
            project = response.json()
            log_test("Get Project by ID", True, f"Retrieved project: {project['name']}")
        else:
            log_test("Get Project by ID", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Project by ID", False, f"Exception: {str(e)}")

def test_update_project():
    """Test updating a project"""
    if not created_projects:
        log_test("Update Project", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    update_data = {
        "status": "active",
        "description": "Updated description for testing"
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/projects/{project_id}", json=update_data)
        if response.status_code == 200:
            project = response.json()
            log_test("Update Project", True, f"Updated project status to: {project['status']}")
        else:
            log_test("Update Project", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Project", False, f"Exception: {str(e)}")

# Task data for testing
def get_task_data():
    """Generate task data using created users and projects"""
    if not created_users or not created_projects:
        return []
    
    # Find engineers
    engineers = [user for user in created_users if "engineer" in user["role"]]
    if not engineers:
        engineers = created_users  # Use all users if no engineers found
    
    now = datetime.now()
    
    tasks = []
    
    # Project-specific tasks with Gantt chart data
    for i, project in enumerate(created_projects):
        # Create a sequence of tasks with dependencies for Gantt chart
        start_date = now
        
        # First task is a milestone (project kickoff)
        kickoff_task = {
            "title": f"Project Kickoff - {project['name']}",
            "description": f"Initial kickoff meeting for {project['name']}",
            "priority": "high",
            "assigned_to": engineers[0]["id"],
            "project_id": project["id"],
            "due_date": start_date.isoformat(),
            "estimated_hours": 8.0,
            "start_date": start_date.isoformat(),
            "end_date": start_date.isoformat(),
            "duration_days": 1.0,
            "is_milestone": True,
            "predecessor_tasks": [],
            "required_resources": [engineers[0]["id"]],
            "tags": ["kickoff", "milestone"]
        }
        tasks.append(kickoff_task)
        
        # Add regular tasks with dependencies
        last_task_id = None
        for j in range(3):
            engineer_idx = (i + j) % len(engineers)
            task_start = start_date + timedelta(days=j*5 + 1)
            task_duration = (j+1) * 5  # 5, 10, 15 days
            task_end = task_start + timedelta(days=task_duration)
            
            task = {
                "title": f"Task {j+1} for {project['name']}",
                "description": f"This is a test task for project {project['name']}",
                "priority": ["low", "medium", "high", "critical"][j % 4],
                "assigned_to": engineers[engineer_idx]["id"],
                "project_id": project["id"],
                "due_date": task_end.isoformat(),
                "estimated_hours": 40.0,
                "start_date": task_start.isoformat(),
                "end_date": task_end.isoformat(),
                "duration_days": float(task_duration),
                "is_milestone": False,
                "predecessor_tasks": [last_task_id] if last_task_id else [],
                "required_resources": [engineers[engineer_idx]["id"]],
                "tags": ["test", f"project-{i}", f"priority-{j%4}"]
            }
            tasks.append(task)
            last_task_id = None  # Will be set after task creation
        
        # Final milestone (project completion)
        final_date = start_date + timedelta(days=20)
        completion_task = {
            "title": f"Project Completion - {project['name']}",
            "description": f"Final delivery for {project['name']}",
            "priority": "critical",
            "assigned_to": engineers[0]["id"],
            "project_id": project["id"],
            "due_date": final_date.isoformat(),
            "estimated_hours": 8.0,
            "start_date": final_date.isoformat(),
            "end_date": final_date.isoformat(),
            "duration_days": 1.0,
            "is_milestone": True,
            "predecessor_tasks": [last_task_id] if last_task_id else [],
            "required_resources": [engineers[0]["id"]],
            "tags": ["completion", "milestone"]
        }
        tasks.append(completion_task)
    
    # Independent tasks (not associated with any project)
    for i in range(3):
        engineer_idx = i % len(engineers)
        due_date = (now + timedelta(days=15)).isoformat()
        tasks.append({
            "title": f"Independent Task {i+1}",
            "description": f"This is an independent test task not associated with any project",
            "priority": ["low", "medium", "high"][i % 3],
            "assigned_to": engineers[engineer_idx]["id"],
            "project_id": None,
            "due_date": due_date,
            "estimated_hours": 20.0,
            "tags": ["test", "independent", f"priority-{i%3}"]
        })
    
    return tasks

# Store created tasks
created_tasks = []

def test_create_tasks():
    """Test creating tasks"""
    tasks_data = get_task_data()
    if not tasks_data:
        log_test("Create Tasks", False, "Not enough users or projects created to test with")
        return
    
    # Group tasks by project for proper dependency tracking
    tasks_by_project = {}
    for task in tasks_data:
        project_id = task.get("project_id")
        if project_id not in tasks_by_project:
            tasks_by_project[project_id] = []
        tasks_by_project[project_id].append(task)
    
    # Create tasks project by project to handle dependencies
    for project_id, project_tasks in tasks_by_project.items():
        last_task_id = None
        for task_data in project_tasks:
            # Update predecessor task ID if needed
            if task_data.get("predecessor_tasks") == [None] and last_task_id:
                task_data["predecessor_tasks"] = [last_task_id]
            
            try:
                response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
                if response.status_code == 200:
                    task = response.json()
                    created_tasks.append(task)
                    last_task_id = task["id"]  # Store for dependency
                    log_test(f"Create Task: {task_data['title']}", True, f"Created task with ID: {task['id']}")
                else:
                    log_test(f"Create Task: {task_data['title']}", False, f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                log_test(f"Create Task: {task_data['title']}", False, f"Exception: {str(e)}")
    
    # Create independent tasks
    for task_data in tasks_data:
        if task_data.get("project_id") is None:
            try:
                response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
                if response.status_code == 200:
                    task = response.json()
                    created_tasks.append(task)
                    log_test(f"Create Task: {task_data['title']}", True, f"Created task with ID: {task['id']}")
                else:
                    log_test(f"Create Task: {task_data['title']}", False, f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                log_test(f"Create Task: {task_data['title']}", False, f"Exception: {str(e)}")

def test_get_tasks():
    """Test getting all tasks"""
    try:
        response = requests.get(f"{BACKEND_URL}/tasks")
        if response.status_code == 200:
            tasks = response.json()
            log_test("Get All Tasks", True, f"Retrieved {len(tasks)} tasks")
        else:
            log_test("Get All Tasks", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Tasks", False, f"Exception: {str(e)}")

def test_get_task_by_id():
    """Test getting a task by ID"""
    if not created_tasks:
        log_test("Get Task by ID", False, "No tasks created to test with")
        return
    
    task_id = created_tasks[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/tasks/{task_id}")
        if response.status_code == 200:
            task = response.json()
            log_test("Get Task by ID", True, f"Retrieved task: {task['title']}")
        else:
            log_test("Get Task by ID", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Task by ID", False, f"Exception: {str(e)}")

def test_update_task():
    """Test updating a task"""
    if not created_tasks:
        log_test("Update Task", False, "No tasks created to test with")
        return
    
    task_id = created_tasks[0]["id"]
    update_data = {
        "status": "in_progress",
        "description": "Updated description for testing",
        "actual_hours": 10.5
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/tasks/{task_id}", json=update_data)
        if response.status_code == 200:
            task = response.json()
            log_test("Update Task", True, f"Updated task status to: {task['status']}")
        else:
            log_test("Update Task", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Task", False, f"Exception: {str(e)}")

def test_task_status_workflow():
    """Test task status workflow (todo -> in_progress -> review -> done)"""
    if not created_tasks:
        log_test("Task Status Workflow", False, "No tasks created to test with")
        return
    
    task_id = created_tasks[0]["id"]
    statuses = ["in_progress", "review", "done"]
    
    for status in statuses:
        try:
            response = requests.put(f"{BACKEND_URL}/tasks/{task_id}", json={"status": status})
            if response.status_code == 200:
                task = response.json()
                log_test(f"Task Status Update to {status}", True, f"Updated task status to: {task['status']}")
            else:
                log_test(f"Task Status Update to {status}", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Task Status Update to {status}", False, f"Exception: {str(e)}")

def test_filter_tasks_by_project():
    """Test filtering tasks by project_id"""
    if not created_projects:
        log_test("Filter Tasks by Project", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/tasks?project_id={project_id}")
        if response.status_code == 200:
            tasks = response.json()
            log_test("Filter Tasks by Project", True, f"Retrieved {len(tasks)} tasks for project {project_id}")
        else:
            log_test("Filter Tasks by Project", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Tasks by Project", False, f"Exception: {str(e)}")

def test_filter_independent_tasks():
    """Test filtering independent tasks (no project_id)"""
    try:
        response = requests.get(f"{BACKEND_URL}/tasks?project_id=independent")
        if response.status_code == 200:
            tasks = response.json()
            log_test("Filter Independent Tasks", True, f"Retrieved {len(tasks)} independent tasks")
        else:
            log_test("Filter Independent Tasks", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Independent Tasks", False, f"Exception: {str(e)}")

def test_filter_tasks_by_assignee():
    """Test filtering tasks by assigned_to"""
    if not created_users:
        log_test("Filter Tasks by Assignee", False, "No users created to test with")
        return
    
    user_id = created_users[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/tasks?assigned_to={user_id}")
        if response.status_code == 200:
            tasks = response.json()
            log_test("Filter Tasks by Assignee", True, f"Retrieved {len(tasks)} tasks assigned to user {user_id}")
        else:
            log_test("Filter Tasks by Assignee", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Tasks by Assignee", False, f"Exception: {str(e)}")

def test_dashboard_stats():
    """Test dashboard stats endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/dashboard/stats")
        if response.status_code == 200:
            stats = response.json()
            log_test("Dashboard Stats", True, f"Retrieved dashboard stats: {stats}")
        else:
            log_test("Dashboard Stats", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Dashboard Stats", False, f"Exception: {str(e)}")

def test_project_kanban():
    """Test project kanban board endpoint"""
    if not created_projects:
        log_test("Project Kanban", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}/kanban")
        if response.status_code == 200:
            kanban = response.json()
            log_test("Project Kanban", True, f"Retrieved kanban board for project {project_id}")
        else:
            log_test("Project Kanban", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Project Kanban", False, f"Exception: {str(e)}")

def test_project_dashboard():
    """Test project-specific dashboard endpoint"""
    if not created_projects:
        log_test("Project Dashboard", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}/dashboard")
        if response.status_code == 200:
            dashboard = response.json()
            log_test("Project Dashboard", True, f"Retrieved dashboard stats for project {project_id}: {dashboard}")
            
            # Verify the dashboard contains the expected fields
            expected_fields = ["total_projects", "active_projects", "total_tasks", 
                              "completed_tasks", "in_progress_tasks", "overdue_tasks", "my_tasks"]
            missing_fields = [field for field in expected_fields if field not in dashboard]
            
            if missing_fields:
                log_test("Project Dashboard Fields", False, f"Missing fields: {missing_fields}")
            else:
                log_test("Project Dashboard Fields", True, "All expected fields present")
        else:
            log_test("Project Dashboard", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Project Dashboard", False, f"Exception: {str(e)}")

def test_user_data_in_resource_management():
    """Test user data in resource management endpoints"""
    if not created_users or not created_projects or not created_tasks:
        log_test("User Data in Resource Management", False, "Not enough users, projects, or tasks created to test with")
        return
    
    # Test resources overview endpoint
    try:
        response = requests.get(f"{BACKEND_URL}/resources/overview")
        if response.status_code == 200:
            resources = response.json()["resources"]
            log_test("Resources Overview", True, f"Retrieved {len(resources)} resources")
            
            # Verify user data is included in resources
            for resource in resources:
                if "discipline" not in resource:
                    log_test(f"Resource Discipline - {resource['name']}", False, "discipline field missing")
                else:
                    log_test(f"Resource Discipline - {resource['name']}", True, f"discipline: {resource['discipline']}")
        else:
            log_test("Resources Overview", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Resources Overview", False, f"Exception: {str(e)}")
    
    # Test project resources endpoint
    if not created_projects:
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}/resources")
        if response.status_code == 200:
            project_resources = response.json()
            log_test("Project Resources", True, f"Retrieved resources for project {project_id}")
            
            # Verify user disciplines are included in project resources
            for resource in project_resources["resources"]:
                if "discipline" not in resource:
                    log_test(f"Project Resource Discipline - {resource['user_name']}", False, "discipline field missing")
                else:
                    log_test(f"Project Resource Discipline - {resource['user_name']}", True, f"discipline: {resource['discipline']}")
        else:
            log_test("Project Resources", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Project Resources", False, f"Exception: {str(e)}")

def test_delete_user_with_dependencies():
    """Test that a user with assigned tasks cannot be deleted"""
    if not created_users or not created_tasks:
        log_test("Delete User With Dependencies", False, "No users or tasks created to test with")
        return
    
    # Find a user who is assigned to tasks
    assigned_user = None
    for user in created_users:
        for task in created_tasks:
            if task.get("assigned_to") == user["id"]:
                assigned_user = user
                break
        if assigned_user:
            break
    
    if not assigned_user:
        log_test("Delete User With Dependencies", False, "No user found with assigned tasks")
        return
    
    try:
        response = requests.delete(f"{BACKEND_URL}/users/{assigned_user['id']}")
        # This should fail with a 400 status code
        if response.status_code == 400:
            log_test("Delete User With Dependencies", True, f"Correctly prevented deletion of user with assigned tasks: {response.json().get('detail', '')}")
        else:
            log_test("Delete User With Dependencies", False, f"Expected 400 status code, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Delete User With Dependencies", False, f"Exception: {str(e)}")

def test_delete_project_with_tasks():
    """Test that a project with tasks cannot be deleted"""
    if not created_projects:
        log_test("Delete Project With Tasks", False, "No projects created to test with")
        return
    
    # Find a project with tasks
    project_with_tasks = None
    for project in created_projects:
        for task in created_tasks:
            if task.get("project_id") == project["id"]:
                project_with_tasks = project
                break
        if project_with_tasks:
            break
    
    if not project_with_tasks:
        log_test("Delete Project With Tasks", False, "No project found with tasks")
        return
    
    try:
        response = requests.delete(f"{BACKEND_URL}/projects/{project_with_tasks['id']}")
        # This should fail with a 400 status code
        if response.status_code == 400:
            log_test("Delete Project With Tasks", True, f"Correctly prevented deletion of project with tasks: {response.json().get('detail', '')}")
        else:
            log_test("Delete Project With Tasks", False, f"Expected 400 status code, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Delete Project With Tasks", False, f"Exception: {str(e)}")

def test_force_delete_project():
    """Test force deleting a project and all its tasks"""
    if not created_projects or len(created_projects) < 2:
        log_test("Force Delete Project", False, "Not enough projects created to test with")
        return
    
    # Use the last project to avoid affecting other tests
    project_id = created_projects[-1]["id"]
    
    # Count tasks associated with this project
    project_tasks = [task for task in created_tasks if task.get("project_id") == project_id]
    task_count = len(project_tasks)
    
    try:
        response = requests.delete(f"{BACKEND_URL}/projects/{project_id}/force")
        if response.status_code == 200:
            log_test("Force Delete Project", True, f"Successfully force deleted project {project_id} with {task_count} tasks")
            
            # Remove the project and its tasks from our lists
            for i, project in enumerate(created_projects):
                if project["id"] == project_id:
                    created_projects.pop(i)
                    break
            
            # Remove all tasks associated with this project
            created_tasks[:] = [task for task in created_tasks if task.get("project_id") != project_id]
            
            # Verify tasks were deleted
            response = requests.get(f"{BACKEND_URL}/tasks?project_id={project_id}")
            if response.status_code == 200:
                remaining_tasks = response.json()
                if len(remaining_tasks) == 0:
                    log_test("Force Delete Project Tasks", True, "All project tasks were deleted")
                else:
                    log_test("Force Delete Project Tasks", False, f"{len(remaining_tasks)} tasks still remain for the deleted project")
        else:
            log_test("Force Delete Project", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Force Delete Project", False, f"Exception: {str(e)}")

def test_delete_user():
    """Test deleting a user without dependencies"""
    if not created_users or len(created_users) < 2:
        log_test("Delete User", False, "Not enough users created to test with")
        return
    
    # Find a user who is not assigned to any tasks
    unassigned_user = None
    for user in created_users:
        is_assigned = False
        for task in created_tasks:
            if task.get("assigned_to") == user["id"]:
                is_assigned = True
                break
        
        # Also check if user is a project manager
        is_project_manager = False
        for project in created_projects:
            if project.get("project_manager_id") == user["id"]:
                is_project_manager = True
                break
        
        if not is_assigned and not is_project_manager:
            unassigned_user = user
            break
    
    if not unassigned_user:
        # Create a new user specifically for deletion
        user_data = {
            "name": "Temporary User",
            "email": "temp.user@epc.com",
            "role": "contractor",
            "discipline": "Testing"
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/users", json=user_data)
            if response.status_code == 200:
                unassigned_user = response.json()
                created_users.append(unassigned_user)
                log_test("Create User for Deletion", True, f"Created user with ID: {unassigned_user['id']}")
            else:
                log_test("Create User for Deletion", False, f"Status code: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            log_test("Create User for Deletion", False, f"Exception: {str(e)}")
            return
    
    try:
        response = requests.delete(f"{BACKEND_URL}/users/{unassigned_user['id']}")
        if response.status_code == 200:
            log_test("Delete User", True, f"Successfully deleted user {unassigned_user['id']}")
            
            # Remove the user from our list
            for i, user in enumerate(created_users):
                if user["id"] == unassigned_user["id"]:
                    created_users.pop(i)
                    break
        else:
            log_test("Delete User", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Delete User", False, f"Exception: {str(e)}")

def run_all_tests():
    """Run all tests in sequence"""
    print("\n===== STARTING EPC PROJECT MANAGEMENT BACKEND TESTS =====\n")
    
    # Test API health
    test_api_health()
    
    # Test user endpoints
    print("\n----- Testing User Endpoints -----\n")
    test_create_users()
    test_get_users()
    test_get_user_by_id()
    test_update_user()  # New test for updating user profiles
    test_partial_user_updates()  # New test for partial user updates
    test_user_hourly_rate_and_availability()  # New test for hourly rate and availability
    
    # Test project endpoints
    print("\n----- Testing Project Endpoints -----\n")
    test_create_projects()
    test_get_projects()
    test_get_project_by_id()
    test_update_project()
    
    # Test task endpoints
    print("\n----- Testing Task Endpoints -----\n")
    test_create_tasks()
    test_get_tasks()
    test_get_task_by_id()
    test_update_task()
    test_task_status_workflow()
    test_filter_tasks_by_project()
    test_filter_independent_tasks()
    test_filter_tasks_by_assignee()
    
    # Test dashboard and kanban endpoints
    print("\n----- Testing Dashboard and Kanban Endpoints -----\n")
    test_dashboard_stats()
    test_project_kanban()
    test_project_dashboard()
    test_user_data_in_resource_management()  # New test for user data in resource management
    
    # Test delete safety checks
    print("\n----- Testing Delete Safety Checks -----\n")
    test_delete_user_with_dependencies()
    test_delete_project_with_tasks()
    
    # Test successful deletions
    print("\n----- Testing Successful Deletions -----\n")
    test_delete_task()
    test_delete_user()
    test_force_delete_project()
    
    # Print summary
    print("\n===== TEST SUMMARY =====")
    print(f"Total tests: {test_results['passed'] + test_results['failed']}")
    print(f"Passed: {test_results['passed']}")
    print(f"Failed: {test_results['failed']}")
    
    # Return exit code based on test results
    return 0 if test_results["failed"] == 0 else 1

if __name__ == "__main__":
    sys.exit(run_all_tests())
