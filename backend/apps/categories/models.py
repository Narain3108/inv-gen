from django.db import models
from apps.core.models import TimeStampedModel


class ProductCategory(TimeStampedModel):
    """Global Product Category with default products"""
    
    category_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    default_gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    products = models.JSONField(default=list, help_text='List of {name, hsn, item_code}')
    
    class Meta:
        db_table = 'product_categories'
        verbose_name_plural = 'Product Categories'
        ordering = ['category_name']
    
    def __str__(self):
        return self.category_name
