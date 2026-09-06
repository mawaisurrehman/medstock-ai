"""Forecasting engine: baseline, moving average, exponential smoothing."""
from __future__ import annotations

import math
from dataclasses import dataclass

import numpy as np


@dataclass
class ForecastResult:
    predictions: list[float]
    lower_bounds: list[float]
    upper_bounds: list[float]
    model_name: str
    mae: float
    mape: float
    confidence: float


def moving_average(values: list[float], window: int = 7) -> list[float]:
    """Simple moving average forecast."""
    if not values:
        return []
    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        result.append(sum(values[start:i + 1]) / (i + 1 - start))
    return result


def exponential_smoothing(values: list[float], alpha: float = 0.3) -> list[float]:
    """Simple exponential smoothing."""
    if not values:
        return []
    result = [values[0]]
    for i in range(1, len(values)):
        result.append(alpha * values[i] + (1 - alpha) * result[-1])
    return result


def double_exponential_smoothing(values: list[float], alpha: float = 0.3, beta: float = 0.1) -> list[float]:
    """Holt's linear trend method."""
    if len(values) < 3:
        return exponential_smoothing(values, alpha)
    level = values[0]
    trend = values[1] - values[0]
    result = [level + trend]
    for i in range(1, len(values)):
        new_level = alpha * values[i] + (1 - alpha) * (level + trend)
        new_trend = beta * (new_level - level) + (1 - beta) * trend
        level, trend = new_level, new_trend
        result.append(level + trend)
    return result


def calculate_mae(actual: list[float], predicted: list[float]) -> float:
    """Mean Absolute Error."""
    if not actual or not predicted:
        return 0.0
    n = min(len(actual), len(predicted))
    return sum(abs(actual[i] - predicted[i]) for i in range(n)) / n


def calculate_mape(actual: list[float], predicted: list[float]) -> float:
    """Mean Absolute Percentage Error."""
    if not actual or not predicted:
        return 0.0
    n = min(len(actual), len(predicted))
    errors = []
    for i in range(n):
        if actual[i] != 0:
            errors.append(abs(actual[i] - predicted[i]) / abs(actual[i]))
    if not errors:
        return 0.0
    return (sum(errors) / len(errors)) * 100


def forecast_demand(
    historical_consumption: list[float],
    horizon_days: int = 30,
) -> ForecastResult:
    """
    Main forecasting function. Selects best model based on data availability.
    Returns predictions for each day in the horizon.
    """
    if not historical_consumption or len(historical_consumption) < 3:
        # Fallback: simple mean
        mean_val = sum(historical_consumption) / max(1, len(historical_consumption)) if historical_consumption else 10.0
        preds = [mean_val] * horizon_days
        return ForecastResult(
            predictions=preds,
            lower_bounds=[p * 0.8 for p in preds],
            upper_bounds=[p * 1.2 for p in preds],
            model_name="baseline_mean",
            mae=0.0,
            mape=0.0,
            confidence=50.0,
        )

    data = historical_consumption
    n = len(data)

    # Try multiple models and pick the best
    models = {}

    # Moving average
    ma_preds = moving_average(data, window=min(7, n))
    models["moving_average"] = ma_preds

    # Exponential smoothing
    es_preds = exponential_smoothing(data, alpha=0.3)
    models["exponential_smoothing"] = es_preds

    # Double exponential smoothing if enough data
    if n >= 14:
        des_preds = double_exponential_smoothing(data, alpha=0.3, beta=0.1)
        models["double_exponential_smoothing"] = des_preds

    # Evaluate each model using MAPE on the last 20% of data
    test_size = max(3, n // 5)
    train = data[:-test_size]
    test = data[-test_size:]

    best_name = "moving_average"
    best_mape = float("inf")

    for name, all_preds in models.items():
        if len(all_preds) >= n:
            model_test_preds = all_preds[-test_size:]
            mape = calculate_mape(test, model_test_preds)
            if mape < best_mape:
                best_mape = mape
                best_name = name

    # Generate future predictions using best model
    best_fitted = models[best_name]
    last_value = best_fitted[-1] if best_fitted else data[-1]

    # Trend estimation for extrapolation
    if n >= 7:
        recent = best_fitted[-7:]
        trend = (recent[-1] - recent[0]) / 7
    else:
        trend = 0.0

    # Compute residual std for confidence intervals
    if len(best_fitted) >= n:
        residuals = [data[i] - best_fitted[i] for i in range(n)]
        std_dev = float(np.std(residuals)) if residuals else last_value * 0.1
    else:
        std_dev = last_value * 0.1

    future_preds = []
    for d in range(horizon_days):
        val = max(0, last_value + trend * (d + 1))
        future_preds.append(val)

    # Calculate error metrics on full fitted
    mae = calculate_mae(data, best_fitted[:n]) if len(best_fitted) >= n else 0.0
    mape_val = calculate_mape(data, best_fitted[:n]) if len(best_fitted) >= n else 0.0

    # Confidence: inverse of MAPE, capped
    confidence = max(50.0, min(99.0, 100.0 - mape_val))

    return ForecastResult(
        predictions=future_preds,
        lower_bounds=[max(0, p - 1.96 * std_dev) for p in future_preds],
        upper_bounds=[p + 1.96 * std_dev for p in future_preds],
        model_name=best_name,
        mae=round(mae, 2),
        mape=round(mape_val, 2),
        confidence=round(confidence, 1),
    )
