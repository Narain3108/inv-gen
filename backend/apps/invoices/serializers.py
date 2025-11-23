from rest_framework import serializers
from .models import Invoice
from apps.clients.serializers import ClientSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
    
    def create(self, validated_data):
        company = validated_data.get('company')
        invoice_number = validated_data.get('invoice_number', '').strip()
        
        if not invoice_number:
            invoice_number = company.generate_invoice_number()
            validated_data['invoice_number'] = invoice_number
            company.increment_invoice_number()
        
        return super().create(validated_data)
