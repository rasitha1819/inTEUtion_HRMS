from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import CustomUser, RoleChoices


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """Custom JWT serializer to enrich tokens and responses with user role and profile details."""

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        # Add custom claims into token payload
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['full_name'] = user.get_full_name() or user.username
        
        # Add employee id if linked
        if hasattr(user, 'employee_profile') and user.employee_profile:
            token['employee_id'] = user.employee_profile.employee_id
            token['designation'] = user.employee_profile.designation
            if user.employee_profile.department:
                token['department'] = user.employee_profile.department.name
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        # Attach user data directly to response body for fast frontend hydration
        data['user'] = {
            'id': user.id,
            'email': user.email,
            'username': user.username,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'full_name': user.get_full_name() or user.username,
            'role': user.role,
            'phone_number': user.phone_number,
            'is_active': user.is_active,
        }

        if hasattr(user, 'employee_profile') and user.employee_profile:
            emp = user.employee_profile
            data['user']['employee_profile'] = {
                'id': emp.id,
                'employee_id': emp.employee_id,
                'designation': emp.designation,
                'department_id': emp.department_id,
                'department_name': emp.department.name if emp.department else None,
                'date_of_joining': str(emp.date_of_joining) if emp.date_of_joining else None,
            }
        else:
            data['user']['employee_profile'] = None

        return data


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    employee_profile = serializers.SerializerMethodField()

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'full_name', 'role', 'phone_number', 'avatar_url',
            'is_active', 'created_at', 'employee_profile'
        ]
        read_only_fields = ['id', 'created_at', 'full_name']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_employee_profile(self, obj):
        if hasattr(obj, 'employee_profile') and obj.employee_profile:
            emp = obj.employee_profile
            return {
                'id': emp.id,
                'employee_id': emp.employee_id,
                'designation': emp.designation,
                'department': emp.department.name if emp.department else None,
            }
        return None


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password does not match.")
        return value
