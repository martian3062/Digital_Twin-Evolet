from django.contrib import admin
from .models import Alert, AlertConfig

@admin.register(Alert)
class AlertAdmin(admin.ModelAdmin):
    list_display = ['patient', 'alert_type', 'severity', 'message', 'acknowledged', 'created_at']
    list_filter = ['severity', 'alert_type', 'acknowledged']

@admin.register(AlertConfig)
class AlertConfigAdmin(admin.ModelAdmin):
    list_display = ['patient', 'notify_sms', 'notify_push', 'notify_call']
