import os
import sys
import types


def load_server():
    os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017")
    os.environ.setdefault("DB_NAME", "testdb")
    sys.modules["document_parser"] = types.ModuleType("document_parser")
    sys.modules["document_parser"].parse_document = lambda *a, **k: None

    base = os.path.dirname(__file__)
    server_path = os.path.join(base, "..", "backend", "server.py")
    with open(server_path, "r") as f:
        code = "from __future__ import annotations\n" + f.read()
    module = types.ModuleType("server_under_test_build")
    module.__file__ = server_path
    sys.modules[module.__name__] = module
    exec(compile(code, server_path, "exec"), module.__dict__)
    module.Task.model_rebuild()
    return module


server = load_server()
build_wbs_tree = server.build_wbs_tree
DEFAULT_WBS_RULES = server.DEFAULT_WBS_RULES


class SimpleTask:
    def __init__(self, id_, title, discipline=None, phase=None):
        self.id = id_
        self.title = title
        self.discipline = discipline
        self.phase = phase


def make_task(id_, title, discipline=None, phase=None):
    return SimpleTask(id_, title, discipline=discipline, phase=phase)


def test_build_wbs_tree_grouping():
    tasks = [
        make_task("t1", "ENG-001 Spec", discipline="Engineering"),
        make_task("t2", "PROC-001 Spec", discipline="Process"),
        make_task("t3", "General Task", discipline="Engineering"),
    ]
    rules = {
        "discipline": True,
        "phase": False,
        "deliverable_prefixes": {"ENG-": "Eng Deliverables"},
    }
    grouped = build_wbs_tree(tasks, rules)
    assert len(grouped["Eng Deliverables"]) == 1
    assert len(grouped["Process"]) == 1
    assert len(grouped["Engineering"]) == 1


def test_build_wbs_tree_uncategorized():
    tasks = [make_task("t4", "Task X")]
    grouped = build_wbs_tree(tasks, DEFAULT_WBS_RULES)
    assert "Uncategorized" in grouped
    assert len(grouped["Uncategorized"]) == 1


def test_build_wbs_tree_phase_grouping():
    tasks = [
        make_task("t5", "Task P1", discipline="Engineering", phase="Phase 1"),
        make_task("t6", "Task P2", discipline="Engineering", phase="Phase 2"),
        make_task("t7", "Task P3", discipline="Engineering", phase="Phase 1"),
    ]
    rules = {"discipline": False, "phase": True, "deliverable_prefixes": {}}
    grouped = build_wbs_tree(tasks, rules)
    assert len(grouped["Phase 1"]) == 2
    assert len(grouped["Phase 2"]) == 1
