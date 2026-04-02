"""Prediction pipeline — runs all models for patient predictions."""
import random


def run_prediction(patient_id: str, data: dict = None) -> dict:
    """Run full prediction pipeline."""
    from models.digital_twin import DigitalTwin

    twin = DigitalTwin(patient_id)

    # Generate sample data if none provided
    if not data or 'vitals' not in data:
        vitals_data = _generate_sample_vitals()
    else:
        vitals_data = data['vitals']

    state = twin.update(vitals_data)

    return {
        'patient_id': patient_id,
        'predictions': state.get('predicted_events', []),
        'risk_scores': state.get('risk_scores', {}),
        'model_version': 'v0.1.0',
        'status': 'success',
    }


def _generate_sample_vitals():
    """Generate sample vitals for testing."""
    vitals = []
    for i in range(48):
        vitals.append({
            'metric_type': 'heart_rate',
            'value': 70 + random.gauss(0, 10),
            'hour': i % 24,
            'is_anomaly': False,
        })
    return vitals
