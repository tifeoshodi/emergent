from __future__ import annotations

import re
from datetime import datetime
from typing import Iterable, List, Optional

from pydantic import BaseModel


class MinimalTask(BaseModel):
    """Subset of Task fields needed for dependency suggestion."""

    id: str
    title: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    assigned_to: Optional[str] = None
    required_resources: List[str] = []
    discipline: Optional[str] = None


class DependencySuggestion(BaseModel):
    from_task: str
    to_task: str
    confidence: float
    reasons: List[str]


_sequence_re = re.compile(r"([A-Za-z]+)[-_]?(\d+)")


def _parse_sequence(title: str) -> Optional[tuple[str, int]]:
    match = _sequence_re.search(title)
    if not match:
        return None
    return match.group(1), int(match.group(2))


def propose_dependencies(tasks: Iterable[MinimalTask]) -> List[DependencySuggestion]:
    tasks = list(tasks)
    suggestions: List[DependencySuggestion] = []

    for a in tasks:
        for b in tasks:
            if a.id == b.id:
                continue

            reasons: List[str] = []
            confidence = 0.0

            # Temporal gap heuristic
            if a.end_date and b.start_date and a.end_date <= b.start_date:
                gap = (b.start_date - a.end_date).days
                if 0 <= gap <= 2:
                    confidence += 0.4
                elif gap <= 7:
                    confidence += 0.2
                reasons.append("temporal_gap")

            # Shared resources heuristic
            shared = set(a.required_resources or []) | (
                {a.assigned_to} if a.assigned_to else set()
            )
            other = set(b.required_resources or []) | (
                {b.assigned_to} if b.assigned_to else set()
            )
            if shared & other:
                confidence += 0.3
                reasons.append("shared_resources")

            # Discipline ordering heuristic (simple alphabetical)
            if a.discipline and b.discipline and a.discipline < b.discipline:
                confidence += 0.2
                reasons.append("discipline_order")

            # Sequential task codes heuristic
            seq_a = _parse_sequence(a.title)
            seq_b = _parse_sequence(b.title)
            if seq_a and seq_b and seq_a[0] == seq_b[0] and seq_a[1] + 1 == seq_b[1]:
                confidence += 0.4
                reasons.append("code_sequence")

            if confidence > 0:
                suggestions.append(
                    DependencySuggestion(
                        from_task=a.id,
                        to_task=b.id,
                        confidence=min(confidence, 1.0),
                        reasons=reasons,
                    )
                )

    # Sort suggestions by confidence
    suggestions.sort(key=lambda s: s.confidence, reverse=True)
    return suggestions
