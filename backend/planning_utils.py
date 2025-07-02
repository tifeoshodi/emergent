from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime
from typing import Callable, Dict, List

@dataclass
class TaskRecord:
    id: str
    project_id: str
    title: str
    start_date: datetime | None = None
    end_date: datetime | None = None
    priority: str = "medium"


def group_tasks_by_rules(
    tasks: List[TaskRecord], rules: Dict[str, Callable[[TaskRecord], bool]]
) -> Dict[str, List[TaskRecord]]:
    """Group tasks according to the first matching rule."""
    groups: Dict[str, List[TaskRecord]] = {name: [] for name in rules}
    groups.setdefault("other", [])
    for task in tasks:
        placed = False
        for name, rule in rules.items():
            if rule(task):
                groups[name].append(task)
                placed = True
                break
        if not placed:
            groups["other"].append(task)
    return groups


def detect_cycles(dependencies: Dict[str, List[str]]) -> List[List[str]]:
    """Return list of cycles detected in the dependency graph."""
    visited: set[str] = set()
    stack: List[str] = []
    cycles: List[List[str]] = []

    def visit(node: str):
        if node in stack:
            cycle = stack[stack.index(node):] + [node]
            cycles.append(cycle)
            return
        if node in visited:
            return
        visited.add(node)
        stack.append(node)
        for nb in dependencies.get(node, []):
            visit(nb)
        stack.pop()

    for node in dependencies:
        if node not in visited:
            visit(node)
    return cycles


def infer_dependencies(tasks: List[TaskRecord]) -> Dict[str, List[str]]:
    """Infer dependencies based on task timing within the same project."""
    tasks_sorted = sorted(tasks, key=lambda t: t.start_date or datetime.min)
    deps: Dict[str, List[str]] = {t.id: [] for t in tasks}
    for i, t in enumerate(tasks_sorted):
        for prev in tasks_sorted[:i]:
            if (
                prev.project_id == t.project_id
                and prev.end_date
                and t.start_date
                and t.start_date >= prev.end_date
            ):
                deps[t.id].append(prev.id)
    return deps
