"""Date utility functions."""
from __future__ import annotations

from datetime import date, datetime, timedelta, timezone


def today() -> date:
    return date.today()


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def days_between(d1: date, d2: date) -> int:
    return (d2 - d1).days


def add_days(d: date, n: int) -> date:
    return d + timedelta(days=n)
