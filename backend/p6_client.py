import httpx
import base64
from datetime import datetime, timedelta
import os
import logging
from typing import Optional, Dict, List, Any
from tenacity import retry, stop_after_attempt, wait_exponential
import asyncio

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class P6Client:
    """Primavera P6 API Client with OAuth authentication and error handling"""
    
    def __init__(self):
        self.host = os.getenv("P6_HOST", "https://demo-p6-server.com")
        self.client_id = os.getenv("P6_CLIENT_ID", "demo_client")
        self.client_secret = os.getenv("P6_CLIENT_SECRET", "demo_secret")
        self.username = os.getenv("P6_USERNAME", "demo_user")
        self.password = os.getenv("P6_PASSWORD", "demo_password")
        self.token = None
        self.token_expires = None
        self.use_mock = os.getenv("P6_USE_MOCK", "true").lower() == "true"
        
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def get_access_token(self) -> str:
        """Get OAuth access token for P6 API with retry logic"""
        if self.token and self.token_expires and datetime.now() < self.token_expires:
            return self.token
            
        if self.use_mock:
            # Mock token for testing
            self.token = "mock_token_12345"
            self.token_expires = datetime.now() + timedelta(hours=1)
            logger.info("Using mock P6 token")
            return self.token
            
        try:
            # Encode credentials for basic auth
            credentials = f"{self.client_id}:{self.client_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.host}/p6ws/oauth/token",
                    headers={
                        "Authorization": f"Basic {encoded_credentials}",
                        "Content-Type": "application/x-www-form-urlencoded"
                    },
                    data={
                        "grant_type": "password",
                        "username": self.username,
                        "password": self.password
                    }
                )
                
                if response.status_code == 200:
                    token_data = response.json()
                    self.token = token_data["access_token"]
                    expires_in = token_data.get("expires_in", 3600)
                    self.token_expires = datetime.now() + timedelta(seconds=expires_in - 60)
                    logger.info("Successfully obtained P6 access token")
                    return self.token
                else:
                    raise Exception(f"Failed to get token: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"Authentication failed: {str(e)}")
            raise
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    async def make_request(self, endpoint: str, method: str = "GET", params: dict = None, data: dict = None):
        """Make authenticated request to P6 API with retry logic"""
        
        if self.use_mock:
            return await self._mock_response(endpoint, method, params, data)
            
        try:
            token = await self.get_access_token()
            
            async with httpx.AsyncClient(timeout=60.0) as client:
                response = await client.request(
                    method,
                    f"{self.host}/p6ws/restapi/{endpoint}",
                    headers={"Authorization": f"Bearer {token}"},
                    params=params,
                    json=data
                )
                
                if response.status_code == 200:
                    return response.json()
                elif response.status_code == 401:
                    # Token might be expired, clear it and retry
                    self.token = None
                    token = await self.get_access_token()
                    response = await client.request(
                        method,
                        f"{self.host}/p6ws/restapi/{endpoint}",
                        headers={"Authorization": f"Bearer {token}"},
                        params=params,
                        json=data
                    )
                    if response.status_code == 200:
                        return response.json()
                    else:
                        raise Exception(f"API request failed after token refresh: {response.status_code} - {response.text}")
                else:
                    raise Exception(f"API request failed: {response.status_code} - {response.text}")
                    
        except Exception as e:
            logger.error(f"API request to {endpoint} failed: {str(e)}")
            raise
    
    async def _mock_response(self, endpoint: str, method: str = "GET", params: dict = None, data: dict = None):
        """Mock P6 API responses for testing"""
        await asyncio.sleep(0.1)  # Simulate network delay
        
        if endpoint == "project":
            return {
                "data": [
                    {
                        "ObjectId": 1,
                        "Name": "Oil Refinery Expansion - P6 Sync",
                        "Id": "P6-REF-001",
                        "StartDate": "2024-01-15T00:00:00.000Z",
                        "FinishDate": "2024-12-30T00:00:00.000Z",
                        "Status": "Active",
                        "ProjectManager": "John Smith",
                        "Description": "Major refinery expansion project imported from P6",
                        "Priority": "High"
                    },
                    {
                        "ObjectId": 2,
                        "Name": "Gas Pipeline Installation - P6 Sync",
                        "Id": "P6-PIPE-002",
                        "StartDate": "2024-03-01T00:00:00.000Z",
                        "FinishDate": "2024-11-15T00:00:00.000Z",
                        "Status": "Planning",
                        "ProjectManager": "Sarah Johnson",
                        "Description": "Cross-country gas pipeline project from P6",
                        "Priority": "Critical"
                    },
                    {
                        "ObjectId": 3,
                        "Name": "Offshore Platform Construction - P6 Sync",
                        "Id": "P6-OFF-003",
                        "StartDate": "2024-06-01T00:00:00.000Z",
                        "FinishDate": "2025-08-30T00:00:00.000Z",
                        "Status": "Not Started",
                        "ProjectManager": "Mike Brown",
                        "Description": "Offshore drilling platform construction from P6",
                        "Priority": "High"
                    }
                ]
            }
        
        elif endpoint == "activity":
            project_filter = params.get("Filter", "") if params else ""
            project_id = None
            if "ProjectObjectId:eq:" in project_filter:
                project_id = int(project_filter.split("ProjectObjectId:eq:")[1])
            
            all_activities = [
                # Project 1 activities
                {
                    "ObjectId": 101,
                    "Name": "Design Engineering Phase",
                    "Id": "P6-ACT-101",
                    "ProjectObjectId": 1,
                    "StartDate": "2024-01-15T00:00:00.000Z",
                    "FinishDate": "2024-04-15T00:00:00.000Z",
                    "Duration": 90.0,
                    "PercentComplete": 75.0,
                    "Status": "In Progress",
                    "Priority": "High",
                    "ResourceId": "ENG-001",
                    "ActivityType": "Task Dependent"
                },
                {
                    "ObjectId": 102,
                    "Name": "Equipment Procurement",
                    "Id": "P6-ACT-102",
                    "ProjectObjectId": 1,
                    "StartDate": "2024-03-01T00:00:00.000Z",
                    "FinishDate": "2024-08-30T00:00:00.000Z",
                    "Duration": 180.0,
                    "PercentComplete": 25.0,
                    "Status": "In Progress",
                    "Priority": "Critical",
                    "ResourceId": "PROC-001",
                    "ActivityType": "Task Dependent"
                },
                # Project 2 activities
                {
                    "ObjectId": 201,
                    "Name": "Route Survey and Planning",
                    "Id": "P6-ACT-201",
                    "ProjectObjectId": 2,
                    "StartDate": "2024-03-01T00:00:00.000Z",
                    "FinishDate": "2024-05-30T00:00:00.000Z",
                    "Duration": 90.0,
                    "PercentComplete": 90.0,
                    "Status": "Nearly Complete",
                    "Priority": "High",
                    "ResourceId": "SURV-001",
                    "ActivityType": "Task Dependent"
                },
                {
                    "ObjectId": 202,
                    "Name": "Environmental Impact Assessment",
                    "Id": "P6-ACT-202",
                    "ProjectObjectId": 2,
                    "StartDate": "2024-04-01T00:00:00.000Z",
                    "FinishDate": "2024-07-30T00:00:00.000Z",
                    "Duration": 120.0,
                    "PercentComplete": 60.0,
                    "Status": "In Progress",
                    "Priority": "Critical",
                    "ResourceId": "ENV-001",
                    "ActivityType": "Task Dependent"
                }
            ]
            
            if project_id:
                filtered_activities = [act for act in all_activities if act["ProjectObjectId"] == project_id]
                return {"data": filtered_activities}
            else:
                return {"data": all_activities}
        
        elif endpoint == "resource":
            return {
                "data": [
                    {
                        "ObjectId": 1001,
                        "Name": "Senior Process Engineer",
                        "Id": "ENG-001",
                        "Type": "Labor",
                        "MaxUnitsPerTime": 1.0,
                        "DefaultUnitsPerTime": 1.0,
                        "CostPerUnit": 125.0,
                        "CalendarObjectId": 1
                    },
                    {
                        "ObjectId": 1002,
                        "Name": "Procurement Specialist",
                        "Id": "PROC-001",
                        "Type": "Labor",
                        "MaxUnitsPerTime": 1.0,
                        "DefaultUnitsPerTime": 1.0,
                        "CostPerUnit": 95.0,
                        "CalendarObjectId": 1
                    },
                    {
                        "ObjectId": 1003,
                        "Name": "Survey Team Lead",
                        "Id": "SURV-001",
                        "Type": "Labor",
                        "MaxUnitsPerTime": 1.0,
                        "DefaultUnitsPerTime": 1.0,
                        "CostPerUnit": 110.0,
                        "CalendarObjectId": 1
                    },
                    {
                        "ObjectId": 1004,
                        "Name": "Environmental Engineer",
                        "Id": "ENV-001",
                        "Type": "Labor",
                        "MaxUnitsPerTime": 1.0,
                        "DefaultUnitsPerTime": 1.0,
                        "CostPerUnit": 105.0,
                        "CalendarObjectId": 1
                    }
                ]
            }
        
        elif endpoint == "calendar":
            return {
                "data": [
                    {
                        "ObjectId": 1,
                        "Name": "Standard Work Week",
                        "Type": "Global",
                        "HoursPerDay": 8.0,
                        "HoursPerWeek": 40.0,
                        "DaysPerMonth": 22.0
                    }
                ]
            }
        
        else:
            return {"data": []}
    
    async def test_connection(self) -> Dict[str, Any]:
        """Test P6 connection and return status"""
        try:
            await self.get_access_token()
            
            # Try to fetch a small amount of data
            response = await self.make_request("project", params={"PageSize": "1"})
            
            return {
                "status": "connected",
                "host": self.host,
                "mock_mode": self.use_mock,
                "projects_available": len(response.get("data", [])),
                "message": "Successfully connected to P6"
            }
            
        except Exception as e:
            return {
                "status": "error",
                "host": self.host,
                "mock_mode": self.use_mock,
                "error": str(e),
                "message": "Failed to connect to P6"
            }
    
    async def get_projects(self, fields: List[str] = None) -> List[Dict[str, Any]]:
        """Get all projects from P6"""
        default_fields = ["ObjectId", "Name", "Id", "StartDate", "FinishDate", "Status", "ProjectManager", "Description"]
        query_fields = fields or default_fields
        
        response = await self.make_request(
            "project",
            params={"Fields": ",".join(query_fields)}
        )
        return response.get("data", [])
    
    async def get_project_activities(self, project_id: int, fields: List[str] = None) -> List[Dict[str, Any]]:
        """Get activities for a specific project"""
        default_fields = ["ObjectId", "Name", "Id", "ProjectObjectId", "StartDate", "FinishDate", 
                         "Duration", "PercentComplete", "Status", "Priority", "ResourceId", "ActivityType"]
        query_fields = fields or default_fields
        
        response = await self.make_request(
            "activity",
            params={
                "Filter": f"ProjectObjectId:eq:{project_id}",
                "Fields": ",".join(query_fields)
            }
        )
        return response.get("data", [])
    
    async def get_resources(self, fields: List[str] = None) -> List[Dict[str, Any]]:
        """Get all resources from P6"""
        default_fields = ["ObjectId", "Name", "Id", "Type", "MaxUnitsPerTime", "DefaultUnitsPerTime", "CostPerUnit"]
        query_fields = fields or default_fields
        
        response = await self.make_request(
            "resource",
            params={"Fields": ",".join(query_fields)}
        )
        return response.get("data", [])
    
    async def update_activity_progress(self, activity_id: int, percent_complete: float) -> Dict[str, Any]:
        """Update activity progress in P6"""
        if self.use_mock:
            return {"status": "success", "message": f"Mock update: Activity {activity_id} set to {percent_complete}% complete"}
        
        response = await self.make_request(
            f"activity/{activity_id}",
            method="PUT",
            data={"PercentComplete": percent_complete}
        )
        return response
    
    async def create_activity(self, project_id: int, activity_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create new activity in P6"""
        if self.use_mock:
            return {
                "ObjectId": 9999,
                "message": f"Mock activity created in project {project_id}",
                **activity_data
            }
        
        activity_data["ProjectObjectId"] = project_id
        response = await self.make_request(
            "activity",
            method="POST",
            data=activity_data
        )
        return response
