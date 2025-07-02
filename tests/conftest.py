from datetime import datetime
import pytest
from backend.planning_utils import TaskRecord


@pytest.fixture
def sample_tasks() -> list[TaskRecord]:
    return [
        TaskRecord(
            id="t1",
            project_id="p1",
            title="Design",
            start_date=datetime(2024, 7, 1),
            end_date=datetime(2024, 7, 5),
            priority="high",
        ),
        TaskRecord(
            id="t2",
            project_id="p1",
            title="Build",
            start_date=datetime(2024, 7, 6),
            end_date=datetime(2024, 7, 10),
            priority="critical",
        ),
        TaskRecord(
            id="t3",
            project_id="p1",
            title="Test",
            start_date=datetime(2024, 7, 11),
            end_date=datetime(2024, 7, 15),
            priority="medium",
        ),
        TaskRecord(
            id="t4",
            project_id="p2",
            title="Deploy",
            start_date=datetime(2024, 7, 2),
            end_date=datetime(2024, 7, 6),
            priority="low",
        ),
    ]


@pytest.fixture
def cyclic_dependencies() -> dict[str, list[str]]:
    return {"A": ["B"], "B": ["C"], "C": ["A"]}
