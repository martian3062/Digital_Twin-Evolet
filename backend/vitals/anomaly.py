"""Simple anomaly detection for vitals using threshold-based rules."""

# Normal ranges for vital signs
VITAL_THRESHOLDS = {
    'heart_rate': {'min': 40, 'max': 150, 'unit': 'bpm'},
    'spo2': {'min': 88, 'max': 100, 'unit': '%'},
    'bp_systolic': {'min': 80, 'max': 180, 'unit': 'mmHg'},
    'bp_diastolic': {'min': 50, 'max': 120, 'unit': 'mmHg'},
    'body_temp': {'min': 35.0, 'max': 39.5, 'unit': '°C'},
    'respiratory_rate': {'min': 8, 'max': 30, 'unit': 'breaths/min'},
    'glucose': {'min': 50, 'max': 300, 'unit': 'mg/dL'},
}

SEVERITY_MAP = {
    'heart_rate': {
        'critical_low': 35, 'critical_high': 180,
        'warning_low': 45, 'warning_high': 140,
    },
    'spo2': {
        'critical_low': 85, 'critical_high': 101,
        'warning_low': 90, 'warning_high': 101,
    },
    'bp_systolic': {
        'critical_low': 70, 'critical_high': 200,
        'warning_low': 85, 'warning_high': 170,
    },
    'body_temp': {
        'critical_low': 34.0, 'critical_high': 41.0,
        'warning_low': 35.5, 'warning_high': 39.0,
    },
    'glucose': {
        'critical_low': 40, 'critical_high': 400,
        'warning_low': 60, 'warning_high': 250,
    },
}


def check_anomaly(vital):
    """Check if a vital reading is anomalous. Returns severity or None."""
    metric = vital.metric_type
    value = vital.value

    if metric not in VITAL_THRESHOLDS:
        return None

    thresholds = VITAL_THRESHOLDS[metric]
    if value < thresholds['min'] or value > thresholds['max']:
        # Determine severity
        severity = 'high'
        if metric in SEVERITY_MAP:
            sev = SEVERITY_MAP[metric]
            if value <= sev.get('critical_low', 0) or value >= sev.get('critical_high', 999):
                severity = 'critical'
            elif value <= sev.get('warning_low', 0) or value >= sev.get('warning_high', 999):
                severity = 'high'
            else:
                severity = 'medium'

        # Trigger alert
        _create_alert(vital, severity, thresholds)
        return True

    return False


def _create_alert(vital, severity, thresholds):
    """Create an alert record for anomalous vital."""
    from alerts.models import Alert

    message = (
        f"Anomalous {vital.get_metric_type_display()}: {vital.value} {vital.unit or thresholds.get('unit', '')}. "
        f"Normal range: {thresholds['min']}-{thresholds['max']} {thresholds.get('unit', '')}."
    )

    Alert.objects.create(
        patient=vital.patient,
        alert_type='anomaly',
        severity=severity,
        metric_type=vital.metric_type,
        metric_value=vital.value,
        threshold_value=thresholds['max'] if vital.value > thresholds['max'] else thresholds['min'],
        message=message,
    )
