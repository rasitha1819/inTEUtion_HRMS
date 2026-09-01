"""WSGI config for HRMS core"""
import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hrms_core.settings')
application = get_wsgi_application()
