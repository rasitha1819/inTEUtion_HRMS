from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Employee
from .serializers import EmployeeListSerializer, EmployeeDetailSerializer
from apps.authentication.permissions import IsHRorAdmin, IsAdminRole
from apps.authentication.models import RoleChoices


class EmployeeViewSet(viewsets.ModelViewSet):
    """
    CRUD API for Employee Management.
    - HR / Admin can create, edit, deactivate, and view all employees.
    - Employees can view their own details and directory list.
    """
    queryset = Employee.objects.select_related('user', 'department').all().order_by('employee_id')

    def get_serializer_class(self):
        if self.action == 'list':
            return EmployeeListSerializer
        return EmployeeDetailSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve', 'me']:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), IsHRorAdmin()]

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filtering options
        department_id = self.request.query_params.get('department')
        is_active = self.request.query_params.get('is_active')
        search = self.request.query_params.get('search')
        role = self.request.query_params.get('role')

        if department_id:
            queryset = queryset.filter(department_id=department_id)
        if is_active is not None:
            active_bool = is_active.lower() in ('true', '1')
            queryset = queryset.filter(is_active=active_bool)
        if role:
            queryset = queryset.filter(user__role=role)
        if search:
            queryset = queryset.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(employee_id__icontains=search) |
                Q(user__email__icontains=search) |
                Q(designation__icontains=search)
            )
        return queryset

    @action(detail=False, methods=['get'])
    def me(self, request):
        """Retrieve profile of the currently logged in employee."""
        if not hasattr(request.user, 'employee_profile') or not request.user.employee_profile:
            return Response(
                {"detail": "No employee profile associated with this account."},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = EmployeeDetailSerializer(request.user.employee_profile)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsHRorAdmin])
    def deactivate(self, request, pk=None):
        """Deactivate an employee and their corresponding user login."""
        employee = self.get_object()
        employee.is_active = False
        employee.save()
        if employee.user:
            employee.user.is_active = False
            employee.user.save()
        return Response({"detail": f"Employee {employee.employee_id} has been deactivated."}, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsHRorAdmin])
    def reactivate(self, request, pk=None):
        """Reactivate an employee and their corresponding user login."""
        employee = self.get_object()
        employee.is_active = True
        employee.save()
        if employee.user:
            employee.user.is_active = True
            employee.user.save()
        return Response({"detail": f"Employee {employee.employee_id} has been reactivated."}, status=status.HTTP_200_OK)
