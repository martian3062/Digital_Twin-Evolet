from rest_framework import serializers
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import PatientProfile, DoctorProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'language_pref', 'wallet_address', 'did_identifier', 'phone_number']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    full_name = serializers.CharField(write_only=True, required=False, default="")

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role', 'full_name', 'phone_number', 'language_pref']

    def create(self, validated_data):
        full_name = validated_data.pop('full_name', '')
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)

        # Use username as fallback for full_name
        display_name = full_name or user.username

        # Auto-create profile based on role
        if user.role == User.Role.PATIENT:
            PatientProfile.objects.create(user=user, full_name=display_name)
        elif user.role == User.Role.DOCTOR:
            DoctorProfile.objects.create(user=user, full_name=display_name)

        return user


class PatientProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = PatientProfile
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class DoctorProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = DoctorProfile
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class EmailOrUsernameTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Allow JWT login with either username or email in the username field."""

    def validate(self, attrs):
        username = attrs.get(self.username_field, '')
        if username and '@' in username:
            try:
                user = User.objects.get(email__iexact=username)
                attrs[self.username_field] = user.get_username()
            except User.DoesNotExist:
                pass
        return super().validate(attrs)
