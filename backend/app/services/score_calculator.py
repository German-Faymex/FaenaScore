"""Score computation utilities for evaluations."""


def compute_average(
    quality: int,
    safety: int,
    punctuality: int,
    teamwork: int,
    technical: int,
) -> float:
    """Compute the average score from 5 dimensions."""
    return round((quality + safety + punctuality + teamwork + technical) / 5.0, 2)
