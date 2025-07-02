import os
import sys
import types
import asyncio
import pytest


def load_server(monkeypatch, tasks_data):
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
            self.inserted = []
            self.deleted = []

        async def find_one(self, query, session=None):
            return self.find_one_result

        def find(self, query, session=None):
            return DummyCursor(self.list_result)

        async def insert_one(self, doc, session=None):
            self.inserted.append(doc)
            return types.SimpleNamespace(inserted_id=doc.get("id"))

        async def delete_many(self, filt, session=None):
            self.deleted.append(filt)

    class DummyDB:
        def __init__(self):
            self.projects = DummyCollection(find_one_result={"id": "p1"})
            self.tasks = DummyCollection(list_result=tasks_data)
            self.wbs = DummyCollection()
            self.wbs_audit = DummyCollection()

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
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)

    return module, dummy_db


def test_wbs_audit_logging(monkeypatch):
    tasks = [
        {
            "id": "t1",
            "title": "Task 1",
            "description": "d1",
            "duration_days": 1.0,
            "predecessor_tasks": [],
            "discipline": "eng",
            "project_id": "p1",
            "created_by": "u1",
        },
        {
            "id": "t2",
            "title": "Task 2",
            "description": "d2",
            "duration_days": 2.0,
            "predecessor_tasks": ["t1"],
            "discipline": "eng",
            "project_id": "p1",
            "created_by": "u1",
        },
    ]

    server, db = load_server(monkeypatch, tasks)
    server.Task.model_rebuild(_types_namespace=server.__dict__)
    server.DependencyMetadata.model_rebuild(_types_namespace=server.__dict__)
    server.WBSNode.model_rebuild(_types_namespace=server.__dict__)
    user = types.SimpleNamespace(id="u1", discipline="eng")

    nodes = asyncio.run(server._generate_project_wbs("p1", user))

    assert len(db.wbs.inserted) == 2
    assert len(db.wbs_audit.inserted) == 1

    audit = db.wbs_audit.inserted[0]
    assert audit["project_id"] == "p1"
    assert len(audit["nodes"]) == 2
    assert audit["nodes"][1]["dependency_metadata"][0]["predecessor_id"] == "t1"
    assert audit["nodes"][0]["created_by"] == "u1"
