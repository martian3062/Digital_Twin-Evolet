from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import get_user_model
from .serializers import RegisterSerializer, UserSerializer, PatientProfileSerializer, DoctorProfileSerializer
from .models import PatientProfile, DoctorProfile

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """Register a new patient or doctor."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response({
            'user': UserSerializer(user).data,
            'message': 'Registration successful'
        }, status=status.HTTP_201_CREATED)


class MeView(APIView):
    """Get current authenticated user info."""
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        data = serializer.data

        # Attach profile
        if request.user.role == 'patient' and hasattr(request.user, 'patient_profile'):
            data['profile'] = PatientProfileSerializer(request.user.patient_profile).data
        elif request.user.role == 'doctor' and hasattr(request.user, 'doctor_profile'):
            data['profile'] = DoctorProfileSerializer(request.user.doctor_profile).data

        return Response(data)


class PatientProfileView(generics.RetrieveUpdateAPIView):
    """Get/update patient profile."""
    serializer_class = PatientProfileSerializer

    def get_object(self):
        return PatientProfile.objects.get(user=self.request.user)


class DoctorProfileView(generics.RetrieveUpdateAPIView):
    """Get/update doctor profile."""
    serializer_class = DoctorProfileSerializer

    def get_object(self):
        return DoctorProfile.objects.get(user=self.request.user)


class AvailableDoctorsView(generics.ListAPIView):
    """List available doctors for consultation."""
    serializer_class = DoctorProfileSerializer
    queryset = DoctorProfile.objects.filter(available=True)
