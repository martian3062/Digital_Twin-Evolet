from django.contrib import admin
from .models import Vital, DigitalTwinState, GoogleFitToken

@admin.register(Vital)
class VitalAdmin(admin.ModelAdmin):
    list_display = ['patient', 'metric_type', 'value', 'unit', 'recorded_at', 'is_anomaly']
    list_filter = ['metric_type', 'is_anomaly', 'data_source']
    search_fields = ['patient__username']

@admin.register(DigitalTwinState)
class DigitalTwinAdmin(admin.ModelAdmin):
    list_display = ['patient', 'model_version', 'last_updated']

@admin.register(GoogleFitToken)
class GoogleFitTokenAdmin(admin.ModelAdmin):
    list_display = ['user', 'created_at', 'updated_at']
