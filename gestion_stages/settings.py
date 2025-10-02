"""
Django settings for gestion_stages project.
"""
import os
from pathlib import Path

# Build paths inside the project like this: BASE_DIR / 'subdir'.
# Utilisation de os.path pour garantir la compatibilité pour MEDIA_ROOT
BASE_DIR = Path(__file__).resolve().parent.parent 
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__)) # Point to the directory containing settings.py

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'django-insecure-4kioi6zti==$-c@_@p6cuk+slrz0fm@4(=-13e!3pbk44^#$a7' # À changer pour la production

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*'] # À restreindre en production


# Application definition

INSTALLED_APPS = [
    'corsheaders',
    'stages', # Votre application principale (Assumer que vos models/views/forms sont ici)
    'rest_framework',
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # ⚠️ Ajout du middleware de sécurité AVANT l'authentification
    'stages.security_middleware.SecurityMiddleware', 
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'gestion_stages.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'gestion_stages.wsgi.application'


# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'gestion_stages',
        'USER': 'postgres',
        'PASSWORD': 'emigadmin',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

# User Model Customization (Nécessaire pour le champ 'role')
# ⚠️ Assurez-vous d'avoir un modèle CustomUser avec le champ 'role' dans stages/models.py
AUTH_USER_MODEL = 'stages.CustomUser' 


# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',},
]


# Internationalization
LANGUAGE_CODE = 'fr-fr'
TIME_ZONE = 'Africa/Algiers' # Ajustez si nécessaire
USE_I18N = True
USE_TZ = True


# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'


# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# --- Configuration API / Frontend ---
# CORS (React Frontend)
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    # Ajouter votre domaine de production
]
CORS_ALLOW_CREDENTIALS = True

# CSRF (Permet au frontend React de faire des POST/PUT/DELETE)
CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Media files (upload de rapports)
MEDIA_URL = "/media/"
MEDIA_ROOT = os.path.join(BASE_DIR, "media")

# REST Framework - Authentification
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication', # SessionAuth pour interagir avec le frontend React via CORS/CSRF
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated', # Règle par défaut
    ],
}