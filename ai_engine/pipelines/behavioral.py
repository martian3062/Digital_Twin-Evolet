"""Behavioral & Emotional Intelligence Pipeline.
IDF Step 15: Wearable + voice signals → stress, mood, activity trend analysis.
"""
import math
import random


def analyze_behavioral_state(patient_id: str, data: dict = None) -> dict:
    """
    Analyzes behavioral and emotional health from wearable + voice data.
    Returns stress index, mood estimate, activity score, and risk modifiers.
    """
    vitals = (data or {}).get("vitals", [])
    voice_text = (data or {}).get("voice_text", "")
    sleep_hours = (data or {}).get("sleep_hours", 7.0)
    activity_minutes = (data or {}).get("activity_minutes", 30)

    # Stress Index from HRV proxy (HR variance)
    hr_values = [v["value"] for v in vitals if v.get("metric_type") == "heart_rate"]
    stress_index = _compute_stress_index(hr_values)

    # Mood from voice sentiment (keyword-based)
    mood = _analyze_mood(voice_text)

    # Activity readiness score
    activity_score = _score_activity(activity_minutes, sleep_hours)

    # Sleep quality
    sleep_quality = min(1.0, sleep_hours / 8.0)

    # Behavioral risk modifiers for Digital Twin
    risk_modifiers = {
        "cardiac": round(1.0 + (stress_index * 0.15), 3),
        "hypertension": round(1.0 + (stress_index * 0.12), 3),
        "overall_health": round(1.0 - (stress_index * 0.08) + (activity_score * 0.05), 3),
    }

    return {
        "patient_id": patient_id,
        "stress_index": round(stress_index, 3),
        "mood": mood,
        "activity_readiness": round(activity_score, 3),
        "sleep_quality": round(sleep_quality, 3),
        "behavioral_risk_modifiers": risk_modifiers,
        "insights": _generate_insights(stress_index, mood, activity_score, sleep_quality),
        "model_version": "behavioral-v1.0",
    }


def _compute_stress_index(hr_values: list) -> float:
    if len(hr_values) < 2:
        return 0.2
    mean_hr = sum(hr_values) / len(hr_values)
    variance = sum((x - mean_hr) ** 2 for x in hr_values) / len(hr_values)
    hrv_proxy = math.sqrt(variance)
    # Low HRV → high stress (inverse relationship)
    stress = max(0.0, min(1.0, 1.0 - (hrv_proxy / 20.0)))
    return stress


def _analyze_mood(text: str) -> dict:
    text_lower = text.lower()
    positive = sum(text_lower.count(w) for w in ["good", "better", "great", "fine", "well", "happy"])
    negative = sum(text_lower.count(w) for w in ["pain", "tired", "worse", "bad", "stressed", "anxious", "dizzy"])
    total = positive + negative or 1
    return {
        "label": "positive" if positive >= negative else ("neutral" if positive == negative else "negative"),
        "valence": round((positive - negative) / total, 2),
        "arousal": round(random.uniform(0.3, 0.7), 2),
    }


def _score_activity(activity_minutes: float, sleep_hours: float) -> float:
    activity_score = min(1.0, activity_minutes / 60.0)
    sleep_bonus = min(0.2, (sleep_hours - 6.0) * 0.1) if sleep_hours >= 6 else -0.2
    return max(0.0, min(1.0, activity_score + sleep_bonus))


def _generate_insights(stress: float, mood: dict, activity: float, sleep: float) -> list:
    insights = []
    if stress > 0.6:
        insights.append("Elevated stress detected via HRV analysis — consider mindfulness or reduced load.")
    if mood["label"] == "negative":
        insights.append("Negative mood indicators detected in voice log — recommend follow-up consultation.")
    if activity < 0.3:
        insights.append("Low activity readiness — ensure adequate recovery and hydration.")
    if sleep < 0.75:
        insights.append("Sub-optimal sleep duration detected — target 7-9 hours for full recovery.")
    if not insights:
        insights.append("Behavioral state within normal range — maintain current routine.")
    return insights
