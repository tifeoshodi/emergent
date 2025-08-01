from document_parser import parse_ctr_excel, parse_mdr_excel
from pathlib import Path

print("🧪 Testing Document-Based WBS Creation")
print("=" * 50)

# Test CTR Excel file
ctr_file = Path("../tests/fixtures/CTR Schedule Final Version.xlsx")
print(f"\n📊 Testing CTR Excel: {ctr_file.name}")

try:
    result = parse_ctr_excel(ctr_file)
    tasks = result.get("tasks", [])
    print(f"✅ Found {len(tasks)} tasks in CTR file")
    
    for i, task in enumerate(tasks[:5]):
        title = task.get('title', 'N/A')[:40] + ("..." if len(task.get('title', '')) > 40 else "")
        duration = task.get('duration', 'N/A')
        cost = task.get('cost', 'N/A')
        print(f"  {i+1:2d}. {title} | {duration} days | ${cost}")
    
    if len(tasks) > 5:
        print(f"     ... and {len(tasks) - 5} more tasks")
        
except Exception as e:
    print(f"❌ CTR parsing failed: {e}")

# Test MDR Excel file  
mdr_file = Path("../tests/fixtures/MDR-UNICEM.xlsx")
print(f"\n📋 Testing MDR Excel: {mdr_file.name}")

try:
    result = parse_mdr_excel(mdr_file)
    tasks = result.get("tasks", [])
    print(f"✅ Found {len(tasks)} tasks in MDR file")
    
    for i, task in enumerate(tasks[:5]):
        title = task.get('title', 'N/A')[:40] + ("..." if len(task.get('title', '')) > 40 else "")
        discipline = task.get('discipline', 'N/A')
        due_date = task.get('due_date', 'N/A')
        print(f"  {i+1:2d}. {title} | {discipline} | Due: {due_date}")
    
    if len(tasks) > 5:
        print(f"     ... and {len(tasks) - 5} more tasks")
        
except Exception as e:
    print(f"❌ MDR parsing failed: {e}")

print(f"\n✅ Document parsing tests completed!")
print(f"🎯 Ready for WBS creation testing!") 