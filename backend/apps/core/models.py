"""
Base Model and Manager Classes
"""

from django.db import models
from django.utils import timezone
import uuid


class TimeStampedModel(models.Model):
    """
    Abstract base model with created_at and updated_at fields
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        abstract = True
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        """Update updated_at on save"""
        self.updated_at = timezone.now()
        super().save(*args, **kwargs)


class CompanyRelatedModel(TimeStampedModel):
    """
    Abstract model for entities related to a company
    """
    company = models.ForeignKey(
        'companies.Company',
        on_delete=models.CASCADE,
        related_name='%(class)s_set'
    )
    
    class Meta:
        abstract = True
    
    def save(self, *args, **kwargs):
        """Ensure company is set before saving"""
        if not self.company_id:
            raise ValueError('Company must be set before saving')
        super().save(*args, **kwargs)
