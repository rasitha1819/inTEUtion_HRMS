from django.db import models
from django.conf import settings


class EmploymentType(models.TextChoices):
    FULL_TIME = 'FULL_TIME', 'Full Time'
    PART_TIME = 'PART_TIME', 'Part Time'
    CONTRACT = 'CONTRACT', 'Contract'
    INTERN = 'INTERN', 'Intern'


class Employee(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='employee_profile'
    )
    employee_id = models.CharField(
        max_length=20,
        unique=True,
        help_text="Unique employee code, e.g. EMP-001"
    )
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    phone = models.CharField(max_length=20, blank=True, null=True)
    designation = models.CharField(max_length=100)
    department = models.ForeignKey(
        'departments.Department',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='employees'
    )
    date_of_joining = models.DateField()
    date_of_birth = models.DateField(blank=True, null=True)
    employment_type = models.CharField(
        max_length=20,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME
    )
    salary = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['employee_id']
        verbose_name = 'Employee'
        verbose_name_plural = 'Employees'

    def __str__(self):
        return f"{self.employee_id} - {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def email(self):
        return self.user.email if self.user else ""

    @property
    def role(self):
        return self.user.role if self.user else ""
