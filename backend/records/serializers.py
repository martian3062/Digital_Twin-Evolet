from rest_framework import serializers
from .models import MedicalRecord, Consultation, ConsentRecord


class MedicalRecordSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default='')

    class Meta:
        model = MedicalRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class ConsultationSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.username', read_only=True)
    doctor_name = serializers.CharField(source='doctor.username', read_only=True)

    class Meta:
        model = Consultation
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class ConsentRecordSerializer(serializers.ModelSerializer):
    patient_name = serializers.CharField(source='patient.username', read_only=True)
    grantee_name = serializers.CharField(source='grantee.username', read_only=True)

    class Meta:
        model = ConsentRecord
        fields = '__all__'
        read_only_fields = ['id', 'granted_at']
