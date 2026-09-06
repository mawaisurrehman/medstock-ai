"""Pagination helpers."""
from __future__ import annotations

from math import ceil
from typing import Generic, TypeVar, Sequence

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    model_config = ConfigDict(populate_by_name=True, alias_generator=to_camel)

    items: list[T]
    page: int
    limit: int
    total: int
    pages: int


def paginate(query_result: Sequence, page: int = 1, limit: int = 20) -> dict:
    total = len(query_result)
    pages = max(1, ceil(total / limit))
    start = (page - 1) * limit
    end = start + limit
    return {
        "items": list(query_result[start:end]),
        "page": page,
        "limit": limit,
        "total": total,
        "pages": pages,
    }
