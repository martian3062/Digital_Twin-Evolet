from rest_framework import serializers
from .models import Vital, DigitalTwinState


class VitalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vital
        fields = '__all__'
        read_only_fields = ['id', 'synced_at', 'is_anomaly']


class VitalCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vital
        fields = ['metric_type', 'value', 'unit', 'recorded_at', 'data_source', 'metadata']

    def create(self, validated_data):
        validated_data['patient'] = self.context['request'].user
        vital = Vital.objects.create(**validated_data)
        
        # Check for anomalies
        from .anomaly import check_anomaly
        is_anomaly = check_anomaly(vital)
        if is_anomaly:
            vital.is_anomaly = True
            vital.save()
        
        return vital


class DigitalTwinSerializer(serializers.ModelSerializer):
    class Meta:
        model = DigitalTwinState
        fields = '__all__'
        read_only_fields = ['id', 'last_updated']


class VitalsBatchSerializer(serializers.Serializer):
    """For Google Fit bulk sync."""
    vitals = VitalCreateSerializer(many=True)

    def create(self, validated_data):
        patient = self.context['request'].user
        vitals = []
        for vital_data in validated_data['vitals']:
            vital_data['patient'] = patient
            vitals.append(Vital(**vital_data))
        return Vital.objects.bulk_create(vitals)
