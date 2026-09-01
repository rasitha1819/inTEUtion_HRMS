from rest_framework import serializers
from django.db import transaction
from apps.authentication.models import CustomUser, RoleChoices
from apps.departments.models import Department
from .models import Employee, EmploymentType


class EmployeeListSerializer(serializers.ModelSerializer):
    """Compact serializer for table lists."""
    email = serializers.EmailField(source='user.email', read_only=True)
    role = serializers.CharField(source='user.role', read_only=True)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    department_code = serializers.CharField(source='department.code', read_only=True, default=None)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'phone', 'designation', 'department', 'department_name',
            'department_code', 'role', 'date_of_joining', 'employment_type',
            'is_active', 'created_at'
        ]


class EmployeeDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for individual employee views, creation, and edits."""
    email = serializers.EmailField(source='user.email', required=False)
    role = serializers.ChoiceField(choices=RoleChoices.choices, default=RoleChoices.EMPLOYEE, write_only=False, required=False)
    password = serializers.CharField(write_only=True, required=False, min_length=6)
    department_name = serializers.CharField(source='department.name', read_only=True, default=None)
    department_code = serializers.CharField(source='department.code', read_only=True, default=None)

    class Meta:
        model = Employee
        fields = [
            'id', 'employee_id', 'first_name', 'last_name', 'full_name',
            'email', 'role', 'password', 'phone', 'designation',
            'department', 'department_name', 'department_code',
            'date_of_joining', 'date_of_birth', 'employment_type',
            'salary', 'address', 'emergency_contact', 'is_active',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'full_name']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if instance.user:
            ret['email'] = instance.user.email
            ret['role'] = instance.user.role
            ret['user_id'] = instance.user.id
        return ret

    def create(self, validated_data):
        email = self.initial_data.get('email')
        role = self.initial_data.get('role', RoleChoices.EMPLOYEE)
        password = validated_data.pop('password', 'Password@123')
        first_name = validated_data.get('first_name', '')
        last_name = validated_data.get('last_name', '')

        if not email:
            raise serializers.ValidationError({"email": "Email is required to create an employee account."})

        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "A user account with this email already exists."})

        with transaction.atomic():
            user = CustomUser.objects.create_user(
                username=email,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=role,
                is_active=validated_data.get('is_active', True)
            )
            employee = Employee.objects.create(user=user, **validated_data)
            
            # Initialize default leave balances for this employee for current year
            from apps.leaves.models import LeaveBalance, LeaveType
            from datetime import date
            current_year = date.today().year
            default_leaves = [
                (LeaveType.CASUAL, 12),
                (LeaveType.SICK, 12),
                (LeaveType.EARNED, 12),
                (LeaveType.MATERNITY, 180),
                (LeaveType.PATERNITY, 7),
                (LeaveType.WFH, 36),
            ]
            for l_type, days in default_leaves:
                LeaveBalance.objects.get_or_create(
                    employee=employee,
                    leave_type=l_type,
                    year=current_year,
                    defaults={'total_days': days, 'used_days': 0}
                )

        return employee

    def update(self, instance, validated_data):
        email = self.initial_data.get('email')
        role = self.initial_data.get('role')
        password = validated_data.pop('password', None)

        user = instance.user
        if user:
            if email and email != user.email:
                if CustomUser.objects.filter(email=email).exclude(id=user.id).exists():
                    raise serializers.ValidationError({"email": "A user with this email already exists."})
                user.email = email
                user.username = email
            if role:
                user.role = role
            if 'is_active' in validated_data:
                user.is_active = validated_data['is_active']
            if password:
                user.set_password(password)
            user.first_name = validated_data.get('first_name', user.first_name)
            user.last_name = validated_data.get('last_name', user.last_name)
            user.save()

        return super().update(instance, validated_data)
