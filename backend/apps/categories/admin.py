from django.contrib import admin
from .models import ProductCategory

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['category_name', 'default_gst_rate', 'created_at']
    search_fields = ['category_name']
