import os
import sys
import types
import asyncio


def load_server(monkeypatch):
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "testdb")
    sys.modules["document_parser"] = types.ModuleType("document_parser")
    sys.modules["document_parser"].parse_document = lambda *a, **k: None

    tasks = [
        {"id": "t1", "discipline": "eng", "project_id": "p1", "predecessor_tasks": []},
        {"id": "t2", "discipline": "eng", "project_id": "p1", "predecessor_tasks": []},
    ]
    wbs = [
        {"task_id": "t2", "dependency_metadata": []}
    ]

    class DummyCursor:
        def __init__(self, result=None):
            self._result = result or []

        async def to_list(self, length):
            return self._result

    class DummyCollection:
        def __init__(self, data):
            self.data = data

        async def find_one(self, query):
            for d in self.data:
                if all(d.get(k) == v for k, v in query.items()):
                    return d
            return None

        def find(self, query):
            return DummyCursor([d for d in self.data if all(d.get(k) == v for k, v in query.items())])

        async def update_one(self, query, update):
            doc = await self.find_one(query)
            if doc and "$set" in update:
                doc.update(update["$set"])

        async def update_many(self, query, update):
            for doc in self.data:
                if all(doc.get(k) == v for k, v in query.items()):
                    doc.setdefault("dependency_metadata", []).append(update["$push"]["dependency_metadata"])

    class DummyDB:
        def __init__(self):
            self.tasks = DummyCollection(tasks)
            self.wbs = DummyCollection(wbs)
            self.projects = DummyCollection([{"id": "p1"}])

    class DummyClient:
        def __init__(self, db):
            self._db = db

        def __getitem__(self, name):
            return self._db

    monkeypatch.setattr("motor.motor_asyncio.AsyncIOMotorClient", lambda *a, **kw: DummyClient(DummyDB()))

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test_confirm")
    module.__file__ = server_path
    exec(compile(code, server_path, "exec"), module.__dict__)

    async def dummy_generate(project_id, user, session=None):
        return []

    module._generate_project_wbs = dummy_generate
    return module, tasks, wbs


def test_confirm_accept(monkeypatch):
    server, tasks, wbs = load_server(monkeypatch)
    server.DependencyConfirmation.model_rebuild(_types_namespace=server.__dict__)
    server.DependencyMetadata.model_rebuild(_types_namespace=server.__dict__)
    user = types.SimpleNamespace(id="u1", discipline="eng")
    decision = server.DependencyConfirmation(from_task="t1", to_task="t2", accept=True)
    asyncio.run(server.confirm_dependency_suggestions([decision], current_user=user))
    assert "t1" in tasks[1]["predecessor_tasks"]
    assert wbs[0]["dependency_metadata"][0]["status"] == "accepted"


def test_confirm_reject(monkeypatch):
    server, tasks, wbs = load_server(monkeypatch)
    server.DependencyConfirmation.model_rebuild(_types_namespace=server.__dict__)
    server.DependencyMetadata.model_rebuild(_types_namespace=server.__dict__)
    user = types.SimpleNamespace(id="u1", discipline="eng")
    decision = server.DependencyConfirmation(from_task="t1", to_task="t2", accept=False)
    asyncio.run(server.confirm_dependency_suggestions([decision], current_user=user))
    assert tasks[1]["predecessor_tasks"] == []
    assert wbs[0]["dependency_metadata"][0]["status"] == "rejected"
