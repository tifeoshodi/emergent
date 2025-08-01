import pytest
from backend.document_parser import parse_mdr_excel

def test_parse_mdr_excel_reads_all_sheets_and_maps_rows():
    from pathlib import Path
    sample_excel = Path("tests/fixtures/MDR-UNICEM.xlsx")
    result = parse_mdr_excel(sample_excel)
    assert isinstance(result, dict)
    assert 'tasks' in result and isinstance(result['tasks'], list)
    if result['tasks']:
        first_task = result['tasks'][0]
        assert 'task_id' in first_task
        assert 'title' in first_task
        assert 'discipline' in first_task
        assert 'due_date' in first_task
