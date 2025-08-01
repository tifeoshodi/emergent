import pytest
from backend.document_parser import parse_ctr_excel

def test_parse_ctr_excel_builds_hierarchical_tasks():
    from pathlib import Path
    sample_excel = Path("tests/fixtures/CTR Schedule Final Version.xlsx")
    result = parse_ctr_excel(sample_excel)
    assert isinstance(result, dict)
    assert 'tasks' in result and isinstance(result['tasks'], list)
    if result['tasks']:
        first_task = result['tasks'][0]
        assert 'task_id' in first_task
        assert 'title' in first_task
        assert 'duration' in first_task
        assert 'cost' in first_task
        assert 'resource' in first_task
