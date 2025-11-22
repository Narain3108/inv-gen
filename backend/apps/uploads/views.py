"""
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
