from rest_framework import permissions

class IsAdmin(permissions.BasePermission):
    """Permet l'accès uniquement aux administrateurs."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsGestionnaireOrAdmin(permissions.BasePermission):
    """Permet l'accès uniquement aux gestionnaires et administrateurs."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ['admin', 'gestionnaire']

class CanEditStages(permissions.BasePermission):
    """Permet l'édition (POST/PUT/DELETE) aux gestionnaires/admins, et la lecture (GET) à tous les authentifiés."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
       
        return request.user.is_authenticated and request.user.role in ['admin', 'gestionnaire']

class CanValidateRapports(permissions.BasePermission):
    """Permet la validation/archivage aux gestionnaires/admins."""
    def has_permission(self, request, view):
       
        if 'valider' in request.path or 'archiver' in request.path:
            return request.user.is_authenticated and request.user.role in ['admin', 'gestionnaire']
        return True

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission au niveau de l'objet
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
       
        return request.user.is_authenticated and request.user.role in ['admin', 'gestionnaire']