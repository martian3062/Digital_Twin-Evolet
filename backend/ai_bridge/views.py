"""AI Bridge — proxy service for AI Engine communication."""
from rest_framework.views import APIView
from rest_framework.response import Response
from django.conf import settings
import httpx
import logging

logger = logging.getLogger(__name__)


class PredictView(APIView):
    """Forward prediction request to AI engine."""

    def post(self, request):
        try:
            response = httpx.post(
                f"{settings.AI_ENGINE_URL}/predict",
                json={
                    'patient_id': str(request.user.id),
                    'data': request.data,
                },
                timeout=30,
            )
            return Response(response.json())
        except httpx.ConnectError:
            # Fallback to mock prediction
            return Response({
                'predictions': [
                    {'condition': 'Hypertension Risk', 'probability': 0.23, 'timeframe': '7 days'},
                    {'condition': 'Sleep Apnea Indicator', 'probability': 0.12, 'timeframe': '14 days'},
                    {'condition': 'Stress Episode', 'probability': 0.31, 'timeframe': '48 hours'},
                ],
                'model_version': 'mock-v0.1',
                'status': 'ai_engine_offline_using_mock',
            })


class RiskScoreView(APIView):
    """Get risk scores from AI engine."""

    def post(self, request):
        try:
            response = httpx.post(
                f"{settings.AI_ENGINE_URL}/risk-score",
                json={'patient_id': str(request.user.id)},
                timeout=30,
            )
            return Response(response.json())
        except httpx.ConnectError:
            import random
            return Response({
                'risk_scores': {
                    'cardiac': round(random.uniform(0.05, 0.35), 3),
                    'diabetes': round(random.uniform(0.1, 0.4), 3),
                    'respiratory': round(random.uniform(0.02, 0.2), 3),
                    'hypertension': round(random.uniform(0.1, 0.5), 3),
                    'stroke': round(random.uniform(0.01, 0.15), 3),
                    'overall_health': round(random.uniform(0.6, 0.95), 3),
                },
                'model_version': 'mock-v0.1',
                'status': 'ai_engine_offline_using_mock',
            })
