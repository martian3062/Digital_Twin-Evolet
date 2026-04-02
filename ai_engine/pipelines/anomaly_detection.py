"""Anomaly detection pipeline with severity context."""

def detect_anomalies(patient_id: str, data: dict = None) -> dict:
    # Defining core ranges for alerting
    THRESHOLDS = {
        'heart_rate': {'low': 50, 'high': 120, 'crit_low': 40, 'crit_high': 150},
        'spo2': {'low': 94, 'high': 100, 'crit_low': 88, 'crit_high': 100},
        'blood_pressure_systolic': {'low': 90, 'high': 140, 'crit_low': 80, 'crit_high': 180},
    }

    anomalies = []
    if data and 'vitals' in data:
        for vital in data['vitals']:
            metric = vital.get('metric_type', '')
            value = vital.get('value', 0)
            
            if metric in THRESHOLDS:
                t = THRESHOLDS[metric]
                # Critical check first
                if value < t['crit_low'] or value > t['crit_high']:
                    anomalies.append({
                        'metric': metric,
                        'value': value,
                        'severity': 'critical',
                        'message': f"CRITICAL: {metric.replace('_', ' ').title()} is {value} (Normal: {t['low']}-{t['high']})",
                    })
                # Warning check
                elif value < t['low'] or value > t['high']:
                    anomalies.append({
                        'metric': metric,
                        'value': value,
                        'severity': 'warning',
                        'message': f"WARNING: {metric.replace('_', ' ').title()} is {value} (Normal: {t['low']}-{t['high']})",
                    })

    return {
        'patient_id': patient_id,
        'anomalies': anomalies,
        'total': len(anomalies),
        'timestamp': data.get('timestamp') if data else None
    }
