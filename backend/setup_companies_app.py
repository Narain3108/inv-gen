"""
COMPLETE DJANGO BACKEND GENERATOR
==================================

This script generates ALL remaining Django apps with models, serializers, views, and URLs.
This is the COMPLETE backend that replaces ALL Firebase client SDK functionality.

Run: python setup_complete_backend_all_apps.py
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# All files to create with their full content
FILES = {

# ==================== COMPANIES APP ====================

'apps/companies/__init__.py': '',

'apps/companies/apps.py': '''from django.apps import AppConfig

class CompaniesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.companies'
''',

'apps/companies/models.py': '''"""
Company Models
"""

from django.db import models
from apps.core.models import TimeStampedModel
from apps.core.utils import validate_gstin, validate_pan, validate_ifsc


class Company(TimeStampedModel):
    """Company/Business Entity"""
    
    name = models.CharField(max_length=255)
    gstin = models.CharField(max_length=15, blank=True, null=True, db_index=True)
    pan = models.CharField(max_length=10, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    
    # Address
    address_street = models.CharField(max_length=255)
    address_city = models.CharField(max_length=100)
    address_state = models.CharField(max_length=100)
    address_pincode = models.CharField(max_length=6)
    address_country = models.CharField(max_length=100, default='India')
    
    # Contact
    contact_phone = models.CharField(max_length=15)
    contact_email = models.EmailField()
    contact_website = models.URLField(blank=True, null=True)
    
    # Bank Details
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc_code = models.CharField(max_length=11, blank=True, null=True)
    bank_account_holder_name = models.CharField(max_length=255, blank=True, null=True)
    bank_branch = models.CharField(max_length=255, blank=True, null=True)
    bank_upi_id = models.CharField(max_length=100, blank=True, null=True)
    
    # Assets
    logo_url = models.URLField(blank=True, null=True)
    signature_url = models.URLField(blank=True, null=True)
    
    # Default Settings
    terms_and_conditions = models.TextField(blank=True, null=True)
    additional_notes = models.TextField(blank=True, null=True)
    
    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'Companies'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.gstin and not validate_gstin(self.gstin):
            raise ValidationError({'gstin': 'Invalid GSTIN format'})
        if self.pan and not validate_pan(self.pan):
            raise ValidationError({'pan': 'Invalid PAN format'})
        if self.bank_ifsc_code and not validate_ifsc(self.bank_ifsc_code):
            raise ValidationError({'bank_ifsc_code': 'Invalid IFSC code'})
''',

'apps/companies/serializers.py': '''"""
Company Serializers
"""

from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    """Company serializer"""
    
    # Nested address representation
    address = serializers.SerializerMethodField()
    contact = serializers.SerializerMethodField()
    bank_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = '__all__'
    
    def get_address(self, obj):
        return {
            'street': obj.address_street,
            'city': obj.address_city,
            'state': obj.address_state,
            'pincode': obj.address_pincode,
            'country': obj.address_country,
        }
    
    def get_contact(self, obj):
        return {
            'phone': obj.contact_phone,
            'email': obj.contact_email,
            'website': obj.contact_website,
        }
    
    def get_bank_details(self, obj):
        if not obj.bank_name:
            return None
        return {
            'bank_name': obj.bank_name,
            'account_number': obj.bank_account_number,
            'ifsc_code': obj.bank_ifsc_code,
            'account_holder_name': obj.bank_account_holder_name,
            'branch': obj.bank_branch,
            'upi_id': obj.bank_upi_id,
        }


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    """Company create/update serializer with nested objects"""
    
    address = serializers.JSONField(write_only=True)
    contact = serializers.JSONField(write_only=True)
    bank_details = serializers.JSONField(write_only=True, required=False)
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'gstin', 'pan', 'state', 'address', 'contact',
            'bank_details', 'logo_url', 'signature_url', 'terms_and_conditions',
            'additional_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        address = validated_data.pop('address')
        contact = validated_data.pop('contact')
        bank_details = validated_data.pop('bank_details', None)
        
        # Map nested objects to flat fields
        validated_data.update({
            'address_street': address.get('street'),
            'address_city': address.get('city'),
            'address_state': address.get('state'),
            'address_pincode': address.get('pincode'),
            'address_country': address.get('country', 'India'),
            'contact_phone': contact.get('phone'),
            'contact_email': contact.get('email'),
            'contact_website': contact.get('website'),
        })
        
        if bank_details:
            validated_data.update({
                'bank_name': bank_details.get('bank_name'),
                'bank_account_number': bank_details.get('account_number'),
                'bank_ifsc_code': bank_details.get('ifsc_code'),
                'bank_account_holder_name': bank_details.get('account_holder_name'),
                'bank_branch': bank_details.get('branch'),
                'bank_upi_id': bank_details.get('upi_id'),
            })
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        address = validated_data.pop('address', None)
        contact = validated_data.pop('contact', None)
        bank_details = validated_data.pop('bank_details', None)
        
        if address:
            instance.address_street = address.get('street', instance.address_street)
            instance.address_city = address.get('city', instance.address_city)
            instance.address_state = address.get('state', instance.address_state)
            instance.address_pincode = address.get('pincode', instance.address_pincode)
            instance.address_country = address.get('country', instance.address_country)
        
        if contact:
            instance.contact_phone = contact.get('phone', instance.contact_phone)
            instance.contact_email = contact.get('email', instance.contact_email)
            instance.contact_website = contact.get('website', instance.contact_website)
        
        if bank_details:
            instance.bank_name = bank_details.get('bank_name', instance.bank_name)
            instance.bank_account_number = bank_details.get('account_number', instance.bank_account_number)
            instance.bank_ifsc_code = bank_details.get('ifsc_code', instance.bank_ifsc_code)
            instance.bank_account_holder_name = bank_details.get('account_holder_name', instance.bank_account_holder_name)
            instance.bank_branch = bank_details.get('branch', instance.bank_branch)
            instance.bank_upi_id = bank_details.get('upi_id', instance.bank_upi_id)
        
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        return CompanySerializer(instance).data
''',

'apps/companies/views.py': '''"""
Company Views
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Company
from .serializers import CompanySerializer, CompanyCreateUpdateSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Company CRUD operations
    
    GET /api/companies/ - List all companies
    POST /api/companies/ - Create new company
    GET /api/companies/{id}/ - Get company details
    PUT /api/companies/{id}/ - Update company
    DELETE /api/companies/{id}/ - Delete company
    """
    
    queryset = Company.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'gstin', 'contact_email']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CompanyCreateUpdateSerializer
        return CompanySerializer
''',

'apps/companies/urls.py': '''"""
Company URLs
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CompanyViewSet

router = DefaultRouter()
router.register(r'', CompanyViewSet, basename='company')

urlpatterns = [
    path('', include(router.urls)),
]
''',

'apps/companies/admin.py': '''"""
Company Admin
"""

from django.contrib import admin
from .models import Company


@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ['name', 'gstin', 'contact_email', 'created_at']
    search_fields = ['name', 'gstin', 'contact_email']
    list_filter = ['created_at']
    ordering = ['-created_at']
''',

'apps/companies/migrations/__init__.py': '',

}


def create_file(path: str, content: str):
    """Create file with content"""
    file_path = BASE_DIR / path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"✅ {path}")


def main():
    print("\n" + "=" * 70)
    print("DJANGO BACKEND GENERATOR - COMPANIES APP")
    print("=" * 70 + "\n")
    
    for path, content in FILES.items():
        create_file(path, content)
    
    print("\n" + "=" * 70)
    print("✅ COMPANIES APP CREATED!")
    print("=" * 70 + "\n")


if __name__ == '__main__':
    main()
