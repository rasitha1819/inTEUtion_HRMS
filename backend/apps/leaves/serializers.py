from rest_framework import serializers
from datetime import date
from .models import LeaveBalance, LeaveRequest, LeaveType, LeaveStatus
from apps.employees.models import Employee


class LeaveBalanceSerializer(serializers.ModelSerializer):
    remaining_days = serializers.IntegerField(read_only=True)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)

    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'employee', 'employee_name', 'leave_type',
            'leave_type_display', 'year', 'total_days',
            'used_days', 'remaining_days'
        ]
        read_only_fields = ['id', 'remaining_days']


class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.full_name', read_only=True)
    employee_code = serializers.CharField(source='employee.employee_id', read_only=True)
    department_name = serializers.CharField(source='employee.department.name', read_only=True, default=None)
    leave_type_display = serializers.CharField(source='get_leave_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_code', 'employee_name', 'department_name',
            'leave_type', 'leave_type_display', 'start_date', 'end_date',
            'total_days', 'reason', 'status', 'status_display',
            'reviewed_by', 'reviewed_by_name', 'review_comments',
            'applied_at', 'reviewed_at'
        ]
        read_only_fields = ['id', 'applied_at', 'reviewed_at', 'status', 'reviewed_by', 'review_comments']

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return obj.reviewed_by.get_full_name() or obj.reviewed_by.username
        return None

    def validate(self, attrs):
        start_date = attrs.get('start_date')
        end_date = attrs.get('end_date')

        if start_date and end_date:
            if start_date > end_date:
                raise serializers.ValidationError({"end_date": "End date cannot be prior to start date."})
            
            # Calculate total business/calendar days requested
            days_count = (end_date - start_date).days + 1
            attrs['total_days'] = days_count

            # Check leave balance if employee exists
            request = self.context.get('request')
            employee = attrs.get('employee')
            if not employee and request and hasattr(request.user, 'employee_profile'):
                employee = request.user.employee_profile
                attrs['employee'] = employee

            leave_type = attrs.get('leave_type')
            if employee and leave_type:
                current_year = start_date.year
                balance = LeaveBalance.objects.filter(
                    employee=employee,
                    leave_type=leave_type,
                    year=current_year
                ).first()

                if balance and balance.remaining_days < days_count:
                    raise serializers.ValidationError({
                        "leave_type": f"Insufficient balance. You requested {days_count} days, but only have {balance.remaining_days} days remaining for {leave_type}."
                    })

                # Monthly limit for Work From Home (WFH: 3 days/month)
                if leave_type == LeaveType.WFH:
                    month_requests = LeaveRequest.objects.filter(
                        employee=employee,
                        leave_type=LeaveType.WFH,
                        status__in=[LeaveStatus.APPROVED, LeaveStatus.PENDING],
                        start_date__year=start_date.year,
                        start_date__month=start_date.month
                    )
                    if self.instance:
                        month_requests = month_requests.exclude(id=self.instance.id)
                    month_used = sum(r.total_days for r in month_requests)
                    if month_used + days_count > 3:
                        raise serializers.ValidationError({
                            "leave_type": f"Work From Home is limited to 3 days per month. You already have {month_used} day(s) active for {start_date.strftime('%B %Y')}."
                        })

        return attrs


class LeaveApprovalSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=[LeaveStatus.APPROVED, LeaveStatus.REJECTED])
    review_comments = serializers.CharField(required=False, allow_blank=True)
