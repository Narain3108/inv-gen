"""
🚀 COMPLETE DJANGO BACKEND - ALL REMAINING APPS GENERATOR
===========================================================

This single script creates ALL remaining Django apps with complete functionality:
- Clients
- Products  
- Categories
- Invoices
- Quotations
- Uploads (Cloudinary server-side)

Run: python setup_all_remaining_apps.py
"""

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Complete file contents for all apps
ALL_FILES = {

# ==================== CLIENTS APP ====================

'apps/clients/__init__.py': '',
'apps/clients/migrations/__init__.py': '',

'apps/clients/apps.py': '''from django.apps import AppConfig

class ClientsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.clients'
''',

'apps/clients/models.py': '''from django.db import models
from apps.core.models import CompanyRelatedModel
from apps.core.utils import validate_gstin, validate_pan


class Client(CompanyRelatedModel):
    """Client/Customer Model"""
    
    client_name = models.CharField(max_length=255)
    gstin = models.CharField(max_length=15, blank=True, null=True)
    pan = models.CharField(max_length=10, blank=True, null=True)
    
    # Address
    address_street = models.CharField(max_length=255)
    address_city = models.CharField(max_length=100)
    address_state = models.CharField(max_length=100)
    address_pincode = models.CharField(max_length=6)
    address_country = models.CharField(max_length=100, default='India')
    
    # Contact
    contact_phone = models.CharField(max_length=15)
    contact_email = models.EmailField()
    
    # Billing Address (optional separate)
    billing_street = models.CharField(max_length=255, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state = models.CharField(max_length=100, blank=True, null=True)
    billing_pincode = models.CharField(max_length=6, blank=True, null=True)
    
    # Shipping Address
    shipping_street = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_state = models.CharField(max_length=100, blank=True, null=True)
    shipping_pincode = models.CharField(max_length=6, blank=True, null=True)
    
    # Bank Details (optional)
    bank_name = models.CharField(max_length=255, blank=True, null=True)
    bank_account_number = models.CharField(max_length=50, blank=True, null=True)
    bank_ifsc_code = models.CharField(max_length=11, blank=True, null=True)
    
    auto_fetched = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'clients'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'client_name']),
        ]
    
    def __str__(self):
        return f"{self.client_name} ({self.company.name})"
''',

'apps/clients/serializers.py': '''from rest_framework import serializers
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
''',

'apps/clients/views.py': '''from rest_framework import viewsets, filters
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
''',

'apps/clients/urls.py': '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ClientViewSet

router = DefaultRouter()
router.register(r'', ClientViewSet, basename='client')

urlpatterns = [
    path('', include(router.urls)),
]
''',

'apps/clients/admin.py': '''from django.contrib import admin
from .models import Client

@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ['client_name', 'company', 'contact_email', 'created_at']
    search_fields = ['client_name', 'contact_email', 'gstin']
    list_filter = ['company', 'created_at']
''',

# ==================== PRODUCTS APP ====================

'apps/products/__init__.py': '',
'apps/products/migrations/__init__.py': '',

'apps/products/apps.py': '''from django.apps import AppConfig

class ProductsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.products'
''',

'apps/products/models.py': '''from django.db import models
from apps.core.models import CompanyRelatedModel


class Product(CompanyRelatedModel):
    """Product/Service Model"""
    
    PRODUCT_TYPE_CHOICES = [
        ('product', 'Product (Goods)'),
        ('service', 'Service'),
    ]
    
    product_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    item_code = models.CharField(max_length=10, blank=True, null=True)
    hsn = models.CharField(max_length=8, help_text='HSN for goods, SAC for services')
    unit = models.CharField(max_length=20, default='Nos')
    price = models.DecimalField(max_digits=12, decimal_places=2)
    gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    cess_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)
    stock = models.IntegerField(default=0, blank=True, null=True)
    type = models.CharField(max_length=20, choices=PRODUCT_TYPE_CHOICES, default='product')
    has_serial_number = models.BooleanField(default=False)
    category_id = models.UUIDField(blank=True, null=True)
    
    class Meta:
        db_table = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['company', 'product_name']),
            models.Index(fields=['hsn']),
        ]
    
    def __str__(self):
        return f"{self.product_name} ({self.company.name})"
''',

'apps/products/serializers.py': '''from rest_framework import serializers
from .models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = '__all__'
''',

'apps/products/views.py': '''from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['product_name', 'hsn', 'item_code']
    ordering = ['-created_at']
    
    def get_queryset(self):
        queryset = super().get_queryset()
        company_id = self.request.query_params.get('company_id')
        if company_id:
            queryset = queryset.filter(company_id=company_id)
        return queryset
''',

'apps/products/urls.py': '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet

router = DefaultRouter()
router.register(r'', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]
''',

'apps/products/admin.py': '''from django.contrib import admin
from .models import Product

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['product_name', 'company', 'type', 'price', 'gst_rate', 'stock']
    search_fields = ['product_name', 'hsn']
    list_filter = ['company', 'type', 'created_at']
''',

# ==================== CATEGORIES APP ====================

'apps/categories/__init__.py': '',
'apps/categories/migrations/__init__.py': '',

'apps/categories/apps.py': '''from django.apps import AppConfig

class CategoriesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.categories'
''',

'apps/categories/models.py': '''from django.db import models
from apps.core.models import TimeStampedModel


class ProductCategory(TimeStampedModel):
    """Global Product Category with default products"""
    
    category_name = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    default_gst_rate = models.DecimalField(max_digits=5, decimal_places=2, default=18.00)
    products = models.JSONField(default=list, help_text='List of {name, hsn, item_code}')
    
    class Meta:
        db_table = 'product_categories'
        verbose_name_plural = 'Product Categories'
        ordering = ['category_name']
    
    def __str__(self):
        return self.category_name
''',

'apps/categories/serializers.py': '''from rest_framework import serializers
from .models import ProductCategory


class ProductCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductCategory
        fields = '__all__'
''',

'apps/categories/views.py': '''from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ProductCategory
from .serializers import ProductCategorySerializer


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ProductCategorySerializer
    ordering = ['category_name']
''',

'apps/categories/urls.py': '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductCategoryViewSet

router = DefaultRouter()
router.register(r'', ProductCategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
''',

'apps/categories/admin.py': '''from django.contrib import admin
from .models import ProductCategory

@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ['category_name', 'default_gst_rate', 'created_at']
    search_fields = ['category_name']
''',

# ==================== INVOICES APP ====================

'apps/invoices/__init__.py': '',
'apps/invoices/migrations/__init__.py': '',

'apps/invoices/apps.py': '''from django.apps import AppConfig

class InvoicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.invoices'
''',

'apps/invoices/models.py': '''from django.db import models
from apps.core.models import CompanyRelatedModel


class Invoice(CompanyRelatedModel):
    """Invoice Model"""
    
    PAYMENT_STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('partially_paid', 'Partially Paid'),
        ('paid', 'Paid'),
    ]
    
    invoice_number = models.CharField(max_length=50, unique=True, db_index=True)
    client = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='invoices')
    date = models.DateTimeField()
    
    items = models.JSONField(default=list)
    taxable_amount = models.DecimalField(max_digits=15, decimal_places=2)
    cgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    sgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    igst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    total_amount_in_words = models.TextField()
    tax_breakdown = models.JSONField(default=list, blank=True)
    
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pending')
    amount_paid = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    amount_pending = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    payments = models.JSONField(default=list)
    
    class Meta:
        db_table = 'invoices'
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['company', 'date']),
            models.Index(fields=['client']),
            models.Index(fields=['invoice_number']),
        ]
    
    def __str__(self):
        return f"{self.invoice_number} - {self.client.client_name}"
''',

'apps/invoices/serializers.py': '''from rest_framework import serializers
from .models import Invoice
from apps.clients.serializers import ClientSerializer


class InvoiceSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
''',

'apps/invoices/views.py': '''from rest_framework import viewsets, status
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
''',

'apps/invoices/urls.py': '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import InvoiceViewSet

router = DefaultRouter()
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
]
''',

'apps/invoices/admin.py': '''from django.contrib import admin
from .models import Invoice

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ['invoice_number', 'client', 'date', 'total_amount', 'payment_status']
    search_fields = ['invoice_number', 'client__client_name']
    list_filter = ['company', 'payment_status', 'date']
''',

# ==================== QUOTATIONS APP ====================

'apps/quotations/__init__.py': '',
'apps/quotations/migrations/__init__.py': '',

'apps/quotations/apps.py': '''from django.apps import AppConfig

class QuotationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.quotations'
''',

'apps/quotations/models.py': '''from django.db import models
from apps.core.models import CompanyRelatedModel


class Quotation(CompanyRelatedModel):
    """Quotation Model"""
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('converted', 'Converted to Invoice'),
        ('expired', 'Expired'),
    ]
    
    quotation_number = models.CharField(max_length=50, unique=True, db_index=True)
    client = models.ForeignKey('clients.Client', on_delete=models.PROTECT, related_name='quotations')
    date = models.DateTimeField()
    valid_until = models.DateTimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    items = models.JSONField(default=list)
    taxable_amount = models.DecimalField(max_digits=15, decimal_places=2)
    cgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    sgst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    igst = models.DecimalField(max_digits=15, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=15, decimal_places=2)
    total_amount_in_words = models.TextField()
    tax_breakdown = models.JSONField(default=list, blank=True)
    
    converted_to_invoice_id = models.UUIDField(blank=True, null=True)
    
    class Meta:
        db_table = 'quotations'
        ordering = ['-date']
    
    def __str__(self):
        return f"{self.quotation_number} - {self.client.client_name}"
''',

'apps/quotations/serializers.py': '''from rest_framework import serializers
from .models import Quotation


class QuotationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quotation
        fields = '__all__'
''',

'apps/quotations/views.py': '''from rest_framework import viewsets, status
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
''',

'apps/quotations/urls.py': '''from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuotationViewSet

router = DefaultRouter()
router.register(r'', QuotationViewSet, basename='quotation')

urlpatterns = [
    path('', include(router.urls)),
]
''',

'apps/quotations/admin.py': '''from django.contrib import admin
from .models import Quotation

@admin.register(Quotation)
class QuotationAdmin(admin.ModelAdmin):
    list_display = ['quotation_number', 'client', 'date', 'status', 'total_amount']
    search_fields = ['quotation_number', 'client__client_name']
    list_filter = ['company', 'status', 'date']
''',

# ==================== UPLOADS APP (Cloudinary Server-Side) ====================

'apps/uploads/__init__.py': '',
'apps/uploads/migrations/__init__.py': '',

'apps/uploads/apps.py': '''from django.apps import AppConfig

class UploadsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.uploads'
''',

'apps/uploads/views.py': '''"""
Cloudinary Server-Side Upload
Replaces ALL client-side Cloudinary uploads from Next.js
"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
import cloudinary
import cloudinary.uploader


class CloudinaryUploadView(APIView):
    """
    Upload image to Cloudinary server-side
    
    POST /api/uploads/image/
    Body: multipart/form-data
        - file: Image file
        - folder: Cloudinary folder (default: 'logos')
    """
    
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        file = request.FILES.get('file')
        folder = request.data.get('folder', 'logos')
        
        if not file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            return Response(
                {'error': 'Only image files are allowed'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate file size (5MB max)
        max_size = 5 * 1024 * 1024  # 5MB
        if file.size > max_size:
            return Response(
                {'error': 'File size must be less than 5MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                file,
                folder=folder,
                resource_type='image',
                transformation=[
                    {'quality': 'auto:good'},
                    {'fetch_format': 'auto'},
                ]
            )
            
            return Response({
                'secure_url': result['secure_url'],
                'public_id': result['public_id'],
                'url': result['url'],
                'width': result.get('width'),
                'height': result.get('height'),
                'format': result.get('format'),
                'resource_type': result.get('resource_type'),
                'created_at': result.get('created_at'),
            })
        
        except Exception as e:
            return Response(
                {'error': f'Upload failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CloudinaryDeleteView(APIView):
    """
    Delete image from Cloudinary
    
    DELETE /api/uploads/image/
    Body: { "public_id": "logos/abc123" }
    """
    
    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        public_id = request.data.get('public_id')
        
        if not public_id:
            return Response(
                {'error': 'public_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            result = cloudinary.uploader.destroy(public_id)
            
            return Response({
                'result': result.get('result'),
                'message': 'Image deleted successfully' if result.get('result') == 'ok' else 'Delete failed'
            })
        
        except Exception as e:
            return Response(
                {'error': f'Delete failed: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
''',

'apps/uploads/urls.py': '''from django.urls import path
from .views import CloudinaryUploadView, CloudinaryDeleteView

urlpatterns = [
    path('image/', CloudinaryUploadView.as_view(), name='upload-image'),
    path('image/delete/', CloudinaryDeleteView.as_view(), name='delete-image'),
]
''',

'apps/uploads/admin.py': '''from django.contrib import admin

# Uploads don't have models, just API endpoints
''',

}


def create_file(path: str, content: str):
    """Create file with content"""
    file_path = BASE_DIR / path
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    return path


def main():
    print("\n" + "=" * 80)
    print("🚀 CREATING ALL REMAINING DJANGO APPS")
    print("=" * 80 + "\n")
    
    apps_created = set()
    
    for path, content in ALL_FILES.items():
        create_file(path, content)
        app_name = path.split('/')[1]
        apps_created.add(app_name)
        print(f"✅ {path}")
    
    print("\n" + "=" * 80)
    print(f"✅ ALL APPS CREATED: {', '.join(sorted(apps_created))}")
    print("=" * 80)
    print("\n📋 Next Steps:")
    print("1. python manage.py makemigrations")
    print("2. python manage.py migrate")
    print("3. python manage.py createsuperuser")
    print("4. python manage.py runserver 8000")
    print("\n🌐 Then visit: http://localhost:8000/api/docs/")
    print("=" * 80 + "\n")


if __name__ == '__main__':
    main()
