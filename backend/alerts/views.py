from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import Alert, AlertConfig
from .serializers import AlertSerializer, AlertConfigSerializer


class AlertListView(generics.ListAPIView):
    serializer_class = AlertSerializer

    def get_queryset(self):
        qs = Alert.objects.filter(patient=self.request.user)
        severity = self.request.query_params.get('severity')
        if severity:
            qs = qs.filter(severity=severity)
        unread = self.request.query_params.get('unread')
        if unread == 'true':
            qs = qs.filter(acknowledged=False)
        return qs


class AlertAcknowledgeView(APIView):
    def post(self, request, id):
        try:
            alert = Alert.objects.get(id=id, patient=request.user)
            alert.acknowledged = True
            alert.acknowledged_at = timezone.now()
            alert.save()
            return Response(AlertSerializer(alert).data)
        except Alert.DoesNotExist:
            return Response({'error': 'Alert not found'}, status=404)


class AlertConfigView(generics.RetrieveUpdateAPIView):
    serializer_class = AlertConfigSerializer

    def get_object(self):
        config, _ = AlertConfig.objects.get_or_create(patient=self.request.user)
        return config


class AlertStatsView(APIView):
    def get(self, request):
        alerts = Alert.objects.filter(patient=request.user)
        return Response({
            'total': alerts.count(),
            'unacknowledged': alerts.filter(acknowledged=False).count(),
            'critical': alerts.filter(severity='critical', acknowledged=False).count(),
            'high': alerts.filter(severity='high', acknowledged=False).count(),
            'by_type': {
                'anomaly': alerts.filter(alert_type='anomaly').count(),
                'emergency': alerts.filter(alert_type='emergency').count(),
                'prediction': alerts.filter(alert_type='prediction').count(),
            }
        })
