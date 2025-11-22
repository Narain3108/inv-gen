from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import ProductCategory
from .serializers import ProductCategorySerializer


class ProductCategoryViewSet(viewsets.ModelViewSet):
    queryset = ProductCategory.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = ProductCategorySerializer
    ordering = ['category_name']
