from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from datetime import timedelta

from .models import LeaveBalance, LeaveRequest, LeaveStatus, LeaveType
from .serializers import (
    LeaveBalanceSerializer,
    LeaveRequestSerializer,
    LeaveApprovalSerializer,
)
from apps.authentication.permissions import IsHRorAdmin
from apps.attendance.models import Attendance, AttendanceStatus


class LeaveBalanceViewSet(viewsets.ReadOnlyModelViewSet):
    """View leave balances for employees."""
    queryset = LeaveBalance.objects.select_related('employee', 'employee__user').all()
    serializer_class = LeaveBalanceSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()
        if user.role == 'EMPLOYEE' and not user.is_superuser:
            if hasattr(user, 'employee_profile') and user.employee_profile:
                return queryset.filter(employee=user.employee_profile)
            return LeaveBalance.objects.none()
        
        emp_id = self.request.query_params.get('employee_id')
        if emp_id:
            queryset = queryset.filter(employee__employee_id=emp_id)
        return queryset

    @action(detail=False, methods=['get'])
    def my_balances(self, request):
        """Returns the current year's leave balances for the logged-in user."""
        if not hasattr(request.user, 'employee_profile') or not request.user.employee_profile:
            return Response([])
        current_year = timezone.now().year
        balances = LeaveBalance.objects.filter(
            employee=request.user.employee_profile,
            year=current_year
        )
        serializer = self.get_serializer(balances, many=True)
        return Response(serializer.data)


class LeaveRequestViewSet(viewsets.ModelViewSet):
    """
    Manage Leave Applications.
    - Employees apply for leave, view status, and cancel pending requests.
    - HR & Admins review, approve, and reject requests.
    """
    queryset = LeaveRequest.objects.select_related(
        'employee', 'employee__department', 'employee__user', 'reviewed_by'
    ).all()
    serializer_class = LeaveRequestSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = super().get_queryset()

        if user.role == 'EMPLOYEE' and not user.is_superuser:
            if hasattr(user, 'employee_profile') and user.employee_profile:
                queryset = queryset.filter(employee=user.employee_profile)
            else:
                return LeaveRequest.objects.none()

        status_param = self.request.query_params.get('status')
        department_id = self.request.query_params.get('department_id')
        employee_id = self.request.query_params.get('employee_id')

        if status_param:
            queryset = queryset.filter(status=status_param)
        if department_id:
            queryset = queryset.filter(employee__department_id=department_id)
        if employee_id:
            queryset = queryset.filter(employee__employee_id=employee_id)

        return queryset

    def perform_create(self, serializer):
        user = self.request.user
        if hasattr(user, 'employee_profile') and user.employee_profile:
            serializer.save(employee=user.employee_profile)
        else:
            serializer.save()

    @action(detail=False, methods=['get'])
    def my_requests(self, request):
        """List current user's leave requests."""
        if not hasattr(request.user, 'employee_profile') or not request.user.employee_profile:
            return Response([])
        requests = self.get_queryset().filter(employee=request.user.employee_profile)
        serializer = self.get_serializer(requests, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated, IsHRorAdmin])
    def pending(self, request):
        """List all pending leave requests for HR review."""
        pending_requests = self.get_queryset().filter(status=LeaveStatus.PENDING)
        serializer = self.get_serializer(pending_requests, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsHRorAdmin])
    def approve(self, request, pk=None):
        """Approve a leave request and deduct leave balance & populate attendance records."""
        leave_request = self.get_object()

        if leave_request.status != LeaveStatus.PENDING:
            return Response(
                {"detail": f"Leave request is already {leave_request.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        comments = request.data.get('review_comments', '')

        with transaction.atomic():
            leave_request.status = LeaveStatus.APPROVED
            leave_request.reviewed_by = request.user
            leave_request.review_comments = comments
            leave_request.reviewed_at = timezone.now()
            leave_request.save()

            # Deduct balance
            year = leave_request.start_date.year
            balance, _ = LeaveBalance.objects.get_or_create(
                employee=leave_request.employee,
                leave_type=leave_request.leave_type,
                year=year,
                defaults={'total_days': 12, 'used_days': 0}
            )
            balance.used_days += leave_request.total_days
            balance.save()

            # Create or update Attendance records for leave duration
            curr_date = leave_request.start_date
            while curr_date <= leave_request.end_date:
                # Skip weekends (Saturday=5, Sunday=6)
                if curr_date.weekday() < 5:
                    Attendance.objects.update_or_create(
                        employee=leave_request.employee,
                        date=curr_date,
                        defaults={
                            'status': AttendanceStatus.ON_LEAVE,
                            'notes': f"On Leave ({leave_request.leave_type})"
                        }
                    )
                curr_date += timedelta(days=1)

        return Response({
            "detail": "Leave request approved successfully.",
            "leave_request": LeaveRequestSerializer(leave_request).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated, IsHRorAdmin])
    def reject(self, request, pk=None):
        """Reject a leave request with mandatory or optional review comments."""
        leave_request = self.get_object()

        if leave_request.status != LeaveStatus.PENDING:
            return Response(
                {"detail": f"Leave request is already {leave_request.status}."},
                status=status.HTTP_400_BAD_REQUEST
            )

        comments = request.data.get('review_comments', 'Rejected by HR/Management')

        leave_request.status = LeaveStatus.REJECTED
        leave_request.reviewed_by = request.user
        leave_request.review_comments = comments
        leave_request.reviewed_at = timezone.now()
        leave_request.save()

        return Response({
            "detail": "Leave request rejected.",
            "leave_request": LeaveRequestSerializer(leave_request).data
        }, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def cancel(self, request, pk=None):
        """Allow applicant to cancel a pending leave request."""
        leave_request = self.get_object()

        if hasattr(request.user, 'employee_profile') and leave_request.employee != request.user.employee_profile:
            if not request.user.role in ['ADMIN', 'HR']:
                return Response({"detail": "Not authorized to cancel this request."}, status=status.HTTP_403_FORBIDDEN)

        if leave_request.status != LeaveStatus.PENDING:
            return Response({"detail": "Only pending leave requests can be cancelled."}, status=status.HTTP_400_BAD_REQUEST)

        leave_request.status = LeaveStatus.CANCELLED
        leave_request.save()
        return Response({"detail": "Leave request cancelled successfully."}, status=status.HTTP_200_OK)
