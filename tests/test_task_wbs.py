import os
import sys
import types
import asyncio
import pymongo
import pytest


def load_server(monkeypatch, tasks=None):
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
        def __init__(self, docs=None):
            self.docs = list(docs or [])
            self.inserted = []
            self.deleted = []
            self.deleted_one_filters = []
            self.unique_index = None

        async def find_one(self, query, session=None):
            for doc in self.docs:
                if all(doc.get(k) == v for k, v in query.items()):
                    return doc
            return None

        def find(self, query, session=None):
            result = [
                doc
                for doc in self.docs
                if all(doc.get(k) == v for k, v in query.items())
            ]
            return DummyCursor(result)

        async def insert_one(self, doc, session=None):
            if self.unique_index:
                key = tuple(doc.get(f[0]) for f in self.unique_index)
                for ex in self.docs:
                    if key == tuple(ex.get(f[0]) for f in self.unique_index):
                        raise pymongo.errors.DuplicateKeyError("duplicate")
            self.docs.append(doc)
            self.inserted.append(doc)
            return types.SimpleNamespace(inserted_id=doc.get("id"))

        async def delete_one(self, filt, session=None):
            self.deleted_one_filters.append(filt)
            for i, doc in enumerate(self.docs):
                if all(doc.get(k) == v for k, v in filt.items()):
                    del self.docs[i]
                    return types.SimpleNamespace(deleted_count=1)
            return types.SimpleNamespace(deleted_count=0)

        async def delete_many(self, filt, session=None):
            self.deleted.append(filt)
            self.docs = [
                doc
                for doc in self.docs
                if not all(doc.get(k) == v for k, v in filt.items())
            ]
            return types.SimpleNamespace(deleted_count=0)

        async def create_index(self, spec, unique=False):
            if unique:
                self.unique_index = spec
            return "idx"

        async def count_documents(self, filt):
            return len(
                [
                    doc
                    for doc in self.docs
                    if all(doc.get(k) == v for k, v in filt.items())
                ]
            )

    class DummyDB:
        def __init__(self):
            self.projects = DummyCollection([{"id": "p1"}])
            self.tasks = DummyCollection(tasks)
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
        def __init__(self, db):
            self._db = db

        def __getitem__(self, name):
            return self._db

        async def start_session(self):
            return DummySession()

    monkeypatch.setattr(
        "motor.motor_asyncio.AsyncIOMotorClient", lambda *a, **kw: DummyClient(dummy_db)
    )

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test_tasks")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)

    return module, dummy_db


def test_duplicate_task_insertion_raises(monkeypatch):
    server, db = load_server(monkeypatch)
    server.Task.model_rebuild(_types_namespace=server.__dict__)
    server.TaskCreate.model_rebuild(_types_namespace=server.__dict__)
    server.WBSNode.model_rebuild(_types_namespace=server.__dict__)

    asyncio.run(server.ensure_wbs_index())
    user = types.SimpleNamespace(id="u1", discipline="eng")
    monkeypatch.setattr(server.uuid, "uuid4", lambda: "t1")
    task = server.TaskCreate(title="T", description="d", project_id="p1")

    asyncio.run(server.create_task(task, current_user=user))
    with pytest.raises(pymongo.errors.DuplicateKeyError):
        asyncio.run(server.create_task(task, current_user=user))


def test_delete_task_removes_wbs_entry(monkeypatch):
    tasks = [
        {
            "id": "t1",
            "title": "T",
            "description": "d",
            "discipline": "eng",
            "project_id": "p1",
            "created_by": "u1",
        }
    ]
    server, db = load_server(monkeypatch, tasks)
    server.Task.model_rebuild(_types_namespace=server.__dict__)
    server.WBSNode.model_rebuild(_types_namespace=server.__dict__)

    node = {
        "id": "n1",
        "project_id": "p1",
        "task_id": "t1",
        "title": "T",
        "duration_days": 1.0,
        "predecessors": [],
        "dependency_metadata": [],
        "early_start": 0.0,
        "early_finish": 1.0,
        "is_critical": False,
        "created_by": "u1",
    }
    db.wbs.docs.append(node)
    asyncio.run(server.ensure_wbs_index())
    user = types.SimpleNamespace(id="u1", discipline="eng")

    asyncio.run(server.delete_task("t1", current_user=user))
    assert any(f.get("task_id") == "t1" for f in db.wbs.deleted_one_filters)
