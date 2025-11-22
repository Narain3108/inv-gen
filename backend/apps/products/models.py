from django.db import models
from apps.core.models import CompanyRelatedModel


class Product(CompanyRelatedModel):
    """Product/Service Model"""
    
    PRODUCT_TYPE_CHOICES = [
        ('product', 'Product (Goods)'),
        ('service', 'Service'),
    ]
    
    product_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    item_code = models.CharField(max_length=10, blank=True, null=True)
    hsn = models.CharField(max_length=8, help_text='HSN for goods, SAC for services')
    unit = models.CharField(max_length=20, default='Nos')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    stock = models.IntegerField(default=0, blank=True, null=True)
    type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES, default='product')
    has_serial_number = models.BooleanField(default=False)
    category_id = models.UUIDField(blank=True, null=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'product_name']),
            models.Index(fields=['hsn']),
        ]
    
    def __str__(self):
        return f"{self.product_name} ({self.company.name})"
