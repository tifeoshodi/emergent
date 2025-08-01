import pytest
from backend.document_parser import parse_sow_pdf

def test_parse_sow_pdf_sections_and_tasks():
    from pathlib import Path
    sample_pdf = Path("tests/fixtures/2506600-AGAS-SOW-A-0001 RevB SOW UNICEM PRMS Upgrade FEED-Detailed Engineering Design Project.pdf")
    result = parse_sow_pdf(sample_pdf)
    assert isinstance(result, dict)
    assert 'tasks' in result and isinstance(result['tasks'], list)
    if result['tasks']:
        first_task = result['tasks'][0]
        assert 'task_id' in first_task
        assert 'title' in first_task
        assert 'discipline' in first_task
        assert 'description' in first_task
