"""Tests for the forecasting engine."""
from app.forecasting.model import (
    moving_average,
    exponential_smoothing,
    forecast_demand,
    calculate_mae,
    calculate_mape,
)


def test_moving_average_basic():
    data = [10.0, 12.0, 11.0, 13.0, 14.0, 12.0, 15.0]
    result = moving_average(data, window=3)
    assert len(result) == len(data)
    assert all(p > 0 for p in result)


def test_exponential_smoothing_basic():
    data = [10.0, 11.0, 12.0, 13.0, 14.0, 15.0, 16.0, 17.0]
    result = exponential_smoothing(data, alpha=0.3)
    assert len(result) == len(data)
    assert all(p > 0 for p in result)


def test_forecast_demand_full():
    data = [float(10 + i % 5) for i in range(90)]
    result = forecast_demand(data, horizon_days=30)
    assert len(result.predictions) == 30
    assert result.model_name != ""
    assert result.mae >= 0
    assert 0 <= result.mape <= 100


def test_forecast_demand_short_data():
    data = [10.0, 12.0]
    result = forecast_demand(data, horizon_days=7)
    assert len(result.predictions) == 7


def test_forecast_demand_empty():
    result = forecast_demand([], horizon_days=7)
    assert len(result.predictions) == 7


def test_calculate_mae():
    actual = [10.0, 12.0, 11.0]
    predicted = [10.5, 11.5, 11.5]
    mae = calculate_mae(actual, predicted)
    assert mae >= 0
    assert mae < 1.0


def test_calculate_mape():
    actual = [10.0, 12.0, 11.0]
    predicted = [10.5, 11.5, 11.5]
    mape = calculate_mape(actual, predicted)
    assert 0 <= mape <= 100
