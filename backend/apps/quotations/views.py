from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Quotation
from .serializers import QuotationSerializer
from apps.invoices.models import Invoice


class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = QuotationSerializer
    ordering = ['-date']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset
    
    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """Convert quotation to invoice"""
        quotation = self.get_object()
        
        if quotation.status == 'converted':
            return Response({'error': 'Already converted'}, status=status.HTTP_400_BAD_REQUEST)
        
        invoice = Invoice.objects.create(
            company=quotation.company,
            client=quotation.client,
            date=quotation.date,
            items=quotation.items,
            taxable_amount=quotation.taxable_amount,
            cgst=quotation.cgst,
            sgst=quotation.sgst,
            igst=quotation.igst,
            total_amount=quotation.total_amount,
            total_amount_in_words=quotation.total_amount_in_words,
            invoice_number=f"INV-{quotation.quotation_number.split('-')[1]}",
            amount_pending=quotation.total_amount,
        )
        
        quotation.status = 'converted'
        quotation.converted_to_invoice_id = invoice.id
        quotation.save()
        
        return Response({'invoice_id': str(invoice.id)})
