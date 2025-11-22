from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductCategoryViewSet

router = DefaultRouter()
router.register(r'', ProductCategoryViewSet, basename='category')

urlpatterns = [
    path('', include(router.urls)),
]
