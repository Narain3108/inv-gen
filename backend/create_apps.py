"""
Complete Django Backend Generator Script
Run this to create all remaining Django apps, models, serializers, and views
"""

import os
import subprocess
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Django apps to create
APPS = [
    'users',
    'companies',
    'clients',
    'products',
    'categories',
    'invoices',
    'quotations',
    'uploads',
]

def create_app_structure(app_name):
    """Create Django app with standard structure"""
    app_path = BASE_DIR / 'apps' / app_name
    app_path.mkdir(parents=True, exist_ok=True)
    
    # Create __init__.py
    (app_path / '__init__.py').touch()
    
    # Create apps.py
    with open(app_path / 'apps.py', 'w') as f:
        f.write(f"""from django.apps import AppConfig


class {app_name.capitalize()}Config(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.{app_name}'
""")
    
    # Create admin.py
    (app_path / 'admin.py').write_text("""from django.contrib import admin

# Register your models here.
""")
    
    # Create tests.py
    (app_path / 'tests.py').write_text("""from django.test import TestCase

# Create your tests here.
""")
    
    # Create empty files
    for filename in ['models.py', 'serializers.py', 'views.py', 'urls.py', 'services.py']:
        (app_path / filename).touch()
    
    # Create migrations directory
    migrations_dir = app_path / 'migrations'
    migrations_dir.mkdir(exist_ok=True)
    (migrations_dir / '__init__.py').touch()
    
    print(f"✅ Created app structure for: {app_name}")

if __name__ == '__main__':
    print("🚀 Creating Django app structures...")
    
    for app in APPS:
        create_app_structure(app)
    
    print("\n✅ All app structures created!")
    print("\nNext steps:")
    print("1. Run: python manage.py makemigrations")
    print("2. Run: python manage.py migrate")
    print("3. Run: python manage.py createsuperuser")
    print("4. Run: python manage.py runserver")
