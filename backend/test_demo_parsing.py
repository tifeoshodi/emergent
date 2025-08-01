from document_parser import parse_ctr_excel, parse_mdr_excel
from pathlib import Path

print("🧪 Testing Demo Document Parsing")
print("=" * 50)

# Test our demo CTR file
ctr_file = Path("../demo_ctr_schedule.xlsx")
print(f"\n📊 Testing Demo CTR: {ctr_file.name}")

try:
    result = parse_ctr_excel(ctr_file)
    tasks = result.get("tasks", [])
    print(f"✅ Found {len(tasks)} tasks")
    
    for i, task in enumerate(tasks):
        title = task.get('title', 'N/A')
        duration = task.get('duration', 'N/A')
        cost = task.get('cost', 'N/A')
        print(f"  {i+1:2d}. {title} | {duration} days | ${cost}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Test our demo MDR file  
mdr_file = Path("../demo_mdr_deliverables.xlsx")
print(f"\n📋 Testing Demo MDR: {mdr_file.name}")

try:
    result = parse_mdr_excel(mdr_file)
    tasks = result.get("tasks", [])
    print(f"✅ Found {len(tasks)} tasks")
    
    for i, task in enumerate(tasks):
        title = task.get('title', 'N/A')
        discipline = task.get('discipline', 'N/A')
        due_date = task.get('due_date', 'N/A')
        print(f"  {i+1:2d}. {title} | {discipline} | Due: {due_date}")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()

print(f"\n🎯 Demo parsing test completed!") 