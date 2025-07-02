import os
import sys
import types
import asyncio
import pytest


def load_server(monkeypatch, wbs_data):
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
            self.projects = DummyCollection(find_one_result={"id": "p1"})
            self.wbs = DummyCollection(list_result=wbs_data)

    dummy_db = DummyDB()

    class DummySession:
        async def __aenter__(self):
            return self

        async def __aexit__(self, exc_type, exc, tb):
            pass

        def start_transaction(self):
            class DummyTxn:
                async def __aenter__(self_inner):
                    return self_inner

                async def __aexit__(self_inner, exc_type, exc, tb):
                    pass

            return DummyTxn()

    class DummyClient:
        def __init__(self, _db):
            self._db = _db

        def __getitem__(self, name):
            return self._db

        async def start_session(self):
            return DummySession()

    monkeypatch.setattr(
        "motor.motor_asyncio.AsyncIOMotorClient",
        lambda *a, **kw: DummyClient(dummy_db),
    )

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = f"from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)

    return module


def sample_wbs():
    return [
        {
            "id": "n1",
            "project_id": "p1",
            "task_id": "t1",
            "title": "Task 1",
            "duration_days": 2,
            "predecessors": [],
            "early_start": 0,
            "early_finish": 2,
            "is_critical": True,
        }
    ]


def test_export_invalid_anchor(monkeypatch):
    server = load_server(monkeypatch, sample_wbs())
    user = types.SimpleNamespace(discipline="eng")
    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(
            server.export_project_wbs_cpm(
                "p1", anchor_date="not-a-date", current_user=user
            )
        )
    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid anchor_date format"


def test_export_invalid_working_day(monkeypatch):
    server = load_server(monkeypatch, sample_wbs())
    user = types.SimpleNamespace(discipline="eng")
    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(
            server.export_project_wbs_cpm(
                "p1", working_days="mon,foo", current_user=user
            )
        )
    assert exc.value.status_code == 400
    assert "Invalid working day" in exc.value.detail


def test_export_success(monkeypatch):
    server = load_server(monkeypatch, sample_wbs())
    user = types.SimpleNamespace(discipline="eng")
    result = asyncio.run(server.export_project_wbs_cpm("p1", current_user=user))
    assert result.project_id == "p1"
    assert result.tasks[0].task_id == "t1"
