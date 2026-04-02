from django.contrib import admin
from .models import MedicalRecord, Consultation, ConsentRecord

@admin.register(MedicalRecord)
class MedicalRecordAdmin(admin.ModelAdmin):
    list_display = ['title', 'patient', 'record_type', 'created_at']
    list_filter = ['record_type']

@admin.register(Consultation)
class ConsultationAdmin(admin.ModelAdmin):
    list_display = ['patient', 'doctor', 'status', 'created_at']
    list_filter = ['status']

@admin.register(ConsentRecord)
class ConsentRecordAdmin(admin.ModelAdmin):
    list_display = ['patient', 'grantee', 'granted_at', 'revoked_at']
