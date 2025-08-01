#!/usr/bin/env python3
"""Test script for AI parser integration"""

from pathlib import Path
import json

def test_ai_integration():
    print("🧪 Testing AI Document Parser Integration")
    
    try:
        from document_parser import parse_document_with_ai
        print("✅ AI parser import successful")
    except ImportError as e:
        print(f"❌ AI parser import failed: {e}")
        return False
    
    # Test with demo file
    demo_file = Path("demo_ctr_schedule.xlsx")
    if not demo_file.exists():
        print(f"❌ Demo file not found: {demo_file}")
        return False
    
    print(f"📊 Testing with: {demo_file.name}")
    
    try:
        result = parse_document_with_ai(demo_file)
        tasks = result.get("tasks", [])
        print(f"✅ Success! Extracted {len(tasks)} tasks")
        
        for i, task in enumerate(tasks[:3]):
            title = task.get("title", "N/A")
            duration = task.get("duration", 0)
            discipline = task.get("discipline", "N/A")
            cost = task.get("cost", 0)
            print(f"  {i+1}. {title} | {duration} days | {discipline} | ${cost:,.0f}")
        
        if len(tasks) > 3:
            print(f"     ... and {len(tasks) - 3} more tasks")
            
        print("\n📋 Task structure example:")
        if tasks:
            example_task = tasks[0]
            for key, value in example_task.items():
                print(f"  {key}: {value}")
                
        return True
        
    except Exception as e:
        print(f"❌ AI parsing failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_ai_integration()
    print(f"\n🎯 Test {'PASSED' if success else 'FAILED'}") 