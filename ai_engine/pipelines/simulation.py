"""Simulation pipeline for what-if scenarios."""


def run_simulation(patient_id: str, scenario: dict) -> dict:
    from models.digital_twin import DigitalTwin

    twin = DigitalTwin(patient_id)
    twin.update([{'metric_type': 'heart_rate', 'value': 72, 'hour': 12}])
    result = twin.simulate(scenario)

    return {
        'patient_id': patient_id,
        **result,
        'recommendations': _get_recommendations(scenario),
    }


def _get_recommendations(scenario):
    recs = []
    if scenario.get('increase_exercise'):
        recs.append('30 minutes of moderate cardio daily reduces cardiac risk by ~20%')
    if scenario.get('reduce_sodium'):
        recs.append('Limiting sodium to <2300mg/day can lower BP by 5-10 mmHg')
    if scenario.get('improve_sleep'):
        recs.append('7-9 hours of quality sleep improves cardiovascular markers')
    if scenario.get('quit_smoking'):
        recs.append('Respiratory risk drops 50% within 1 year of cessation')
    if not recs:
        recs.append('Maintain current healthy habits and regular monitoring')
    return recs
