import pytest
from backend.document_parser import parse_document

def test_parse_document_dispatcher_routes_files():
    from pathlib import Path
    sow_pdf = Path("tests/fixtures/2506600-AGAS-SOW-A-0001 RevB SOW UNICEM PRMS Upgrade FEED-Detailed Engineering Design Project.pdf")
    mdr_excel = Path("tests/fixtures/MDR-UNICEM.xlsx")
    ctr_excel = Path("tests/fixtures/CTR Schedule Final Version.xlsx")
    # Stub parser if needed
    sow_result = parse_document(sow_pdf)
    mdr_result = parse_document(mdr_excel)
    ctr_result = parse_document(ctr_excel)
    assert isinstance(sow_result, dict)
    assert isinstance(mdr_result, dict)
    assert isinstance(ctr_result, dict)
    assert 'tasks' in sow_result and isinstance(sow_result['tasks'], list)
    assert 'tasks' in mdr_result and isinstance(mdr_result['tasks'], list)
    assert 'tasks' in ctr_result and isinstance(ctr_result['tasks'], list)
    # Optionally, check at least one task for expected fields
    if sow_result['tasks']:
        assert all('task_id' in t and 'title' in t for t in sow_result['tasks'])
    if mdr_result['tasks']:
        assert all('task_id' in t and 'title' in t for t in mdr_result['tasks'])
    if ctr_result['tasks']:
        assert all('task_id' in t and 'title' in t for t in ctr_result['tasks'])
