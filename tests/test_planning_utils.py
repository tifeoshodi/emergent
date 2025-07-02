from backend.planning_utils import group_tasks_by_rules, detect_cycles, infer_dependencies


def test_rule_based_grouping(sample_tasks):
    rules = {
        "critical": lambda t: t.priority == "critical",
        "high": lambda t: t.priority == "high",
    }
    groups = group_tasks_by_rules(sample_tasks, rules)
    assert [t.id for t in groups["critical"]] == ["t2"]
    assert [t.id for t in groups["high"]] == ["t1"]
    assert {"t3", "t4"} == {t.id for t in groups["other"]}


def test_cycle_detection(cyclic_dependencies):
    cycles = detect_cycles(cyclic_dependencies)
    assert any(set(cycle) == {"A", "B", "C"} for cycle in cycles)


def test_dependency_inference(sample_tasks):
    deps = infer_dependencies(sample_tasks)
    assert deps["t2"] == ["t1"]
    assert deps["t3"] == ["t1", "t2"]
    assert deps["t4"] == []
