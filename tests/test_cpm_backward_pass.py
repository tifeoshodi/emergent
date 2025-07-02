import os
import sys
import types


def load_server(monkeypatch):
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "testdb")

    sys.modules["document_parser"] = types.ModuleType("document_parser")
    sys.modules["document_parser"].parse_document = lambda *a, **k: None

    class DummyClient:
        def __getitem__(self, name):
            return object()

    monkeypatch.setattr(
        "motor.motor_asyncio.AsyncIOMotorClient", lambda *a, **kw: DummyClient()
    )

    server_path = os.path.join(os.path.dirname(__file__), "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test_backward")
    module.__file__ = server_path
    sys.modules[module.__name__] = module
    exec(compile(code, server_path, "exec"), module.__dict__)
    module.Task.model_rebuild()
    return module


def test_backward_pass_metrics(monkeypatch):
    server = load_server(monkeypatch)
    Task = server.Task

    tasks = [
        Task(
            id="t1",
            title="A",
            description="",
            created_by="u",
            predecessor_tasks=[],
            duration_days=2,
        ),
        Task(
            id="t2",
            title="B",
            description="",
            created_by="u",
            predecessor_tasks=["t1"],
            duration_days=3,
        ),
        Task(
            id="t3",
            title="C",
            description="",
            created_by="u",
            predecessor_tasks=[],
            duration_days=1,
        ),
    ]

    cp, metrics = server._calculate_cpm(tasks)

    assert cp == ["t1", "t2"]
    assert metrics["t1"]["late_start"] == 0
    assert metrics["t1"]["late_finish"] == 2
    assert metrics["t1"]["total_float"] == 0
    assert metrics["t3"]["total_float"] == 4
