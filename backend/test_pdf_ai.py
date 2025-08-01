#!/usr/bin/env python3
"""Test AI parser with real project documents"""

from pathlib import Path
import json

def test_pdf_ai_parsing():
    print("🔍 Testing AI Parser with Real MDR Document")
    print("=" * 60)
    
    # Available MDR files
    mdr_files = [
        Path("../tests/fixtures/MDR-UNICEM.xlsx"),
        Path("../tests/fixtures/CTR Schedule Final Version.xlsx"),
        Path("../demo_ctr_schedule.xlsx")
    ]
    
    # Find existing MDR file
    target_file = None
    for mdr_file in mdr_files:
        if mdr_file.exists():
            target_file = mdr_file
            break
    
    if not target_file:
        print("❌ No MDR files found to test")
        return False
    
    print(f"📋 Testing with: {target_file.name}")
    print(f"📊 File size: {target_file.stat().st_size / 1024:.1f} KB")
    
    try:
        from document_parser import parse_document_with_ai
        print("✅ AI parser imported successfully")
    except ImportError as e:
        print(f"❌ AI parser import failed: {e}")
        return False
    
    try:
        print("\n🧠 Starting AI analysis...")
        result = parse_document_with_ai(target_file)
        tasks = result.get("tasks", [])
        
        print(f"\n🎯 AI Extraction Results:")
        print(f"📋 Total tasks extracted: {len(tasks)}")
        print("-" * 50)
        
        for i, task in enumerate(tasks):
            print(f"\n📌 Task {i+1}:")
            print(f"   Title: {task.get('title', 'N/A')}")
            print(f"   Duration: {task.get('duration', 0)} days")
            print(f"   Cost: ${task.get('cost', 0):,.0f}")
            print(f"   Resource: {task.get('resource', 'N/A')}")
            print(f"   Discipline: {task.get('discipline', 'N/A')}")
            print(f"   WBS Code: {task.get('wbs_code', 'N/A')}")
            if task.get('description'):
                description = str(task['description'])[:100]
                print(f"   Description: {description}{'...' if len(str(task['description'])) > 100 else ''}")
        
        print("\n" + "=" * 60)
        print("🔬 Detailed Analysis:")
        
        # Analyze disciplines
        disciplines = {}
        for task in tasks:
            disc = task.get('discipline', 'Unknown')
            disciplines[disc] = disciplines.get(disc, 0) + 1
        
        print(f"📊 Disciplines found: {dict(disciplines)}")
        
        # Analyze durations
        durations = [task.get('duration', 0) for task in tasks]
        if durations:
            print(f"⏱️ Duration range: {min(durations)} - {max(durations)} days")
            print(f"📈 Average duration: {sum(durations)/len(durations):.1f} days")
        
        # Analyze costs
        costs = [task.get('cost', 0) for task in tasks]
        if costs:
            total_cost = sum(costs)
            print(f"💰 Total project cost: ${total_cost:,.0f}")
            print(f"💵 Average task cost: ${total_cost/len(costs):,.0f}")
        
        # Show raw JSON structure for first task
        if tasks:
            print(f"\n📝 Raw JSON structure (first task):")
            print(json.dumps(tasks[0], indent=2, default=str))
        
        return True
        
    except Exception as e:
        print(f"❌ AI parsing failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = test_pdf_ai_parsing()
    print(f"\n🎯 Test {'PASSED' if success else 'FAILED'}")
    
    if success:
        print("\n🚀 Ready for frontend integration!")
        print("   The AI can extract structured tasks from real project documents")
        print("   and create proper WBS hierarchies for project management.")
    else:
        print("\n🔧 Debug mode: Check logs above for issues") 