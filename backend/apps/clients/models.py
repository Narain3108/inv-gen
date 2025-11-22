from django.db import models
from apps.core.models import CompanyRelatedModel
from apps.core.utils import validate_gstin, validate_pan


class Client(CompanyRelatedModel):
    """Client/Customer Model"""
    
    client_name = models.CharField(max_length=255)
    gstin = models.CharField(max_length=15, blank=True, null=True)
    pan = models.CharField(max_length=10, blank=True, null=True)
    
    # Address
    address_street = models.CharField(max_length=255)
    address_city = models.CharField(max_length=100)
    address_state = models.CharField(max_length=100)
    address_pincode = models.CharField(max_length=6)
    address_country = models.CharField(max_length=100, default='India')
    
    # Contact
    contact_phone = models.CharField(max_length=15)
    contact_email = models.EmailField()
    
    # Billing Address (optional separate)
    billing_street = models.CharField(max_length=255, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state = models.CharField(max_length=100, blank=True, null=True)
    billing_pincode = models.CharField(max_length=6, blank=True, null=True)
    
    # Shipping Address
    shipping_street = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_state = models.CharField(max_length=100, blank=True, null=True)
    shipping_pincode = models.CharField(max_length=6, blank=True, null=True)
    
    # Bank Details (optional)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc_code = models.CharField(max_length=11, blank=True, null=True)
    
    auto_fetched = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'clients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'client_name']),
        ]
    
    def __str__(self):
        return f"{self.client_name} ({self.company.name})"
