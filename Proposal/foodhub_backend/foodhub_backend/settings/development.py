"""
Django development settings for FOODHUB project.
"""

from .base import *

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

# Allow all hosts in development
ALLOWED_HOSTS = ['*']

# Database - use SQLite for development (MariaDB 10.4 in XAMPP is too old for Django 5.x)
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Email backend for development (console)
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'

# Disable password validators in development for easier testing
AUTH_PASSWORD_VALIDATORS = []

# CORS - allow all in development
CORS_ALLOW_ALL_ORIGINS = True


# Logging
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
        'accounts.views': {
            'handlers': ['console'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}