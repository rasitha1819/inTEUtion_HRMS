from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta, date

from apps.employees.models import Employee
from apps.departments.models import Department
from apps.attendance.models import Attendance, AttendanceStatus
from apps.leaves.models import LeaveRequest, LeaveStatus, LeaveBalance


class DashboardMetricsView(APIView):
    """
    Consolidated analytics endpoint for HRMS dashboard.
    Returns role-adapted metrics for Admin, HR, and Employee.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = timezone.now().date()
        is_hr_admin = user.role in ['ADMIN', 'HR'] or user.is_superuser

        # 1. Base Employee Count
        total_employees = Employee.objects.count()
        active_employees = Employee.objects.filter(is_active=True).count()

        # 2. Today's Attendance Overview
        today_attendances = Attendance.objects.filter(date=today)
        present_count = today_attendances.filter(status=AttendanceStatus.PRESENT).count()
        late_count = today_attendances.filter(status=AttendanceStatus.LATE).count()
        half_day_count = today_attendances.filter(status=AttendanceStatus.HALF_DAY).count()
        on_leave_count = today_attendances.filter(status=AttendanceStatus.ON_LEAVE).count()
        
        checked_in_total = present_count + late_count + half_day_count
        # Expected attendance is total active employees minus those on leave
        absent_count = max(0, active_employees - checked_in_total - on_leave_count)

        # 3. Pending Leave Requests
        pending_leaves_count = LeaveRequest.objects.filter(status=LeaveStatus.PENDING).count()

        # 4. Department Distribution
        departments = Department.objects.annotate(
            total_members=Count('employees', filter=Q(employees__is_active=True))
        ).values('id', 'name', 'code', 'total_members')

        # 5. Last 7 Days Attendance Trend (for charts)
        trend_days = []
        for i in range(6, -1, -1):
            day_date = today - timedelta(days=i)
            day_records = Attendance.objects.filter(date=day_date)
            p_cnt = day_records.filter(status__in=[AttendanceStatus.PRESENT, AttendanceStatus.HALF_DAY]).count()
            l_cnt = day_records.filter(status=AttendanceStatus.LATE).count()
            ol_cnt = day_records.filter(status=AttendanceStatus.ON_LEAVE).count()
            
            trend_days.append({
                'date': day_date.strftime('%b %d'),
                'day': day_date.strftime('%a'),
                'present': p_cnt,
                'late': l_cnt,
                'on_leave': ol_cnt,
                'total_checked_in': p_cnt + l_cnt
            })

        # 6. Personal Stats if Employee Profile Exists
        user_stats = None
        if hasattr(user, 'employee_profile') and user.employee_profile:
            emp = user.employee_profile
            user_today_att = Attendance.objects.filter(employee=emp, date=today).first()
            user_month_atts = Attendance.objects.filter(
                employee=emp,
                date__year=today.year,
                date__month=today.month
            )
            user_leaves = LeaveBalance.objects.filter(employee=emp, year=today.year)

            user_stats = {
                'today_checked_in': user_today_att.check_in_time is not None if user_today_att else False,
                'today_checked_out': user_today_att.check_out_time is not None if user_today_att else False,
                'check_in_time': user_today_att.check_in_time.strftime('%H:%M:%S') if user_today_att and user_today_att.check_in_time else None,
                'check_out_time': user_today_att.check_out_time.strftime('%H:%M:%S') if user_today_att and user_today_att.check_out_time else None,
                'month_present_days': user_month_atts.filter(status=AttendanceStatus.PRESENT).count(),
                'month_late_days': user_month_atts.filter(status=AttendanceStatus.LATE).count(),
                'remaining_leave_days': sum(b.remaining_days for b in user_leaves),
                'pending_my_leaves': LeaveRequest.objects.filter(employee=emp, status=LeaveStatus.PENDING).count()
            }

        response_data = {
            'is_hr_admin': is_hr_admin,
            'summary': {
                'total_employees': total_employees,
                'active_employees': active_employees,
                'today_present': present_count,
                'today_late': late_count,
                'today_half_day': half_day_count,
                'today_on_leave': on_leave_count,
                'today_absent': absent_count,
                'checked_in_total': checked_in_total,
                'pending_leaves_count': pending_leaves_count,
                'attendance_rate': round((checked_in_total / max(1, active_employees)) * 100, 1)
            },
            'attendance_trends': trend_days,
            'department_distribution': list(departments),
            'user_stats': user_stats
        }

        return Response(response_data)
