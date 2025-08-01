#!/usr/bin/env python3
"""
Script to create a demo MDR Excel file for testing the PMFusion workflow.
This creates a realistic Master Document Register for an Oil Refinery Upgrade project.
"""

import pandas as pd
from datetime import datetime, timedelta
import random

def create_demo_mdr_excel():
    """Create a comprehensive demo MDR Excel file"""
    
    # Define the data structure
    mdr_data = []
    
    # Project Management Documents
    project_docs = [
        ("PRJ-001", "Project Execution Plan", "Project Management", "In Progress", "2024-02-15", "High", "Rev-1", "John Smith", "Overall project execution strategy and timeline"),
        ("PRJ-002", "Risk Assessment Matrix", "Project Management", "Not Started", "2024-02-20", "High", "Rev-0", "John Smith", "Comprehensive project risk analysis"),
        ("PRJ-003", "Quality Assurance Plan", "Project Management", "Under Review", "2024-02-10", "Medium", "Rev-1", "John Smith", "QA procedures and standards"),
        ("PRJ-004", "Project Schedule", "Project Management", "Completed", "2024-01-25", "High", "Rev-2", "John Smith", "Master project timeline and milestones"),
        ("PRJ-005", "Communications Plan", "Project Management", "In Progress", "2024-02-12", "Low", "Rev-1", "John Smith", "Stakeholder communication strategy"),
    ]
    
    # Safety Documents
    safety_docs = [
        ("SAF-001", "HSE Management Plan", "Safety", "Approved", "2024-01-30", "High", "Rev-2", "Sarah Wilson", "Health Safety and Environment procedures"),
        ("SAF-002", "HAZOP Study Report", "Safety", "Under Review", "2024-02-18", "High", "Rev-1", "Sarah Wilson", "Hazard and operability analysis"),
        ("SAF-003", "Emergency Response Plan", "Safety", "In Progress", "2024-02-25", "High", "Rev-1", "Sarah Wilson", "Emergency procedures and evacuation plans"),
        ("SAF-004", "Fire Protection Design", "Safety", "Not Started", "2024-03-01", "High", "Rev-0", "Sarah Wilson", "Fire detection and suppression systems"),
    ]
    
    # Process Documents
    process_docs = [
        ("PRC-001", "Process Flow Diagram", "Process", "In Progress", "2024-02-25", "High", "Rev-1", "Mike Johnson", "Main process flow for distillation unit"),
        ("PRC-002", "Heat and Material Balance", "Process", "Not Started", "2024-03-01", "High", "Rev-0", "Mike Johnson", "Thermal and mass balance calculations"),
        ("PRC-003", "Process Control Philosophy", "Process", "In Progress", "2024-02-28", "Medium", "Rev-1", "Mike Johnson", "Control system design principles"),
        ("PRC-004", "Utility Requirements", "Process", "Under Review", "2024-02-18", "Medium", "Rev-1", "Mike Johnson", "Steam electricity and cooling water needs"),
        ("PRC-005", "Operating Manual", "Process", "Not Started", "2024-03-10", "Medium", "Rev-0", "Mike Johnson", "Detailed operating procedures"),
    ]
    
    # Piping Documents
    piping_docs = [
        ("PIP-001", "Piping and Instrumentation Diagram", "Piping", "In Progress", "2024-03-05", "High", "Rev-1", "David Brown", "P&ID for distillation section"),
        ("PIP-002", "Pipe Stress Analysis", "Piping", "Not Started", "2024-03-10", "High", "Rev-0", "David Brown", "Stress analysis for high temperature lines"),
        ("PIP-003", "Piping Material Specification", "Piping", "Under Review", "2024-02-22", "Medium", "Rev-1", "David Brown", "Material specs for all piping systems"),
        ("PIP-004", "Isometric Drawings", "Piping", "Not Started", "2024-03-15", "Medium", "Rev-0", "David Brown", "3D piping layout drawings"),
        ("PIP-005", "Piping Support Design", "Piping", "In Progress", "2024-03-08", "Medium", "Rev-1", "David Brown", "Structural supports for piping systems"),
    ]
    
    # Instrumentation Documents
    instrumentation_docs = [
        ("INS-001", "Instrument Index", "Instrumentation", "In Progress", "2024-02-26", "High", "Rev-1", "Lisa Chen", "Complete list of all instruments"),
        ("INS-002", "Control System Architecture", "Instrumentation", "Not Started", "2024-03-02", "High", "Rev-0", "Lisa Chen", "DCS and safety system design"),
        ("INS-003", "Instrument Data Sheets", "Instrumentation", "In Progress", "2024-02-29", "Medium", "Rev-1", "Lisa Chen", "Detailed specs for all instruments"),
        ("INS-004", "Loop Diagrams", "Instrumentation", "Not Started", "2024-03-08", "Medium", "Rev-0", "Lisa Chen", "Control loop wiring diagrams"),
        ("INS-005", "Safety Instrumented System", "Instrumentation", "Under Review", "2024-02-20", "High", "Rev-1", "Lisa Chen", "SIS design and implementation"),
    ]
    
    # Electrical Documents
    electrical_docs = [
        ("ELE-001", "Electrical Load List", "Electrical", "In Progress", "2024-02-24", "High", "Rev-1", "Robert Taylor", "Power requirements for all equipment"),
        ("ELE-002", "Single Line Diagram", "Electrical", "Not Started", "2024-03-03", "High", "Rev-0", "Robert Taylor", "Main electrical distribution diagram"),
        ("ELE-003", "Motor Control Center Layout", "Electrical", "Under Review", "2024-02-27", "Medium", "Rev-1", "Robert Taylor", "MCC arrangement and specifications"),
        ("ELE-004", "Cable Schedule", "Electrical", "Not Started", "2024-03-12", "Medium", "Rev-0", "Robert Taylor", "Complete cable routing schedule"),
        ("ELE-005", "Grounding System Design", "Electrical", "In Progress", "2024-03-05", "High", "Rev-1", "Robert Taylor", "Plant grounding and lightning protection"),
    ]
    
    # Structural Documents
    structural_docs = [
        ("STR-001", "Structural Steel Drawings", "Structural", "In Progress", "2024-03-06", "High", "Rev-1", "James Wilson", "Steel structure for equipment support"),
        ("STR-002", "Foundation Design", "Structural", "Not Started", "2024-03-11", "High", "Rev-0", "James Wilson", "Concrete foundations for all equipment"),
        ("STR-003", "Wind Load Analysis", "Structural", "Under Review", "2024-02-23", "Medium", "Rev-1", "James Wilson", "Wind loading calculations for structures"),
        ("STR-004", "Seismic Analysis", "Structural", "Not Started", "2024-03-13", "Medium", "Rev-0", "James Wilson", "Earthquake resistance analysis"),
    ]
    
    # Civil Documents
    civil_docs = [
        ("CIV-001", "Site Plan", "Civil", "Approved", "2024-01-25", "High", "Rev-2", "Emma Davis", "Overall site layout and access roads"),
        ("CIV-002", "Grading and Drainage Plan", "Civil", "In Progress", "2024-02-21", "Medium", "Rev-1", "Emma Davis", "Surface water management system"),
        ("CIV-003", "Utility Routing Plan", "Civil", "Under Review", "2024-02-19", "Medium", "Rev-1", "Emma Davis", "Underground utility corridor layout"),
        ("CIV-004", "Paving and Roads Design", "Civil", "Not Started", "2024-03-07", "Low", "Rev-0", "Emma Davis", "Internal road system design"),
    ]
    
    # Mechanical Documents
    mechanical_docs = [
        ("MEC-001", "Equipment List", "Mechanical", "In Progress", "2024-02-16", "High", "Rev-1", "Tom Anderson", "Complete mechanical equipment inventory"),
        ("MEC-002", "Pump Data Sheets", "Mechanical", "Under Review", "2024-02-28", "High", "Rev-1", "Tom Anderson", "Specifications for all process pumps"),
        ("MEC-003", "Heat Exchanger Design", "Mechanical", "In Progress", "2024-03-04", "High", "Rev-1", "Tom Anderson", "Shell and tube heat exchanger specs"),
        ("MEC-004", "Compressor Specifications", "Mechanical", "Not Started", "2024-03-09", "Medium", "Rev-0", "Tom Anderson", "Process gas compressor requirements"),
        ("MEC-005", "Vessel Design Calculations", "Mechanical", "Under Review", "2024-02-26", "High", "Rev-1", "Tom Anderson", "Pressure vessel design and analysis"),
    ]
    
    # Environmental Documents
    environmental_docs = [
        ("ENV-001", "Environmental Impact Assessment", "Environmental", "Approved", "2024-01-20", "High", "Rev-1", "Rachel Green", "Environmental compliance documentation"),
        ("ENV-002", "Air Emissions Permit", "Environmental", "Under Review", "2024-02-17", "High", "Rev-1", "Rachel Green", "Air quality permit application"),
        ("ENV-003", "Waste Management Plan", "Environmental", "In Progress", "2024-02-25", "Medium", "Rev-1", "Rachel Green", "Solid and liquid waste disposal"),
        ("ENV-004", "Noise Impact Study", "Environmental", "Not Started", "2024-03-14", "Low", "Rev-0", "Rachel Green", "Community noise level assessment"),
    ]
    
    # Combine all documents
    all_docs = (project_docs + safety_docs + process_docs + piping_docs + 
               instrumentation_docs + electrical_docs + structural_docs + 
               civil_docs + mechanical_docs + environmental_docs)
    
    # Convert to DataFrame
    columns = ['Doc Number', 'DOC Title', 'Category', 'Status', 'Due Date', 
              'Priority', 'Revision', 'Responsible Engineer', 'Description']
    
    df = pd.DataFrame(all_docs, columns=columns)
    
    # Convert Due Date to proper datetime format
    df['Due Date'] = pd.to_datetime(df['Due Date'])
    
    # Add some additional metadata columns
    df['Created Date'] = '2024-01-15'
    df['Last Updated'] = '2024-02-01'
    df['Client'] = 'XYZ Oil Corporation'
    df['Project Phase'] = 'Detailed Design'
    
    # Create the Excel file with multiple sheets
    with pd.ExcelWriter('Demo_MDR_Oil_Refinery_Project.xlsx', engine='openpyxl') as writer:
        # Main MDR sheet
        df.to_excel(writer, sheet_name='Master Document Register', index=False)
        
        # Summary sheet by discipline
        summary_df = df.groupby('Category').agg({
            'Doc Number': 'count',
            'Status': lambda x: x.value_counts().to_dict()
        }).rename(columns={'Doc Number': 'Total Documents'})
        
        # Create a flattened summary for better Excel compatibility
        summary_data = []
        for discipline in df['Category'].unique():
            discipline_docs = df[df['Category'] == discipline]
            total = len(discipline_docs)
            status_counts = discipline_docs['Status'].value_counts()
            
            summary_data.append({
                'Discipline': discipline,
                'Total Documents': total,
                'Not Started': status_counts.get('Not Started', 0),
                'In Progress': status_counts.get('In Progress', 0),
                'Under Review': status_counts.get('Under Review', 0),
                'Approved': status_counts.get('Approved', 0),
                'Completed': status_counts.get('Completed', 0)
            })
        
        summary_df_final = pd.DataFrame(summary_data)
        summary_df_final.to_excel(writer, sheet_name='Summary by Discipline', index=False)
        
        # Project info sheet
        project_info = pd.DataFrame({
            'Attribute': ['Project Name', 'Client', 'Project Manager', 'Start Date', 'Planned Completion', 'Total Documents'],
            'Value': ['Oil Refinery Upgrade Phase 1', 'XYZ Oil Corporation', 'John Smith', '2024-01-15', '2024-06-30', len(df)]
        })
        project_info.to_excel(writer, sheet_name='Project Information', index=False)
    
    print(f"✅ Demo MDR Excel file created: Demo_MDR_Oil_Refinery_Project.xlsx")
    print(f"📊 Total documents: {len(df)}")
    print(f"🏗️ Disciplines covered: {len(df['Category'].unique())}")
    print(f"📋 Document status distribution:")
    for status, count in df['Status'].value_counts().items():
        print(f"   • {status}: {count} documents")

if __name__ == "__main__":
    create_demo_mdr_excel()