"""Display formatting for values quoted back as evidence.

These strings travel to the client already formatted, so a reviewer reads the
same rendering of a number that the rule reasoned about.
"""

from __future__ import annotations

from decimal import Decimal


def format_inr(amount: Decimal | float | int) -> str:
    """Format an amount with the Indian lakh/crore digit grouping.

    ``850000`` becomes ``₹8,50,000``: the last three digits group together and
    everything above them groups in pairs.
    """
    quantised = Decimal(amount).quantize(Decimal("1"))
    negative = quantised < 0
    digits = str(abs(quantised))

    if len(digits) > 3:
        last_three = digits[-3:]
        rest = digits[:-3]
        pairs = []
        while len(rest) > 2:
            pairs.insert(0, rest[-2:])
            rest = rest[:-2]
        if rest:
            pairs.insert(0, rest)
        grouped = ",".join(pairs + [last_three])
    else:
        grouped = digits

    return f"{'-' if negative else ''}₹{grouped}"


def format_percentage(value: float) -> str:
    """Render a percentage without a trailing ``.0`` on whole numbers."""
    if value == int(value):
        return f"{int(value)}%"
    return f"{value:.1f}%"


def format_ratio_as_percentage(ratio: float) -> str:
    return format_percentage(round(ratio * 100, 1))


def format_days(days: int) -> str:
    return "1 day" if days == 1 else f"{days} days"
