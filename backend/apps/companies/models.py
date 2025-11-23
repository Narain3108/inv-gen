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
    
    # Invoice Numbering Configuration
    invoice_prefix = models.CharField(max_length=20, blank=True, null=True)
    invoice_suffix = models.CharField(max_length=20, blank=True, null=True)
    invoice_number_order = models.CharField(
        max_length=50, 
        default='prefix,number,suffix',
        help_text='Order of invoice number components (comma-separated: prefix,number,suffix)'
    )
    invoice_next_number = models.PositiveIntegerField(default=1)
    
    # Quotation Numbering Configuration
    quotation_prefix = models.CharField(max_length=20, blank=True, null=True)
    quotation_suffix = models.CharField(max_length=20, blank=True, null=True)
    quotation_number_order = models.CharField(
        max_length=50,
        default='prefix,number,suffix',
        help_text='Order of quotation number components (comma-separated: prefix,number,suffix)'
    )
    quotation_next_number = models.PositiveIntegerField(default=1)
    
    class Meta:
        db_table = 'companies'
        verbose_name_plural = 'Companies'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.name
    
    def generate_invoice_number(self):
        """Generate next invoice number based on company configuration"""
        components = {
            'prefix': self.invoice_prefix or '',
            'number': str(self.invoice_next_number),
            'suffix': self.invoice_suffix or ''
        }
        
        order = [part.strip() for part in self.invoice_number_order.split(',')]
        number_parts = [components.get(part, '') for part in order if components.get(part)]
        
        if not number_parts:
            return f'INV{self.invoice_next_number:04d}'
        
        return ''.join(number_parts)
    
    def generate_quotation_number(self):
        """Generate next quotation number based on company configuration"""
        components = {
            'prefix': self.quotation_prefix or '',
            'number': str(self.quotation_next_number),
            'suffix': self.quotation_suffix or ''
        }
        
        order = [part.strip() for part in self.quotation_number_order.split(',')]
        number_parts = [components.get(part, '') for part in order if components.get(part)]
        
        if not number_parts:
            return f'QUO{self.quotation_next_number:04d}'
        
        return ''.join(number_parts)
    
    def increment_invoice_number(self):
        """Increment the invoice counter"""
        self.invoice_next_number += 1
        self.save(update_fields=['invoice_next_number'])
    
    def increment_quotation_number(self):
        """Increment the quotation counter"""
        self.quotation_next_number += 1
        self.save(update_fields=['quotation_next_number'])
    
    def clean(self):
        from django.core.exceptions import ValidationError
        if self.gstin and not validate_gstin(self.gstin):
            raise ValidationError({'gstin': 'Invalid GSTIN format'})
        if self.pan and not validate_pan(self.pan):
            raise ValidationError({'pan': 'Invalid PAN format'})
        if self.bank_ifsc_code and not validate_ifsc(self.bank_ifsc_code):
            raise ValidationError({'bank_ifsc_code': 'Invalid IFSC code'})
