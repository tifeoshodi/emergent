import pandas as pd
import numpy as np
import os
import logging
from typing import Dict, List, Any, Tuple, Optional, Union
from datetime import datetime, date
import uuid
from pathlib import Path
from enum import Enum

from .models import (
    CTRData, Task, Resource, TaskResource, TaskType, TaskStatus,
    MDRData, Document, DocumentType, DocumentStatus, Discipline
)

# Configure logging
logger = logging.getLogger(__name__)

class FileType(str, Enum):
    """Types of files that can be parsed"""
    CTR = "CTR"
    MDR = "MDR"
    UNKNOWN = "UNKNOWN"


def detect_file_type(file_path: str) -> FileType:
    """
    Detect if the file is a CTR or MDR file based on content analysis
    
    Args:
        file_path: Path to the file to analyze
        
    Returns:
        FileType enum indicating the detected file type
    """
    try:
        # Read the first few rows to analyze headers
        if file_path.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(file_path, nrows=5)
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path, nrows=5)
        else:
            logger.warning(f"Unsupported file format: {file_path}")
            return FileType.UNKNOWN
        
        # Convert headers to lowercase for case-insensitive matching
        headers = [str(col).lower() for col in df.columns]
        
        # Check for CTR indicators
        ctr_keywords = ['task', 'resource', 'rate', 'man-hour', 'manhour', 'approved hours', 'work']
        ctr_matches = sum(1 for keyword in ctr_keywords if any(keyword in header for header in headers))
        
        # Check for MDR indicators
        mdr_keywords = ['document', 'title', 'code', 'due date', 'discipline', 'revision']
        mdr_matches = sum(1 for keyword in mdr_keywords if any(keyword in header for header in headers))
        
        # Determine file type based on keyword matches
        if ctr_matches > mdr_matches:
            return FileType.CTR
        elif mdr_matches > ctr_matches:
            return FileType.MDR
        else:
            # If equal or no matches, try to make a best guess
            if any('task' in header for header in headers):
                return FileType.CTR
            elif any('document' in header for header in headers):
                return FileType.MDR
            else:
                return FileType.UNKNOWN
                
    except Exception as e:
        logger.error(f"Error detecting file type: {e}")
        return FileType.UNKNOWN


def map_column_names(df: pd.DataFrame, mapping_templates: List[Dict[str, List[str]]]) -> Dict[str, str]:
    """
    Map dataframe columns to standardized names using templates
    
    Args:
        df: Pandas DataFrame with the file data
        mapping_templates: List of dictionaries mapping standard names to possible column names
        
    Returns:
        Dictionary mapping standard column names to actual column names in the dataframe
    """
    column_mapping = {}
    df_columns_lower = [col.lower() for col in df.columns]
    
    for template in mapping_templates:
        for standard_name, possible_names in template.items():
            for possible_name in possible_names:
                matches = [i for i, col in enumerate(df_columns_lower) if possible_name.lower() in col]
                if matches:
                    # Use the first match
                    column_mapping[standard_name] = df.columns[matches[0]]
                    break
    
    return column_mapping


def parse_ctr_file(file_path: str) -> CTRData:
    """
    Parse a CTR (Cost, Task, Resource) file and extract tasks, resources, and man-hours
    
    Args:
        file_path: Path to the CTR file
        
    Returns:
        CTRData object containing parsed information
    """
    try:
        # Read the file based on extension
        if file_path.endswith(('.xlsx', '.xls')):
            # Try to read all sheets
            excel_file = pd.ExcelFile(file_path)
            sheets = excel_file.sheet_names
            
            # Look for specific sheet names
            task_sheet = next((s for s in sheets if 'task' in s.lower()), sheets[0])
            resource_sheet = next((s for s in sheets if 'resource' in s.lower()), 
                               next((s for s in sheets if 'rate' in s.lower()), 
                                   sheets[0] if len(sheets) == 1 else sheets[1]))
            
            tasks_df = pd.read_excel(file_path, sheet_name=task_sheet)
            
            # If resources are in a different sheet
            if resource_sheet != task_sheet:
                resources_df = pd.read_excel(file_path, sheet_name=resource_sheet)
            else:
                # Resources might be in the same sheet as tasks
                resources_df = tasks_df
                
        elif file_path.endswith('.csv'):
            tasks_df = pd.read_csv(file_path)
            resources_df = tasks_df  # Assume resources are in the same file
        else:
            raise ValueError(f"Unsupported file format: {file_path}")
        
        # Define column mapping templates for tasks
        task_mapping_templates = [{
            'task_id': ['task id', 'id', 'task_id', 'task code', 'task_code', 'code'],
            'task_name': ['task name', 'name', 'task_name', 'description', 'activity', 'activity name'],
            'task_type': ['type', 'task type', 'task_type', 'activity type'],
            'task_status': ['status', 'task status', 'task_status', 'activity status'],
            'planned_start': ['planned start', 'start date', 'start', 'plan start', 'planned_start'],
            'planned_end': ['planned end', 'end date', 'end', 'plan end', 'planned_end', 'finish'],
            'actual_start': ['actual start', 'actual_start', 'act start', 'start actual'],
            'actual_end': ['actual end', 'actual_end', 'act end', 'end actual', 'finish actual'],
            'discipline': ['discipline', 'department', 'dept', 'area'],
            'progress': ['progress', 'percent complete', 'completion', '% complete'],
            'parent_id': ['parent', 'parent id', 'parent_id', 'wbs', 'parent task'],
            'predecessors': ['predecessor', 'predecessors', 'pred', 'dependency'],
            'successors': ['successor', 'successors', 'succ']
        }]
        
        # Define column mapping templates for resources
        resource_mapping_templates = [{
            'resource_id': ['resource id', 'id', 'resource_id', 'resource code', 'resource_code'],
            'resource_name': ['resource name', 'name', 'resource_name', 'resource'],
            'resource_type': ['resource type', 'type', 'resource_type', 'category'],
            'rate': ['rate', 'cost rate', 'hourly rate', 'unit rate', 'price'],
            'unit': ['unit', 'unit of measure', 'uom'],
            'discipline': ['discipline', 'department', 'dept', 'area']
        }]
        
        # Define column mapping templates for task-resource assignments
        task_resource_mapping_templates = [{
            'task_id': ['task id', 'task_id', 'activity id', 'activity_id'],
            'resource_id': ['resource id', 'resource_id'],
            'approved_hours': ['approved hours', 'approved_hours', 'planned hours', 'budget hours', 'man-hours', 'manhours'],
            'actual_hours': ['actual hours', 'actual_hours', 'hours', 'used hours'],
            'cost_code': ['cost code', 'cost_code', 'account', 'account code']
        }]
        
        # Map column names
        task_columns = map_column_names(tasks_df, task_mapping_templates)
        resource_columns = map_column_names(resources_df, resource_mapping_templates)
        task_resource_columns = map_column_names(tasks_df, task_resource_mapping_templates)
        
        # Extract tasks
        tasks = []
        for _, row in tasks_df.iterrows():
            try:
                task = Task(
                    id=str(row.get(task_columns.get('task_id'), str(uuid.uuid4()))),
                    name=str(row.get(task_columns.get('task_name'), "Unnamed Task")),
                    code=str(row.get(task_columns.get('task_id'), "")),
                    description=str(row.get(task_columns.get('task_name'), "")),
                    type=parse_task_type(row.get(task_columns.get('task_type'), "")),
                    status=parse_task_status(row.get(task_columns.get('task_status'), "")),
                    planned_start_date=parse_date(row.get(task_columns.get('planned_start'), None)),
                    planned_end_date=parse_date(row.get(task_columns.get('planned_end'), None)),
                    actual_start_date=parse_date(row.get(task_columns.get('actual_start'), None)),
                    actual_end_date=parse_date(row.get(task_columns.get('actual_end'), None)),
                    discipline=parse_discipline(row.get(task_columns.get('discipline'), "")),
                    progress=parse_percentage(row.get(task_columns.get('progress'), 0)),
                    parent_id=str(row.get(task_columns.get('parent_id'), "")) if pd.notna(row.get(task_columns.get('parent_id'), "")) else None,
                    predecessors=parse_id_list(row.get(task_columns.get('predecessors'), "")),
                    successors=parse_id_list(row.get(task_columns.get('successors'), ""))
                )
                tasks.append(task)
            except Exception as e:
                logger.warning(f"Error parsing task row: {e}")
                continue
        
        # Extract resources
        resources = []
        for _, row in resources_df.iterrows():
            try:
                if resource_columns.get('resource_id') or resource_columns.get('resource_name'):
                    resource = Resource(
                        id=str(row.get(resource_columns.get('resource_id'), str(uuid.uuid4()))),
                        name=str(row.get(resource_columns.get('resource_name'), "Unnamed Resource")),
                        code=str(row.get(resource_columns.get('resource_id'), "")),
                        type=str(row.get(resource_columns.get('resource_type'), "Labor")),
                        rate=float(row.get(resource_columns.get('rate'), 0)),
                        unit=str(row.get(resource_columns.get('unit'), "hour")),
                        discipline=parse_discipline(row.get(resource_columns.get('discipline'), ""))
                    )
                    resources.append(resource)
            except Exception as e:
                logger.warning(f"Error parsing resource row: {e}")
                continue
        
        # Extract task-resource assignments
        task_resources = []
        for _, row in tasks_df.iterrows():
            try:
                if (task_resource_columns.get('task_id') and 
                    task_resource_columns.get('approved_hours') and 
                    pd.notna(row.get(task_resource_columns.get('approved_hours'), None))):
                    
                    # If we have a direct task-resource mapping
                    if task_resource_columns.get('resource_id'):
                        task_resource = TaskResource(
                            id=str(uuid.uuid4()),
                            task_id=str(row.get(task_resource_columns.get('task_id'), "")),
                            resource_id=str(row.get(task_resource_columns.get('resource_id'), "")),
                            approved_hours=float(row.get(task_resource_columns.get('approved_hours'), 0)),
                            actual_hours=float(row.get(task_resource_columns.get('actual_hours'), 0)) if pd.notna(row.get(task_resource_columns.get('actual_hours'), None)) else None,
                            cost_code=str(row.get(task_resource_columns.get('cost_code'), "")) if pd.notna(row.get(task_resource_columns.get('cost_code'), "")) else None
                        )
                        task_resources.append(task_resource)
                    # If no direct resource mapping, but we have approved hours, create a generic resource
                    else:
                        # Create a generic resource if we have hours but no resource
                        generic_resource_id = str(uuid.uuid4())
                        resources.append(Resource(
                            id=generic_resource_id,
                            name="Generic Resource",
                            code="GEN",
                            type="Labor",
                            rate=0,
                            unit="hour"
                        ))
                        
                        task_resource = TaskResource(
                            id=str(uuid.uuid4()),
                            task_id=str(row.get(task_resource_columns.get('task_id'), "")),
                            resource_id=generic_resource_id,
                            approved_hours=float(row.get(task_resource_columns.get('approved_hours'), 0)),
                            actual_hours=float(row.get(task_resource_columns.get('actual_hours'), 0)) if pd.notna(row.get(task_resource_columns.get('actual_hours'), None)) else None
                        )
                        task_resources.append(task_resource)
            except Exception as e:
                logger.warning(f"Error parsing task-resource row: {e}")
                continue
        
        # Create metadata
        metadata = {
            "file_name": os.path.basename(file_path),
            "parse_time": datetime.now().isoformat(),
            "total_tasks": len(tasks),
            "total_resources": len(resources),
            "total_task_resources": len(task_resources),
            "column_mappings": {
                "tasks": task_columns,
                "resources": resource_columns,
                "task_resources": task_resource_columns
            }
        }
        
        # Return the parsed data
        return CTRData(
            tasks=tasks,
            resources=resources,
            task_resources=task_resources,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Error parsing CTR file: {e}")
        # Return empty data with error information
        return CTRData(
            metadata={
                "error": str(e),
                "file_name": os.path.basename(file_path),
                "parse_time": datetime.now().isoformat(),
                "status": "error"
            }
        )


def parse_mdr_file(file_path: str) -> MDRData:
    """
    Parse an MDR (Master Document Register) file and extract document information
    
    Args:
        file_path: Path to the MDR file
        
    Returns:
        MDRData object containing parsed information
    """
    try:
        # Read the file based on extension
        if file_path.endswith(('.xlsx', '.xls')):
            # Try to read all sheets
            excel_file = pd.ExcelFile(file_path)
            sheets = excel_file.sheet_names
            
            # Look for specific sheet names or use the first one
            doc_sheet = next((s for s in sheets if any(keyword in s.lower() for keyword in 
                                                    ['document', 'doc', 'mdr', 'register'])), sheets[0])
            
            df = pd.read_excel(file_path, sheet_name=doc_sheet)
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_path}")
        
        # Define column mapping templates for documents
        doc_mapping_templates = [{
            'doc_id': ['document id', 'doc id', 'id', 'document_id', 'doc_id', 'document number', 'doc number', 'doc no', 'document no'],
            'doc_code': ['document code', 'doc code', 'code', 'document_code', 'doc_code', 'document ref', 'reference'],
            'title': ['title', 'document title', 'doc title', 'name', 'description'],
            'doc_type': ['document type', 'doc type', 'type', 'document_type', 'doc_type', 'category'],
            'discipline': ['discipline', 'department', 'dept', 'area', 'responsible discipline'],
            'revision': ['revision', 'rev', 'version'],
            'status': ['status', 'document status', 'doc status'],
            'issue_date': ['issue date', 'issued date', 'date issued', 'issue_date', 'issued'],
            'due_date': ['due date', 'target date', 'deadline', 'due_date', 'required date', 'required by'],
            'responsible_person': ['responsible person', 'responsible', 'owner', 'document owner', 'responsible_person'],
            'review_by': ['review by', 'reviewer', 'reviewed by', 'review_by'],
            'approve_by': ['approve by', 'approver', 'approved by', 'approve_by']
        }]
        
        # Map column names
        doc_columns = map_column_names(df, doc_mapping_templates)
        
        # Extract documents
        documents = []
        for _, row in df.iterrows():
            try:
                # Skip empty rows
                if pd.isna(row.get(doc_columns.get('doc_id', ''), '')) and pd.isna(row.get(doc_columns.get('title', ''), '')):
                    continue
                    
                document = Document(
                    id=str(uuid.uuid4()),
                    title=str(row.get(doc_columns.get('title', ''), "Untitled Document")),
                    code=str(row.get(doc_columns.get('doc_code', ''), row.get(doc_columns.get('doc_id', ''), ""))),
                    document_type=parse_document_type(row.get(doc_columns.get('doc_type', ''), "")),
                    discipline=parse_discipline(row.get(doc_columns.get('discipline', ''), "")),
                    revision=str(row.get(doc_columns.get('revision', ''), "A")),
                    status=parse_document_status(row.get(doc_columns.get('status', ''), "")),
                    issue_date=parse_date(row.get(doc_columns.get('issue_date', ''), None)),
                    due_date=parse_date(row.get(doc_columns.get('due_date', ''), None)),
                    responsible_person=str(row.get(doc_columns.get('responsible_person', ''), "")) if pd.notna(row.get(doc_columns.get('responsible_person', ''), "")) else None,
                    review_by=str(row.get(doc_columns.get('review_by', ''), "")) if pd.notna(row.get(doc_columns.get('review_by', ''), "")) else None,
                    approve_by=str(row.get(doc_columns.get('approve_by', ''), "")) if pd.notna(row.get(doc_columns.get('approve_by', ''), "")) else None,
                    remarks=str(row.get('remarks', row.get('comments', ""))) if pd.notna(row.get('remarks', row.get('comments', ""))) else None
                )
                documents.append(document)
            except Exception as e:
                logger.warning(f"Error parsing document row: {e}")
                continue
        
        # Create metadata
        metadata = {
            "file_name": os.path.basename(file_path),
            "parse_time": datetime.now().isoformat(),
            "total_documents": len(documents),
            "column_mappings": {
                "documents": doc_columns
            }
        }
        
        # Return the parsed data
        return MDRData(
            documents=documents,
            metadata=metadata
        )
        
    except Exception as e:
        logger.error(f"Error parsing MDR file: {e}")
        # Return empty data with error information
        return MDRData(
            metadata={
                "error": str(e),
                "file_name": os.path.basename(file_path),
                "parse_time": datetime.now().isoformat(),
                "status": "error"
            }
        )


def parse_file(file_path: str) -> Union[CTRData, MDRData]:
    """
    Parse a file and return the appropriate data structure based on file type
    
    Args:
        file_path: Path to the file to parse
        
    Returns:
        Either CTRData or MDRData depending on the detected file type
    """
    file_type = detect_file_type(file_path)
    
    if file_type == FileType.CTR:
        return parse_ctr_file(file_path)
    elif file_type == FileType.MDR:
        return parse_mdr_file(file_path)
    else:
        raise ValueError(f"Unable to determine file type for {file_path}")


# Helper functions for parsing specific data types

def parse_date(value: Any) -> Optional[date]:
    """Parse a date value from various formats"""
    if pd.isna(value) or value is None:
        return None
    
    try:
        if isinstance(value, (datetime, date)):
            return value.date() if isinstance(value, datetime) else value
        elif isinstance(value, str):
            # Try multiple date formats
            for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y', '%d-%m-%Y', '%m-%d-%Y', '%d.%m.%Y', '%m.%d.%Y'):
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
            # If no format works, try pandas to_datetime
            return pd.to_datetime(value).date()
        else:
            # Try to convert Excel serial date
            return pd.to_datetime(value).date()
    except Exception as e:
        logger.warning(f"Error parsing date '{value}': {e}")
        return None


def parse_percentage(value: Any) -> float:
    """Parse a percentage value"""
    if pd.isna(value):
        return 0.0
    
    try:
        if isinstance(value, str):
            # Remove % sign if present
            value = value.replace('%', '')
        
        value = float(value)
        
        # If value is between 0 and 1, assume it's a decimal percentage
        if 0 <= value <= 1:
            return value * 100
        # If value is greater than 100, cap it at 100
        elif value > 100:
            return 100.0
        else:
            return value
    except Exception as e:
        logger.warning(f"Error parsing percentage '{value}': {e}")
        return 0.0


def parse_id_list(value: Any) -> List[str]:
    """Parse a list of IDs from a string"""
    if pd.isna(value) or not value:
        return []
    
    try:
        if isinstance(value, str):
            # Split by common delimiters
            for delimiter in (',', ';', ' ', '+', '|'):
                if delimiter in value:
                    return [item.strip() for item in value.split(delimiter) if item.strip()]
            # If no delimiter found, treat as single ID
            return [value.strip()]
        elif isinstance(value, (list, tuple)):
            return [str(item).strip() for item in value if str(item).strip()]
        else:
            return [str(value).strip()]
    except Exception as e:
        logger.warning(f"Error parsing ID list '{value}': {e}")
        return []


def parse_task_type(value: Any) -> TaskType:
    """Parse task type from string"""
    if pd.isna(value) or not value:
        return TaskType.TASK
    
    value_str = str(value).upper()
    
    if "MILESTONE" in value_str:
        return TaskType.MILESTONE
    elif "SUMMARY" in value_str:
        return TaskType.SUMMARY
    elif "HAMMOCK" in value_str:
        return TaskType.HAMMOCK
    elif "LEVEL OF EFFORT" in value_str or "LOE" in value_str:
        return TaskType.LEVEL_OF_EFFORT
    else:
        return TaskType.TASK


def parse_task_status(value: Any) -> TaskStatus:
    """Parse task status from string"""
    if pd.isna(value) or not value:
        return TaskStatus.NOT_STARTED
    
    value_str = str(value).upper()
    
    if any(keyword in value_str for keyword in ["COMPLETE", "FINISHED", "DONE"]):
        return TaskStatus.COMPLETED
    elif any(keyword in value_str for keyword in ["PROGRESS", "ONGOING", "STARTED"]):
        return TaskStatus.IN_PROGRESS
    elif any(keyword in value_str for keyword in ["HOLD", "SUSPENDED", "PAUSED"]):
        return TaskStatus.ON_HOLD
    elif any(keyword in value_str for keyword in ["CANCEL", "TERMINATED", "ABANDONED"]):
        return TaskStatus.CANCELLED
    else:
        return TaskStatus.NOT_STARTED


def parse_discipline(value: Any) -> Optional[Discipline]:
    """Parse discipline from string"""
    if pd.isna(value) or not value:
        return None
    
    value_str = str(value).upper()
    
    discipline_keywords = {
        Discipline.PROCESS: ["PROCESS"],
        Discipline.MECHANICAL: ["MECHANICAL", "MECH"],
        Discipline.PIPING: ["PIPING", "PIPE"],
        Discipline.ELECTRICAL: ["ELECTRICAL", "ELEC"],
        Discipline.INSTRUMENTATION: ["INSTRUMENTATION", "INSTRUMENT", "I&C", "INST"],
        Discipline.CIVIL: ["CIVIL", "CIV"],
        Discipline.STRUCTURAL: ["STRUCTURAL", "STRUCT"],
        Discipline.HVAC: ["HVAC", "HEATING", "VENTILATION", "AIR CONDITIONING"],
        Discipline.ARCHITECTURE: ["ARCHITECTURE", "ARCH", "ARCHITECTURAL"],
        Discipline.HSE: ["HSE", "HEALTH", "SAFETY", "ENVIRONMENT"],
        Discipline.PROCUREMENT: ["PROCUREMENT", "PROC", "PURCHASING"],
        Discipline.CONSTRUCTION: ["CONSTRUCTION", "CONST"],
        Discipline.COMMISSIONING: ["COMMISSIONING", "COMM"],
        Discipline.PROJECT_MANAGEMENT: ["PROJECT MANAGEMENT", "PM", "PROJECT", "MANAGEMENT"],
        Discipline.QUALITY: ["QUALITY", "QA", "QC", "QUALITY ASSURANCE"]
    }
    
    for discipline, keywords in discipline_keywords.items():
        if any(keyword in value_str for keyword in keywords):
            return discipline
    
    return Discipline.OTHER


def parse_document_type(value: Any) -> DocumentType:
    """Parse document type from string"""
    if pd.isna(value) or not value:
        return DocumentType.OTHER
    
    value_str = str(value).upper()
    
    doc_type_keywords = {
        DocumentType.DRAWING: ["DRAWING", "DWG", "SKETCH"],
        DocumentType.SPECIFICATION: ["SPECIFICATION", "SPEC"],
        DocumentType.PROCEDURE: ["PROCEDURE", "PROC"],
        DocumentType.REPORT: ["REPORT", "RPT"],
        DocumentType.CALCULATION: ["CALCULATION", "CALC"],
        DocumentType.DATA_SHEET: ["DATA SHEET", "DATASHEET"],
        DocumentType.MANUAL: ["MANUAL", "MAN"],
        DocumentType.LIST: ["LIST", "LISTING", "SCHEDULE"]
    }
    
    for doc_type, keywords in doc_type_keywords.items():
        if any(keyword in value_str for keyword in keywords):
            return doc_type
    
    return DocumentType.OTHER


def parse_document_status(value: Any) -> DocumentStatus:
    """Parse document status from string"""
    if pd.isna(value) or not value:
        return DocumentStatus.DRAFT
    
    value_str = str(value).upper()
    
    if "DRAFT" in value_str:
        return DocumentStatus.DRAFT
    elif any(keyword in value_str for keyword in ["REVIEW", "FOR REVIEW", "IFR"]):
        return DocumentStatus.ISSUED_FOR_REVIEW
    elif any(keyword in value_str for keyword in ["APPROVAL", "FOR APPROVAL", "IFA"]):
        return DocumentStatus.ISSUED_FOR_APPROVAL
    elif "APPROVED" in value_str:
        return DocumentStatus.APPROVED
    elif any(keyword in value_str for keyword in ["CONSTRUCTION", "FOR CONSTRUCTION", "IFC"]):
        return DocumentStatus.ISSUED_FOR_CONSTRUCTION
    elif any(keyword in value_str for keyword in ["AS BUILT", "AS-BUILT"]):
        return DocumentStatus.AS_BUILT
    else:
        return DocumentStatus.DRAFT
