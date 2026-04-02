import uuid
from django.db import models
from django.conf import settings


class Alert(models.Model):
    """Health alert triggered by anomaly detection."""
    
    class AlertType(models.TextChoices):
        ANOMALY = 'anomaly', 'Vitals Anomaly'
        EMERGENCY = 'emergency', 'Emergency'
        REMINDER = 'reminder', 'Reminder'
        PREDICTION = 'prediction', 'AI Prediction'

    class Severity(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'
        CRITICAL = 'critical', 'Critical'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alerts')
    alert_type = models.CharField(max_length=50, choices=AlertType.choices, default=AlertType.ANOMALY)
    severity = models.CharField(max_length=20, choices=Severity.choices, default=Severity.MEDIUM)
    metric_type = models.CharField(max_length=50, blank=True)
    metric_value = models.FloatField(null=True, blank=True)
    threshold_value = models.FloatField(null=True, blank=True)
    message = models.TextField()
    channels_notified = models.JSONField(default=list)
    acknowledged = models.BooleanField(default=False)
    acknowledged_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'alerts'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
        ]

    def __str__(self):
        return f"[{self.severity.upper()}] {self.alert_type}: {self.message[:50]}"


class AlertConfig(models.Model):
    """Per-patient alert thresholds and preferences."""
    
    patient = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='alert_config')
    custom_thresholds = models.JSONField(default=dict, help_text='Override default thresholds')
    notify_sms = models.BooleanField(default=True)
    notify_push = models.BooleanField(default=True)
    notify_call = models.BooleanField(default=False, help_text='Only for critical alerts')
    notify_email = models.BooleanField(default=True)
    emergency_contacts = models.JSONField(default=list)
    quiet_hours_start = models.TimeField(null=True, blank=True)
    quiet_hours_end = models.TimeField(null=True, blank=True)

    class Meta:
        db_table = 'alert_configs'

    def __str__(self):
        return f"Alert Config: {self.patient.username}"
