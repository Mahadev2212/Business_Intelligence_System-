import numpy as np
from typing import List, Dict, Any, Optional


def detect_anomalies(
    data: List[float],
    sensitivity: float = 0.05,
    method: str = "isolation_forest"
) -> Dict[str, Any]:
    """
    Detect anomalies in a list of numeric values.

    Args:
        data: List of numeric data points (time-series or general).
        sensitivity: Contamination ratio / sensitivity level (0–1).
        method: Detection algorithm — 'isolation_forest', 'zscore', or 'iqr'.

    Returns:
        Dictionary with anomaly indices, scores, and summary statistics.
    """
    if not data or len(data) < 3:
        return {"error": "Insufficient data. At least 3 data points required."}

    arr = np.array(data, dtype=float)

    if method == "zscore":
        anomaly_indices, scores = _zscore_anomalies(arr, sensitivity)
    elif method == "iqr":
        anomaly_indices, scores = _iqr_anomalies(arr)
    else:  # Default: isolation_forest (approximated via z-score for zero-dependency fallback)
        anomaly_indices, scores = _isolation_forest_anomalies(arr, sensitivity)

    return {
        "method": method,
        "total_points": len(data),
        "anomaly_count": len(anomaly_indices),
        "anomaly_indices": anomaly_indices,
        "anomaly_values": [data[i] for i in anomaly_indices],
        "anomaly_scores": scores,
        "mean": float(np.mean(arr)),
        "std": float(np.std(arr)),
        "min": float(np.min(arr)),
        "max": float(np.max(arr)),
    }


def _zscore_anomalies(arr: np.ndarray, sensitivity: float):
    """Z-score based anomaly detection."""
    threshold = 3.0 - (sensitivity * 10)  # Adjust threshold by sensitivity
    threshold = max(1.5, threshold)
    mean, std = np.mean(arr), np.std(arr)
    if std == 0:
        return [], []
    z_scores = np.abs((arr - mean) / std)
    indices = [int(i) for i in np.where(z_scores > threshold)[0]]
    scores = [float(z_scores[i]) for i in indices]
    return indices, scores


def _iqr_anomalies(arr: np.ndarray):
    """IQR-based anomaly detection."""
    q1, q3 = np.percentile(arr, 25), np.percentile(arr, 75)
    iqr = q3 - q1
    lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
    indices = [int(i) for i in np.where((arr < lower) | (arr > upper))[0]]
    scores = [abs(float(arr[i]) - float(np.median(arr))) / (iqr + 1e-9) for i in indices]
    return indices, scores


def _isolation_forest_anomalies(arr: np.ndarray, sensitivity: float):
    """
    Lightweight approximation of Isolation Forest using z-score.
    Replace with sklearn's IsolationForest for production use.
    """
    try:
        from sklearn.ensemble import IsolationForest
        model = IsolationForest(contamination=sensitivity, random_state=42)
        preds = model.fit_predict(arr.reshape(-1, 1))
        scores_raw = model.score_samples(arr.reshape(-1, 1))
        indices = [int(i) for i in np.where(preds == -1)[0]]
        scores = [float(-scores_raw[i]) for i in indices]
        return indices, scores
    except ImportError:
        # Fallback to z-score if sklearn not available
        return _zscore_anomalies(arr, sensitivity)
