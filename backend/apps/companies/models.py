"""
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
