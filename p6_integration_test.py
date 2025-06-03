import requests
import json
import time
from datetime import datetime, timedelta

# Get Backend URL from frontend/.env
def get_backend_url():
    # Use localhost directly for testing
    return "http://localhost:8001/api"

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

def test_p6_connection():
    """Test P6 connection endpoint"""
    print("\n=== Testing P6 Connection ===")
    try:
        response = requests.get(f"{BACKEND_URL}/p6/connection/test")
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            # Check if the connection is successful and in mock mode
            if data.get("status") == "connected" or data.get("status") == "success":
                log_test("P6 Connection Test", True, "Successfully connected to P6 (mock mode)")
                return True
            else:
                log_test("P6 Connection Test", False, f"Connection failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Connection Test", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Connection Test", False, f"Exception: {str(e)}")
        return False

def test_p6_projects():
    """Test P6 projects endpoint"""
    print("\n=== Testing P6 Projects ===")
    try:
        response = requests.get(f"{BACKEND_URL}/p6/projects")
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success" and "projects" in data:
                projects = data["projects"]
                log_test("P6 Projects", True, f"Retrieved {len(projects)} P6 projects")
                
                # Verify project data structure
                if projects:
                    project = projects[0]
                    required_fields = ["ObjectId", "Name", "Id", "StartDate", "FinishDate"]
                    missing_fields = [field for field in required_fields if field not in project]
                    
                    if missing_fields:
                        log_test("P6 Project Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        log_test("P6 Project Structure", True, "Project data contains all required fields")
                
                return True
            else:
                log_test("P6 Projects", False, f"Failed to retrieve projects: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Projects", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Projects", False, f"Exception: {str(e)}")
        return False

def test_p6_project_activities():
    """Test P6 project activities endpoint"""
    print("\n=== Testing P6 Project Activities ===")
    try:
        # First get a project ID
        projects_response = requests.get(f"{BACKEND_URL}/p6/projects")
        if projects_response.status_code != 200 or "projects" not in projects_response.json():
            log_test("P6 Project Activities", False, "Failed to get projects to test activities")
            return False
        
        projects = projects_response.json()["projects"]
        if not projects:
            log_test("P6 Project Activities", False, "No projects available to test activities")
            return False
        
        project_id = projects[0]["ObjectId"]
        
        # Now get activities for this project
        response = requests.get(f"{BACKEND_URL}/p6/projects/{project_id}/activities")
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success" and "activities" in data:
                activities = data["activities"]
                log_test("P6 Project Activities", True, f"Retrieved {len(activities)} activities for project {project_id}")
                
                # Verify activity data structure
                if activities:
                    activity = activities[0]
                    required_fields = ["ObjectId", "Name", "Id", "ProjectObjectId", "StartDate", "FinishDate"]
                    missing_fields = [field for field in required_fields if field not in activity]
                    
                    if missing_fields:
                        log_test("P6 Activity Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        log_test("P6 Activity Structure", True, "Activity data contains all required fields")
                
                return True
            else:
                log_test("P6 Project Activities", False, f"Failed to retrieve activities: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Project Activities", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Project Activities", False, f"Exception: {str(e)}")
        return False

def test_p6_resources():
    """Test P6 resources endpoint"""
    print("\n=== Testing P6 Resources ===")
    try:
        response = requests.get(f"{BACKEND_URL}/p6/resources")
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success" and "resources" in data:
                resources = data["resources"]
                log_test("P6 Resources", True, f"Retrieved {len(resources)} P6 resources")
                
                # Verify resource data structure
                if resources:
                    resource = resources[0]
                    required_fields = ["ObjectId", "Name", "Id", "Type"]
                    missing_fields = [field for field in required_fields if field not in resource]
                    
                    if missing_fields:
                        log_test("P6 Resource Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        log_test("P6 Resource Structure", True, "Resource data contains all required fields")
                
                return True
            else:
                log_test("P6 Resources", False, f"Failed to retrieve resources: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Resources", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Resources", False, f"Exception: {str(e)}")
        return False

def test_p6_sync():
    """Test P6 sync endpoint"""
    print("\n=== Testing P6 Sync ===")
    try:
        sync_request = {
            "project_ids": None,  # Sync all projects
            "sync_projects": True,
            "sync_activities": True,
            "sync_resources": True,
            "sync_direction": "p6_to_pmfusion",
            "force_sync": False
        }
        
        response = requests.post(f"{BACKEND_URL}/p6/sync", json=sync_request)
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success" and "sync_result" in data:
                sync_result = data["sync_result"]
                log_test("P6 Sync", True, f"Sync completed with status: {sync_result.get('status')}")
                
                # Verify sync result data
                required_fields = ["status", "projects_synced", "activities_synced", "resources_synced"]
                missing_fields = [field for field in required_fields if field not in sync_result]
                
                if missing_fields:
                    log_test("P6 Sync Result Structure", False, f"Missing fields: {missing_fields}")
                else:
                    log_test("P6 Sync Result Structure", True, "Sync result contains all required fields")
                    
                    # Verify projects were synced
                    if sync_result.get("projects_synced", 0) > 0:
                        log_test("P6 Projects Synced", True, f"Synced {sync_result['projects_synced']} projects")
                    else:
                        log_test("P6 Projects Synced", False, "No projects were synced")
                
                return True
            else:
                log_test("P6 Sync", False, f"Sync failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Sync", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Sync", False, f"Exception: {str(e)}")
        return False

def test_p6_export():
    """Test P6 export endpoint"""
    print("\n=== Testing P6 Export ===")
    try:
        # First get a PMFusion project ID
        projects_response = requests.get(f"{BACKEND_URL}/projects")
        
        # If no projects exist, create one
        if projects_response.status_code != 200 or not projects_response.json():
            print("Creating a test project for P6 export...")
            
            # Create a test project
            project_data = {
                "name": "Test P6 Export Project",
                "description": "Project for testing P6 export",
                "start_date": datetime.now().isoformat(),
                "end_date": datetime.now().isoformat(),
                "project_manager_id": "default_user"  # This might need to be a valid user ID
            }
            
            # Try to get a valid user ID first
            users_response = requests.get(f"{BACKEND_URL}/users")
            if users_response.status_code == 200 and users_response.json():
                project_data["project_manager_id"] = users_response.json()[0]["id"]
            
            create_response = requests.post(f"{BACKEND_URL}/projects", json=project_data)
            if create_response.status_code != 200:
                log_test("P6 Export - Create Test Project", False, f"Failed to create test project: {create_response.text}")
                return False
            
            project_id = create_response.json()["id"]
            log_test("P6 Export - Create Test Project", True, f"Created test project with ID: {project_id}")
        else:
            project_id = projects_response.json()[0]["id"]
        
        # Now test the export
        export_request = {
            "project_id": project_id,
            "include_tasks": True,
            "include_resources": True,
            "create_new_project": True
        }
        
        response = requests.post(f"{BACKEND_URL}/p6/export", json=export_request)
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success":
                log_test("P6 Export", True, f"Successfully exported project {project_id} to P6")
                
                # Verify export result data
                if "export_result" in data:
                    export_result = data["export_result"]
                    log_test("P6 Export Result", True, f"Export result: {export_result}")
                else:
                    log_test("P6 Export Result", False, "No export result data returned")
                
                return True
            else:
                log_test("P6 Export", False, f"Export failed: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Export", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Export", False, f"Exception: {str(e)}")
        return False

def test_p6_status():
    """Test P6 status endpoint"""
    print("\n=== Testing P6 Status ===")
    try:
        response = requests.get(f"{BACKEND_URL}/p6/status")
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success" and "p6_status" in data:
                p6_status = data["p6_status"]
                log_test("P6 Status", True, f"Retrieved P6 integration status")
                
                # Verify status data
                if "connection_status" in p6_status:
                    log_test("P6 Connection Status", True, f"Connection status: {p6_status['connection_status']}")
                else:
                    log_test("P6 Connection Status", False, "No connection status information")
                
                # Verify mock mode
                if "mock_mode" in p6_status:
                    log_test("P6 Mock Mode", True, f"Mock mode: {p6_status['mock_mode']}")
                else:
                    log_test("P6 Mock Mode", False, "No mock mode information")
                
                return True
            else:
                log_test("P6 Status", False, f"Failed to retrieve status: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Status", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Status", False, f"Exception: {str(e)}")
        return False

def test_p6_sync_history():
    """Test P6 sync history endpoint"""
    print("\n=== Testing P6 Sync History ===")
    try:
        response = requests.get(f"{BACKEND_URL}/p6/sync/history")
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success" and "sync_history" in data:
                sync_history = data["sync_history"]
                log_test("P6 Sync History", True, f"Retrieved {len(sync_history)} sync history records")
                
                # If we have history records, verify their structure
                if sync_history:
                    record = sync_history[0]
                    required_fields = ["status", "started_at", "projects_synced", "activities_synced", "resources_synced"]
                    missing_fields = [field for field in required_fields if field not in record]
                    
                    if missing_fields:
                        log_test("P6 Sync History Record Structure", False, f"Missing fields: {missing_fields}")
                    else:
                        log_test("P6 Sync History Record Structure", True, "Sync history record contains all required fields")
                
                return True
            else:
                log_test("P6 Sync History", False, f"Failed to retrieve sync history: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Sync History", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Sync History", False, f"Exception: {str(e)}")
        return False

def test_p6_mapping_preview():
    """Test P6 mapping preview endpoint"""
    print("\n=== Testing P6 Mapping Preview ===")
    try:
        response = requests.get(f"{BACKEND_URL}/p6/mapping/preview")
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2))
            
            if data.get("status") == "success" and "mapping_preview" in data:
                mapping_preview = data["mapping_preview"]
                log_test("P6 Mapping Preview", True, f"Retrieved P6 mapping preview")
                
                # Verify mapping data
                required_mappings = ["project_mappings", "activity_mappings", "status_mappings", "priority_mappings"]
                missing_mappings = [mapping for mapping in required_mappings if mapping not in mapping_preview]
                
                if missing_mappings:
                    log_test("P6 Mapping Preview Structure", False, f"Missing mappings: {missing_mappings}")
                else:
                    log_test("P6 Mapping Preview Structure", True, "Mapping preview contains all required mappings")
                
                # Check for sample data
                if "sample_p6_project" in mapping_preview:
                    log_test("P6 Sample Project", True, "Sample P6 project data included")
                else:
                    log_test("P6 Sample Project", False, "No sample P6 project data")
                
                return True
            else:
                log_test("P6 Mapping Preview", False, f"Failed to retrieve mapping preview: {data.get('message', 'Unknown error')}")
                return False
        else:
            log_test("P6 Mapping Preview", False, f"Status code: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        log_test("P6 Mapping Preview", False, f"Exception: {str(e)}")
        return False

def run_all_tests():
    """Run all P6 integration tests"""
    print("\n======= TESTING P6 INTEGRATION =======\n")
    
    tests = [
        ("P6 Connection Test", test_p6_connection),
        ("P6 Projects", test_p6_projects),
        ("P6 Project Activities", test_p6_project_activities),
        ("P6 Resources", test_p6_resources),
        ("P6 Sync", test_p6_sync),
        ("P6 Export", test_p6_export),
        ("P6 Status", test_p6_status),
        ("P6 Sync History", test_p6_sync_history),
        ("P6 Mapping Preview", test_p6_mapping_preview)
    ]
    
    results = {}
    
    for test_name, test_func in tests:
        print(f"\n\n{'=' * 50}")
        print(f"Running test: {test_name}")
        print(f"{'=' * 50}")
        
        try:
            success = test_func()
            results[test_name] = "✅ PASS" if success else "❌ FAIL"
        except Exception as e:
            print(f"Exception during test: {str(e)}")
            results[test_name] = "❌ FAIL (Exception)"
    
    # Print summary
    print("\n\n")
    print("=" * 50)
    print("P6 INTEGRATION TEST SUMMARY")
    print("=" * 50)
    
    all_passed = True
    for test_name, result in results.items():
        print(f"{test_name}: {result}")
        if "FAIL" in result:
            all_passed = False
    
    print("\nOverall Result:", "✅ ALL TESTS PASSED" if all_passed else "❌ SOME TESTS FAILED")
    
    # Print test statistics
    print(f"\nTests Passed: {test_results['passed']}")
    print(f"Tests Failed: {test_results['failed']}")
    print(f"Total Tests: {test_results['passed'] + test_results['failed']}")
    
    return all_passed

if __name__ == "__main__":
    run_all_tests()