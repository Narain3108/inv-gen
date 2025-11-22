from rest_framework import serializers
from .models import Invoice
from apps.clients.serializers import ClientSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
