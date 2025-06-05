import logging
from typing import Dict, List, Any, Optional, Tuple, Set
from datetime import datetime, date, timedelta
import uuid
import re

from .models import (
    CTRData, MDRData, Task, Document, WBSElement, WBSStructure,
    TaskType, Discipline
)

# Configure logging
logger = logging.getLogger(__name__)

class WBSGenerator:
    """
    Generates a Work Breakdown Structure (WBS) from CTR and MDR data
    in a style similar to Primavera P6.
    """
    
    def __init__(self, ctr_data: CTRData, mdr_data: Optional[MDRData] = None):
        """
        Initialize the WBS generator with parsed CTR and optional MDR data
        
        Args:
            ctr_data: Parsed CTR data containing tasks, resources, and man-hours
            mdr_data: Optional parsed MDR data containing documents
        """
        self.ctr_data = ctr_data
        self.mdr_data = mdr_data
        self.task_map = {task.id: task for task in ctr_data.tasks}
        self.document_map = {}
        if mdr_data:
            self.document_map = {doc.id: doc for doc in mdr_data.documents}
    
    def generate_wbs(self, project_id: str, name: str, description: Optional[str] = None) -> WBSStructure:
        """
        Generate a complete WBS structure from the provided data
        
        Args:
            project_id: ID of the project
            name: Name of the WBS
            description: Optional description of the WBS
            
        Returns:
            WBSStructure object representing the complete WBS
        """
        # Create a new WBS structure
        wbs = WBSStructure(
            id=str(uuid.uuid4()),
            name=name,
            description=description,
            project_id=project_id,
            elements=[],
            root_element_ids=[],
            created_at=datetime.now(),
            updated_at=datetime.now(),
            metadata={}
        )
        
        # Build the WBS hierarchy
        self._build_wbs_hierarchy(wbs)
        
        # Link documents to WBS elements if MDR data is available
        if self.mdr_data:
            self._link_documents_to_wbs(wbs)
        
        # Calculate WBS metrics (progress, dates, hours)
        self._calculate_wbs_metrics(wbs)
        
        # Generate WBS codes (like 1.2.3)
        self._generate_wbs_codes(wbs)
        
        return wbs
    
    def _build_wbs_hierarchy(self, wbs: WBSStructure) -> None:
        """
        Build the WBS hierarchy based on task parent-child relationships
        
        Args:
            wbs: WBS structure to populate
        """
        # Identify root tasks (no parent or parent not in task list)
        root_tasks = []
        child_tasks = set()
        
        for task in self.ctr_data.tasks:
            if task.parent_id and task.parent_id in self.task_map:
                child_tasks.add(task.id)
            
        for task in self.ctr_data.tasks:
            if task.id not in child_tasks:
                root_tasks.append(task)
        
        # Create WBS elements for root tasks
        for task in root_tasks:
            element = self._create_wbs_element_from_task(task, level=1)
            wbs.elements.append(element)
            wbs.root_element_ids.append(element.id)
            
            # Process children recursively
            self._process_child_tasks(wbs, task.id, element.id, level=2)
    
    def _process_child_tasks(self, wbs: WBSStructure, parent_task_id: str, 
                            parent_element_id: str, level: int) -> None:
        """
        Process child tasks recursively to build the WBS hierarchy
        
        Args:
            wbs: WBS structure to populate
            parent_task_id: ID of the parent task
            parent_element_id: ID of the parent WBS element
            level: Current hierarchy level
        """
        # Find all child tasks
        child_tasks = [task for task in self.ctr_data.tasks if task.parent_id == parent_task_id]
        
        # Sort child tasks by planned start date if available
        child_tasks.sort(key=lambda t: t.planned_start_date or date.max)
        
        # Process each child task
        for task in child_tasks:
            element = self._create_wbs_element_from_task(task, level, parent_element_id)
            wbs.elements.append(element)
            
            # Add child ID to parent element
            parent_element = next(e for e in wbs.elements if e.id == parent_element_id)
            parent_element.children_ids.append(element.id)
            
            # Process children recursively
            self._process_child_tasks(wbs, task.id, element.id, level + 1)
    
    def _create_wbs_element_from_task(self, task: Task, level: int, 
                                     parent_id: Optional[str] = None) -> WBSElement:
        """
        Create a WBS element from a task
        
        Args:
            task: Task to convert to WBS element
            level: Hierarchy level
            parent_id: Optional parent element ID
            
        Returns:
            WBS element created from the task
        """
        # Get approved hours for this task
        approved_hours = 0
        actual_hours = 0
        
        for tr in self.ctr_data.task_resources:
            if tr.task_id == task.id:
                approved_hours += tr.approved_hours
                if tr.actual_hours is not None:
                    actual_hours += tr.actual_hours
        
        # Create WBS element
        return WBSElement(
            id=str(uuid.uuid4()),
            name=task.name,
            code="",  # Will be populated later
            level=level,
            description=task.description,
            parent_id=parent_id,
            children_ids=[],
            task_ids=[task.id],
            document_ids=[],
            weight=approved_hours,  # Use approved hours as weight
            progress=task.progress,
            planned_start_date=task.planned_start_date,
            planned_end_date=task.planned_end_date,
            actual_start_date=task.actual_start_date,
            actual_end_date=task.actual_end_date,
            approved_hours=approved_hours,
            actual_hours=actual_hours,
            discipline=task.discipline,
            metadata={
                "task_type": task.type,
                "task_status": task.status,
                "task_code": task.code
            }
        )
    
    def _link_documents_to_wbs(self, wbs: WBSStructure) -> None:
        """
        Link documents to WBS elements based on matching criteria
        
        Args:
            wbs: WBS structure to update
        """
        if not self.mdr_data or not self.mdr_data.documents:
            return
        
        # Create a mapping of disciplines to WBS elements
        discipline_map: Dict[Optional[Discipline], List[WBSElement]] = {}
        
        for element in wbs.elements:
            if element.discipline:
                if element.discipline not in discipline_map:
                    discipline_map[element.discipline] = []
                discipline_map[element.discipline].append(element)
        
        # Link documents to WBS elements
        for doc in self.mdr_data.documents:
            linked = False
            
            # Try to link by discipline
            if doc.discipline and doc.discipline in discipline_map:
                potential_elements = discipline_map[doc.discipline]
                
                # Find the most specific (highest level) element that matches
                potential_elements.sort(key=lambda e: e.level, reverse=True)
                
                for element in potential_elements:
                    # Check if document title contains task name or vice versa
                    task = self.task_map.get(element.task_ids[0]) if element.task_ids else None
                    
                    if task:
                        # Check for keyword matches between document title and task name
                        doc_words = set(re.findall(r'\w+', doc.title.lower()))
                        task_words = set(re.findall(r'\w+', task.name.lower()))
                        
                        # If there's significant overlap or one contains the other
                        if (len(doc_words.intersection(task_words)) >= 2 or
                            task.name.lower() in doc.title.lower() or
                            doc.title.lower() in task.name.lower()):
                            
                            element.document_ids.append(doc.id)
                            linked = True
                            break
                
                # If not linked by specific match, link to the lowest level element in the discipline
                if not linked and potential_elements:
                    lowest_level_element = min(potential_elements, key=lambda e: e.level)
                    lowest_level_element.document_ids.append(doc.id)
                    linked = True
            
            # If still not linked, try to find a match by keywords
            if not linked:
                for element in wbs.elements:
                    task = self.task_map.get(element.task_ids[0]) if element.task_ids else None
                    if task:
                        # Check for keyword matches
                        doc_words = set(re.findall(r'\w+', doc.title.lower()))
                        task_words = set(re.findall(r'\w+', task.name.lower()))
                        
                        if len(doc_words.intersection(task_words)) >= 2:
                            element.document_ids.append(doc.id)
                            linked = True
                            break
            
            # If still not linked, link to root elements
            if not linked and wbs.root_element_ids:
                # Find the root element with matching discipline if possible
                for root_id in wbs.root_element_ids:
                    root_element = next(e for e in wbs.elements if e.id == root_id)
                    if root_element.discipline == doc.discipline:
                        root_element.document_ids.append(doc.id)
                        linked = True
                        break
                
                # If no discipline match, link to first root
                if not linked:
                    first_root = next(e for e in wbs.elements if e.id == wbs.root_element_ids[0])
                    first_root.document_ids.append(doc.id)
    
    def _calculate_wbs_metrics(self, wbs: WBSStructure) -> None:
        """
        Calculate metrics for WBS elements (progress, dates, hours)
        
        Args:
            wbs: WBS structure to update
        """
        # Create element map for easier access
        element_map = {element.id: element for element in wbs.elements}
        
        # Calculate metrics from bottom up
        for element_id in self._get_bottom_up_element_order(wbs):
            element = element_map[element_id]
            
            # Skip leaf elements (already calculated from tasks)
            if not element.children_ids:
                continue
            
            # Calculate metrics from children
            child_elements = [element_map[child_id] for child_id in element.children_ids]
            
            # Calculate dates
            planned_start_dates = [e.planned_start_date for e in child_elements if e.planned_start_date]
            planned_end_dates = [e.planned_end_date for e in child_elements if e.planned_end_date]
            actual_start_dates = [e.actual_start_date for e in child_elements if e.actual_start_date]
            actual_end_dates = [e.actual_end_date for e in child_elements if e.actual_end_date]
            
            if planned_start_dates:
                element.planned_start_date = min(planned_start_dates)
            if planned_end_dates:
                element.planned_end_date = max(planned_end_dates)
            if actual_start_dates:
                element.actual_start_date = min(actual_start_dates)
            if actual_end_dates and all(e.actual_end_date for e in child_elements if e.planned_end_date):
                element.actual_end_date = max(actual_end_dates)
            
            # Calculate hours
            element.approved_hours = sum(e.approved_hours for e in child_elements)
            element.actual_hours = sum(e.actual_hours for e in child_elements)
            
            # Calculate progress
            if element.approved_hours > 0:
                weighted_progress = sum(e.progress * e.approved_hours for e in child_elements)
                element.progress = weighted_progress / element.approved_hours
            else:
                # If no approved hours, use simple average
                element.progress = sum(e.progress for e in child_elements) / len(child_elements) if child_elements else 0
    
    def _get_bottom_up_element_order(self, wbs: WBSStructure) -> List[str]:
        """
        Get element IDs in bottom-up order for calculation
        
        Args:
            wbs: WBS structure
            
        Returns:
            List of element IDs in bottom-up order
        """
        # Create element map for easier access
        element_map = {element.id: element for element in wbs.elements}
        
        # Track visited elements
        visited = set()
        order = []
        
        def visit(element_id):
            if element_id in visited:
                return
            
            element = element_map[element_id]
            visited.add(element_id)
            
            # Visit children first
            for child_id in element.children_ids:
                visit(child_id)
            
            # Add to order after children
            order.append(element_id)
        
        # Visit all root elements
        for root_id in wbs.root_element_ids:
            visit(root_id)
        
        return order
    
    def _generate_wbs_codes(self, wbs: WBSStructure) -> None:
        """
        Generate WBS codes (like 1.2.3) for all elements
        
        Args:
            wbs: WBS structure to update
        """
        # Create element map for easier access
        element_map = {element.id: element for element in wbs.elements}
        
        # Generate codes for root elements
        for i, root_id in enumerate(wbs.root_element_ids):
            root_code = str(i + 1)
            element_map[root_id].code = root_code
            
            # Generate codes for children recursively
            self._generate_child_codes(wbs, root_id, root_code)
    
    def _generate_child_codes(self, wbs: WBSStructure, parent_id: str, parent_code: str) -> None:
        """
        Generate WBS codes for child elements recursively
        
        Args:
            wbs: WBS structure to update
            parent_id: ID of the parent element
            parent_code: Code of the parent element
        """
        # Create element map for easier access
        element_map = {element.id: element for element in wbs.elements}
        parent = element_map[parent_id]
        
        # Generate codes for children
        for i, child_id in enumerate(parent.children_ids):
            child_code = f"{parent_code}.{i + 1}"
            element_map[child_id].code = child_code
            
            # Generate codes for children recursively
            self._generate_child_codes(wbs, child_id, child_code)


def generate_wbs_from_data(
    ctr_data: CTRData, 
    project_id: str, 
    name: str, 
    description: Optional[str] = None,
    mdr_data: Optional[MDRData] = None,
    options: Optional[Dict[str, Any]] = None
) -> WBSStructure:
    """
    Generate a WBS from CTR and optional MDR data
    
    Args:
        ctr_data: Parsed CTR data
        project_id: ID of the project
        name: Name of the WBS
        description: Optional description of the WBS
        mdr_data: Optional parsed MDR data
        options: Optional configuration options
        
    Returns:
        Generated WBS structure
    """
    generator = WBSGenerator(ctr_data, mdr_data)
    return generator.generate_wbs(project_id, name, description)
