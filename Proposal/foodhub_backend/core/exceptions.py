"""
Custom exception handling for FOODHUB API.
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.core.exceptions import ValidationError as DjangoValidationError
import logging

logger = logging.getLogger(__name__)


def custom_exception_handler(exc, context):
    """
    Custom exception handler that provides consistent error responses.
    """
    # Call REST framework's default exception handler first
    response = exception_handler(exc, context)

    if response is not None:
        # Standardize the error response format
        custom_response = {
            'success': False,
            'error': {
                'code': response.status_code,
                'message': _get_error_message(response.data),
                'details': response.data if isinstance(response.data, dict) else None,
            }
        }
        response.data = custom_response
        return response

    # Handle unhandled exceptions
    if isinstance(exc, IntegrityError):
        logger.error(f"Database integrity error: {exc}")
        return Response({
            'success': False,
            'error': {
                'code': status.HTTP_409_CONFLICT,
                'message': 'A database constraint was violated. This may be due to a duplicate entry or invalid reference.',
                'details': str(exc) if settings.DEBUG else None,
            }
        }, status=status.HTTP_409_CONFLICT)

    if isinstance(exc, DjangoValidationError):
        logger.warning(f"Validation error: {exc}")
        return Response({
            'success': False,
            'error': {
                'code': status.HTTP_400_BAD_REQUEST,
                'message': 'Validation failed.',
                'details': exc.message_dict if hasattr(exc, 'message_dict') else str(exc),
            }
        }, status=status.HTTP_400_BAD_REQUEST)

    # Log unexpected errors
    logger.exception(f"Unhandled exception: {exc}")

    # Return generic error in production, detailed in debug
    from django.conf import settings
    if settings.DEBUG:
        return Response({
            'success': False,
            'error': {
                'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
                'message': str(exc),
                'details': None,
            }
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    return Response({
        'success': False,
        'error': {
            'code': status.HTTP_500_INTERNAL_SERVER_ERROR,
            'message': 'An internal server error occurred.',
            'details': None,
        }
    }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def _get_error_message(data):
    """
    Extract a human-readable error message from DRF error data.
    """
    if isinstance(data, dict):
        # Check for detail field (common in DRF)
        if 'detail' in data:
            return str(data['detail'])
        # Check for non_field_errors
        if 'non_field_errors' in data:
            return ' '.join(str(e) for e in data['non_field_errors'])
        # Return first field error
        for key, value in data.items():
            if isinstance(value, list) and value:
                return f"{key}: {value[0]}"
            elif isinstance(value, str):
                return f"{key}: {value}"
    elif isinstance(data, list) and data:
        return str(data[0])
    elif isinstance(data, str):
        return data
    return 'An error occurred.'