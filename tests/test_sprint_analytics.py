import os
import sys
import types
import asyncio
import pytest


def load_server(monkeypatch, sprint_data):
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
            self.sprints = DummyCollection(find_one_result=sprint_data)
            self.tasks = DummyCollection()

    dummy_db = DummyDB()

    class DummyClient:
        def __init__(self, _db):
            self._db = _db

        def __getitem__(self, name):
            return self._db

    monkeypatch.setattr("motor.motor_asyncio.AsyncIOMotorClient", lambda url: DummyClient(dummy_db))

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = f"from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)

    return module


def test_get_sprint_analytics_missing_dates(monkeypatch):
    server = load_server(monkeypatch, {"id": "s1"})

    user = types.SimpleNamespace(discipline="eng")

    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(server.get_sprint_analytics("s1", current_user=user))

    assert exc.value.status_code == 400
    assert exc.value.detail == "Sprint dates are missing"


def test_get_sprint_analytics_invalid_dates(monkeypatch):
    server = load_server(
        monkeypatch,
        {"id": "s2", "start_date": "not-a-date", "end_date": "2024-06-10"},
    )

    user = types.SimpleNamespace(discipline="eng")

    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(server.get_sprint_analytics("s2", current_user=user))

    assert exc.value.status_code == 400
    assert exc.value.detail == "Invalid sprint date format"
