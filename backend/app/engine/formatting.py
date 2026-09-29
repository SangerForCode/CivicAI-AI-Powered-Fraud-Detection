"""Display formatting for values quoted back as evidence.

These strings travel to the client already formatted, so a reviewer reads the
same rendering of a number that the rule reasoned about.
"""

from __future__ import annotations

from datetime import date
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


def _plural(count: int, unit: str) -> str:
    return f"{count} {unit}" if count == 1 else f"{count} {unit}s"


def humanise_days(days: int) -> str:
    """Render a day count the way a person would say it.

    ``620`` becomes ``1 year 8 months``; ``167`` becomes ``5 months 2 weeks``.
    At most two units are used, because a third adds precision nobody reads.
    A year is treated as 365 days and a month as 30, which is close enough for
    a duration label and keeps the function pure and exactly reproducible.
    """
    days = abs(int(days))
    if days == 0:
        return "0 days"
    if days < 7:
        return _plural(days, "day")

    years, remainder = divmod(days, 365)
    months, remainder = divmod(remainder, 30)
    weeks, day_part = divmod(remainder, 7)

    # Four leftover weeks reads worse than the month it almost is.
    if weeks >= 4:
        months += 1
        weeks = 0
    if months >= 12:
        years += 1
        months -= 12

    units: list[str] = []
    if years:
        units.append(_plural(years, "year"))
    if months:
        units.append(_plural(months, "month"))
    if weeks and len(units) < 2:
        units.append(_plural(weeks, "week"))
    if day_part and len(units) < 2 and not years and not months:
        units.append(_plural(day_part, "day"))

    return " ".join(units[:2])


def format_duration(days: int) -> str:
    """The full ``620 days ≈ 1 year 8 months`` rendering."""
    exact = format_days(abs(int(days)))
    human = humanise_days(days)
    return exact if exact == human else f"{exact} ≈ {human}"


def format_date(value: "date") -> str:
    """A compact, unambiguous date: ``12 Mar 2024``."""
    return f"{value.day} {value.strftime('%b')} {value.year}"
