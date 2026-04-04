import logging
import threading
import httpx
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import Vital, DigitalTwinState

from alerts.models import Alert

logger = logging.getLogger(__name__)

def trigger_ai_update(patient_id, vitals_data):
    """Background thread to trigger AI Engine update and check for alerts."""
    try:
        # 1. Trigger AI Engine Prediction & Risk Scoring
        response = httpx.post(
            f"{settings.AI_ENGINE_URL}/predict",
            json={
                'patient_id': str(patient_id),
                'data': {'vitals': vitals_data}
            },
            timeout=10,
        )
        ai_data = response.json()

        # 2. Update DigitalTwinState in DB
        if ai_data.get('status') != 'error':
            risk_scores = ai_data.get('risk_scores', {})
            DigitalTwinState.objects.update_or_create(
                patient_id=patient_id,
                defaults={
                    'risk_scores': risk_scores,
                    'predicted_events': ai_data.get('predictions', []),
                    'model_version': ai_data.get('model_version', 'v0.1.0')
                }
            )
            
            # 3. Threshold-based Autonomous Alerting
            thresholds = {
                'cardiac': 0.8,
                'respiratory': 0.75,
                'hypertension': 0.85,
                'stroke': 0.7
            }
            
            for risk_type, score in risk_scores.items():
                if score >= thresholds.get(risk_type, 0.9):
                    severity = Alert.Severity.CRITICAL if score > 0.9 else Alert.Severity.HIGH
                    
                    # Prevent duplicate active alerts for same risk type within last hour
                    from django.utils import timezone
                    from datetime import timedelta
                    one_hour_ago = timezone.now() - timedelta(hours=1)
                    
                    recent_alert = Alert.objects.filter(
                        patient_id=patient_id,
                        metric_type=risk_type,
                        created_at__gt=one_hour_ago,
                        acknowledged=False
                    ).exists()
                    
                    if not recent_alert:
                        Alert.objects.create(
                            patient_id=patient_id,
                            alert_type=Alert.AlertType.PREDICTION,
                            severity=severity,
                            metric_type=risk_type,
                            metric_value=score,
                            threshold_value=thresholds.get(risk_type),
                            message=f"Critical {risk_type.capitalize()} risk detected by AI: {score*100:.1f}%. Immediate clinical review recommended."
                        )
                        logger.warning(f"AI Alert triggered for patient {patient_id}: {risk_type} risk @ {score}")
            
            logger.info(f"Successfully updated Digital Twin state for patient {patient_id}")
    except Exception as e:
        logger.error(f"Failed to trigger AI update: {e}")

@receiver(post_save, sender=Vital)
def handle_vital_saved(sender, instance, created, **kwargs):
    """Trigger AI processing when a new vital reading is recorded."""
    if created:
        # Get recent vitals for context (last 24-48 hours)
        recent_vitals = Vital.objects.filter(
            patient=instance.patient
        ).order_by('-recorded_at')[:50]
        
        vitals_payload = [
            {
                'metric_type': v.metric_type,
                'value': v.value,
                'recorded_at': v.recorded_at.isoformat(),
            }
            for v in recent_vitals
        ]

        # Run AI update in background thread to avoid blocking request
        thread = threading.Thread(
            target=trigger_ai_update, 
            args=(instance.patient.id, vitals_payload)
        )
        thread.start()
