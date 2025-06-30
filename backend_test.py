import requests
import json
from datetime import datetime, timedelta
import time
import uuid
import sys
import os
import random
import pytest

# Skip these integration tests by default as they require a running backend
if os.environ.get("RUN_BACKEND_TESTS", "false").lower() not in {"1", "true", "yes"}:
    pytest.skip("Skipping backend integration tests", allow_module_level=True)

# Get Backend URL from frontend/.env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.strip().split('=')[1].strip("\"'") + '/api'
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
        "hourly_rate": 70.0,
        "availability": 1.0
    }
]

# Store created users
created_users = []

def test_create_users():
    """Test creating users"""
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
            try:
                assert user["id"] == created_users[0]["id"]
                assert user["name"] == created_users[0]["name"]
                assert user["email"] == created_users[0]["email"]
                log_test("Get User by ID", True, f"Retrieved user: {user['name']}")
            except AssertionError:
                log_test(
                    "Get User by ID",
                    False,
                    "Returned user data does not match created user",
                )
        else:
            log_test("Get User by ID", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get User by ID", False, f"Exception: {str(e)}")

def test_update_user():
    """Test updating a user"""
    if not created_users:
        log_test("Update User", False, "No users created to test with")
        return
    
    user_id = created_users[0]["id"]
    update_data = {
        "name": f"Updated Name {datetime.now().isoformat()}",
        "email": f"updated.email.{int(time.time())}@epc.com",
        "role": "senior_engineer_1"
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", json=update_data)
        if response.status_code == 200:
            user = response.json()
            log_test("Update User", True, f"Updated user name to: {user['name']}")
        else:
            log_test("Update User", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update User", False, f"Exception: {str(e)}")

def test_partial_user_updates():
    """Test partial updates to a user"""
    if not created_users:
        log_test("Partial User Update", False, "No users created to test with")
        return
    
    user_id = created_users[1]["id"] if len(created_users) > 1 else created_users[0]["id"]
    
    # Update just the name
    name_update = {"name": f"Name Only Update {datetime.now().isoformat()}"}
    try:
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", json=name_update)
        if response.status_code == 200:
            user = response.json()
            log_test("Partial User Update - Name", True, f"Updated user name to: {user['name']}")
            
            # Verify other fields weren't changed
            if user["email"] != created_users[1]["email"] if len(created_users) > 1 else created_users[0]["email"]:
                log_test("Partial User Update - Email Preservation", False, "Email was changed when it shouldn't have been")
            else:
                log_test("Partial User Update - Email Preservation", True, "Email was correctly preserved")
        else:
            log_test("Partial User Update - Name", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Partial User Update - Name", False, f"Exception: {str(e)}")
    
    # Update just the role
    role_update = {"role": "project_manager"}
    try:
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", json=role_update)
        if response.status_code == 200:
            user = response.json()
            log_test("Partial User Update - Role", True, f"Updated user role to: {user['role']}")
        else:
            log_test("Partial User Update - Role", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Partial User Update - Role", False, f"Exception: {str(e)}")

def test_user_hourly_rate_and_availability():
    """Test updating a user's hourly rate and availability"""
    if not created_users:
        log_test("User Hourly Rate and Availability", False, "No users created to test with")
        return
    
    user_id = created_users[2]["id"] if len(created_users) > 2 else created_users[0]["id"]
    update_data = {
        "hourly_rate": 125.50,
        "availability": 0.75
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/users/{user_id}", json=update_data)
        if response.status_code == 200:
            user = response.json()
            log_test("User Hourly Rate and Availability", True, 
                     f"Updated user hourly rate to: {user['hourly_rate']}, availability to: {user['availability']}")
            
            # Verify the values were updated correctly
            if user["hourly_rate"] != update_data["hourly_rate"]:
                log_test("User Hourly Rate Update", False, f"Expected {update_data['hourly_rate']}, got {user['hourly_rate']}")
            else:
                log_test("User Hourly Rate Update", True, "Hourly rate updated correctly")
                
            if user["availability"] != update_data["availability"]:
                log_test("User Availability Update", False, f"Expected {update_data['availability']}, got {user['availability']}")
            else:
                log_test("User Availability Update", True, "Availability updated correctly")
        else:
            log_test("User Hourly Rate and Availability", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("User Hourly Rate and Availability", False, f"Exception: {str(e)}")

# Project data for testing
projects_data = [
    {
        "name": "Office Building Renovation",
        "description": "Complete renovation of a 10-story office building",
        "start_date": (datetime.now() - timedelta(days=30)).isoformat(),
        "end_date": (datetime.now() + timedelta(days=180)).isoformat()
    },
    {
        "name": "Industrial Plant Expansion",
        "description": "Expansion of manufacturing capacity at the Springfield plant",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=365)).isoformat()
    },
    {
        "name": "Solar Farm Development",
        "description": "Design and construction of a 50MW solar farm",
        "start_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "end_date": (datetime.now() + timedelta(days=545)).isoformat()
    }
]

# Store created projects
created_projects = []

def test_create_projects():
    """Test creating projects"""
    if not created_users:
        log_test("Create Projects", False, "No users created to test with")
        return
    
    for i, project_data in enumerate(projects_data):
        # Assign a project manager
        project_data["project_manager_id"] = created_users[i % len(created_users)]["id"]
        
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
    if not created_projects or not created_users:
        log_test("Update Project", False, "No projects or users created to test with")
        return
    
    project_id = created_projects[0]["id"]
    # Assign a different project manager
    new_pm_id = created_users[1]["id"] if len(created_users) > 1 else created_users[0]["id"]
    
    update_data = {
        "name": f"Updated Project Name {datetime.now().isoformat()}",
        "description": "Updated project description for testing",
        "project_manager_id": new_pm_id
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/projects/{project_id}", json=update_data)
        if response.status_code == 200:
            project = response.json()
            log_test("Update Project", True, f"Updated project name to: {project['name']}")
            
            # Verify project manager was updated
            if project["project_manager_id"] != new_pm_id:
                log_test("Update Project Manager", False, f"Expected PM ID {new_pm_id}, got {project['project_manager_id']}")
            else:
                log_test("Update Project Manager", True, "Project manager updated correctly")
        else:
            log_test("Update Project", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Project", False, f"Exception: {str(e)}")

# Task data for testing
def get_task_data():
    """Generate task data using created projects and users"""
    if not created_projects or not created_users:
        return []
    
    tasks_data = []
    priorities = ["low", "medium", "high", "critical"]
    statuses = ["todo", "in_progress", "review", "done"]
    
    for project in created_projects:
        # Create multiple tasks per project
        for i in range(3):  # 3 tasks per project
            task_data = {
                "title": f"Task {i+1} for {project['name']}",
                "description": f"This is a test task for project {project['name']}",
                "priority": priorities[i % len(priorities)],
                "status": statuses[i % len(statuses)],
                "project_id": project["id"]
            }
            
            # Assign to a user if available
            if created_users:
                task_data["assigned_to"] = created_users[i % len(created_users)]["id"]
            
            # Add due date
            due_date = datetime.now() + timedelta(days=(i+1)*7)
            task_data["due_date"] = due_date.isoformat()
            
            tasks_data.append(task_data)
    
    # Create some independent tasks (not associated with a project)
    for i in range(2):
        task_data = {
            "title": f"Independent Task {i+1}",
            "description": f"This is a test task not associated with any project",
            "priority": priorities[i % len(priorities)],
            "status": statuses[i % len(statuses)]
        }
        
        # Assign to a user if available
        if created_users:
            task_data["assigned_to"] = created_users[i % len(created_users)]["id"]
        
        # Add due date
        due_date = datetime.now() + timedelta(days=(i+1)*5)
        task_data["due_date"] = due_date.isoformat()
        
        tasks_data.append(task_data)
    
    return tasks_data

# Store created tasks
created_tasks = []

def test_create_tasks():
    """Test creating tasks"""
    tasks_data = get_task_data()
    if not tasks_data:
        log_test("Create Tasks", False, "No projects or users created to test with")
        return
    
    for task_data in tasks_data:
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
    if not created_tasks or not created_users:
        log_test("Update Task", False, "No tasks or users created to test with")
        return
    
    task_id = created_tasks[0]["id"]
    # Assign a different user
    new_assignee_id = created_users[2]["id"] if len(created_users) > 2 else created_users[0]["id"]
    
    update_data = {
        "title": f"Updated Task Title {datetime.now().isoformat()}",
        "description": "Updated task description for testing",
        "priority": "high",
        "status": "in_progress",
        "assigned_to": new_assignee_id
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/tasks/{task_id}", json=update_data)
        if response.status_code == 200:
            task = response.json()
            log_test("Update Task", True, f"Updated task title to: {task['title']}, status to: {task['status']}")
            
            # Verify assignee was updated
            if task["assigned_to"] != new_assignee_id:
                log_test("Update Task Assignee", False, f"Expected assignee ID {new_assignee_id}, got {task['assigned_to']}")
            else:
                log_test("Update Task Assignee", True, "Task assignee updated correctly")
        else:
            log_test("Update Task", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Task", False, f"Exception: {str(e)}")

def test_task_status_workflow():
    """Test task status workflow transitions"""
    if not created_tasks:
        log_test("Task Status Workflow", False, "No tasks created to test with")
        return
    
    # Create a new task specifically for workflow testing
    if created_projects:
        task_data = {
            "title": "Workflow Test Task",
            "description": "Task for testing status workflow",
            "priority": "medium",
            "status": "todo",
            "project_id": created_projects[0]["id"]
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
            if response.status_code != 200:
                log_test("Create Workflow Test Task", False, f"Status code: {response.status_code}, Response: {response.text}")
                return
            
            workflow_task = response.json()
            log_test("Create Workflow Test Task", True, f"Created task with ID: {workflow_task['id']}")
            
            # Test status transitions
            statuses = ["todo", "in_progress", "review", "done"]
            
            for status in statuses[1:]:  # Skip the first status (todo) as it's the initial state
                update_data = {"status": status}
                response = requests.put(f"{BACKEND_URL}/tasks/{workflow_task['id']}", json=update_data)
                
                if response.status_code == 200:
                    updated_task = response.json()
                    log_test(f"Task Status Transition to {status}", True, f"Updated task status to: {updated_task['status']}")
                    
                    # Verify status was updated correctly
                    if updated_task["status"] != status:
                        log_test(f"Task Status Verification for {status}", False, f"Expected status {status}, got {updated_task['status']}")
                    else:
                        log_test(f"Task Status Verification for {status}", True, "Task status updated correctly")
                else:
                    log_test(f"Task Status Transition to {status}", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Task Status Workflow", False, f"Exception: {str(e)}")
    else:
        log_test("Task Status Workflow", False, "No projects created to test with")

def test_filter_tasks_by_project():
    """Test filtering tasks by project"""
    if not created_projects or not created_tasks:
        log_test("Filter Tasks by Project", False, "No projects or tasks created to test with")
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
    """Test filtering independent tasks (not associated with a project)"""
    try:
        response = requests.get(f"{BACKEND_URL}/tasks?independent=true")
        if response.status_code == 200:
            tasks = response.json()
            log_test("Filter Independent Tasks", True, f"Retrieved {len(tasks)} independent tasks")
        else:
            log_test("Filter Independent Tasks", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Independent Tasks", False, f"Exception: {str(e)}")

def test_filter_tasks_by_assignee():
    """Test filtering tasks by assignee"""
    if not created_users or not created_tasks:
        log_test("Filter Tasks by Assignee", False, "No users or tasks created to test with")
        return
    
    assignee_id = created_users[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/tasks?assigned_to={assignee_id}")
        if response.status_code == 200:
            tasks = response.json()
            log_test("Filter Tasks by Assignee", True, f"Retrieved {len(tasks)} tasks assigned to user {assignee_id}")
        else:
            log_test("Filter Tasks by Assignee", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Tasks by Assignee", False, f"Exception: {str(e)}")

def test_dashboard_stats():
    """Test dashboard statistics endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/dashboard/stats")
        if response.status_code == 200:
            stats = response.json()
            log_test("Dashboard Stats", True, f"Retrieved dashboard statistics")
            
            # Verify the stats contain the expected fields
            expected_fields = ["total_projects", "total_tasks", "tasks_by_status", "tasks_by_priority", "recent_activity"]
            
            missing_fields = [field for field in expected_fields if field not in stats]
            if missing_fields:
                log_test("Dashboard Stats Fields", False, f"Missing fields: {missing_fields}")
            else:
                log_test("Dashboard Stats Fields", True, "All expected fields present")
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
            
            # Verify the kanban contains all statuses
            statuses = ["todo", "in_progress", "review", "done"]
            for status in statuses:
                if status not in kanban["board"]:
                    log_test(f"Kanban Status: {status}", False, f"Status {status} missing from kanban")
                else:
                    log_test(f"Kanban Status: {status}", True, f"Status {status} present in kanban with {len(kanban['board'][status])} tasks")
        else:
            log_test("Project Kanban", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Project Kanban", False, f"Exception: {str(e)}")

def test_discipline_kanban():
    """Test discipline-wide kanban board endpoint"""
    if not created_users:
        log_test("Discipline Kanban", False, "No users created to test with")
        return

    discipline = created_users[0]["discipline"]
    try:
        response = requests.get(f"{BACKEND_URL}/disciplines/{discipline}/kanban")
        if response.status_code == 200:
            board = response.json()
            log_test("Discipline Kanban", True, f"Retrieved kanban for {discipline}")

            statuses = ["todo", "in_progress", "review", "done"]
            for status in statuses:
                if status not in board["board"]:
                    log_test(f"Discipline Kanban Status: {status}", False, f"Status {status} missing")
                else:
                    log_test(
                        f"Discipline Kanban Status: {status}",
                        True,
                        f"Status {status} has {len(board['board'][status])} tasks",
                    )
        else:
            log_test(
                "Discipline Kanban",
                False,
                f"Status code: {response.status_code}, Response: {response.text}",
            )
    except Exception as e:
        log_test("Discipline Kanban", False, f"Exception: {str(e)}")

def test_project_dashboard():
    """Test project dashboard endpoint"""
    if not created_projects:
        log_test("Project Dashboard", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}/dashboard")
        if response.status_code == 200:
            dashboard = response.json()
            log_test("Project Dashboard", True, f"Retrieved dashboard for project {project_id}")
            
            # Verify the dashboard contains the expected fields
            expected_fields = ["project", "task_stats", "recent_activity", "team_members"]
            
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
    """Test that user data is correctly included in resource management"""
    if not created_projects:
        log_test("User Data in Resource Management", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/projects/{project_id}/resources")
        if response.status_code == 200:
            resources = response.json()
            log_test("Project Resources", True, f"Retrieved resources for project {project_id}")
            
            # Check if resources are included in the response
            if "resources" not in resources:
                log_test("Resources in Response", False, "Resources not included in response")
                return

            # Check if resource disciplines are included
            for member in resources["resources"]:
                if "discipline" not in member:
                    log_test("Resource Disciplines", False, f"Discipline missing for resource {member.get('id', 'unknown')}")
                    return

            log_test("Resource Disciplines", True, "Resource disciplines correctly included")
        else:
            log_test("User Data in Resource Management", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("User Data in Resource Management", False, f"Exception: {str(e)}")

def test_delete_user_with_dependencies():
    """Test that a user with dependencies cannot be deleted"""
    if not created_users or not created_tasks:
        log_test("Delete User With Dependencies", False, "No users or tasks created to test with")
        return
    
    # Find a user who is assigned to a task
    user_with_task = None
    for task in created_tasks:
        if "assigned_to" in task and task["assigned_to"]:
            user_with_task = task["assigned_to"]
            break
    
    if not user_with_task:
        log_test("Delete User With Dependencies", False, "No users with assigned tasks found")
        return
    
    try:
        response = requests.delete(f"{BACKEND_URL}/users/{user_with_task}")
        # This should fail with a 400 status code
        if response.status_code == 400:
            log_test("Delete User With Dependencies", True, f"Correctly prevented deletion of user with tasks: {response.json().get('detail', '')}")
        else:
            log_test("Delete User With Dependencies", False, f"Expected 400 status code, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Delete User With Dependencies", False, f"Exception: {str(e)}")

def test_delete_project_with_tasks():
    """Test that a project with tasks cannot be deleted"""
    if not created_projects or not created_tasks:
        log_test("Delete Project With Tasks", False, "No projects or tasks created to test with")
        return
    
    # Find a project with tasks
    project_with_tasks = None
    for task in created_tasks:
        if "project_id" in task and task["project_id"]:
            project_with_tasks = task["project_id"]
            break
    
    if not project_with_tasks:
        log_test("Delete Project With Tasks", False, "No projects with tasks found")
        return
    
    try:
        response = requests.delete(f"{BACKEND_URL}/projects/{project_with_tasks}")
        # This should fail with a 400 status code
        if response.status_code == 400:
            log_test("Delete Project With Tasks", True, f"Correctly prevented deletion of project with tasks: {response.json().get('detail', '')}")
        else:
            log_test("Delete Project With Tasks", False, f"Expected 400 status code, got {response.status_code}: {response.text}")
    except Exception as e:
        log_test("Delete Project With Tasks", False, f"Exception: {str(e)}")

def test_delete_task():
    """Test deleting a task"""
    if not created_tasks:
        log_test("Delete Task", False, "No tasks created to test with")
        return
    
    # Create a new task specifically for deletion
    if created_projects:
        task_data = {
            "title": "Task for Deletion",
            "description": "This task will be deleted",
            "priority": "low",
            "status": "todo",
            "project_id": created_projects[0]["id"]
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
            if response.status_code == 200:
                task_to_delete = response.json()
                log_test("Create Task for Deletion", True, f"Created task with ID: {task_to_delete['id']}")
            else:
                log_test("Create Task for Deletion", False, f"Status code: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            log_test("Create Task for Deletion", False, f"Exception: {str(e)}")
            return
        
        # Now delete the task
        try:
            response = requests.delete(f"{BACKEND_URL}/tasks/{task_to_delete['id']}")
            if response.status_code == 200:
                log_test("Delete Task", True, f"Successfully deleted task {task_to_delete['id']}")
            else:
                log_test("Delete Task", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Delete Task", False, f"Exception: {str(e)}")
    else:
        log_test("Delete Task", False, "No projects created to test with")

def test_delete_user():
    """Test deleting a user"""
    if not created_users:
        log_test("Delete User", False, "No users created to test with")
        return
    
    # Create a new user specifically for deletion
    user_data = {
        "name": "User for Deletion",
        "email": f"delete.me.{int(time.time())}@epc.com",
        "role": "junior_engineer",
        "discipline": "General",
        "hourly_rate": 65.0,
        "availability": 1.0
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/users", json=user_data)
        if response.status_code == 200:
            user_to_delete = response.json()
            log_test("Create User for Deletion", True, f"Created user with ID: {user_to_delete['id']}")
        else:
            log_test("Create User for Deletion", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
    except Exception as e:
        log_test("Create User for Deletion", False, f"Exception: {str(e)}")
        return
    
    # Now delete the user
    try:
        response = requests.delete(f"{BACKEND_URL}/users/{user_to_delete['id']}")
        if response.status_code == 200:
            log_test("Delete User", True, f"Successfully deleted user {user_to_delete['id']}")
        else:
            log_test("Delete User", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Delete User", False, f"Exception: {str(e)}")

def test_force_delete_project():
    """Test force deleting a project with tasks"""
    if not created_projects:
        log_test("Force Delete Project", False, "No projects created to test with")
        return
    
    # Create a new project specifically for force deletion
    project_data = {
        "name": "Project for Force Deletion",
        "description": "This project will be force deleted",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=90)).isoformat()
    }
    
    if created_users:
        project_data["project_manager_id"] = created_users[0]["id"]
    
    try:
        response = requests.post(f"{BACKEND_URL}/projects", json=project_data)
        if response.status_code == 200:
            project_to_delete = response.json()
            log_test("Create Project for Force Deletion", True, f"Created project with ID: {project_to_delete['id']}")
        else:
            log_test("Create Project for Force Deletion", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
    except Exception as e:
        log_test("Create Project for Force Deletion", False, f"Exception: {str(e)}")
        return
    
    # Create a task for this project
    task_data = {
        "title": "Task for Project Force Deletion",
        "description": "This task will be deleted with the project",
        "priority": "medium",
        "status": "todo",
        "project_id": project_to_delete["id"]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
        if response.status_code == 200:
            task = response.json()
            log_test("Create Task for Project Force Deletion", True, f"Created task with ID: {task['id']}")
        else:
            log_test("Create Task for Project Force Deletion", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
    except Exception as e:
        log_test("Create Task for Project Force Deletion", False, f"Exception: {str(e)}")
        return
    
    # Now force delete the project
    try:
        response = requests.delete(f"{BACKEND_URL}/projects/{project_to_delete['id']}?force=true")
        if response.status_code == 200:
            log_test("Force Delete Project", True, f"Successfully force deleted project {project_to_delete['id']}")
        else:
            log_test("Force Delete Project", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Force Delete Project", False, f"Exception: {str(e)}")

# Store created epics
created_epics = []

def get_epic_data():
    """Generate epic data using created projects"""
    if not created_projects:
        return []
    
    epics_data = []
    priorities = ["low", "medium", "high", "critical"]
    
    for project in created_projects:
        # Create multiple epics with different priorities and story points
        for i in range(2):  # 2 epics per project
            epic_data = {
                "title": f"Epic {i+1} for {project['name']}",
                "description": f"This is a test epic for project {project['name']}",
                "project_id": project["id"],
                "priority": priorities[i % len(priorities)],
                "story_points": (i+1) * 10,  # 10, 20 story points
                "labels": [f"label-{i}", "test-epic"]
            }
            
            # Assign to a user if available
            if created_users:
                epic_data["assigned_to"] = created_users[i % len(created_users)]["id"]
            
            # Add start and end dates
            start_date = datetime.now() + timedelta(days=i*7)
            end_date = start_date + timedelta(days=30)
            epic_data["start_date"] = start_date.isoformat()
            epic_data["end_date"] = end_date.isoformat()
            
            epics_data.append(epic_data)
    
    return epics_data

def test_create_epics():
    """Test creating epics with different priorities and story points"""
    epics_data = get_epic_data()
    if not epics_data:
        log_test("Create Epics", False, "No projects created to test with")
        return
    
    for epic_data in epics_data:
        try:
            response = requests.post(f"{BACKEND_URL}/epics", json=epic_data)
            if response.status_code == 200:
                epic = response.json()
                created_epics.append(epic)
                log_test(f"Create Epic: {epic_data['title']}", True, 
                         f"Created epic with ID: {epic['id']}, Priority: {epic['priority']}, Story Points: {epic['story_points']}")
            else:
                log_test(f"Create Epic: {epic_data['title']}", False, 
                         f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Create Epic: {epic_data['title']}", False, f"Exception: {str(e)}")

def test_get_epics():
    """Test getting all epics and filtering by project"""
    # Test getting all epics
    try:
        response = requests.get(f"{BACKEND_URL}/epics")
        if response.status_code == 200:
            epics = response.json()
            log_test("Get All Epics", True, f"Retrieved {len(epics)} epics")
        else:
            log_test("Get All Epics", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Epics", False, f"Exception: {str(e)}")
    
    # Test filtering epics by project
    if not created_projects:
        log_test("Filter Epics by Project", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/epics?project_id={project_id}")
        if response.status_code == 200:
            epics = response.json()
            log_test("Filter Epics by Project", True, f"Retrieved {len(epics)} epics for project {project_id}")
        else:
            log_test("Filter Epics by Project", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Epics by Project", False, f"Exception: {str(e)}")

def test_get_epic_by_id():
    """Test getting an epic by ID"""
    if not created_epics:
        log_test("Get Epic by ID", False, "No epics created to test with")
        return
    
    epic_id = created_epics[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/epics/{epic_id}")
        if response.status_code == 200:
            epic = response.json()
            log_test("Get Epic by ID", True, f"Retrieved epic: {epic['title']}")
        else:
            log_test("Get Epic by ID", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Epic by ID", False, f"Exception: {str(e)}")

def test_update_epic():
    """Test updating an epic"""
    if not created_epics:
        log_test("Update Epic", False, "No epics created to test with")
        return
    
    epic_id = created_epics[0]["id"]
    update_data = {
        "title": f"Updated Epic Title {datetime.now().isoformat()}",
        "description": "Updated description for testing",
        "status": "in_progress",
        "story_points": 25
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/epics/{epic_id}", json=update_data)
        if response.status_code == 200:
            epic = response.json()
            log_test("Update Epic", True, f"Updated epic title to: {epic['title']}, status to: {epic['status']}")
            
            # Verify fields were updated correctly
            for key, value in update_data.items():
                if epic[key] != value:
                    log_test(f"Update Epic Field: {key}", False, f"Expected {value}, got {epic[key]}")
                else:
                    log_test(f"Update Epic Field: {key}", True, f"Field updated correctly")
        else:
            log_test("Update Epic", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Epic", False, f"Exception: {str(e)}")

def test_delete_epic_with_tasks():
    """Test that an epic with tasks cannot be deleted"""
    if not created_epics or not created_tasks:
        log_test("Delete Epic With Tasks", False, "No epics or tasks created to test with")
        return
    
    # First, assign a task to an epic
    if created_epics and created_tasks:
        epic_id = created_epics[0]["id"]
        task_id = created_tasks[0]["id"]
        
        try:
            # Update a task to assign it to the epic
            response = requests.put(f"{BACKEND_URL}/tasks/{task_id}", json={"epic_id": epic_id})
            if response.status_code == 200:
                log_test("Assign Task to Epic", True, f"Assigned task {task_id} to epic {epic_id}")
            else:
                log_test("Assign Task to Epic", False, f"Status code: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            log_test("Assign Task to Epic", False, f"Exception: {str(e)}")
            return
        
        # Now try to delete the epic (should fail)
        try:
            response = requests.delete(f"{BACKEND_URL}/epics/{epic_id}")
            # This should fail with a 400 status code
            if response.status_code == 400:
                log_test("Delete Epic With Tasks", True, f"Correctly prevented deletion of epic with tasks: {response.json().get('detail', '')}")
            else:
                log_test("Delete Epic With Tasks", False, f"Expected 400 status code, got {response.status_code}: {response.text}")
        except Exception as e:
            log_test("Delete Epic With Tasks", False, f"Exception: {str(e)}")

def test_delete_epic():
    """Test deleting an epic without tasks"""
    if not created_epics:
        log_test("Delete Epic", False, "No epics created to test with")
        return
    
    # Create a new epic specifically for deletion
    if created_projects:
        epic_data = {
            "title": "Epic for Deletion",
            "description": "This epic will be deleted",
            "project_id": created_projects[0]["id"],
            "priority": "medium",
            "story_points": 5
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/epics", json=epic_data)
            if response.status_code == 200:
                epic_to_delete = response.json()
                log_test("Create Epic for Deletion", True, f"Created epic with ID: {epic_to_delete['id']}")
            else:
                log_test("Create Epic for Deletion", False, f"Status code: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            log_test("Create Epic for Deletion", False, f"Exception: {str(e)}")
            return
        
        # Now delete the epic
        try:
            response = requests.delete(f"{BACKEND_URL}/epics/{epic_to_delete['id']}")
            if response.status_code == 200:
                log_test("Delete Epic", True, f"Successfully deleted epic {epic_to_delete['id']}")
            else:
                log_test("Delete Epic", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Delete Epic", False, f"Exception: {str(e)}")
    else:
        log_test("Delete Epic", False, "No projects created to test with")

# Store created sprints
created_sprints = []

def get_sprint_data():
    """Generate sprint data using created projects"""
    if not created_projects:
        return []
    
    sprints_data = []
    
    for project in created_projects:
        # Create multiple sprints with different goals and capacities
        for i in range(2):  # 2 sprints per project
            start_date = datetime.now() + timedelta(days=i*14)  # 2-week sprints
            end_date = start_date + timedelta(days=14)
            
            sprint_data = {
                "name": f"Sprint {i+1} for {project['name']}",
                "description": f"This is a test sprint for project {project['name']}",
                "project_id": project["id"],
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "goal": f"Complete {(i+1)*5} story points for project {project['name']}",
                "capacity_hours": (i+1) * 40,  # 40, 80 hours
                "velocity_target": (i+1) * 10  # 10, 20 story points
            }
            
            sprints_data.append(sprint_data)
    
    return sprints_data

def test_create_sprints():
    """Test creating sprints with goals, capacity, and velocity targets"""
    sprints_data = get_sprint_data()
    if not sprints_data:
        log_test("Create Sprints", False, "No projects created to test with")
        return
    
    for sprint_data in sprints_data:
        try:
            response = requests.post(f"{BACKEND_URL}/sprints", json=sprint_data)
            if response.status_code == 200:
                sprint = response.json()
                created_sprints.append(sprint)
                log_test(f"Create Sprint: {sprint_data['name']}", True, 
                         f"Created sprint with ID: {sprint['id']}, Capacity: {sprint['capacity_hours']}, Velocity: {sprint['velocity_target']}")
            else:
                log_test(f"Create Sprint: {sprint_data['name']}", False, 
                         f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Create Sprint: {sprint_data['name']}", False, f"Exception: {str(e)}")

def test_get_sprints():
    """Test getting all sprints and filtering by project and status"""
    # Test getting all sprints
    try:
        response = requests.get(f"{BACKEND_URL}/sprints")
        if response.status_code == 200:
            sprints = response.json()
            log_test("Get All Sprints", True, f"Retrieved {len(sprints)} sprints")
        else:
            log_test("Get All Sprints", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Sprints", False, f"Exception: {str(e)}")
    
    # Test filtering sprints by project
    if not created_projects:
        log_test("Filter Sprints by Project", False, "No projects created to test with")
        return
    
    project_id = created_projects[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/sprints?project_id={project_id}")
        if response.status_code == 200:
            sprints = response.json()
            log_test("Filter Sprints by Project", True, f"Retrieved {len(sprints)} sprints for project {project_id}")
        else:
            log_test("Filter Sprints by Project", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Sprints by Project", False, f"Exception: {str(e)}")
    
    # Test filtering sprints by status
    try:
        response = requests.get(f"{BACKEND_URL}/sprints?status=planning")
        if response.status_code == 200:
            sprints = response.json()
            log_test("Filter Sprints by Status", True, f"Retrieved {len(sprints)} sprints with status 'planning'")
        else:
            log_test("Filter Sprints by Status", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Sprints by Status", False, f"Exception: {str(e)}")

def test_get_sprint_by_id():
    """Test getting a sprint by ID"""
    if not created_sprints:
        log_test("Get Sprint by ID", False, "No sprints created to test with")
        return
    
    sprint_id = created_sprints[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/sprints/{sprint_id}")
        if response.status_code == 200:
            sprint = response.json()
            log_test("Get Sprint by ID", True, f"Retrieved sprint: {sprint['name']}")
        else:
            log_test("Get Sprint by ID", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Sprint by ID", False, f"Exception: {str(e)}")

def test_update_sprint():
    """Test updating a sprint"""
    if not created_sprints:
        log_test("Update Sprint", False, "No sprints created to test with")
        return
    
    sprint_id = created_sprints[0]["id"]
    update_data = {
        "name": f"Updated Sprint Name {datetime.now().isoformat()}",
        "description": "Updated description for testing",
        "status": "active",
        "goal": "Updated sprint goal for testing",
        "velocity_target": 25
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/sprints/{sprint_id}", json=update_data)
        if response.status_code == 200:
            sprint = response.json()
            log_test("Update Sprint", True, f"Updated sprint name to: {sprint['name']}, status to: {sprint['status']}")
            
            # Verify fields were updated correctly
            for key, value in update_data.items():
                if sprint[key] != value:
                    log_test(f"Update Sprint Field: {key}", False, f"Expected {value}, got {sprint[key]}")
                else:
                    log_test(f"Update Sprint Field: {key}", True, f"Field updated correctly")
        else:
            log_test("Update Sprint", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Sprint", False, f"Exception: {str(e)}")

def test_delete_sprint():
    """Test deleting a sprint (should unassign tasks)"""
    if not created_sprints:
        log_test("Delete Sprint", False, "No sprints created to test with")
        return
    
    # First, create a task and assign it to a sprint
    if created_sprints and created_projects:
        sprint_id = created_sprints[0]["id"]
        
        # Create a task assigned to the sprint
        task_data = {
            "title": "Task for Sprint Deletion Test",
            "description": "This task will be unassigned when the sprint is deleted",
            "priority": "medium",
            "project_id": created_projects[0]["id"],
            "sprint_id": sprint_id,
            "story_points": 5
        }
        
        try:
            response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
            if response.status_code == 200:
                task = response.json()
                log_test("Create Task for Sprint", True, f"Created task with ID: {task['id']} assigned to sprint {sprint_id}")
            else:
                log_test("Create Task for Sprint", False, f"Status code: {response.status_code}, Response: {response.text}")
                return
        except Exception as e:
            log_test("Create Task for Sprint", False, f"Exception: {str(e)}")
            return
        
        # Now delete the sprint
        try:
            response = requests.delete(f"{BACKEND_URL}/sprints/{sprint_id}")
            if response.status_code == 200:
                log_test("Delete Sprint", True, f"Successfully deleted sprint {sprint_id}")
                
                # Verify the task was unassigned
                response = requests.get(f"{BACKEND_URL}/tasks/{task['id']}")
                if response.status_code == 200:
                    updated_task = response.json()
                    if updated_task.get("sprint_id") is None:
                        log_test("Sprint Deletion - Task Unassignment", True, "Task was correctly unassigned from the sprint")
                    else:
                        log_test("Sprint Deletion - Task Unassignment", False, f"Task is still assigned to sprint {updated_task.get('sprint_id')}")
                else:
                    log_test("Sprint Deletion - Task Unassignment", False, f"Could not retrieve task: {response.status_code}, {response.text}")
            else:
                log_test("Delete Sprint", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Delete Sprint", False, f"Exception: {str(e)}")
    else:
        log_test("Delete Sprint", False, "No sprints or projects created to test with")

def test_sprint_board():
    """Test sprint-specific kanban board"""
    if not created_sprints:
        log_test("Sprint Board", False, "No sprints created to test with")
        return
    
    # Create tasks for the sprint first
    if created_sprints and created_projects and created_users:
        sprint_id = created_sprints[0]["id"]
        project_id = created_projects[0]["id"]
        
        # Create tasks with different statuses
        statuses = ["todo", "in_progress", "review", "done"]
        created_sprint_tasks = []
        
        for i, status in enumerate(statuses):
            task_data = {
                "title": f"Sprint Task {i+1} - {status}",
                "description": f"Task in {status} status for sprint board testing",
                "status": status,
                "priority": "medium",
                "project_id": project_id,
                "sprint_id": sprint_id,
                "story_points": 3,
                "assigned_to": created_users[i % len(created_users)]["id"]
            }
            
            try:
                response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
                if response.status_code == 200:
                    task = response.json()
                    created_sprint_tasks.append(task)
                    log_test(f"Create Sprint Task: {task_data['title']}", True, f"Created task with ID: {task['id']}")
                else:
                    log_test(f"Create Sprint Task: {task_data['title']}", False, f"Status code: {response.status_code}, Response: {response.text}")
            except Exception as e:
                log_test(f"Create Sprint Task: {task_data['title']}", False, f"Exception: {str(e)}")
        
        # Now test the sprint board endpoint
        try:
            response = requests.get(f"{BACKEND_URL}/sprints/{sprint_id}/board")
            if response.status_code == 200:
                board = response.json()
                log_test("Sprint Board", True, f"Retrieved sprint board for sprint {sprint_id}")
                
                # Verify the board contains all statuses
                for status in statuses:
                    if status not in board["board"]:
                        log_test(f"Sprint Board Status: {status}", False, f"Status {status} missing from board")
                    else:
                        log_test(f"Sprint Board Status: {status}", True, f"Status {status} present in board with {len(board['board'][status])} tasks")
            else:
                log_test("Sprint Board", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Sprint Board", False, f"Exception: {str(e)}")
    else:
        log_test("Sprint Board", False, "No sprints, projects, or users created to test with")

def test_sprint_analytics():
    """Test sprint analytics and burndown data"""
    if not created_sprints:
        log_test("Sprint Analytics", False, "No sprints created to test with")
        return
    
    # Create tasks for the sprint first if we don't have any
    if created_sprints and created_projects:
        sprint_id = created_sprints[0]["id"]
        
        # Now test the sprint analytics endpoint
        try:
            response = requests.get(f"{BACKEND_URL}/sprints/{sprint_id}/analytics")
            if response.status_code == 200:
                analytics = response.json()
                log_test("Sprint Analytics", True, f"Retrieved analytics for sprint {sprint_id}")
                
                # Verify the analytics contains the expected fields
                expected_fields = ["total_story_points", "completed_story_points", "remaining_story_points", 
                                  "completion_percentage", "total_tasks", "completed_tasks", "remaining_tasks",
                                  "task_completion_percentage", "total_days", "elapsed_days", "remaining_days",
                                  "burndown_data"]
                
                missing_fields = [field for field in expected_fields if field not in analytics]
                if missing_fields:
                    log_test("Sprint Analytics Fields", False, f"Missing fields: {missing_fields}")
                else:
                    log_test("Sprint Analytics Fields", True, "All expected fields present")
                
                # Verify burndown data
                if "burndown_data" in analytics and isinstance(analytics["burndown_data"], list):
                    log_test("Sprint Burndown Data", True, f"Burndown data contains {len(analytics['burndown_data'])} data points")
                    
                    # Check a sample data point
                    if analytics["burndown_data"]:
                        data_point = analytics["burndown_data"][0]
                        expected_point_fields = ["date", "ideal_remaining", "actual_remaining"]
                        missing_point_fields = [field for field in expected_point_fields if field not in data_point]
                        
                        if missing_point_fields:
                            log_test("Sprint Burndown Data Point", False, f"Missing fields in data point: {missing_point_fields}")
                        else:
                            log_test("Sprint Burndown Data Point", True, "Data point contains all expected fields")
                else:
                    log_test("Sprint Burndown Data", False, "Burndown data missing or not a list")
            else:
                log_test("Sprint Analytics", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Sprint Analytics", False, f"Exception: {str(e)}")
    else:
        log_test("Sprint Analytics", False, "No sprints or projects created to test with")

def test_enhanced_task_management():
    """Test enhanced task management with epic_id, sprint_id, and story_points"""
    if not created_epics or not created_sprints:
        log_test("Enhanced Task Management", False, "No epics or sprints created to test with")
        return
    
    # Create a task with epic_id, sprint_id, and story_points
    epic_id = created_epics[0]["id"]
    sprint_id = created_sprints[0]["id"]
    project_id = created_projects[0]["id"]
    
    task_data = {
        "title": "Enhanced Agile Task",
        "description": "Task with epic, sprint, and story points for agile workflow",
        "priority": "high",
        "project_id": project_id,
        "epic_id": epic_id,
        "sprint_id": sprint_id,
        "story_points": 8,
        "status": "todo"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
        if response.status_code == 200:
            task = response.json()
            log_test("Create Enhanced Task", True, f"Created task with ID: {task['id']}, Epic: {task['epic_id']}, Sprint: {task['sprint_id']}")
            
            # Verify all fields were stored correctly
            for key, value in task_data.items():
                if task[key] != value:
                    log_test(f"Enhanced Task Field: {key}", False, f"Expected {value}, got {task[key]}")
                else:
                    log_test(f"Enhanced Task Field: {key}", True, f"Field stored correctly")
            
            # Test updating the task with agile fields
            update_data = {
                "status": "in_progress",
                "story_points": 13,  # Changed story points
                "progress_percent": 30.0
            }
            
            response = requests.put(f"{BACKEND_URL}/tasks/{task['id']}", json=update_data)
            if response.status_code == 200:
                updated_task = response.json()
                log_test("Update Enhanced Task", True, f"Updated task status to: {updated_task['status']}, Story Points: {updated_task['story_points']}")
                
                # Verify fields were updated correctly
                for key, value in update_data.items():
                    if updated_task[key] != value:
                        log_test(f"Update Enhanced Task Field: {key}", False, f"Expected {value}, got {updated_task[key]}")
                    else:
                        log_test(f"Update Enhanced Task Field: {key}", True, f"Field updated correctly")
            else:
                log_test("Update Enhanced Task", False, f"Status code: {response.status_code}, Response: {response.text}")
        else:
            log_test("Create Enhanced Task", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Enhanced Task Management", False, f"Exception: {str(e)}")

def test_agile_workflow():
    """Test the complete agile workflow from epic creation to sprint completion"""
    if not created_projects or not created_users:
        log_test("Agile Workflow", False, "No projects or users created to test with")
        return
    
    # 1. Create a new project for agile workflow testing

# Document Management System Tests
# Store created documents
created_documents = []

def test_document_upload():
    """Test uploading documents with different file types and categories"""
    if not created_projects or not created_users:
        log_test("Document Upload", False, "No projects or users created to test with")
        return
    
    # Test files with different types
    test_files = [
        ("/app/test_document.pdf", "application/pdf"),
        ("/app/test_document.doc", "application/msword"),
        ("/app/test_document.dwg", "application/acad"),
        ("/app/test_document.xls", "application/vnd.ms-excel")
    ]
    
    # Test different document categories
    categories = [
        "engineering_drawing",
        "piping_drawing",
        "electrical_drawing",
        "technical_specification",
        "safety_document",
        "compliance_document"
    ]
    
    # Test different disciplines
    disciplines = ["Mechanical", "Electrical", "Process", "Civil", "Instrumentation"]
    
    for i, (file_path, content_type) in enumerate(test_files):
        # Select a category and discipline for this file
        category = categories[i % len(categories)]
        discipline = disciplines[i % len(disciplines)]
        
        # Create document metadata
        document_number = f"DOC-{uuid.uuid4().hex[:8]}"
        is_confidential = i % 2 == 0  # Every other document is confidential
        
        # Create tags
        tags = f"tag1,tag2,test,{category}"
        
        try:
            with open(file_path, 'rb') as file:
                files = {'file': (os.path.basename(file_path), file, content_type)}
                data = {
                    'title': f"Test Document {i+1}",
                    'description': f"This is a test {category} document",
                    'category': category,
                    'project_id': created_projects[0]["id"] if i % 2 == 0 else None,  # Associate every other document with a project
                    'discipline': discipline,
                    'document_number': document_number,
                    'is_confidential': str(is_confidential),
                    'tags': tags
                }
                
                response = requests.post(f"{BACKEND_URL}/documents/upload", files=files, data=data)
                
                if response.status_code == 200:
                    document = response.json()
                    created_documents.append(document)
                    log_test(f"Upload Document: {data['title']}", True, 
                             f"Uploaded document with ID: {document['id']}, Category: {category}, Type: {content_type}")
                else:
                    log_test(f"Upload Document: {data['title']}", False, 
                             f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Upload Document: {file_path}", False, f"Exception: {str(e)}")

def test_get_documents():
    """Test retrieving all documents and filtering by various criteria"""
    # Test getting all documents
    try:
        response = requests.get(f"{BACKEND_URL}/documents")
        if response.status_code == 200:
            documents = response.json()
            log_test("Get All Documents", True, f"Retrieved {len(documents)} documents")
        else:
            log_test("Get All Documents", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get All Documents", False, f"Exception: {str(e)}")
    
    # Test filtering by project
    if created_projects:
        project_id = created_projects[0]["id"]
        try:
            response = requests.get(f"{BACKEND_URL}/documents?project_id={project_id}")
            if response.status_code == 200:
                documents = response.json()
                log_test("Filter Documents by Project", True, f"Retrieved {len(documents)} documents for project {project_id}")
            else:
                log_test("Filter Documents by Project", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Filter Documents by Project", False, f"Exception: {str(e)}")
    
    # Test filtering by category
    try:
        response = requests.get(f"{BACKEND_URL}/documents?category=engineering_drawing")
        if response.status_code == 200:
            documents = response.json()
            log_test("Filter Documents by Category", True, f"Retrieved {len(documents)} engineering drawing documents")
        else:
            log_test("Filter Documents by Category", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Documents by Category", False, f"Exception: {str(e)}")
    
    # Test filtering by discipline
    try:
        response = requests.get(f"{BACKEND_URL}/documents?discipline=Mechanical")
        if response.status_code == 200:
            documents = response.json()
            log_test("Filter Documents by Discipline", True, f"Retrieved {len(documents)} Mechanical discipline documents")
        else:
            log_test("Filter Documents by Discipline", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Filter Documents by Discipline", False, f"Exception: {str(e)}")
    
    # Test search functionality
    try:
        search_term = "test"
        response = requests.get(f"{BACKEND_URL}/documents?search={search_term}")
        if response.status_code == 200:
            documents = response.json()
            log_test("Search Documents", True, f"Found {len(documents)} documents matching '{search_term}'")
        else:
            log_test("Search Documents", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Search Documents", False, f"Exception: {str(e)}")

def test_get_document_by_id():
    """Test getting a document by ID"""
    if not created_documents:
        log_test("Get Document by ID", False, "No documents created to test with")
        return
    
    document_id = created_documents[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/documents/{document_id}")
        if response.status_code == 200:
            document = response.json()
            log_test("Get Document by ID", True, f"Retrieved document: {document['title']}")
        else:
            log_test("Get Document by ID", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Get Document by ID", False, f"Exception: {str(e)}")

def test_download_document():
    """Test downloading a document"""
    if not created_documents:
        log_test("Download Document", False, "No documents created to test with")
        return
    
    document_id = created_documents[0]["id"]
    try:
        response = requests.get(f"{BACKEND_URL}/documents/{document_id}/download")
        if response.status_code == 200:
            # Check content type and content disposition
            content_type = response.headers.get('Content-Type')
            content_disposition = response.headers.get('Content-Disposition')
            
            log_test("Download Document", True, 
                     f"Downloaded document with Content-Type: {content_type}, Content-Disposition: {content_disposition}")
        else:
            log_test("Download Document", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Download Document", False, f"Exception: {str(e)}")

def test_update_document():
    """Test updating a document's metadata"""
    if not created_documents:
        log_test("Update Document", False, "No documents created to test with")
        return
    
    document_id = created_documents[0]["id"]
    update_data = {
        "title": f"Updated Document Title {datetime.now().isoformat()}",
        "description": "Updated document description for testing",
        "discipline": "Updated Discipline",
        "document_number": f"UPD-{uuid.uuid4().hex[:8]}",
        "tags": ["updated", "test", "document"]
    }
    
    try:
        response = requests.put(f"{BACKEND_URL}/documents/{document_id}", json=update_data)
        if response.status_code == 200:
            document = response.json()
            log_test("Update Document", True, f"Updated document title to: {document['title']}")
            
            # Verify fields were updated correctly
            for key, value in update_data.items():
                if isinstance(value, list) and key == "tags":
                    # Compare tags as sets since order might differ
                    if set(document[key]) != set(value):
                        log_test(f"Update Document Field: {key}", False, f"Expected {value}, got {document[key]}")
                    else:
                        log_test(f"Update Document Field: {key}", True, f"Field updated correctly")
                elif document[key] != value:
                    log_test(f"Update Document Field: {key}", False, f"Expected {value}, got {document[key]}")
                else:
                    log_test(f"Update Document Field: {key}", True, f"Field updated correctly")
        else:
            log_test("Update Document", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Update Document", False, f"Exception: {str(e)}")

def test_document_status_workflow():
    """Test document status workflow transitions"""
    if not created_documents or not created_users:
        log_test("Document Status Workflow", False, "No documents or users created to test with")
        return
    
    document_id = created_documents[0]["id"]
    reviewer_id = created_users[1]["id"] if len(created_users) > 1 else created_users[0]["id"]
    approver_id = created_users[2]["id"] if len(created_users) > 2 else created_users[0]["id"]
    
    # Test status transitions: draft -> under_review -> approved
    status_updates = [
        {"status": "under_review", "reviewed_by": reviewer_id},
        {"status": "approved", "approved_by": approver_id}
    ]
    
    for update in status_updates:
        try:
            response = requests.put(f"{BACKEND_URL}/documents/{document_id}/status", json=update)
            if response.status_code == 200:
                document = response.json()
                log_test(f"Document Status Transition to {update['status']}", True, 
                         f"Updated document status to: {document['status']}")
                
                # Verify status and reviewer/approver were updated correctly
                if document["status"] != update["status"]:
                    log_test(f"Document Status Verification for {update['status']}", False, 
                             f"Expected status {update['status']}, got {document['status']}")
                else:
                    log_test(f"Document Status Verification for {update['status']}", True, 
                             "Document status updated correctly")
                
                if "reviewed_by" in update and document["reviewed_by"] != update["reviewed_by"]:
                    log_test("Document Reviewer Verification", False, 
                             f"Expected reviewer {update['reviewed_by']}, got {document['reviewed_by']}")
                elif "reviewed_by" in update:
                    log_test("Document Reviewer Verification", True, "Document reviewer updated correctly")
                
                if "approved_by" in update and document["approved_by"] != update["approved_by"]:
                    log_test("Document Approver Verification", False, 
                             f"Expected approver {update['approved_by']}, got {document['approved_by']}")
                elif "approved_by" in update:
                    log_test("Document Approver Verification", True, "Document approver updated correctly")
            else:
                log_test(f"Document Status Transition to {update['status']}", False, 
                         f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test(f"Document Status Transition to {update['status']}", False, f"Exception: {str(e)}")

def test_document_analytics():
    """Test document analytics summary"""
    try:
        response = requests.get(f"{BACKEND_URL}/documents/analytics/summary")
        if response.status_code == 200:
            analytics = response.json()
            log_test("Document Analytics", True, f"Retrieved document analytics")
            
            # Verify the analytics contains the expected fields
            expected_fields = ["total_documents", "total_size_bytes", "total_size_mb", "by_category", "by_status"]
            
            missing_fields = [field for field in expected_fields if field not in analytics]
            if missing_fields:
                log_test("Document Analytics Fields", False, f"Missing fields: {missing_fields}")
            else:
                log_test("Document Analytics Fields", True, "All expected fields present")
        else:
            log_test("Document Analytics", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Document Analytics", False, f"Exception: {str(e)}")
    
    # Test project-specific analytics
    if created_projects:
        project_id = created_projects[0]["id"]
        try:
            response = requests.get(f"{BACKEND_URL}/documents/analytics/summary?project_id={project_id}")
            if response.status_code == 200:
                analytics = response.json()
                log_test("Project Document Analytics", True, f"Retrieved document analytics for project {project_id}")
            else:
                log_test("Project Document Analytics", False, f"Status code: {response.status_code}, Response: {response.text}")
        except Exception as e:
            log_test("Project Document Analytics", False, f"Exception: {str(e)}")

def test_delete_document():
    """Test deleting a document"""
    if not created_documents:
        log_test("Delete Document", False, "No documents created to test with")
        return
    
    # Use the last document for deletion
    document_id = created_documents[-1]["id"]
    try:
        response = requests.delete(f"{BACKEND_URL}/documents/{document_id}")
        if response.status_code == 200:
            log_test("Delete Document", True, f"Successfully deleted document {document_id}")
            
            # Verify the document was deleted
            response = requests.get(f"{BACKEND_URL}/documents/{document_id}")
            if response.status_code == 404:
                log_test("Document Deletion Verification", True, "Document was correctly deleted")
            else:
                log_test("Document Deletion Verification", False, f"Document still exists with status code: {response.status_code}")
        else:
            log_test("Delete Document", False, f"Status code: {response.status_code}, Response: {response.text}")
    except Exception as e:
        log_test("Delete Document", False, f"Exception: {str(e)}")

def test_document_management_system():
    """Run all document management system tests"""
    print("\n=== Testing Document Management System ===\n")
    
    # Create test users and projects if needed
    if not created_users:
        test_create_users()
    if not created_projects:
        test_create_projects()
    
    # Run document tests
    test_document_upload()
    test_get_documents()
    test_get_document_by_id()
    test_download_document()
    test_update_document()
    test_document_status_workflow()
    test_document_analytics()
    test_delete_document()
    project_data = {
        "name": "Agile Workflow Test Project",
        "description": "Project for testing the complete agile workflow",
        "start_date": datetime.now().isoformat(),
        "end_date": (datetime.now() + timedelta(days=90)).isoformat(),
        "project_manager_id": created_users[0]["id"]
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/projects", json=project_data)
        if response.status_code != 200:
            log_test("Agile Workflow - Create Project", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        project = response.json()
        log_test("Agile Workflow - Create Project", True, f"Created project with ID: {project['id']}")
        
        # 2. Create epics for the project
        epic_data = {
            "title": "User Authentication Epic",
            "description": "Implement user authentication features",
            "project_id": project["id"],
            "priority": "high",
            "story_points": 30,
            "labels": ["authentication", "security"],
            "assigned_to": created_users[0]["id"]
        }
        
        response = requests.post(f"{BACKEND_URL}/epics", json=epic_data)
        if response.status_code != 200:
            log_test("Agile Workflow - Create Epic", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        epic = response.json()
        log_test("Agile Workflow - Create Epic", True, f"Created epic with ID: {epic['id']}")
        
        # 3. Create a sprint for the project
        sprint_data = {
            "name": "Sprint 1 - Authentication",
            "description": "First sprint focusing on authentication features",
            "project_id": project["id"],
            "start_date": datetime.now().isoformat(),
            "end_date": (datetime.now() + timedelta(days=14)).isoformat(),
            "goal": "Complete user authentication epic",
            "capacity_hours": 120,
            "velocity_target": 30
        }
        
        response = requests.post(f"{BACKEND_URL}/sprints", json=sprint_data)
        if response.status_code != 200:
            log_test("Agile Workflow - Create Sprint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        sprint = response.json()
        log_test("Agile Workflow - Create Sprint", True, f"Created sprint with ID: {sprint['id']}")
        
        # 4. Create tasks for the epic and assign them to the sprint
        task_statuses = ["todo", "in_progress", "review", "done"]
        story_points = [5, 8, 3, 5]
        
        for i in range(4):
            task_data = {
                "title": f"Auth Task {i+1}",
                "description": f"Authentication task {i+1} description",
                "priority": "high",
                "status": task_statuses[i],
                "project_id": project["id"],
                "epic_id": epic["id"],
                "sprint_id": sprint["id"],
                "story_points": story_points[i],
                "assigned_to": created_users[i % len(created_users)]["id"]
            }
            
            response = requests.post(f"{BACKEND_URL}/tasks", json=task_data)
            if response.status_code != 200:
                log_test(f"Agile Workflow - Create Task {i+1}", False, f"Status code: {response.status_code}, Response: {response.text}")
                continue
            
            task = response.json()
            log_test(f"Agile Workflow - Create Task {i+1}", True, f"Created task with ID: {task['id']}, Status: {task['status']}")
        
        # 5. Update the sprint to active
        response = requests.put(f"{BACKEND_URL}/sprints/{sprint['id']}", json={"status": "active"})
        if response.status_code != 200:
            log_test("Agile Workflow - Activate Sprint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        updated_sprint = response.json()
        log_test("Agile Workflow - Activate Sprint", True, f"Updated sprint status to: {updated_sprint['status']}")
        
        # 6. Check sprint board
        response = requests.get(f"{BACKEND_URL}/sprints/{sprint['id']}/board")
        if response.status_code != 200:
            log_test("Agile Workflow - Sprint Board", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        board = response.json()
        log_test("Agile Workflow - Sprint Board", True, f"Retrieved sprint board with {sum(len(tasks) for tasks in board['board'].values())} tasks")
        
        # 7. Check sprint analytics
        response = requests.get(f"{BACKEND_URL}/sprints/{sprint['id']}/analytics")
        if response.status_code != 200:
            log_test("Agile Workflow - Sprint Analytics", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        analytics = response.json()
        log_test("Agile Workflow - Sprint Analytics", True, 
                 f"Retrieved sprint analytics - Total Points: {analytics['total_story_points']}, Completed: {analytics['completed_story_points']}")
        
        # 8. Complete the sprint
        response = requests.put(f"{BACKEND_URL}/sprints/{sprint['id']}", json={"status": "completed"})
        if response.status_code != 200:
            log_test("Agile Workflow - Complete Sprint", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        completed_sprint = response.json()
        log_test("Agile Workflow - Complete Sprint", True, f"Updated sprint status to: {completed_sprint['status']}")
        
        # 9. Update the epic status to done
        response = requests.put(f"{BACKEND_URL}/epics/{epic['id']}", json={"status": "done"})
        if response.status_code != 200:
            log_test("Agile Workflow - Complete Epic", False, f"Status code: {response.status_code}, Response: {response.text}")
            return
        
        completed_epic = response.json()
        log_test("Agile Workflow - Complete Epic", True, f"Updated epic status to: {completed_epic['status']}")
        
        # Overall workflow test passed
        log_test("Agile Workflow - Complete Flow", True, "Successfully tested the complete agile workflow")
        
    except Exception as e:
        log_test("Agile Workflow", False, f"Exception: {str(e)}")

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
    
    # Test epic endpoints
    print("\n----- Testing Epic Endpoints -----\n")
    test_create_epics()
    test_get_epics()
    test_get_epic_by_id()
    test_update_epic()
    test_delete_epic_with_tasks()
    test_delete_epic()
    
    # Test sprint endpoints
    print("\n----- Testing Sprint Endpoints -----\n")
    test_create_sprints()
    test_get_sprints()
    test_get_sprint_by_id()
    test_update_sprint()
    test_sprint_board()
    test_sprint_analytics()
    test_delete_sprint()
    
    # Test enhanced task management
    print("\n----- Testing Enhanced Task Management -----\n")
    test_enhanced_task_management()
    
    # Test complete agile workflow
    print("\n----- Testing Complete Agile Workflow -----\n")
    test_agile_workflow()
    
    # Test dashboard and kanban endpoints
    print("\n----- Testing Dashboard and Kanban Endpoints -----\n")
    test_dashboard_stats()
    test_project_kanban()
    test_discipline_kanban()
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
