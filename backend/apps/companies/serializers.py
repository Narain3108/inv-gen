"""
Company Serializers
"""

from rest_framework import serializers
from .models import Company


class CompanySerializer(serializers.ModelSerializer):
    """Company serializer"""
    
    # Nested address representation
    address = serializers.SerializerMethodField()
    contact = serializers.SerializerMethodField()
    bank_details = serializers.SerializerMethodField()
    
    class Meta:
        model = Company
        fields = '__all__'
    
    def get_address(self, obj):
        return {
            'street': obj.address_street,
            'city': obj.address_city,
            'state': obj.address_state,
            'pincode': obj.address_pincode,
            'country': obj.address_country,
        }
    
    def get_contact(self, obj):
        return {
            'phone': obj.contact_phone,
            'email': obj.contact_email,
            'website': obj.contact_website,
        }
    
    def get_bank_details(self, obj):
        if not obj.bank_name:
            return None
        return {
            'bank_name': obj.bank_name,
            'account_number': obj.bank_account_number,
            'ifsc_code': obj.bank_ifsc_code,
            'account_holder_name': obj.bank_account_holder_name,
            'branch': obj.bank_branch,
            'upi_id': obj.bank_upi_id,
        }


class CompanyCreateUpdateSerializer(serializers.ModelSerializer):
    """Company create/update serializer with nested objects"""
    
    address = serializers.JSONField(write_only=True)
    contact = serializers.JSONField(write_only=True)
    bank_details = serializers.JSONField(write_only=True, required=False)
    
    class Meta:
        model = Company
        fields = [
            'id', 'name', 'gstin', 'pan', 'state', 'address', 'contact',
            'bank_details', 'logo_url', 'signature_url', 'terms_and_conditions',
            'additional_notes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        address = validated_data.pop('address')
        contact = validated_data.pop('contact')
        bank_details = validated_data.pop('bank_details', None)
        
        # Map nested objects to flat fields
        validated_data.update({
            'address_street': address.get('street'),
            'address_city': address.get('city'),
            'address_state': address.get('state'),
            'address_pincode': address.get('pincode'),
            'address_country': address.get('country', 'India'),
            'contact_phone': contact.get('phone'),
            'contact_email': contact.get('email'),
            'contact_website': contact.get('website'),
        })
        
        if bank_details:
            validated_data.update({
                'bank_name': bank_details.get('bank_name'),
                'bank_account_number': bank_details.get('account_number'),
                'bank_ifsc_code': bank_details.get('ifsc_code'),
                'bank_account_holder_name': bank_details.get('account_holder_name'),
                'bank_branch': bank_details.get('branch'),
                'bank_upi_id': bank_details.get('upi_id'),
            })
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        address = validated_data.pop('address', None)
        contact = validated_data.pop('contact', None)
        bank_details = validated_data.pop('bank_details', None)
        
        if address:
            instance.address_street = address.get('street', instance.address_street)
            instance.address_city = address.get('city', instance.address_city)
            instance.address_state = address.get('state', instance.address_state)
            instance.address_pincode = address.get('pincode', instance.address_pincode)
            instance.address_country = address.get('country', instance.address_country)
        
        if contact:
            instance.contact_phone = contact.get('phone', instance.contact_phone)
            instance.contact_email = contact.get('email', instance.contact_email)
            instance.contact_website = contact.get('website', instance.contact_website)
        
        if bank_details:
            instance.bank_name = bank_details.get('bank_name', instance.bank_name)
            instance.bank_account_number = bank_details.get('account_number', instance.bank_account_number)
            instance.bank_ifsc_code = bank_details.get('ifsc_code', instance.bank_ifsc_code)
            instance.bank_account_holder_name = bank_details.get('account_holder_name', instance.bank_account_holder_name)
            instance.bank_branch = bank_details.get('branch', instance.bank_branch)
            instance.bank_upi_id = bank_details.get('upi_id', instance.bank_upi_id)
        
        return super().update(instance, validated_data)
    
    def to_representation(self, instance):
        return CompanySerializer(instance).data
