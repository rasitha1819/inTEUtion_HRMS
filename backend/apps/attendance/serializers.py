from rest_framework import serializers
from .models import Attendance, AttendanceStatus
from apps.employees.models import Employee


class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True, default=None)

    class Meta:
        model = Attendance
        fields = [
            'id', 'employee', 'employee_code', 'employee_name', 'department_name',
            'date', 'check_in_time', 'check_out_time', 'working_hours',
            'status', 'late_minutes', 'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'working_hours', 'late_minutes']


class CheckInSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class CheckOutSerializer(serializers.Serializer):
    notes = serializers.CharField(required=False, allow_blank=True)


class AttendanceSummarySerializer(serializers.Serializer):
    total_days = serializers.IntegerField()
    present_days = serializers.IntegerField()
    late_days = serializers.IntegerField()
    half_days = serializers.IntegerField()
    absent_days = serializers.IntegerField()
    on_leave_days = serializers.IntegerField()
    total_hours = serializers.FloatField()
    average_hours = serializers.FloatField()
