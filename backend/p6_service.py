import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase
from p6_client import P6Client
from p6_models import (
    P6Project, P6Activity, P6Resource, SyncRequest, SyncResult, 
    P6SyncStatus, P6DataMapping, PMFusionToP6Export, P6ImportRequest
)
import uuid

logger = logging.getLogger(__name__)

class P6Service:
    """Service layer for P6 integration operations"""
    
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.p6_client = P6Client()
        self.data_mapping = P6DataMapping()
        
    async def test_connection(self) -> Dict[str, Any]:
        """Test P6 connection"""
        return await self.p6_client.test_connection()
    
    async def sync_from_p6(self, sync_request: SyncRequest) -> SyncResult:
        """Sync data from P6 to PMFusion"""
        started_at = datetime.utcnow()
        result = SyncResult(
            status=P6SyncStatus.IN_PROGRESS,
            message="Starting P6 to PMFusion sync",
            started_at=started_at
        )
        
        try:
            logger.info(f"Starting P6 sync: {sync_request}")
            
            # Sync projects
            if sync_request.sync_projects:
                projects_count = await self._sync_projects_from_p6(sync_request.project_ids)
                result.projects_synced = projects_count
                logger.info(f"Synced {projects_count} projects from P6")
            
            # Sync activities
            if sync_request.sync_activities:
                activities_count = await self._sync_activities_from_p6(sync_request.project_ids)
                result.activities_synced = activities_count
                logger.info(f"Synced {activities_count} activities from P6")
            
            # Sync resources
            if sync_request.sync_resources:
                resources_count = await self._sync_resources_from_p6()
                result.resources_synced = resources_count
                logger.info(f"Synced {resources_count} resources from P6")
            
            result.status = P6SyncStatus.COMPLETED
            result.message = "P6 sync completed successfully"
            
        except Exception as e:
            logger.error(f"P6 sync failed: {str(e)}")
            result.status = P6SyncStatus.FAILED
            result.message = f"P6 sync failed: {str(e)}"
            result.errors.append(str(e))
        
        # Finalize result
        result.completed_at = datetime.utcnow()
        result.duration_seconds = (result.completed_at - result.started_at).total_seconds()
        
        # Store sync result
        await self.db.p6_sync_results.insert_one(result.dict())
        
        return result
    
    async def _sync_projects_from_p6(self, project_ids: Optional[List[int]] = None) -> int:
        """Sync projects from P6 to PMFusion"""
        p6_projects = await self.p6_client.get_projects()
        synced_count = 0
        
        for p6_project in p6_projects:
            # Filter by project IDs if specified
            if project_ids and p6_project["ObjectId"] not in project_ids:
                continue
                
            try:
                # Map P6 project to PMFusion project format
                pmfusion_project = await self._map_p6_project_to_pmfusion(p6_project)
                
                # Check if project already exists in PMFusion
                existing_project = await self.db.projects.find_one({
                    "$or": [
                        {"external_id": p6_project["Id"]},
                        {"p6_object_id": p6_project["ObjectId"]}
                    ]
                })
                
                if existing_project:
                    # Update existing project
                    await self.db.projects.update_one(
                        {"id": existing_project["id"]},
                        {"$set": {
                            **pmfusion_project,
                            "p6_object_id": p6_project["ObjectId"],
                            "p6_last_sync": datetime.utcnow(),
                            "updated_at": datetime.utcnow()
                        }}
                    )
                    logger.info(f"Updated existing project: {existing_project['name']}")
                else:
                    # Create new project
                    pmfusion_project.update({
                        "id": str(uuid.uuid4()),
                        "p6_object_id": p6_project["ObjectId"],
                        "external_id": p6_project["Id"],
                        "p6_last_sync": datetime.utcnow(),
                        "created_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    })
                    
                    await self.db.projects.insert_one(pmfusion_project)
                    logger.info(f"Created new project: {pmfusion_project['name']}")
                
                synced_count += 1
                
            except Exception as e:
                logger.error(f"Failed to sync project {p6_project.get('Name', 'Unknown')}: {str(e)}")
        
        return synced_count
    
    async def _sync_activities_from_p6(self, project_ids: Optional[List[int]] = None) -> int:
        """Sync activities from P6 to PMFusion tasks"""
        synced_count = 0
        
        # Get PMFusion projects that have P6 mapping
        pmfusion_projects = await self.db.projects.find({"p6_object_id": {"$exists": True}}).to_list(1000)
        
        for pmfusion_project in pmfusion_projects:
            p6_project_id = pmfusion_project["p6_object_id"]
            
            # Filter by project IDs if specified
            if project_ids and p6_project_id not in project_ids:
                continue
            
            try:
                # Get P6 activities for this project
                p6_activities = await self.p6_client.get_project_activities(p6_project_id)
                
                for p6_activity in p6_activities:
                    try:
                        # Map P6 activity to PMFusion task
                        pmfusion_task = await self._map_p6_activity_to_task(p6_activity, pmfusion_project["id"])
                        
                        # Check if task already exists
                        existing_task = await self.db.tasks.find_one({
                            "$or": [
                                {"external_id": p6_activity["Id"]},
                                {"p6_object_id": p6_activity["ObjectId"]}
                            ]
                        })
                        
                        if existing_task:
                            # Update existing task
                            await self.db.tasks.update_one(
                                {"id": existing_task["id"]},
                                {"$set": {
                                    **pmfusion_task,
                                    "p6_object_id": p6_activity["ObjectId"],
                                    "p6_last_sync": datetime.utcnow(),
                                    "updated_at": datetime.utcnow()
                                }}
                            )
                        else:
                            # Create new task
                            pmfusion_task.update({
                                "id": str(uuid.uuid4()),
                                "p6_object_id": p6_activity["ObjectId"],
                                "external_id": p6_activity["Id"],
                                "p6_last_sync": datetime.utcnow(),
                                "created_at": datetime.utcnow(),
                                "updated_at": datetime.utcnow(),
                                "created_by": "p6_sync"
                            })
                            
                            await self.db.tasks.insert_one(pmfusion_task)
                        
                        synced_count += 1
                        
                    except Exception as e:
                        logger.error(f"Failed to sync activity {p6_activity.get('Name', 'Unknown')}: {str(e)}")
                        
            except Exception as e:
                logger.error(f"Failed to sync activities for project {p6_project_id}: {str(e)}")
        
        return synced_count
    
    async def _sync_resources_from_p6(self) -> int:
        """Sync resources from P6 (note: usually not synced to users for security)"""
        synced_count = 0
        
        try:
            p6_resources = await self.p6_client.get_resources()
            
            # Store P6 resources in a separate collection for reference
            await self.db.p6_resources.delete_many({})  # Clear old data
            
            for p6_resource in p6_resources:
                resource_doc = {
                    **p6_resource,
                    "p6_last_sync": datetime.utcnow(),
                    "sync_status": "synced"
                }
                await self.db.p6_resources.insert_one(resource_doc)
                synced_count += 1
            
            logger.info(f"Stored {synced_count} P6 resources for reference")
            
        except Exception as e:
            logger.error(f"Failed to sync P6 resources: {str(e)}")
        
        return synced_count
    
    async def _map_p6_project_to_pmfusion(self, p6_project: Dict[str, Any]) -> Dict[str, Any]:
        """Map P6 project data to PMFusion project format"""
        mapped_project = {}
        
        for p6_field, pmfusion_field in self.data_mapping.project_mappings.items():
            if p6_field in p6_project and p6_project[p6_field] is not None:
                value = p6_project[p6_field]
                
                # Handle date fields
                if p6_field in ["StartDate", "FinishDate"] and value:
                    try:
                        # Parse P6 date format and convert to ISO
                        if isinstance(value, str):
                            parsed_date = datetime.fromisoformat(value.replace('Z', '+00:00'))
                            mapped_project[pmfusion_field] = parsed_date
                    except Exception:
                        logger.warning(f"Failed to parse date {value} for field {p6_field}")
                
                # Handle status mapping
                elif p6_field == "Status" and value in self.data_mapping.status_mappings:
                    mapped_project[pmfusion_field] = self.data_mapping.status_mappings[value]
                
                else:
                    mapped_project[pmfusion_field] = value
        
        # Set default values for required PMFusion fields
        if "status" not in mapped_project:
            mapped_project["status"] = "planning"
        
        # Find project manager user ID if name is provided
        if "project_manager_name" in mapped_project:
            pm_name = mapped_project.pop("project_manager_name")
            pm_user = await self.db.users.find_one({"name": {"$regex": pm_name, "$options": "i"}})
            if pm_user:
                mapped_project["project_manager_id"] = pm_user["id"]
        
        return mapped_project
    
    async def _map_p6_activity_to_task(self, p6_activity: Dict[str, Any], project_id: str) -> Dict[str, Any]:
        """Map P6 activity data to PMFusion task format"""
        mapped_task = {"project_id": project_id}
        
        for p6_field, pmfusion_field in self.data_mapping.activity_mappings.items():
            if p6_field in p6_activity and p6_activity[p6_field] is not None:
                value = p6_activity[p6_field]
                
                # Handle date fields
                if p6_field in ["StartDate", "FinishDate"] and value:
                    try:
                        if isinstance(value, str):
                            parsed_date = datetime.fromisoformat(value.replace('Z', '+00:00'))
                            mapped_task[pmfusion_field] = parsed_date
                    except Exception:
                        logger.warning(f"Failed to parse date {value} for field {p6_field}")
                
                # Handle status mapping
                elif p6_field == "Status" and value in self.data_mapping.status_mappings:
                    mapped_task[pmfusion_field] = self.data_mapping.status_mappings[value]
                
                # Handle priority mapping
                elif p6_field == "Priority" and value in self.data_mapping.priority_mappings:
                    mapped_task[pmfusion_field] = self.data_mapping.priority_mappings[value]
                
                else:
                    mapped_task[pmfusion_field] = value
        
        # Set default values for required PMFusion fields
        if "status" not in mapped_task:
            mapped_task["status"] = "todo"
        if "priority" not in mapped_task:
            mapped_task["priority"] = "medium"
        if "description" not in mapped_task:
            mapped_task["description"] = f"Task imported from P6 Activity {p6_activity.get('Id', '')}"
        
        # Convert duration to estimated hours (assuming 8 hours per day)
        if "Duration" in p6_activity and p6_activity["Duration"]:
            mapped_task["estimated_hours"] = p6_activity["Duration"] * 8
        
        return mapped_task
    
    async def export_to_p6(self, export_request: PMFusionToP6Export) -> Dict[str, Any]:
        """Export PMFusion project to P6"""
        try:
            # Get PMFusion project
            project = await self.db.projects.find_one({"id": export_request.project_id})
            if not project:
                raise Exception(f"Project {export_request.project_id} not found")
            
            # Map to P6 format
            p6_project_data = await self._map_pmfusion_project_to_p6(project)
            
            # Create or update in P6
            if export_request.create_new_project:
                # Create new P6 project (mock for now)
                p6_result = {
                    "ObjectId": 9999,
                    "message": f"Mock P6 project created: {project['name']}"
                }
            else:
                # Update existing P6 project
                p6_result = {
                    "ObjectId": export_request.p6_project_id,
                    "message": f"Mock P6 project updated: {project['name']}"
                }
            
            # Export tasks as activities
            if export_request.include_tasks:
                tasks = await self.db.tasks.find({"project_id": export_request.project_id}).to_list(1000)
                for task in tasks:
                    activity_data = await self._map_pmfusion_task_to_p6_activity(task)
                    # Create activity in P6 (mock)
                    await self.p6_client.create_activity(p6_result["ObjectId"], activity_data)
            
            return {
                "status": "success",
                "message": "Successfully exported to P6",
                "p6_project_id": p6_result["ObjectId"],
                "tasks_exported": len(tasks) if export_request.include_tasks else 0
            }
            
        except Exception as e:
            logger.error(f"P6 export failed: {str(e)}")
            return {
                "status": "error",
                "message": f"P6 export failed: {str(e)}"
            }
    
    async def _map_pmfusion_project_to_p6(self, pmfusion_project: Dict[str, Any]) -> Dict[str, Any]:
        """Map PMFusion project to P6 format"""
        # Reverse mapping from PMFusion to P6
        reverse_mappings = {v: k for k, v in self.data_mapping.project_mappings.items()}
        reverse_status = {v: k for k, v in self.data_mapping.status_mappings.items()}
        
        p6_data = {}
        for pmf_field, p6_field in reverse_mappings.items():
            if pmf_field in pmfusion_project:
                value = pmfusion_project[pmf_field]
                
                # Handle status reverse mapping
                if pmf_field == "status" and value in reverse_status:
                    p6_data[p6_field] = reverse_status[value]
                else:
                    p6_data[p6_field] = value
        
        return p6_data
    
    async def _map_pmfusion_task_to_p6_activity(self, pmfusion_task: Dict[str, Any]) -> Dict[str, Any]:
        """Map PMFusion task to P6 activity format"""
        reverse_mappings = {v: k for k, v in self.data_mapping.activity_mappings.items()}
        reverse_status = {v: k for k, v in self.data_mapping.status_mappings.items()}
        reverse_priority = {v: k for k, v in self.data_mapping.priority_mappings.items()}
        
        p6_data = {}
        for pmf_field, p6_field in reverse_mappings.items():
            if pmf_field in pmfusion_task:
                value = pmfusion_task[pmf_field]
                
                # Handle mappings
                if pmf_field == "status" and value in reverse_status:
                    p6_data[p6_field] = reverse_status[value]
                elif pmf_field == "priority" and value in reverse_priority:
                    p6_data[p6_field] = reverse_priority[value]
                else:
                    p6_data[p6_field] = value
        
        # Convert estimated hours to duration days
        if "estimated_hours" in pmfusion_task and pmfusion_task["estimated_hours"]:
            p6_data["Duration"] = pmfusion_task["estimated_hours"] / 8
        
        return p6_data
    
    async def get_sync_status(self) -> Dict[str, Any]:
        """Get overall P6 sync status and analytics"""
        try:
            # Get latest sync results
            latest_sync = await self.db.p6_sync_results.find_one(
                {}, sort=[("started_at", -1)]
            )
            
            # Count synced items
            synced_projects = await self.db.projects.count_documents({"p6_object_id": {"$exists": True}})
            synced_tasks = await self.db.tasks.count_documents({"p6_object_id": {"$exists": True}})
            
            # Get P6 totals (from cache)
            p6_projects = await self.db.p6_projects.count_documents({})
            p6_activities = await self.db.p6_activities.count_documents({})
            
            return {
                "connection_status": "connected" if self.p6_client.use_mock else "unknown",
                "last_sync": latest_sync,
                "sync_statistics": {
                    "projects": {"synced": synced_projects, "total_p6": p6_projects},
                    "activities": {"synced": synced_tasks, "total_p6": p6_activities}
                },
                "mock_mode": self.p6_client.use_mock
            }
            
        except Exception as e:
            logger.error(f"Failed to get sync status: {str(e)}")
            return {
                "connection_status": "error", 
                "error": str(e),
                "mock_mode": self.p6_client.use_mock
            }
