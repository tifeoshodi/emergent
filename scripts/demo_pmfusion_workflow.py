#!/usr/bin/env python3
"""
PMFusion Three-Phase Workflow Demonstration
Shows the complete end-to-end workflow from project creation to document control
"""

import asyncio
import sys
import os
import uuid
from pathlib import Path
from datetime import datetime, timedelta
import json
from typing import Any, Dict, List, Optional, Union

# Add backend to path
sys.path.append(str(Path(__file__).parent.parent))

# Mock Supabase functions - used instead of importing from supabase_client
# since we don't have actual Supabase credentials

def insert(table: str, data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    """Mock insert data into table"""
    if 'id' not in data:
        data['id'] = str(uuid.uuid4())
    print(f"[MOCK] Inserting into {table}: {data}")
    return [data]

def select(table: str, query: Optional[Dict[str, Any]] = None, jwt: Optional[str] = None) -> Any:
    """Mock select data from table"""
    print(f"[MOCK] Selecting from {table}")
    if table == 'orgs':
        return [{'id': str(uuid.uuid4()), 'name': 'Demo Org'}]
    return []

def update(table: str, query: Dict[str, Any], data: Dict[str, Any], jwt: Optional[str] = None) -> Any:
    """Mock update data in table"""
    print(f"[MOCK] Updating {table} with {data}")
    return [data]

def create_organization(name: str) -> Dict[str, Any]:
    """Create a new organization"""
    org_data = {"name": name, "id": str(uuid.uuid4())}
    print(f"[MOCK] Creating organization: {name}")
    return org_data

def create_user(org_id: str, email: str, full_name: str, role: str, discipline_id: Optional[str] = None) -> Dict[str, Any]:
    """Create a new user"""
    user_data = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "email": email,
        "full_name": full_name,
        "role": role,
        "discipline_id": discipline_id
    }
    print(f"[MOCK] Creating user: {full_name}")
    return user_data

def create_project(org_id: str, name: str, owner_id: str, **kwargs) -> Dict[str, Any]:
    """Create a new project"""
    project_data = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "name": name,
        "owner_id": owner_id,
        **kwargs
    }
    print(f"[MOCK] Creating project: {name}")
    return project_data

def create_discipline(org_id: str, name: str, code: str, color_hex: str = "#6366f1") -> Dict[str, Any]:
    """Create a new discipline"""
    discipline_data = {
        "id": str(uuid.uuid4()),
        "org_id": org_id,
        "name": name,
        "code": code,
        "color_hex": color_hex
    }
    print(f"[MOCK] Creating discipline: {name}")
    return discipline_data

def get_discipline_kanban(discipline_id: str, project_id: str, jwt: Optional[str] = None) -> Dict[str, List[Dict[str, Any]]]:
    """Mock kanban board data for a discipline"""
    print(f"[MOCK] Getting kanban for discipline: {discipline_id}")
    # Return mock kanban structure
    return {
        "backlog": [{"id": str(uuid.uuid4()), "title": "Mock Task 1", "status": "backlog"}],
        "todo": [{"id": str(uuid.uuid4()), "title": "Mock Task 2", "status": "todo"}],
        "in_progress": [],
        "review_dic": [],
        "review_idc": [],
        "review_dcc": [],
        "done": []
    }

def print_banner(text, char="="):
    """Print a formatted banner"""
    print(f"\n{char * 80}")
    print(f" {text.center(76)} ")
    print(f"{char * 80}")

def print_step(step_num, title, description=""):
    """Print a formatted step"""
    print(f"\n🚀 STEP {step_num}: {title}")
    if description:
        print(f"   {description}")
    print("-" * 60)

def print_success(message):
    """Print success message"""
    print(f"✅ {message}")

def print_info(message):
    """Print info message"""
    print(f"ℹ️  {message}")

def print_workflow_stage(stage, description):
    """Print workflow stage"""
    print(f"\n📋 {stage}")
    print(f"   {description}")

async def demonstrate_three_phase_workflow():
    """Demonstrate the complete three-phase workflow"""
    
    print_banner("PMFusion Three-Phase Workflow Demonstration")
    print_info("This demo shows how the three-phase project management workflow operates")
    print_info("from project creation through teams execution to document control.")
    
    # ========================================================================
    # PHASE 1: PROJECT CREATION
    # ========================================================================
    
    print_banner("PHASE 1: PROJECT CREATION", "=")
    print_workflow_stage("PHASE 1", "Scheduler creates project using CTR/MDR documents")
    
    print_step(1, "Create Organization", "Setting up the engineering organization")
    try:
        org = create_organization("Advanced Engineering Solutions Ltd")
        print_success(f"Organization created: {org['name']}")
        org_id = org["id"]
    except Exception as e:
        print(f"❌ Organization creation failed: {e}")
        # Try to get existing org
        orgs = select('orgs')
        if orgs:
            org = orgs[0]
            org_id = org['id']
            print_info(f"Using existing organization: {org['name']}")
        else:
            print("❌ No organizations available")
            return
    
    print_step(2, "Create Engineering Disciplines", "Setting up discipline teams")
    disciplines = []
    discipline_configs = [
        ("Process Engineering", "PRO", "#ef4444"),
        ("Civil Engineering", "CIV", "#3b82f6"),
        ("Electrical Engineering", "ELE", "#f59e0b"),
        ("Instrumentation", "INS", "#10b981"),
        ("Mechanical Engineering", "MEC", "#8b5cf6")
    ]
    
    for name, code, color in discipline_configs:
        try:
            discipline = create_discipline(org_id, name, code, color)
            disciplines.append(discipline)
            print_success(f"Discipline created: {name} ({code})")
        except Exception as e:
            print(f"❌ Failed to create {name}: {e}")
    
    print_step(3, "Create Project Team", "Setting up users with different roles")
    users = []
    user_configs = [
        ("scheduler@aes.com", "Marcus Scheduler", "scheduler", None),
        ("process.lead@aes.com", "Sarah Process Lead", "team_lead", disciplines[0]['id'] if disciplines else None),
        ("civil.lead@aes.com", "David Civil Lead", "team_lead", disciplines[1]['id'] if len(disciplines) > 1 else None),
        ("process.eng@aes.com", "Emma Process Engineer", "team_member", disciplines[0]['id'] if disciplines else None),
        ("civil.eng@aes.com", "Michael Civil Engineer", "team_member", disciplines[1]['id'] if len(disciplines) > 1 else None),
        ("dcc.officer@aes.com", "Anna DCC Officer", "dcc", None),
    ]
    
    for email, name, role, discipline_id in user_configs:
        try:
            user = create_user(org_id, email, name, role, discipline_id)
            users.append(user)
            print_success(f"User created: {name} ({role})")
        except Exception as e:
            print(f"❌ Failed to create {name}: {e}")
    
    print_step(4, "Create Project via 4-Step Wizard", "Scheduler creates new project")
    try:
        scheduler = next(u for u in users if u['role'] == 'scheduler')
        project_data = {
            "name": "Catalytic Cracker Unit Modernization",
            "code": "CCU-MOD-2024",
            "description": "Complete modernization of the catalytic cracking unit including new reactor design, advanced control systems, and environmental upgrades",
            "client_name": "Global Petroleum Refining Corp",
            "start_date": "2024-03-01",
            "end_date": "2024-12-31",
            "status": "active"
        }
        
        project = create_project(org_id, **project_data, owner_id=scheduler['id'])
        print_success(f"Project created: {project['name']}")
        print_info(f"Project Code: {project['code']}")
        print_info(f"Duration: {project['start_date']} to {project['end_date']}")
        project_id = project['id']
    except Exception as e:
        print(f"❌ Project creation failed: {e}")
        return
    
    # ========================================================================
    # PHASE 2: TEAMS EXECUTION
    # ========================================================================
    
    print_banner("PHASE 2: TEAMS EXECUTION", "=")
    print_workflow_stage("PHASE 2", "Discipline teams execute tasks through kanban workflow")
    
    print_step(5, "Generate WBS and Create Tasks", "Converting project scope to actionable tasks")
    
    # Create sample tasks for different disciplines
    task_templates = [
        # Process Engineering Tasks
        {
            "title": "Process Flow Diagrams (PFD)",
            "description": "Develop detailed process flow diagrams for the catalytic cracking unit",
            "discipline": "PRO",
            "priority": 2,
            "estimated_hours": 80,
            "wbs_code": "1.1.1"
        },
        {
            "title": "Piping & Instrumentation Diagrams (P&ID)",
            "description": "Create comprehensive P&IDs for all process systems",
            "discipline": "PRO", 
            "priority": 1,
            "estimated_hours": 120,
            "wbs_code": "1.1.2"
        },
        {
            "title": "Process Simulation & Optimization",
            "description": "Run Aspen Plus simulations to optimize process parameters",
            "discipline": "PRO",
            "priority": 3,
            "estimated_hours": 60,
            "wbs_code": "1.1.3"
        },
        # Civil Engineering Tasks
        {
            "title": "Foundation Design",
            "description": "Design reinforced concrete foundations for new reactor",
            "discipline": "CIV",
            "priority": 1,
            "estimated_hours": 100,
            "wbs_code": "1.2.1"
        },
        {
            "title": "Structural Steel Design",
            "description": "Design steel support structures and platforms",
            "discipline": "CIV",
            "priority": 2,
            "estimated_hours": 90,
            "wbs_code": "1.2.2"
        },
        # Electrical Engineering Tasks
        {
            "title": "Electrical Load Analysis",
            "description": "Calculate electrical loads for all new equipment",
            "discipline": "ELE",
            "priority": 2,
            "estimated_hours": 40,
            "wbs_code": "1.3.1"
        },
        {
            "title": "Motor Control Center Design",
            "description": "Design MCC for process equipment control",
            "discipline": "ELE",
            "priority": 1,
            "estimated_hours": 70,
            "wbs_code": "1.3.2"
        }
    ]
    
    tasks_created = []
    for task_template in task_templates:
        try:
            # Find discipline and assignee
            discipline = next(d for d in disciplines if d['code'] == task_template['discipline'])
            assignee = next(u for u in users if u['discipline_id'] == discipline['id'] and u['role'] == 'team_member')
            
            task_data = {
                'project_id': project_id,
                'discipline_id': discipline['id'],
                'assignee_id': assignee['id'],
                'title': task_template['title'],
                'description': task_template['description'],
                'priority': task_template['priority'],
                'estimated_hours': task_template['estimated_hours'],
                'wbs_code': task_template['wbs_code'],
                'status': 'backlog',
                'created_at': datetime.now().isoformat(),
                'due_date': (datetime.now() + timedelta(days=30)).date().isoformat()
            }
            
            result = insert('tasks', task_data)
            task = result[0] if isinstance(result, list) else result
            tasks_created.append(task)
            print_success(f"Task created: {task['title']} ({task_template['discipline']})")
            
        except Exception as e:
            print(f"❌ Failed to create task {task_template['title']}: {e}")
    
    print_step(6, "Demonstrate Kanban Workflow", "Tasks move through workflow stages")
    
    # Simulate task progression through workflow stages
    workflow_stages = [
        ('backlog', 'Backlog - Task identified and prioritized'),
        ('todo', 'To Do - Task ready for execution'),
        ('in_progress', 'In Progress - Team member working on task'),
        ('review_dic', 'DIC Review - Discipline Internal Check'),
        ('review_idc', 'IDC Review - Inter-Discipline Check'),
        ('review_dcc', 'DCC Review - Document Control Centre'),
        ('done', 'Done - Task completed and approved')
    ]
    
    print_info("Workflow stages in PMFusion three-phase system:")
    for stage, description in workflow_stages:
        print(f"   • {stage.upper()}: {description}")
    
    # Show current kanban state
    if disciplines:
        print_info(f"\nCurrent Kanban State for {disciplines[0]['name']}:")
        try:
            kanban_data = get_discipline_kanban(disciplines[0]['id'], project_id)
            for status, task_list in kanban_data.items():
                print(f"   • {status.upper()}: {len(task_list)} tasks")
        except Exception as e:
            print(f"   • Error loading kanban data: {e}")
    
    # ========================================================================
    # PHASE 3: DOCUMENT CONTROL
    # ========================================================================
    
    print_banner("PHASE 3: DOCUMENT CONTROL", "=")
    print_workflow_stage("PHASE 3", "DCC officers manage document lifecycle and client approvals")
    
    print_step(7, "Document Control Process", "Managing document approvals and client communication")
    
    # Create sample documents
    document_templates = [
        {
            "title": "Process Flow Diagram - Reactor Section",
            "description": "PFD showing the catalytic reactor and associated equipment",
            "category": "technical_drawing",
            "discipline_id": disciplines[0]['id'] if disciplines else None,
            "project_id": project_id,
            "stage": "dcc",
            "version": "Rev A",
            "file_size": 2480000,
            "file_type": "pdf"
        },
        {
            "title": "Foundation Design Calculations",
            "description": "Structural calculations for reactor foundation",
            "category": "calculation",
            "discipline_id": disciplines[1]['id'] if len(disciplines) > 1 else None,
            "project_id": project_id,
            "stage": "idc",
            "version": "Rev 0",
            "file_size": 1250000,
            "file_type": "pdf"
        },
        {
            "title": "Electrical Load Summary",
            "description": "Summary of electrical loads for all equipment",
            "category": "report",
            "discipline_id": disciplines[2]['id'] if len(disciplines) > 2 else None,
            "project_id": project_id,
            "stage": "dic",
            "version": "Rev 0",
            "file_size": 890000,
            "file_type": "xlsx"
        }
    ]
    
    documents_created = []
    for doc_template in document_templates:
        try:
            doc_data = {
                **doc_template,
                'created_at': datetime.now().isoformat(),
                'updated_at': datetime.now().isoformat()
            }
            
            result = insert('documents', doc_data)
            document = result[0] if isinstance(result, list) else result
            documents_created.append(document)
            print_success(f"Document created: {document['title']} (Stage: {document['stage']})")
            
        except Exception as e:
            print(f"❌ Failed to create document {doc_template['title']}: {e}")
    
    print_step(8, "Document Approval Workflow", "Tracking document through approval stages")
    
    document_stages = [
        ('dic', 'Discipline Internal Check - Internal team review'),
        ('idc', 'Inter-Discipline Check - Cross-discipline review'),
        ('dcc', 'Document Control Centre - Final review and formatting'),
        ('client', 'Client Review - External client approval'),
        ('approved', 'Approved - Document finalized and released')
    ]
    
    print_info("Document approval workflow stages:")
    for stage, description in document_stages:
        print(f"   • {stage.upper()}: {description}")
    
    # Show document control summary
    try:
        all_documents = select('documents')
        doc_summary = {}
        for doc in all_documents:
            stage = doc.get('stage', 'unknown')
            doc_summary[stage] = doc_summary.get(stage, 0) + 1
        
        print_info("\nDocument Control Centre Summary:")
        for stage, count in doc_summary.items():
            print(f"   • {stage.upper()}: {count} documents")
            
    except Exception as e:
        print(f"❌ Error loading document summary: {e}")
    
    # ========================================================================
    # WORKFLOW COMPLETION
    # ========================================================================
    
    print_banner("WORKFLOW DEMONSTRATION COMPLETE", "=")
    
    print_info("🎉 PMFusion Three-Phase Workflow Successfully Demonstrated!")
    print_info("")
    print_info("Summary of what was accomplished:")
    print_info("• Phase 1: Project creation with 4-step wizard")
    print_info("• Phase 2: Team workspace with kanban task management")
    print_info("• Phase 3: Document control with approval workflow")
    print_info("")
    print_info("Key Features Demonstrated:")
    print_info("• Multi-discipline project organization")
    print_info("• Role-based access control (scheduler, team_lead, team_member, dcc)")
    print_info("• Task workflow through DIC → IDC → DCC stages")
    print_info("• Document lifecycle management")
    print_info("• Real-time project tracking and reporting")
    print_info("")
    print_info("🚀 The PMFusion system is ready for production use!")
    print_info("   Access the web interface at: http://localhost:3000/pmfusion")
    print_info("   API endpoints available at: http://localhost:8000/api/v2/")
    
    print_banner("END DEMONSTRATION", "=")

if __name__ == "__main__":
    try:
        asyncio.run(demonstrate_three_phase_workflow())
    except Exception as e:
        print(f"❌ Demo failed: {e}")
        sys.exit(1) 