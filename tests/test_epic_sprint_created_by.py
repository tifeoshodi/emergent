import os
import sys
import types
import asyncio


def load_server(monkeypatch):
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "testdb")
    sys.modules["document_parser"] = types.ModuleType("document_parser")
    sys.modules["document_parser"].parse_document = lambda *a, **k: None

    class DummyCollection:
        def __init__(self, find_one_result=None):
            self.find_one_result = find_one_result
            self.inserted = []

        async def find_one(self, query):
            return self.find_one_result

        async def insert_one(self, doc):
            self.inserted.append(doc)

    class DummyDB:
        def __init__(self):
            self.projects = DummyCollection(find_one_result={"id": "p1"})
            self.epics = DummyCollection()
            self.sprints = DummyCollection()

    dummy_db = DummyDB()

    class DummyClient:
        def __init__(self, db):
            self._db = db

        def __getitem__(self, name):
            return self._db

    monkeypatch.setattr(
        "motor.motor_asyncio.AsyncIOMotorClient", lambda *a, **kw: DummyClient(dummy_db)
    )

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test_epic_sprint")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)

    return module, dummy_db


def test_create_epic_uses_current_user(monkeypatch):
    server, db = load_server(monkeypatch)
    server.Epic.model_rebuild(_types_namespace=server.__dict__)
    server.EpicCreate.model_rebuild(_types_namespace=server.__dict__)
    user = types.SimpleNamespace(id="u1", discipline="eng")
    epic = server.EpicCreate(title="E", description="d", project_id="p1")
    result = asyncio.run(server.create_epic(epic, current_user=user))
    assert result.created_by == "u1"
    assert db.epics.inserted[0]["created_by"] == "u1"


def test_create_sprint_uses_current_user(monkeypatch):
    server, db = load_server(monkeypatch)
    server.Sprint.model_rebuild(_types_namespace=server.__dict__)
    server.SprintCreate.model_rebuild(_types_namespace=server.__dict__)
    user = types.SimpleNamespace(id="u2", discipline="eng")
    sprint = server.SprintCreate(
        name="S",
        description="d",
        project_id="p1",
        start_date=server.datetime.utcnow(),
        end_date=server.datetime.utcnow(),
    )
    result = asyncio.run(server.create_sprint(sprint, current_user=user))
    assert result.created_by == "u2"
    assert db.sprints.inserted[0]["created_by"] == "u2"
