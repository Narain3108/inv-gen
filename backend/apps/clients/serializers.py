from rest_framework import serializers
from .models import Client


class ClientSerializer(serializers.ModelSerializer):
    address = serializers.SerializerMethodField()
    contact = serializers.SerializerMethodField()
    
    class Meta:
        model = Client
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
        }


class ClientCreateUpdateSerializer(serializers.ModelSerializer):
    address = serializers.JSONField(write_only=True)
    contact = serializers.JSONField(write_only=True)
    billing_address = serializers.JSONField(write_only=True, required=False)
    shipping_address = serializers.JSONField(write_only=True, required=False)
    
    class Meta:
        model = Client
        exclude = ['address_street', 'address_city', 'address_state', 'address_pincode',
                   'contact_phone', 'contact_email']
    
    def create(self, validated_data):
        address = validated_data.pop('address')
        contact = validated_data.pop('contact')
        billing = validated_data.pop('billing_address', None)
        shipping = validated_data.pop('shipping_address', None)
        
        validated_data.update({
            'address_street': address['street'],
            'address_city': address['city'],
            'address_state': address['state'],
            'address_pincode': address['pincode'],
            'contact_phone': contact['phone'],
            'contact_email': contact['email'],
        })
        
        if billing:
            validated_data.update({
                'billing_street': billing.get('street'),
                'billing_city': billing.get('city'),
                'billing_state': billing.get('state'),
                'billing_pincode': billing.get('pincode'),
            })
        
        if shipping:
            validated_data.update({
                'shipping_street': shipping.get('street'),
                'shipping_city': shipping.get('city'),
                'shipping_state': shipping.get('state'),
                'shipping_pincode': shipping.get('pincode'),
            })
        
        return super().create(validated_data)
    
    def to_representation(self, instance):
        return ClientSerializer(instance).data
