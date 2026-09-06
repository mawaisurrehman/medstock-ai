"""File validation utilities for uploads."""
from __future__ import annotations

import os
from pathlib import Path

ALLOWED_EXTENSIONS = {".csv", ".xlsx", ".xls"}


def validate_file_extension(filename: str) -> bool:
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


def validate_file_size(size_bytes: int, max_mb: int = 20) -> bool:
    return size_bytes <= max_mb * 1024 * 1024
