from django.contrib.auth.models import AbstractUser
from django.db import models


class RoleChoices(models.TextChoices):
    ADMIN = 'ADMIN', 'Administrator'
    HR = 'HR', 'Human Resources'
    EMPLOYEE = 'EMPLOYEE', 'Employee'


class CustomUser(AbstractUser):
    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=RoleChoices.choices,
        default=RoleChoices.EMPLOYEE,
        help_text="Role determining access level within HRMS"
    )
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    avatar_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        ordering = ['-id']
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"

    @property
    def is_admin_role(self):
        return self.role == RoleChoices.ADMIN or self.is_superuser

    @property
    def is_hr_role(self):
        return self.role == RoleChoices.HR

    @property
    def is_employee_role(self):
        return self.role == RoleChoices.EMPLOYEE
