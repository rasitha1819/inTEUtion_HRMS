from rest_framework import serializers
from .models import Department


class DepartmentSerializer(serializers.ModelSerializer):
    employee_count = serializers.IntegerField(read_only=True)
    manager_name = serializers.SerializerMethodField()

    class Meta:
        model = Department
        fields = [
            'id', 'name', 'code', 'description',
            'manager', 'manager_name', 'employee_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'employee_count']

    def get_manager_name(self, obj):
        if obj.manager:
            return f"{obj.manager.first_name} {obj.manager.last_name}"
        return None
