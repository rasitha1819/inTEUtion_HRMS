"""ASGI config for HRMS core"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
application = get_asgi_application()
