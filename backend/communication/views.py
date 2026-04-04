from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import SignalMessage
import json

class SignalView(APIView):
    def post(self, request):
        room_id = request.data.get('room_id')
        sender_type = request.data.get('sender_type')
        signal_data = request.data.get('signal_data')

        if not all([room_id, sender_type, signal_data]):
            return Response({'error': 'Missing required fields'}, status=status.HTTP_400_BAD_REQUEST)

        SignalMessage.objects.create(
            room_id=room_id,
            sender_type=sender_type,
            signal_data=signal_data
        )

        return Response({'status': 'sent'}, status=status.HTTP_201_CREATED)

    def get(self, request, room_id):
        # Retrieve signals for this room that were sent BY THE OTHER PARTY
        # In a real app we'd use a more robust way to differentiate.
        # Here we just get all for simplicity and the frontend will filter if needed.
        signals = SignalMessage.objects.filter(room_id=room_id).order_by('timestamp')
        
        # Optionally, delete old signals (older than 5 mins) to keep clean
        expiry = timezone.now() - timedelta(minutes=5)
        SignalMessage.objects.filter(timestamp__lt=expiry).delete()

        data = [{
            'id': s.id,
            'sender_type': s.sender_type,
            'signal_data': s.signal_data,
            'timestamp': s.timestamp
        } for s in signals]

        return Response(data)

class ClearRoomSignalsView(APIView):
    def delete(self, request, room_id):
        SignalMessage.objects.filter(room_id=room_id).delete()
        return Response({'status': 'cleared'})
