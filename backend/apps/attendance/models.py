from django.db import models
from django.utils import timezone
from datetime import time, datetime, timedelta


class AttendanceStatus(models.TextChoices):
    PRESENT = 'PRESENT', 'Present'
    ABSENT = 'ABSENT', 'Absent'
    HALF_DAY = 'HALF_DAY', 'Half Day'
    LATE = 'LATE', 'Late'
    ON_LEAVE = 'ON_LEAVE', 'On Leave'


class Attendance(models.Model):
    # Standard office start time (e.g. 09:15 AM threshold for late arrival)
    STANDARD_CHECK_IN = time(9, 15)

    employee = models.ForeignKey(
        'employees.Employee',
        on_delete=models.CASCADE,
        related_name='attendances'
    )
    date = models.DateField(default=timezone.now)
    check_in_time = models.TimeField(null=True, blank=True)
    check_out_time = models.TimeField(null=True, blank=True)
    working_hours = models.DecimalField(max_digits=5, decimal_places=2, default=0.0)
    status = models.CharField(
        max_length=20,
        choices=AttendanceStatus.choices,
        default=AttendanceStatus.PRESENT
    )
    late_minutes = models.IntegerField(default=0, help_text="Minutes checked in after standard time")
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', '-check_in_time']
        unique_together = ('employee', 'date')
        verbose_name = 'Attendance'
        verbose_name_plural = 'Attendances'

    def __str__(self):
        return f"{self.employee.employee_id} - {self.date} - {self.status}"

    def calculate_hours_and_status(self):
        """Calculate working duration and compute status based on business rules."""
        if self.check_in_time and self.check_out_time:
            today = timezone.now().date()
            t_in = datetime.combine(today, self.check_in_time)
            t_out = datetime.combine(today, self.check_out_time)
            if t_out < t_in:
                # Checkout on next day
                t_out += timedelta(days=1)
            duration = (t_out - t_in).total_seconds() / 3600.0
            self.working_hours = round(duration, 2)

            if self.working_hours < 4.0:
                self.status = AttendanceStatus.HALF_DAY
            elif self.late_minutes > 0:
                self.status = AttendanceStatus.LATE
            else:
                self.status = AttendanceStatus.PRESENT
        elif self.check_in_time:
            # Only check in registered so far
            t_std = datetime.combine(timezone.now().date(), self.STANDARD_CHECK_IN)
            t_in = datetime.combine(timezone.now().date(), self.check_in_time)
            if t_in > t_std:
                self.late_minutes = int((t_in - t_std).total_seconds() / 60)
                self.status = AttendanceStatus.LATE
            else:
                self.late_minutes = 0
                self.status = AttendanceStatus.PRESENT
