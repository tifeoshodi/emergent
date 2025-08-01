import pandas as pd
from pathlib import Path

print("🔍 Examining UNICEM Project Documents")
print("=" * 50)

# Examine CTR Excel file
ctr_file = Path("../tests/fixtures/CTR Schedule Final Version.xlsx")
print(f"\n📊 CTR File: {ctr_file.name}")

try:
    xls = pd.ExcelFile(ctr_file)
    print(f"   Sheets: {xls.sheet_names}")
    
    for sheet_name in xls.sheet_names[:3]:  # First 3 sheets
        print(f"\n   📋 Sheet: {sheet_name}")
        df = pd.read_excel(xls, sheet_name=sheet_name, nrows=10)  # First 10 rows
        
        if df.empty:
            print("      (Empty sheet)")
            continue
            
        print(f"      Columns: {list(df.columns)}")
        print(f"      Rows: {len(df)}")
        
        # Show first few non-empty rows
        non_empty = df.dropna(how='all')
        if not non_empty.empty:
            print(f"      Sample data:")
            for i, (idx, row) in enumerate(non_empty.head(3).iterrows()):
                print(f"        Row {idx}: {dict(row)}")
                
except Exception as e:
    print(f"❌ Error reading CTR: {e}")

# Examine MDR Excel file  
mdr_file = Path("../tests/fixtures/MDR-UNICEM.xlsx")
print(f"\n📋 MDR File: {mdr_file.name}")

try:
    xls = pd.ExcelFile(mdr_file)
    print(f"   Sheets: {xls.sheet_names}")
    
    for sheet_name in xls.sheet_names[:3]:  # First 3 sheets
        print(f"\n   📋 Sheet: {sheet_name}")
        df = pd.read_excel(xls, sheet_name=sheet_name, nrows=10)  # First 10 rows
        
        if df.empty:
            print("      (Empty sheet)")
            continue
            
        print(f"      Columns: {list(df.columns)}")
        print(f"      Rows: {len(df)}")
        
        # Show first few non-empty rows
        non_empty = df.dropna(how='all')
        if not non_empty.empty:
            print(f"      Sample data:")
            for i, (idx, row) in enumerate(non_empty.head(3).iterrows()):
                data_dict = {k: v for k, v in row.items() if pd.notna(v)}
                print(f"        Row {idx}: {data_dict}")
                
except Exception as e:
    print(f"❌ Error reading MDR: {e}")

print(f"\n✅ File examination completed!")
print(f"🎯 This will help us understand the file structure!") 