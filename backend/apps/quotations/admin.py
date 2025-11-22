from django.contrib import admin
from .models import Quotation

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ['quotation_number', 'client', 'date', 'status', 'total_amount']
    search_fields = ['quotation_number', 'client__client_name']
    list_filter = ['company', 'status', 'date']
