#!/usr/bin/env python3
"""
Test script for document-based WBS creation functionality
"""

import sys
import os
from pathlib import Path

# Add backend to Python path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

def test_document_parsing():
    """Test the document parsing functionality"""
    
    # Import the document parser
    try:
        from document_parser import parse_document, parse_ctr_excel, parse_mdr_excel
        print("✅ Successfully imported document parsing modules")
    except ImportError as e:
        print(f"❌ Failed to import document parsing modules: {e}")
        return False
    
    # Test with CTR Excel file
    ctr_file = Path("tests/fixtures/CTR Schedule Final Version.xlsx")
    if ctr_file.exists():
        print(f"\n📊 Testing CTR Excel parsing: {ctr_file.name}")
        try:
            result = parse_ctr_excel(ctr_file)
            tasks = result.get("tasks", [])
            print(f"✅ Successfully parsed CTR file")
            print(f"📋 Found {len(tasks)} tasks")
            
            # Show first few tasks
            for i, task in enumerate(tasks[:3]):
                print(f"   Task {i+1}: {task.get('title', 'N/A')} ({task.get('duration', 'N/A')} days)")
            
            if len(tasks) > 3:
                print(f"   ... and {len(tasks) - 3} more tasks")
                
        except Exception as e:
            print(f"❌ CTR parsing failed: {e}")
    else:
        print(f"❌ CTR file not found: {ctr_file}")
    
    # Test with MDR Excel file  
    mdr_file = Path("tests/fixtures/MDR-UNICEM.xlsx")
    if mdr_file.exists():
        print(f"\n📋 Testing MDR Excel parsing: {mdr_file.name}")
        try:
            result = parse_mdr_excel(mdr_file)
            tasks = result.get("tasks", [])
            print(f"✅ Successfully parsed MDR file")
            print(f"📋 Found {len(tasks)} tasks")
            
            # Show first few tasks
            for i, task in enumerate(tasks[:3]):
                title = task.get('title', 'N/A')[:50] + ("..." if len(task.get('title', '')) > 50 else "")
                print(f"   Task {i+1}: {title} - {task.get('discipline', 'N/A')}")
            
            if len(tasks) > 3:
                print(f"   ... and {len(tasks) - 3} more tasks")
                
        except Exception as e:
            print(f"❌ MDR parsing failed: {e}")
    else:
        print(f"❌ MDR file not found: {mdr_file}")
    
    # Test the main dispatcher
    print(f"\n🎯 Testing main document dispatcher")
    try:
        result = parse_document(ctr_file)
        tasks = result.get("tasks", [])
        print(f"✅ Main dispatcher successfully parsed CTR file")
        print(f"📋 Dispatcher found {len(tasks)} tasks")
    except Exception as e:
        print(f"❌ Main dispatcher failed: {e}")
    
    return True

if __name__ == "__main__":
    print("🧪 Testing Document-Based WBS Creation")
    print("=" * 50)
    
    success = test_document_parsing()
    
    if success:
        print("\n✅ Document parsing tests completed!")
        print("\n🎯 Next steps: Test API integration and WBS node creation")
    else:
        print("\n❌ Document parsing tests failed!") 