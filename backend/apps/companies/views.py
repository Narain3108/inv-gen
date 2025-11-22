"""
Company Views
"""

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Company
from .serializers import CompanySerializer, CompanyCreateUpdateSerializer


class CompanyViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Company CRUD operations
    
    GET /api/companies/ - List all companies
    POST /api/companies/ - Create new company
    GET /api/companies/{id}/ - Get company details
    PUT /api/companies/{id}/ - Update company
    DELETE /api/companies/{id}/ - Delete company
    """
    
    queryset = Company.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'gstin', 'contact_email']
    ordering_fields = ['created_at', 'name']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CompanyCreateUpdateSerializer
        return CompanySerializer
