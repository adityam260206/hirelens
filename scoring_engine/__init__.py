"""HireLens Deterministic Matching Engine (Python).

Pure functional scoring engine producing skill-level match/gap evidence
and deterministic match scores for explainable AI candidate ranking.
"""

from .engine import compute_match, MATCH_WEIGHTS

__all__ = ["compute_match", "MATCH_WEIGHTS"]
