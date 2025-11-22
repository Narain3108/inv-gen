from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client', 'date', 'total_amount', 'payment_status']
    search_fields = ['invoice_number', 'client__client_name']
    list_filter = ['company', 'payment_status', 'date']
