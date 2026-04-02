"""Risk scoring pipeline with physiological correlation."""
import random

def calculate_risk_scores(patient_id: str, vitals_data: list = None) -> dict:
    """
    Calculates weighted risk scores based on correlated vital signs.
    """
    # Simulated correlations for the demonstration
    # In a real system, this would pull from PyTorch model inference
    
    # Extract recent vitals (mocked if not provided)
    hr = 75
    spo2 = 98
    sys_bp = 120
    
    if vitals_data:
        # Example logic to extract from vitals list
        for v in vitals_data:
            if v.get('metric_type') == 'heart_rate': hr = v.get('value', 75)
            elif v.get('metric_type') == 'spo2': spo2 = v.get('value', 98)
            elif v.get('metric_type') == 'blood_pressure_systolic': sys_bp = v.get('value', 120)

    # Core scoring logic
    # Cardiac Risk: HR stress + BP elevation
    hr_risk = max(0, (hr - 100) / 60) if hr > 100 else 0
    bp_risk = max(0, (sys_bp - 140) / 60) if sys_bp > 140 else 0
    cardiac = min(0.95, 0.1 + (hr_risk * 0.7) + (bp_risk * 0.3))

    # Respiratory Risk: SpO2 drop is the primary driver
    resp_risk = max(0, (95 - spo2) / 10) if spo2 < 95 else 0
    respiratory = min(0.95, 0.05 + resp_risk)

    # Overall Health: Inverse of 1.0 (1.0 = Perfect Health, 0.0 = Critical)
    # We'll normalize so higher = better for 'overall_health' to match the frontend expectation
    raw_weighted_risk = (cardiac * 0.4) + (respiratory * 0.4) + (random.uniform(0.1, 0.2) * 0.2)
    overall_health = max(0.05, min(0.98, 1.0 - raw_weighted_risk))

    return {
        'patient_id': patient_id,
        'risk_scores': {
            'cardiac': round(cardiac, 3),
            'diabetes': round(random.uniform(0.15, 0.25), 3),
            'respiratory': round(respiratory, 3),
            'hypertension': round(bp_risk, 3),
            'stroke': round(0.1 + (bp_risk * 0.4), 3),
            'overall_health': round(overall_health, 3),
        },
        'model_version': 'v1.0.0-multi-metric',
    }
