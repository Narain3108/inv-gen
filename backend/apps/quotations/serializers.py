from rest_framework import serializers
from .models import Quotation


class QuotationSerializer(serializers.ModelSerializer):
    quotation_number = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = Quotation
        fields = '__all__'
    
    def create(self, validated_data):
        company = validated_data.get('company')
        quotation_number = validated_data.get('quotation_number', '').strip()
        
        if not quotation_number:
            quotation_number = company.generate_quotation_number()
            validated_data['quotation_number'] = quotation_number
            company.increment_quotation_number()
        
        return super().create(validated_data)
