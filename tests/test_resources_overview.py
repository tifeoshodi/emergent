import os
import sys
import types
import asyncio
import pytest


def load_server(monkeypatch, users_data, tasks_data):
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "testdb")
    sys.modules["document_parser"] = types.ModuleType("document_parser")
    sys.modules["document_parser"].parse_document = lambda *a, **k: None

    # Dummy supabase client modules to avoid import errors
    dummy_supabase = types.ModuleType("supabase_client")
    dummy_supabase.supabase = None
    dummy_supabase.insert = lambda *a, **k: None
    dummy_supabase.select = lambda *a, **k: None
    sys.modules["backend.external_integrations.supabase_client"] = dummy_supabase
    sys.modules["external_integrations.supabase_client"] = dummy_supabase

    class DummyCursor:
        def __init__(self, result=None):
            self._result = result or []

        async def to_list(self, length):
            return self._result

    class DummyCollection:
        def __init__(self, docs=None):
            self.docs = list(docs or [])

        def find(self, query, session=None):
            result = []
            for d in self.docs:
                match = True
                for k, v in query.items():
                    if isinstance(v, dict) and "$ne" in v:
                        if d.get(k) == v["$ne"]:
                            match = False
                            break
                    elif d.get(k) != v:
                        match = False
                        break
                if match:
                    result.append(d)
            return DummyCursor(result)

    class DummyDB:
        def __init__(self):
            self.users = DummyCollection(users_data)
            self.tasks = DummyCollection(tasks_data)

    class DummyClient:
        def __init__(self, db):
            self._db = db

        def __getitem__(self, name):
            return self._db

    # Create dummy motor module used by server for MongoDB
    motor_mod = sys.modules.setdefault("motor", types.ModuleType("motor"))
    motor_asyncio_mod = types.ModuleType("motor.motor_asyncio")
    motor_asyncio_mod.AsyncIOMotorClient = lambda *a, **kw: DummyClient(DummyDB())
    sys.modules["motor.motor_asyncio"] = motor_asyncio_mod
    setattr(motor_mod, "motor_asyncio", motor_asyncio_mod)

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test_resources")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)
    return module


import asyncio


async def call_overview(server, user):
    return await server.get_resources_overview(current_user=user)


def test_invalid_estimated_hours(monkeypatch):
    users = [{"id": "u1", "name": "U1", "role": "eng", "discipline": "eng", "availability": 1.0}]
    tasks = [{"id": "t1", "title": "T1", "assigned_to": "u1", "discipline": "eng", "created_by": "u1", "estimated_hours": "bad"}]
    server = load_server(monkeypatch, users, tasks)
    user = types.SimpleNamespace(id="u1", discipline="eng")
    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(call_overview(server, user))
    assert exc.value.status_code == 400
    assert "estimated_hours" in exc.value.detail


def test_invalid_availability(monkeypatch):
    users = [{"id": "u1", "name": "U1", "role": "eng", "discipline": "eng", "availability": "oops"}]
    tasks = [{"id": "t1", "title": "T1", "assigned_to": "u1", "discipline": "eng", "created_by": "u1", "estimated_hours": 8}]
    server = load_server(monkeypatch, users, tasks)
    user = types.SimpleNamespace(id="u1", discipline="eng")
    with pytest.raises(server.HTTPException) as exc:
        asyncio.run(call_overview(server, user))
    assert exc.value.status_code == 400
    assert "availability" in exc.value.detail
