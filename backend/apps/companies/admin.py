"""
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
