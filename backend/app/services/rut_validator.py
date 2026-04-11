"""Chilean RUT validation (modulo 11)."""

import re


def clean_rut(rut: str) -> str:
    """Remove dots and dashes, uppercase."""
    return re.sub(r"[.\-\s]", "", rut).upper()


def format_rut(rut: str) -> str:
    """Format RUT as XX.XXX.XXX-D."""
    cleaned = clean_rut(rut)
    if len(cleaned) < 2:
        return rut

    body = cleaned[:-1]
    dv = cleaned[-1]

    # Add thousand separators
    formatted = ""
    for i, c in enumerate(reversed(body)):
        if i > 0 and i % 3 == 0:
            formatted = "." + formatted
        formatted = c + formatted

    return f"{formatted}-{dv}"


def validate_rut(rut: str) -> bool:
    """Validate Chilean RUT using modulo 11 algorithm."""
    cleaned = clean_rut(rut)

    if not re.match(r"^\d{7,8}[0-9K]$", cleaned):
        return False

    body = cleaned[:-1]
    expected_dv = cleaned[-1]

    # Modulo 11
    total = 0
    multiplier = 2
    for digit in reversed(body):
        total += int(digit) * multiplier
        multiplier = multiplier + 1 if multiplier < 7 else 2

    remainder = 11 - (total % 11)

    if remainder == 11:
        computed_dv = "0"
    elif remainder == 10:
        computed_dv = "K"
    else:
        computed_dv = str(remainder)

    return computed_dv == expected_dv
