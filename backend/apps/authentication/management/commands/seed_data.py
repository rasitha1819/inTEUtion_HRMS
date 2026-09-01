from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from datetime import timedelta, date, time
import random

from apps.authentication.models import CustomUser, RoleChoices
from apps.departments.models import Department
from apps.employees.models import Employee, EmploymentType
from apps.attendance.models import Attendance, AttendanceStatus
from apps.leaves.models import LeaveType, LeaveStatus, LeaveBalance, LeaveRequest


class Command(BaseCommand):
    help = "Seed initial demonstration data for HRMS"

    def handle(self, *args, **options):
        self.stdout.write("Seeding HRMS initial database...")

        with transaction.atomic():
            # 1. Create Default Users for Roles
            users_data = [
                {
                    'email': 'admin@hrms.com',
                    'username': 'admin@hrms.com',
                    'first_name': 'Alexander',
                    'last_name': 'Pierce',
                    'role': RoleChoices.ADMIN,
                    'is_superuser': True,
                    'is_staff': True,
                    'emp_id': 'EMP-001',
                    'dept_code': 'EXEC',
                    'designation': 'Chief Executive Officer',
                    'phone': '+1 (555) 019-2831'
                },
                {
                    'email': 'hr@hrms.com',
                    'username': 'hr@hrms.com',
                    'first_name': 'Sarah',
                    'last_name': 'Connor',
                    'role': RoleChoices.HR,
                    'is_superuser': False,
                    'is_staff': True,
                    'emp_id': 'EMP-002',
                    'dept_code': 'HR',
                    'designation': 'Senior HR Director',
                    'phone': '+1 (555) 014-9922'
                },
                {
                    'email': 'emp@hrms.com',
                    'username': 'emp@hrms.com',
                    'first_name': 'David',
                    'last_name': 'Miller',
                    'role': RoleChoices.EMPLOYEE,
                    'is_superuser': False,
                    'is_staff': False,
                    'emp_id': 'EMP-003',
                    'dept_code': 'ENG',
                    'designation': 'Lead Frontend Engineer',
                    'phone': '+1 (555) 018-7733'
                },
                {
                    'email': 'emily.chen@hrms.com',
                    'username': 'emily.chen@hrms.com',
                    'first_name': 'Emily',
                    'last_name': 'Chen',
                    'role': RoleChoices.EMPLOYEE,
                    'is_superuser': False,
                    'is_staff': False,
                    'emp_id': 'EMP-004',
                    'dept_code': 'ENG',
                    'designation': 'Senior Backend Engineer',
                    'phone': '+1 (555) 012-4411'
                },
                {
                    'email': 'marcus.vance@hrms.com',
                    'username': 'marcus.vance@hrms.com',
                    'first_name': 'Marcus',
                    'last_name': 'Vance',
                    'role': RoleChoices.EMPLOYEE,
                    'is_superuser': False,
                    'is_staff': False,
                    'emp_id': 'EMP-005',
                    'dept_code': 'MKT',
                    'designation': 'Marketing Strategist',
                    'phone': '+1 (555) 017-8822'
                },
                {
                    'email': 'olivia.taylor@hrms.com',
                    'username': 'olivia.taylor@hrms.com',
                    'first_name': 'Olivia',
                    'last_name': 'Taylor',
                    'role': RoleChoices.EMPLOYEE,
                    'is_superuser': False,
                    'is_staff': False,
                    'emp_id': 'EMP-006',
                    'dept_code': 'FIN',
                    'designation': 'Financial Analyst',
                    'phone': '+1 (555) 011-3377'
                },
            ]

            # 2. Create Departments
            depts_info = [
                {'name': 'Executive Leadership', 'code': 'EXEC', 'description': 'Executive management & strategic operations'},
                {'name': 'Human Resources', 'code': 'HR', 'description': 'Talent acquisition, employee wellness, and organizational culture'},
                {'name': 'Engineering & Tech', 'code': 'ENG', 'description': 'Software development, infrastructure, and technical architecture'},
                {'name': 'Product Marketing', 'code': 'MKT', 'description': 'Brand growth, market campaigns, and client outreach'},
                {'name': 'Finance & Accounting', 'code': 'FIN', 'description': 'Corporate finance, payroll, and fiscal reporting'},
            ]

            departments_map = {}
            for d in depts_info:
                dept_obj, _ = Department.objects.get_or_create(
                    code=d['code'],
                    defaults={'name': d['name'], 'description': d['description']}
                )
                departments_map[d['code']] = dept_obj

            # 3. Create Users and Employees
            employees_list = []
            for u in users_data:
                user, created = CustomUser.objects.get_or_create(
                    email=u['email'],
                    defaults={
                        'username': u['username'],
                        'first_name': u['first_name'],
                        'last_name': u['last_name'],
                        'role': u['role'],
                        'phone_number': u['phone'],
                        'is_superuser': u['is_superuser'],
                        'is_staff': u['is_staff'],
                        'is_active': True,
                    }
                )
                user.is_active = True
                user.role = u['role']
                user.set_password('Password@123')
                user.save()

                dept = departments_map.get(u['dept_code'])
                emp, _ = Employee.objects.get_or_create(
                    employee_id=u['emp_id'],
                    defaults={
                        'user': user,
                        'first_name': u['first_name'],
                        'last_name': u['last_name'],
                        'phone': u['phone'],
                        'designation': u['designation'],
                        'department': dept,
                        'date_of_joining': date(2023, 1, 15),
                        'employment_type': EmploymentType.FULL_TIME,
                        'salary': 85000.00,
                        'address': '124 Market Street, Suite 400, San Francisco, CA',
                        'emergency_contact': 'Emergency Contact (+1 555-099-1122)'
                    }
                )
                employees_list.append(emp)

            # Assign managers
            if 'HR' in departments_map and len(employees_list) > 1:
                departments_map['HR'].manager = employees_list[1]
                departments_map['HR'].save()
            if 'ENG' in departments_map and len(employees_list) > 2:
                departments_map['ENG'].manager = employees_list[2]
                departments_map['ENG'].save()

            # 4. Leave Balances Initialization
            current_year = timezone.now().year
            leave_types_allocation = [
                (LeaveType.CASUAL, 12),
                (LeaveType.SICK, 12),
                (LeaveType.EARNED, 12),
                (LeaveType.MATERNITY, 180),
                (LeaveType.PATERNITY, 7),
                (LeaveType.WFH, 36),
            ]

            for emp in employees_list:
                for l_type, total in leave_types_allocation:
                    used = 2 if l_type == LeaveType.CASUAL else (1 if l_type == LeaveType.SICK else 0)
                    LeaveBalance.objects.get_or_create(
                        employee=emp,
                        leave_type=l_type,
                        year=current_year,
                        defaults={'total_days': total, 'used_days': used}
                    )

            # 5. Seed Attendance for Past 14 Days
            today = timezone.now().date()
            for day_offset in range(14, -1, -1):
                cur_date = today - timedelta(days=day_offset)
                if cur_date.weekday() >= 5:  # Skip weekends
                    continue

                for emp in employees_list:
                    # Randomize attendance realism
                    rand_val = random.random()
                    
                    if day_offset == 0:
                        # Today: Some checked in, some not yet
                        if emp.employee_id in ['EMP-001', 'EMP-002', 'EMP-003', 'EMP-004']:
                            att, _ = Attendance.objects.get_or_create(
                                employee=emp,
                                date=cur_date,
                                defaults={
                                    'check_in_time': time(9, 5),
                                    'status': AttendanceStatus.PRESENT,
                                    'late_minutes': 0,
                                    'notes': 'Daily on-time check-in'
                                }
                            )
                    else:
                        if rand_val < 0.70:
                            # Present on time
                            Attendance.objects.get_or_create(
                                employee=emp,
                                date=cur_date,
                                defaults={
                                    'check_in_time': time(8, 55),
                                    'check_out_time': time(17, 30),
                                    'working_hours': 8.58,
                                    'status': AttendanceStatus.PRESENT,
                                    'late_minutes': 0,
                                }
                            )
                        elif rand_val < 0.85:
                            # Late arrival
                            Attendance.objects.get_or_create(
                                employee=emp,
                                date=cur_date,
                                defaults={
                                    'check_in_time': time(9, 45),
                                    'check_out_time': time(18, 0),
                                    'working_hours': 8.25,
                                    'status': AttendanceStatus.LATE,
                                    'late_minutes': 30,
                                    'notes': 'Traffic delay on freeway'
                                }
                            )
                        elif rand_val < 0.95:
                            # Half day
                            Attendance.objects.get_or_create(
                                employee=emp,
                                date=cur_date,
                                defaults={
                                    'check_in_time': time(9, 0),
                                    'check_out_time': time(13, 0),
                                    'working_hours': 4.0,
                                    'status': AttendanceStatus.HALF_DAY,
                                    'late_minutes': 0,
                                    'notes': 'Doctor appointment in afternoon'
                                }
                            )
                        else:
                            # Absent
                            Attendance.objects.get_or_create(
                                employee=emp,
                                date=cur_date,
                                defaults={
                                    'status': AttendanceStatus.ABSENT,
                                    'notes': 'Unexcused absence'
                                }
                            )

            # 6. Sample Leave Requests
            sample_leaves = [
                {
                    'employee': employees_list[2],  # David Miller (emp@hrms.com)
                    'leave_type': LeaveType.CASUAL,
                    'start_date': today + timedelta(days=5),
                    'end_date': today + timedelta(days=6),
                    'total_days': 2,
                    'reason': 'Family gathering and travel',
                    'status': LeaveStatus.PENDING,
                },
                {
                    'employee': employees_list[3],  # Emily Chen
                    'leave_type': LeaveType.SICK,
                    'start_date': today - timedelta(days=7),
                    'end_date': today - timedelta(days=6),
                    'total_days': 2,
                    'reason': 'Viral fever and recovery',
                    'status': LeaveStatus.APPROVED,
                    'reviewed_by': users_data[1]['email'],
                    'review_comments': 'Approved. Take rest.'
                },
                {
                    'employee': employees_list[4],  # Marcus Vance
                    'leave_type': LeaveType.EARNED,
                    'start_date': today + timedelta(days=12),
                    'end_date': today + timedelta(days=16),
                    'total_days': 5,
                    'reason': 'Earned leave for personal vacation',
                    'status': LeaveStatus.PENDING,
                }
            ]

            hr_user = CustomUser.objects.filter(email='hr@hrms.com').first()
            for sl in sample_leaves:
                req, _ = LeaveRequest.objects.get_or_create(
                    employee=sl['employee'],
                    start_date=sl['start_date'],
                    end_date=sl['end_date'],
                    defaults={
                        'leave_type': sl['leave_type'],
                        'total_days': sl['total_days'],
                        'reason': sl['reason'],
                        'status': sl['status'],
                        'reviewed_by': hr_user if sl['status'] == LeaveStatus.APPROVED else None,
                        'review_comments': sl.get('review_comments', ''),
                        'reviewed_at': timezone.now() if sl['status'] == LeaveStatus.APPROVED else None,
                    }
                )

        self.stdout.write(self.style.SUCCESS("HRMS test database successfully seeded!"))
        self.stdout.write("Default Demo Logins (Password for all: Password@123)")
        self.stdout.write("  - Admin:    admin@hrms.com")
        self.stdout.write("  - HR:       hr@hrms.com")
        self.stdout.write("  - Employee: emp@hrms.com")
