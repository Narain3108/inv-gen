from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'company', 'contact_email', 'created_at']
    search_fields = ['client_name', 'contact_email', 'gstin']
    list_filter = ['company', 'created_at']
