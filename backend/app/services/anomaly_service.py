"""Anomaly detection service using statistical methods."""
from __future__ import annotations

import math
from dataclasses import dataclass


@dataclass
class AnomalyResult:
    is_anomaly: bool
    anomaly_type: str
    severity: str
    description: str
    z_score: float


def detect_consumption_anomaly(
    historical_values: list[float],
    current_value: float,
) -> AnomalyResult:
    """Detect anomalies using z-score and IQR methods."""
    if len(historical_values) < 7:
        return AnomalyResult(False, "NONE", "LOW", "Insufficient data for anomaly detection.", 0.0)

    mean = sum(historical_values) / len(historical_values)
    variance = sum((x - mean) ** 2 for x in historical_values) / len(historical_values)
    std = math.sqrt(variance) if variance > 0 else 1.0

    z = (current_value - mean) / std if std > 0 else 0.0

    # IQR method
    sorted_vals = sorted(historical_values)
    n = len(sorted_vals)
    q1 = sorted_vals[n // 4]
    q3 = sorted_vals[3 * n // 4]
    iqr = q3 - q1
    lower_fence = q1 - 1.5 * iqr
    upper_fence = q3 + 1.5 * iqr

    is_anomaly = abs(z) > 2.0 or current_value > upper_fence or current_value < lower_fence

    if not is_anomaly:
        return AnomalyResult(False, "NONE", "LOW", "Consumption is within normal range.", round(z, 2))

    if z > 2.0:
        return AnomalyResult(
            True,
            "HIGH_CONSUMPTION",
            "WARNING",
            f"Unusual consumption spike detected. Current: {current_value:.1f}, "
            f"Normal range: {mean - std:.1f}-{mean + std:.1f} (z-score: {z:.2f}). "
            f"Review transaction history.",
            round(z, 2),
        )
    elif z < -2.0:
        return AnomalyResult(
            True,
            "LOW_CONSUMPTION",
            "INFO",
            f"Unusually low consumption. Current: {current_value:.1f}, "
            f"Expected: {mean:.1f}. Verify data accuracy.",
            round(z, 2),
        )
    else:
        return AnomalyResult(
            True,
            "OUT_OF_RANGE",
            "WARNING",
            f"Consumption outside IQR bounds. Current: {current_value:.1f}, "
            f"Expected range: {lower_fence:.1f}-{upper_fence:.1f}.",
            round(z, 2),
        )
