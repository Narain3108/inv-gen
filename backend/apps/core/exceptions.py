"""
Custom Exception Handler for DRF
Provides consistent error responses across the API
"""

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.core.exceptions import ValidationError as DjangoValidationError
from typing import Any, Dict


def custom_exception_handler(exc: Exception, context: Dict[str, Any]) -> Response:
    """
    Custom exception handler that returns consistent error format
    
    Error Response Format:
    {
        "error": {
            "message": "Error description",
            "code": "error_code",
            "details": {...}
        }
    }
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)
    
    if response is not None:
        # Standardize the error response
        error_data = {
            'error': {
                'message': str(exc),
                'code': exc.__class__.__name__,
                'details': response.data
            }
        }
        response.data = error_data
        return response
    
    # Handle Django ValidationError
    if isinstance(exc, DjangoValidationError):
        error_data = {
            'error': {
                'message': 'Validation error',
                'code': 'ValidationError',
                'details': exc.message_dict if hasattr(exc, 'message_dict') else {'detail': exc.messages}
            }
        }
        return Response(error_data, status=status.HTTP_400_BAD_REQUEST)
    
    # Handle unexpected exceptions
    error_data = {
        'error': {
            'message': 'An unexpected error occurred',
            'code': 'InternalServerError',
            'details': {'detail': str(exc)}
        }
    }
    return Response(error_data, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class APIException(Exception):
    """Base API Exception"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'An error occurred'
    
    def __init__(self, message: str = None, code: str = None, details: Dict = None):
        self.message = message or self.default_message
        self.code = code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class ValidationException(APIException):
    """Validation Error Exception"""
    status_code = status.HTTP_400_BAD_REQUEST
    default_message = 'Validation failed'


class NotFoundException(APIException):
    """Resource Not Found Exception"""
    status_code = status.HTTP_404_NOT_FOUND
    default_message = 'Resource not found'


class PermissionDeniedException(APIException):
    """Permission Denied Exception"""
    status_code = status.HTTP_403_FORBIDDEN
    default_message = 'Permission denied'


class UnauthorizedException(APIException):
    """Unauthorized Exception"""
    status_code = status.HTTP_401_UNAUTHORIZED
    default_message = 'Unauthorized access'
