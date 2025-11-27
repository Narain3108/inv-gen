"""
Cloudinary Service
Handles image uploads for logos and signatures
"""

from typing import Optional
import cloudinary
import cloudinary.uploader
from app.core.config import settings


def initialize_cloudinary():
    """Initialize Cloudinary configuration"""
    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True
    )


def upload_image(
    file_data: bytes,
    filename: str,
    folder: str = "invoices",
    resource_type: str = "image"
) -> Optional[dict]:
    """
    Upload image to Cloudinary
    
    Args:
        file_data: Image file bytes
        filename: Original filename
        folder: Cloudinary folder path
        resource_type: Type of resource (image, raw, etc.)
    
    Returns:
        Dictionary with upload result including url and public_id
    """
    try:
        # Initialize if not already done
        if not cloudinary.config().cloud_name:
            initialize_cloudinary()
        
        result = cloudinary.uploader.upload(
            file_data,
            folder=folder,
            resource_type=resource_type,
            public_id=filename.split('.')[0],
            overwrite=True,
            upload_preset=settings.CLOUDINARY_UPLOAD_PRESET
        )
        
        return {
            "url": result.get("secure_url"),
            "public_id": result.get("public_id"),
            "width": result.get("width"),
            "height": result.get("height"),
            "format": result.get("format"),
            "resource_type": result.get("resource_type")
        }
    except Exception as e:
        print(f"Error uploading to Cloudinary: {str(e)}")
        return None


def upload_logo(file_data: bytes, company_id: str, filename: str) -> Optional[str]:
    """
    Upload company logo to Cloudinary
    
    Args:
        file_data: Logo image bytes
        company_id: Company UUID
        filename: Original filename
    
    Returns:
        URL of uploaded logo
    """
    result = upload_image(
        file_data=file_data,
        filename=f"logo_{company_id}_{filename}",
        folder="invoices/logos"
    )
    return result["url"] if result else None


def upload_signature(file_data: bytes, company_id: str, filename: str) -> Optional[str]:
    """
    Upload signature to Cloudinary
    
    Args:
        file_data: Signature image bytes
        company_id: Company UUID
        filename: Original filename
    
    Returns:
        URL of uploaded signature
    """
    result = upload_image(
        file_data=file_data,
        filename=f"signature_{company_id}_{filename}",
        folder="invoices/signatures"
    )
    return result["url"] if result else None


def delete_image(public_id: str) -> bool:
    """
    Delete image from Cloudinary
    
    Args:
        public_id: Cloudinary public ID of the image
    
    Returns:
        True if successful, False otherwise
    """
    try:
        if not cloudinary.config().cloud_name:
            initialize_cloudinary()
        
        result = cloudinary.uploader.destroy(public_id)
        return result.get("result") == "ok"
    except Exception as e:
        print(f"Error deleting from Cloudinary: {str(e)}")
        return False


def get_image_url(public_id: str, transformation: Optional[dict] = None) -> str:
    """
    Get Cloudinary URL for an image with optional transformations
    
    Args:
        public_id: Cloudinary public ID
        transformation: Optional transformation parameters
    
    Returns:
        Image URL
    """
    if not cloudinary.config().cloud_name:
        initialize_cloudinary()
    
    return cloudinary.CloudinaryImage(public_id).build_url(
        transformation=transformation,
        secure=True
    )
