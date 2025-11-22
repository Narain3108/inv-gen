from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Client
from .serializers import ClientSerializer, ClientCreateUpdateSerializer


class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['client_name', 'gstin', 'contact_email']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return ClientCreateUpdateSerializer
        return ClientSerializer
