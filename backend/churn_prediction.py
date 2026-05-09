# pyrefly: ignore [missing-import]
import numpy as np
from typing import List, Dict, Any, Optional


# Expected features for the churn model
FEATURE_KEYS = [
    "tenure_months",
    "monthly_charges",
    "total_charges",
    "num_products",
    "support_calls",
    "days_since_last_purchase",
    "satisfaction_score",
]


def predict_churn(
    customer_data: List[Dict[str, Any]],
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Predict churn probability for a list of customers.

    Args:
        customer_data: List of customer feature dictionaries.
        threshold: Probability threshold to classify a customer as at-risk.

    Returns:
        Dictionary with per-customer predictions and summary statistics.
    """
    if not customer_data:
        return {"error": "No customer data provided."}

    try:
        return _ml_churn_prediction(customer_data, threshold)
    except (ImportError, Exception):
        return _rule_based_churn(customer_data, threshold)


def _ml_churn_prediction(
    customer_data: List[Dict[str, Any]], threshold: float
) -> Dict[str, Any]:
    """ML-based churn prediction using scikit-learn (if available)."""
    from sklearn.ensemble import GradientBoostingClassifier
    from sklearn.preprocessing import StandardScaler

    X = _extract_features(customer_data)
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Placeholder model — replace with a pre-trained model in production
    model = GradientBoostingClassifier(n_estimators=50, random_state=42)
    # Synthetic labels for demo; in production, load a trained model
    synthetic_labels = (X[:, 5] > 60).astype(int)  # days_since_last_purchase > 60
    model.fit(X_scaled, synthetic_labels)

    probabilities = model.predict_proba(X_scaled)[:, 1].tolist()
    predictions = [prob >= threshold for prob in probabilities]

    return _build_response(customer_data, probabilities, predictions, threshold, method="gradient_boosting")


def _rule_based_churn(
    customer_data: List[Dict[str, Any]], threshold: float
) -> Dict[str, Any]:
    """Simple rule-based fallback for churn scoring."""
    probabilities = []
    for c in customer_data:
        score = 0.0
        if c.get("days_since_last_purchase", 0) > 90:
            score += 0.35
        if c.get("support_calls", 0) > 5:
            score += 0.20
        if c.get("satisfaction_score", 5) < 3:
            score += 0.25
        if c.get("tenure_months", 24) < 6:
            score += 0.10
        if c.get("monthly_charges", 50) > 100:
            score += 0.10
        probabilities.append(min(score, 1.0))

    predictions = [p >= threshold for p in probabilities]
    return _build_response(customer_data, probabilities, predictions, threshold, method="rule_based")


def _extract_features(customer_data: List[Dict[str, Any]]) -> np.ndarray:
    """Extract numeric feature matrix from customer records."""
    rows = []
    for c in customer_data:
        row = [float(c.get(k, 0)) for k in FEATURE_KEYS]
        rows.append(row)
    return np.array(rows, dtype=float)


def _build_response(
    customer_data, probabilities, predictions, threshold, method
) -> Dict[str, Any]:
    results = []
    for i, c in enumerate(customer_data):
        results.append({
            "customer_id": c.get("customer_id", f"CUST_{i+1:04d}"),
            "churn_probability": round(probabilities[i], 4),
            "at_risk": bool(predictions[i]),
            "risk_level": (
                "high" if probabilities[i] >= 0.7
                else "medium" if probabilities[i] >= threshold
                else "low"
            ),
        })

    at_risk_count = sum(predictions)
    return {
        "method": method,
        "threshold": threshold,
        "total_customers": len(customer_data),
        "at_risk_count": at_risk_count,
        "at_risk_percentage": round(at_risk_count / len(customer_data) * 100, 2),
        "predictions": results,
    }
