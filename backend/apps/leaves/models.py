from django.db import models
from django.conf import settings
from django.utils import timezone


class LeaveType(models.TextChoices):
    CASUAL = 'CASUAL', 'Casual Leave'
    SICK = 'SICK', 'Sick Leave'
    EARNED = 'EARNED', 'Earned Leave'
    MATERNITY = 'MATERNITY', 'Maternity Leave'
    PATERNITY = 'PATERNITY', 'Paternity Leave'
    WFH = 'WFH', 'Work From Home'


class LeaveStatus(models.TextChoices):
    PENDING = 'PENDING', 'Pending Approval'
    APPROVED = 'APPROVED', 'Approved'
    REJECTED = 'REJECTED', 'Rejected'
    CANCELLED = 'CANCELLED', 'Cancelled'


class LeaveBalance(models.Model):
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='leave_balances'
    )
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices)
    year = models.IntegerField(default=timezone.now().year)
    total_days = models.IntegerField(default=12)
    used_days = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'leave_type', 'year')
        ordering = ['employee', 'leave_type']

    def __str__(self):
        return f"{self.employee.employee_id} - {self.leave_type}: {self.remaining_days}/{self.total_days}"

    @property
    def remaining_days(self):
        return max(0, self.total_days - self.used_days)


class LeaveRequest(models.Model):
    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='leave_requests'
    )
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices, default=LeaveType.CASUAL)
    start_date = models.DateField()
    end_date = models.DateField()
    total_days = models.IntegerField(default=1)
    reason = models.TextField()
    status = models.CharField(
        max_length=20,
        choices=LeaveStatus.choices,
        default=LeaveStatus.PENDING
    )
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_leaves'
    )
    review_comments = models.TextField(blank=True, null=True)
    applied_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-applied_at']
        verbose_name = 'Leave Request'
        verbose_name_plural = 'Leave Requests'

    def __str__(self):
        return f"{self.employee.full_name} ({self.leave_type}) - {self.status}"
