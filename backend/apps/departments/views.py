from rest_framework import viewsets, permissions
from .models import Department
from .serializers import DepartmentSerializer
from apps.authentication.permissions import IsHRorAdmin


class DepartmentViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing departments.
    - List / Retrieve: Available to all authenticated users.
    - Create / Update / Delete: Admin and HR only.
    """
    queryset = Department.objects.select_related('manager').order_by('name')
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsHRorAdmin()]
