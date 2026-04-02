from rest_framework import serializers
from .models import Alert, AlertConfig


class AlertSerializer(serializers.ModelSerializer):
    class Meta:
        model = Alert
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class AlertConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = AlertConfig
        fields = '__all__'
        read_only_fields = ['patient']
