from django.db import models
from apps.core.models import CompanyRelatedModel


class Quotation(CompanyRelatedModel):
    """Quotation Model"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('converted', 'Converted to Invoice'),
        ('expired', 'Expired'),
    ]
    
    quotation_number = models.CharField(max_length=50, unique=True, db_index=True)
    client = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='quotations')
    date = models.DateTimeField()
    valid_until = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    items = models.JSONField(default=list)
    taxable_amount = models.DecimalField(max_digits=15, decimal_places=2)
    cgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    sgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    igst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    total_amount_in_words = models.TextField()
    tax_breakdown = models.JSONField(default=list, blank=True)
    
    converted_to_invoice_id = models.UUIDField(blank=True, null=True)
    
    class Meta:
        db_table = 'quotations'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.quotation_number} - {self.client.client_name}"
