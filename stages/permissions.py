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
        # POST, PUT, PATCH, DELETE
        return request.user.is_authenticated and request.user.role in ['admin', 'gestionnaire']

class CanValidateRapports(permissions.BasePermission):
    """Permet la validation/archivage aux gestionnaires/admins."""
    def has_permission(self, request, view):
        # Valide l'accès aux routes spécifiques de validation/archivage
        if 'valider' in request.path or 'archiver' in request.path:
            return request.user.is_authenticated and request.user.role in ['admin', 'gestionnaire']
        return True # Permet aux autres méthodes de passer (par ex. GET)

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission au niveau de l'objet, nécessitant une implémentation 
    dans la vue pour vérifier la propriété.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Par défaut, seul l'admin/gestionnaire peut modifier les objets du système
        return request.user.is_authenticated and request.user.role in ['admin', 'gestionnaire']