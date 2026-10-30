"""Small statistics helpers (no numpy needed) and month arithmetic."""
import calendar
import math
from datetime import date


def percentile(values, p):
    """p-th percentile (0-100) with linear interpolation between neighbours. [] -> 0."""
    if not values:
        return 0
    ordered = sorted(values)
    pos = (len(ordered) - 1) * p / 100
    low, high = math.floor(pos), math.ceil(pos)
    return ordered[low] + (ordered[high] - ordered[low]) * (pos - low)


def month_of(day):
    """date or ISO string -> 'YYYY-MM'."""
    return (day if isinstance(day, str) else day.isoformat())[:7]


def add_months(month, n):
    """'2026-09' + 1 -> '2026-10'."""
    index = int(month[:4]) * 12 + int(month[5:]) - 1 + n
    return f"{index // 12:04d}-{index % 12 + 1:02d}"


def months_between(first, last):
    """Inclusive list of 'YYYY-MM' from first to last."""
    out, m = [], first
    while m <= last:
        out.append(m)
        m = add_months(m, 1)
    return out


def month_end(month):
    """Last calendar day of 'YYYY-MM'."""
    year, mon = int(month[:4]), int(month[5:])
    return date(year, mon, calendar.monthrange(year, mon)[1])
