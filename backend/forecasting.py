# pyrefly: ignore [missing-import]
import numpy as np
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta


def generate_forecast(
    data: List[float],
    periods: int = 30,
    frequency: str = "D"
) -> Dict[str, Any]:
    """
    Generate a time-series forecast using exponential smoothing or Prophet.

    Args:
        data: Historical time-series values.
        periods: Number of future periods to forecast.
        frequency: Frequency code — 'D' (daily), 'W' (weekly), 'M' (monthly).

    Returns:
        Dictionary with forecast values, confidence intervals, and metadata.
    """
    if not data or len(data) < 2:
        return {"error": "Insufficient data. At least 2 data points required."}

    try:
        return _prophet_forecast(data, periods, frequency)
    except ImportError:
        return _exponential_smoothing_forecast(data, periods, frequency)


def _prophet_forecast(data: List[float], periods: int, frequency: str) -> Dict[str, Any]:
    """Prophet-based forecast (requires prophet package)."""
    from prophet import Prophet  # pyrefly: ignore [missing-import]
    import pandas as pd  # pyrefly: ignore [missing-import]

    freq_map = {"D": "D", "W": "W", "M": "MS"}
    freq = freq_map.get(frequency, "D")

    dates = pd.date_range(end=datetime.today(), periods=len(data), freq=freq)
    df = pd.DataFrame({"ds": dates, "y": data})

    model = Prophet(yearly_seasonality=True, weekly_seasonality=(freq == "D"))
    model.fit(df)

    future = model.make_future_dataframe(periods=periods, freq=freq)
    forecast = model.predict(future)
    future_rows = forecast.tail(periods)

    return {
        "method": "prophet",
        "periods": periods,
        "frequency": frequency,
        "forecast": future_rows["yhat"].tolist(),
        "lower_bound": future_rows["yhat_lower"].tolist(),
        "upper_bound": future_rows["yhat_upper"].tolist(),
        "dates": future_rows["ds"].dt.strftime("%Y-%m-%d").tolist(),
    }


def _exponential_smoothing_forecast(
    data: List[float], periods: int, frequency: str
) -> Dict[str, Any]:
    """Simple exponential smoothing fallback forecast."""
    arr = np.array(data, dtype=float)
    alpha = 0.3  # Smoothing factor

    smoothed = [arr[0]]
    for val in arr[1:]:
        smoothed.append(alpha * val + (1 - alpha) * smoothed[-1])

    last_value = smoothed[-1]
    trend = (arr[-1] - arr[0]) / max(len(arr) - 1, 1)

    forecast_values = [last_value + trend * (i + 1) for i in range(periods)]
    std = float(np.std(arr))
    lower = [v - 1.96 * std for v in forecast_values]
    upper = [v + 1.96 * std for v in forecast_values]

    freq_map = {"D": 1, "W": 7, "M": 30}
    delta_days = freq_map.get(frequency, 1)
    base_date = datetime.today()
    dates = [(base_date + timedelta(days=delta_days * (i + 1))).strftime("%Y-%m-%d")
             for i in range(periods)]

    return {
        "method": "exponential_smoothing",
        "periods": periods,
        "frequency": frequency,
        "forecast": forecast_values,
        "lower_bound": lower,
        "upper_bound": upper,
        "dates": dates,
        "historical_mean": float(np.mean(arr)),
        "historical_std": std,
    }
