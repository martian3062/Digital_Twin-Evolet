import uuid
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from .models import MedicalRecord, Consultation, ConsentRecord
from .serializers import MedicalRecordSerializer, ConsultationSerializer, ConsentRecordSerializer


class MedicalRecordListCreateView(generics.ListCreateAPIView):
    serializer_class = MedicalRecordSerializer

    def get_queryset(self):
        patient_id = self.kwargs.get('patient_id', self.request.user.id)
        return MedicalRecord.objects.filter(patient_id=patient_id)

    def perform_create(self, serializer):
        serializer.save(patient=self.request.user, created_by=self.request.user)


class MedicalRecordDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MedicalRecordSerializer
    lookup_field = 'id'

    def get_queryset(self):
        return MedicalRecord.objects.filter(patient=self.request.user)


class ConsultationListCreateView(generics.ListCreateAPIView):
    serializer_class = ConsultationSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'doctor':
            return Consultation.objects.filter(doctor=user)
        return Consultation.objects.filter(patient=user)

    def perform_create(self, serializer):
        room_id = f"medgenie-{uuid.uuid4().hex[:12]}"
        serializer.save(patient=self.request.user, livekit_room=room_id)


class ConsultationDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = ConsultationSerializer
    lookup_field = 'id'

    def get_queryset(self):
        user = self.request.user
        return Consultation.objects.filter(patient=user) | Consultation.objects.filter(doctor=user)


class ConsultationRoomView(APIView):
    """Get LiveKit room token for consultation."""

    def get(self, request, id):
        try:
            consultation = Consultation.objects.get(id=id)
        except Consultation.DoesNotExist:
            return Response({'error': 'Consultation not found'}, status=404)

        # For MVP, return mock room info
        return Response({
            'room': consultation.livekit_room,
            'token': f"mock-token-{consultation.livekit_room}",
            'url': 'ws://localhost:7880',
        })
