from rest_framework import generics, status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from drf_spectacular.utils import extend_schema, OpenApiExample

from .models import CustomUser, RoleChoices
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserSerializer,
    ChangePasswordSerializer,
)
from .permissions import IsHRorAdmin


class CustomTokenObtainPairView(TokenObtainPairView):
    """Obtain JWT access and refresh token with user payload."""
    serializer_class = CustomTokenObtainPairSerializer


class UserProfileView(generics.RetrieveUpdateAPIView):
    """Retrieve or update authenticated user profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class UserListView(generics.ListAPIView):
    """List all user accounts (HR/Admin only)."""
    queryset = CustomUser.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsHRorAdmin]
    filterset_fields = ['role', 'is_active']


class ChangePasswordView(APIView):
    """Allow authenticated user to change their account password."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({"detail": "Password updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
