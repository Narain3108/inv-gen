from django.urls import path
from .views import CloudinaryUploadView, CloudinaryDeleteView

urlpatterns = [
    path('image/', CloudinaryUploadView.as_view(), name='upload-image'),
    path('image/delete/', CloudinaryDeleteView.as_view(), name='delete-image'),
]
