from django.db import models
from apps.core.models import CompanyRelatedModel


class Invoice(CompanyRelatedModel):
    """Invoice Model"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    client = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='invoices')
    date = models.DateTimeField()
    
    items = models.JSONField(default=list)
    taxable_amount = models.DecimalField(max_digits=15, decimal_places=2)
    cgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    sgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    igst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    total_amount_in_words = models.TextField()
    tax_breakdown = models.JSONField(default=list, blank=True)
    
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    amount_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    amount_pending = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    payments = models.JSONField(default=list)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['company', 'date']),
            models.Index(fields=['client']),
            models.Index(fields=['invoice_number']),
        ]
    
    def __str__(self):
        return f"{self.invoice_number} - {self.client.client_name}"
