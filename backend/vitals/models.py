import uuid
from django.db import models
from django.conf import settings


class Vital(models.Model):
    """Individual vital sign measurement from wearable or manual input."""
    
    class DataSource(models.TextChoices):
        GOOGLE_FIT = 'google_fit', 'Google Fit'
        HEALTH_CONNECT = 'health_connect', 'Health Connect'
        MANUAL = 'manual', 'Manual Entry'
        DEVICE = 'device', 'IoT Device'

    class MetricType(models.TextChoices):
        HEART_RATE = 'heart_rate', 'Heart Rate'
        SPO2 = 'spo2', 'Blood Oxygen (SpO2)'
        BLOOD_PRESSURE_SYS = 'bp_systolic', 'Blood Pressure (Systolic)'
        BLOOD_PRESSURE_DIA = 'bp_diastolic', 'Blood Pressure (Diastolic)'
        STEPS = 'steps', 'Steps'
        SLEEP_DURATION = 'sleep_duration', 'Sleep Duration'
        SLEEP_QUALITY = 'sleep_quality', 'Sleep Quality'
        BODY_TEMP = 'body_temp', 'Body Temperature'
        RESPIRATORY_RATE = 'respiratory_rate', 'Respiratory Rate'
        CALORIES = 'calories', 'Calories Burned'
        WEIGHT = 'weight', 'Weight'
        GLUCOSE = 'glucose', 'Blood Glucose'
        ACTIVITY_MINUTES = 'activity_minutes', 'Active Minutes'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vitals')
    data_source = models.CharField(max_length=50, choices=DataSource.choices, default=DataSource.MANUAL)
    metric_type = models.CharField(max_length=50, choices=MetricType.choices)
    value = models.FloatField()
    unit = models.CharField(max_length=20, blank=True)
    recorded_at = models.DateTimeField()
    synced_at = models.DateTimeField(auto_now_add=True)
    is_anomaly = models.BooleanField(default=False)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'vitals'
        ordering = ['-recorded_at']
        indexes = [
            models.Index(fields=['patient', '-recorded_at']),
            models.Index(fields=['metric_type', '-recorded_at']),
        ]

    def __str__(self):
        return f"{self.patient.username} - {self.metric_type}: {self.value} @ {self.recorded_at}"


class DigitalTwinState(models.Model):
    """Current state of a patient's digital twin."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    patient = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='digital_twin')
    risk_scores = models.JSONField(default=dict, help_text='{"cardiac": 0.3, "diabetes": 0.7}')
    active_conditions = models.JSONField(default=list)
    predicted_events = models.JSONField(default=list)
    graph_snapshot = models.JSONField(default=dict)
    last_updated = models.DateTimeField(auto_now=True)
    model_version = models.CharField(max_length=50, default='v0.1.0')

    class Meta:
        db_table = 'digital_twin_state'

    def __str__(self):
        return f"Twin: {self.patient.username} (v{self.model_version})"


class GoogleFitToken(models.Model):
    """Stored OAuth2 token for Google Fit API access."""
    
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='google_fit_token')
    access_token = models.TextField()
    refresh_token = models.TextField()
    token_expiry = models.DateTimeField()
    scopes = models.TextField(default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'google_fit_tokens'

    def __str__(self):
        return f"GFit Token: {self.user.username}"
