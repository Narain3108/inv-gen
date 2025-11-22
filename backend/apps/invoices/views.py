from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Invoice
from .serializers import InvoiceSerializer
from apps.core.utils import calculate_gst, number_to_words
from decimal import Decimal


class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = InvoiceSerializer
    ordering = ['-date']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset
    
    @action(detail=True, methods=['post'])
    def add_payment(self, request, pk=None):
        """Add payment to invoice"""
        invoice = self.get_object()
        amount = Decimal(request.data.get('amount', 0))
        
        if amount <= 0:
            return Response({'error': 'Invalid amount'}, status=status.HTTP_400_BAD_REQUEST)
        
        if amount > invoice.amount_pending:
            return Response({'error': 'Amount exceeds pending balance'}, status=status.HTTP_400_BAD_REQUEST)
        
        payment = {
            'amount': float(amount),
            'payment_date': request.data.get('payment_date'),
            'payment_mode': request.data.get('payment_mode'),
            'reference_number': request.data.get('reference_number'),
        }
        
        invoice.payments.append(payment)
        invoice.amount_paid += amount
        invoice.amount_pending -= amount
        
        if invoice.amount_pending == 0:
            invoice.payment_status = 'paid'
        elif invoice.amount_paid > 0:
            invoice.payment_status = 'partially_paid'
        
        invoice.save()
        
        return Response(InvoiceSerializer(invoice).data)
