import re
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin

class SecurityMiddleware(MiddlewareMixin):
    """
    Middleware pour la protection basique contre les injections SQL 
    et XSS (bien que Django gère déjà bien le XSS en template, cette 
    vérification s'applique aux requêtes API).
    """
    def process_request(self, request):
        # Protection contre les injections SQL basiques
        sql_patterns = [
            r'(\bUNION\b.*\bSELECT\b)',
            r'(\bDROP\b.*\bTABLE\b)',
            r'(\bINSERT\b.*\bINTO\b)',
            r'(\bDELETE\b.*\bFROM\b)',
            r'(\bUPDATE\b.*\bSET\b)',
            r'(\b--\b)', # Commentaire SQL
        ]
        
        # Fonction utilitaire pour vérifier les données
        def check_data(data):
            for param, value in data.items():
                if isinstance(value, str):
                    for pattern in sql_patterns:
                        if re.search(pattern, value, re.IGNORECASE):
                            return True
            return False

        # Vérification des paramètres GET
        if check_data(request.GET):
            return JsonResponse({'error': 'Requête suspecte détectée: injection SQL potentielle (GET)'}, status=400)
        
        # Vérification des paramètres POST/BODY (nécessite l'accès au corps de la requête)
        # Pour les requêtes JSON (API), nous devons lire le body
        if request.method not in ['GET', 'HEAD', 'OPTIONS']:
            # Tenter de lire le JSON pour les APIs (seulement si le content-type est approprié)
            if 'application/json' in request.content_type:
                try:
                    import json
                    data = json.loads(request.body)
                    if check_data(data):
                        return JsonResponse({'error': 'Requête suspecte détectée: injection SQL potentielle (JSON POST)'}, status=400)
                except Exception:
                    # Ne rien faire si le body n'est pas un JSON valide ou est vide
                    pass
            # Pour les formulaires classiques
            elif check_data(request.POST):
                return JsonResponse({'error': 'Requête suspecte détectée: injection SQL potentielle (FORM POST)'}, status=400)
        
        return None