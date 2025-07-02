import os
import sys
import types
import asyncio
from datetime import datetime
import pytest


def load_server(monkeypatch, tasks_data, project_exists=True):
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "testdb")
    sys.modules["document_parser"] = types.ModuleType("document_parser")
    sys.modules["document_parser"].parse_document = lambda *a, **k: None

    class DummyCursor:
        def __init__(self, result=None):
            self._result = result or []

        async def to_list(self, length):
            return self._result

    class DummyCollection:
        def __init__(self, find_one_result=None, list_result=None):
            self.find_one_result = find_one_result
            self.list_result = list_result or []

        async def find_one(self, query):
            return self.find_one_result

        def find(self, query):
            return DummyCursor(self.list_result)

    class DummyDB:
        def __init__(self):
            self.projects = DummyCollection(find_one_result={"id": "p1"} if project_exists else None)
            self.tasks = DummyCollection(list_result=tasks_data)

    class DummyClient:
        def __init__(self, _db):
            self._db = _db

        def __getitem__(self, name):
            return self._db

    monkeypatch.setattr(
        "motor.motor_asyncio.AsyncIOMotorClient",
        lambda *a, **kw: DummyClient(DummyDB()),
    )

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test_deps")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)
    return module


def sample_tasks():
    return [
        {
            "id": "t1",
            "title": "ENG-001",
            "start_date": datetime(2024, 1, 1),
            "end_date": datetime(2024, 1, 3),
            "discipline": "eng",
            "project_id": "p1",
        },
        {
            "id": "t2",
            "title": "ENG-002",
            "start_date": datetime(2024, 1, 4),
            "end_date": datetime(2024, 1, 5),
            "discipline": "eng",
            "project_id": "p1",
        },
    ]


def test_dependency_suggestions_success(monkeypatch):
    server = load_server(monkeypatch, sample_tasks())
    user = types.SimpleNamespace(discipline="eng")
    result = asyncio.run(server.get_dependency_suggestions("p1", current_user=user))
    assert isinstance(result, list)
    assert result
    assert result[0].from_task == "t1"
    assert result[0].to_task == "t2"


def test_dependency_suggestions_project_missing(monkeypatch):
    server = load_server(monkeypatch, sample_tasks(), project_exists=False)
    user = types.SimpleNamespace(discipline="eng")
    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(server.get_dependency_suggestions("p1", current_user=user))
    assert exc.value.status_code == 404
