from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'company', 'type', 'price', 'gst_rate', 'stock']
    search_fields = ['product_name', 'hsn']
    list_filter = ['company', 'type', 'created_at']
