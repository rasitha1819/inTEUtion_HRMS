from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db.models import Sum, Avg, Count, Q
from datetime import datetime, date, timedelta

from .models import Attendance, AttendanceStatus
from .serializers import (
    AttendanceSerializer,
    CheckInSerializer,
    CheckOutSerializer,
    AttendanceSummarySerializer,
)
from apps.authentication.permissions import IsHRorAdmin
from apps.employees.models import Employee


class AttendanceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Attendance Tracking & History.
    - Employees can view their own history and punch Check-in / Check-out.
    - HR & Admins can view/filter team attendance and edit records.
    """
    queryset = Attendance.objects.select_related('employee', 'employee__department', 'employee__user').all()
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        # If standard employee, restrict to own records by default unless HR/Admin
        if user.role == 'EMPLOYEE' and not user.is_superuser:
            if hasattr(user, 'employee_profile') and user.employee_profile:
                queryset = queryset.filter(employee=user.employee_profile)
            else:
                return Attendance.objects.none()

        # Filters
        employee_id = self.request.query_params.get('employee_id')
        department_id = self.request.query_params.get('department_id')
        attendance_status = self.request.query_params.get('status')
        filter_date = self.request.query_params.get('date')
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')

        if employee_id:
            queryset = queryset.filter(employee__employee_id=employee_id)
        if department_id:
            queryset = queryset.filter(employee__department_id=department_id)
        if attendance_status:
            queryset = queryset.filter(status=attendance_status)
        if filter_date:
            queryset = queryset.filter(date=filter_date)
        if start_date:
            queryset = queryset.filter(date__gte=start_date)
        if end_date:
            queryset = queryset.filter(date__lte=end_date)

        return queryset

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_in(self, request):
        """Record daily punch-in timestamp for the authenticated employee."""
        if not hasattr(request.user, 'employee_profile') or not request.user.employee_profile:
            return Response({"detail": "Employee profile required to check in."}, status=status.HTTP_400_BAD_REQUEST)

        employee = request.user.employee_profile
        today = timezone.now().date()
        current_time = timezone.localtime().time()

        # Check if already checked in today
        attendance, created = Attendance.objects.get_or_create(
            employee=employee,
            date=today,
            defaults={
                'check_in_time': current_time,
                'notes': request.data.get('notes', '')
            }
        )

        if not created:
            if attendance.check_in_time:
                return Response(
                    {"detail": f"Already checked in today at {attendance.check_in_time.strftime('%H:%M:%S')}."},
                    status=status.HTTP_400_BAD_REQUEST
                )
            attendance.check_in_time = current_time
            if request.data.get('notes'):
                attendance.notes = request.data.get('notes')

        attendance.calculate_hours_and_status()
        attendance.save()

        serializer = AttendanceSerializer(attendance)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def check_out(self, request):
        """Record punch-out timestamp and calculate total working hours."""
        if not hasattr(request.user, 'employee_profile') or not request.user.employee_profile:
            return Response({"detail": "Employee profile required to check out."}, status=status.HTTP_400_BAD_REQUEST)

        employee = request.user.employee_profile
        today = timezone.now().date()
        current_time = timezone.localtime().time()

        try:
            attendance = Attendance.objects.get(employee=employee, date=today)
        except Attendance.DoesNotExist:
            return Response({"detail": "No check-in record found for today. Please check in first."}, status=status.HTTP_400_BAD_REQUEST)

        if attendance.check_out_time:
            return Response(
                {"detail": f"Already checked out today at {attendance.check_out_time.strftime('%H:%M:%S')}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        attendance.check_out_time = current_time
        if request.data.get('notes'):
            attendance.notes = f"{attendance.notes or ''} | {request.data.get('notes')}".strip(' |')

        attendance.calculate_hours_and_status()
        attendance.save()

        serializer = AttendanceSerializer(attendance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def today(self, request):
        """Get today's check-in status for the logged-in user."""
        if not hasattr(request.user, 'employee_profile') or not request.user.employee_profile:
            return Response({"has_profile": False, "checked_in": False, "checked_out": False})

        employee = request.user.employee_profile
        today = timezone.now().date()

        attendance = Attendance.objects.filter(employee=employee, date=today).first()
        if not attendance:
            return Response({
                "has_profile": True,
                "checked_in": False,
                "checked_out": False,
                "attendance": None
            })

        return Response({
            "has_profile": True,
            "checked_in": attendance.check_in_time is not None,
            "checked_out": attendance.check_out_time is not None,
            "attendance": AttendanceSerializer(attendance).data
        })

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def summary(self, request):
        """Summary metrics for the current employee or specified period."""
        user = request.user
        employee = None

        target_emp_id = request.query_params.get('employee_id')
        if target_emp_id and user.role in ['ADMIN', 'HR']:
            employee = Employee.objects.filter(employee_id=target_emp_id).first()
        elif hasattr(user, 'employee_profile'):
            employee = user.employee_profile

        if not employee:
            return Response({"detail": "Employee profile not found."}, status=status.HTTP_404_NOT_FOUND)

        # Date boundaries
        month = request.query_params.get('month')
        year = request.query_params.get('year', timezone.now().year)

        queryset = Attendance.objects.filter(employee=employee)
        if month:
            queryset = queryset.filter(date__year=year, date__month=month)
        else:
            queryset = queryset.filter(date__year=year)

        total_days = queryset.count()
        present_days = queryset.filter(status=AttendanceStatus.PRESENT).count()
        late_days = queryset.filter(status=AttendanceStatus.LATE).count()
        half_days = queryset.filter(status=AttendanceStatus.HALF_DAY).count()
        absent_days = queryset.filter(status=AttendanceStatus.ABSENT).count()
        on_leave_days = queryset.filter(status=AttendanceStatus.ON_LEAVE).count()

        hours_agg = queryset.aggregate(total=Sum('working_hours'), avg=Avg('working_hours'))
        total_hours = float(hours_agg['total'] or 0.0)
        avg_hours = round(float(hours_agg['avg'] or 0.0), 2)

        data = {
            'total_days': total_days,
            'present_days': present_days,
            'late_days': late_days,
            'half_days': half_days,
            'absent_days': absent_days,
            'on_leave_days': on_leave_days,
            'total_hours': total_hours,
            'average_hours': avg_hours,
        }
        return Response(data)
