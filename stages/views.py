from django.shortcuts import render, redirect, get_object_or_404
from .models import Stagiaire, Encadrant, Stage, Rapport
from .forms import StagiaireForm, StageForm, EncadrantForm, RapportForm

from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
from django.db.models import Count, Avg, F
from django.db.models.functions import ExtractMonth
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.contrib.auth.decorators import login_required # Pour les vues HTML

import json
from datetime import datetime, date
from dateutil.relativedelta import relativedelta
from collections import defaultdict
import os # Pour la gestion des fichiers (téléchargement)

# Imports DRF pour les décorateurs de permission/auth
from rest_framework.decorators import permission_classes
from rest_framework.permissions import IsAuthenticated

# Imports de vos permissions personnalisées
from .permissions import IsAdmin, IsGestionnaireOrAdmin, CanEditStages, CanValidateRapports
# ⚠️ Ajoutez cet import si vous avez un fichier business_rules.py
# from .business_rules import BusinessRules 


# =======================================================================
# Fonctions de sérialisation (Conservées & Complétées)
# =======================================================================

def stagiaire_to_dict(stagiaire):
    if stagiaire is None:
        return None
    # Ajout du count ici, nécessite .prefetch_related('stages') lors de l'appel liste
    stages_count = stagiaire.stages.count() if hasattr(stagiaire, 'stages') else 0
    return {
        'id': stagiaire.id,
        'nom': stagiaire.nom,
        'prenom': stagiaire.prenom,
        'ecole': stagiaire.ecole,
        'specialite': stagiaire.specialite,
        'niveau_etude': stagiaire.niveau_etude,
        'email': stagiaire.email,
        'telephone': stagiaire.telephone,
        'matricule': stagiaire.matricule, 
        'stages_count': stages_count,
    }

def encadrant_to_dict(encadrant):
    if encadrant is None:
        return None
    stages_encadres = encadrant.stages.count() if hasattr(encadrant, 'stages') else 0
    return {
        'id': encadrant.id,
        'nom': encadrant.nom,
        'prenom': encadrant.prenom,
        'institution': encadrant.institution,
        'email': encadrant.email,
        'telephone': encadrant.telephone,
        'stages_encadres': stages_encadres,
        
    }

def stage_to_dict_light(stage):
    """Version légère pour les objets imbriqués (ex: Stage dans Rapport)"""
    return {
        'id': stage.id,
        'theme': stage.theme,
        'type_stage': stage.type_stage,
        # Gestion des dates nulles
        'date_debut': stage.date_debut.isoformat() if stage.date_debut else None,
        'date_fin': stage.date_fin.isoformat() if stage.date_fin else None,
        'statut': stage.statut,
        'lieu_affectation': stage.lieu_affectation,
        'stagiaire_id': stage.stagiaire_id,
        'encadrant_id': stage.encadrant_id,
        'stagiaire': stagiaire_to_dict(stage.stagiaire),
        'encadrant': encadrant_to_dict(stage.encadrant),
        'rapports_count': stage.rapports.count() if hasattr(stage, 'rapports') else 0,
    }

def stage_to_dict(stage):
    """Version complète (pour la route principale /stages/api/)"""
    return stage_to_dict_light(stage)


def rapport_to_dict(rapport):
    return {
        'id': rapport.id,
        'date_depot': rapport.date_depot.isoformat() if rapport.date_depot else None,
        'etat': rapport.etat,
        'stage_id': rapport.stage_id,
        # URL de téléchargement pour le front-end
        'fichier_url': rapport.fichier.url if rapport.fichier else None,
        'stage': stage_to_dict_light(rapport.stage), 
    }

# =======================================================================
# Vues d'interface utilisateur (HTML)
# =======================================================================

# Ces vues ne sont pas sécurisées par DRF mais par des décorateurs Django traditionnels 
# si vous utilisez des templates. Si l'application est 100% API, elles sont inutiles.
def home(request):
    stages = Stage.objects.all()
    return render(request, 'stages/home.html', {'stages': stages})

def add_stagiaire(request):
    # ... (logique du formulaire)
    return HttpResponse("Logique d'ajout de stagiaire via template (HTML)")

def add_stage(request):
    # ... (logique du formulaire)
    return HttpResponse("Logique d'ajout de stage via template (HTML)")


# =======================================================================
# Vues API Authentification (AJOUTÉES)
# =======================================================================

@require_http_methods(["POST"])
@csrf_exempt 
def login_api(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'success': False, 'error': 'Format JSON invalide'}, status=400)
        
    username = data.get('username')
    password = data.get('password')
    
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        role = getattr(user, 'role', 'consultant')
        # Réponse structurée pour le frontend React (AuthContext.jsx)
        return JsonResponse({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'role': role,
                'email': user.email,
                'permissions': {
                    # Ces permissions correspondent aux rôles définis dans permissions.py
                    'can_edit': role in ['admin', 'gestionnaire'],
                    'can_validate': role in ['admin', 'gestionnaire'],
                    'is_admin': user.is_superuser,
                }
            }
        })
    else:
        return JsonResponse({'success': False, 'error': 'Identifiants invalides'}, status=401)

@require_http_methods(["POST"])
def logout_api(request):
    logout(request)
    return JsonResponse({'success': True})

@require_http_methods(["GET"])
@csrf_exempt 
def current_user_api(request):
    if not request.user.is_authenticated:
        return JsonResponse({'error': 'Unauthorized'}, status=401)

    user = request.user
    role = getattr(user, 'role', 'consultant')
    return JsonResponse({
        'id': user.id,
        'username': user.username,
        'role': role,
        'email': user.email,
        'permissions': {
            'can_edit': role in ['admin', 'gestionnaire'],
            'can_validate': role in ['admin', 'gestionnaire'],
            'is_admin': user.is_superuser,
        }
    })


# =======================================================================
# Vues API Stagiaires (SÉCURISÉES)
# =======================================================================

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated])
def stagiaires_api(request):
    # 🔑 CORRECTION : Utiliser le nouveau related_name 'stages_stagiaire'
    stagiaires = Stagiaire.objects.all().prefetch_related('stages_stagiaire').order_by('nom', 'prenom') 
    return JsonResponse([stagiaire_to_dict(s) for s in stagiaires], safe=False)


@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([IsGestionnaireOrAdmin]) # Seuls les gestionnaires/admins peuvent créer
def stagiaire_create(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Format JSON invalide'}, status=400)
    
    form = StagiaireForm(data)
    if form.is_valid():
        stagiaire = form.save()
        return JsonResponse(stagiaire_to_dict(stagiaire), status=201)
    return JsonResponse({'form_errors': form.errors}, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
@permission_classes([IsGestionnaireOrAdmin]) # Seuls les gestionnaires/admins peuvent modifier/supprimer
def stagiaire_detail(request, pk):
    stagiaire = get_object_or_404(Stagiaire.objects.prefetch_related('stages'), pk=pk)

    if request.method == 'GET':
        return JsonResponse(stagiaire_to_dict(stagiaire))
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Format JSON invalide'}, status=400)
            
        form = StagiaireForm(data, instance=stagiaire)
        if form.is_valid():
            stagiaire = form.save()
            return JsonResponse(stagiaire_to_dict(stagiaire))
        return JsonResponse({'form_errors': form.errors}, status=400)
        
    elif request.method == 'DELETE':
        if stagiaire.stages.exists():
             return JsonResponse({'error': 'Impossible de supprimer un stagiaire avec des stages associés.'}, status=400)
        stagiaire.delete()
        return JsonResponse({'deleted': True})


@csrf_exempt
@require_http_methods(["GET"])
@permission_classes([IsAuthenticated]) # Tous les utilisateurs authentifiés peuvent chercher
def search_stagiaire_by_matricule(request):
    """ Recherche un stagiaire par son matricule et retourne son ID et ses infos de base. """
    matricule = request.GET.get('matricule', '').strip()

    if not matricule:
        return JsonResponse({"error": "Matricule manquant"}, status=400)

    try:
        stagiaire = Stagiaire.objects.get(matricule__iexact=matricule)
    except Stagiaire.DoesNotExist:
        return JsonResponse({"error": f"Stagiaire avec matricule {matricule} non trouvé."}, status=404)

    return JsonResponse(stagiaire_to_dict(stagiaire))

@csrf_exempt
@require_http_methods(["GET"])
@permission_classes([IsAuthenticated]) # Tous les utilisateurs authentifiés peuvent accéder au détail
def stagiaire_detail_api(request, pk):
    """ API pour obtenir les détails d'un stagiaire et son historique de stages (via ID) """
    try:
        # Optimisation : prefetch stages et select_related encadrant/rapport
        stagiaire = Stagiaire.objects.get(pk=pk)
    except Stagiaire.DoesNotExist:
        return JsonResponse({"error": "Stagiaire non trouvé"}, status=404)

    # Note: La fonction stagiaire_to_detail_dict doit gérer les requêtes de stages/rapports
    data = stagiaire_to_detail_dict(stagiaire) 
    return JsonResponse(data, safe=False)


# =======================================================================
# Vues API Encadrants (SÉCURISÉES)
# =======================================================================

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated])
def encadrants_api(request):
    # 🔑 CORRECTION : Utiliser le nouveau related_name 'stages_encadrant'
    encadrants = Encadrant.objects.all().prefetch_related('stages_encadrant').order_by('nom', 'prenom')
    return JsonResponse([encadrant_to_dict(e) for e in encadrants], safe=False)
@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([IsGestionnaireOrAdmin])
def add_encadrant(request):
    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Format JSON invalide'}, status=400)
        
    form = EncadrantForm(data)
    if form.is_valid():
        encadrant = form.save()
        return JsonResponse(encadrant_to_dict(encadrant), status=201)
    return JsonResponse({'form_errors': form.errors}, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
@permission_classes([IsGestionnaireOrAdmin])
def encadrant_detail(request, pk):
    encadrant = get_object_or_404(Encadrant.objects.prefetch_related('stages'), pk=pk)

    if request.method == 'GET':
        return JsonResponse(encadrant_to_dict(encadrant))
    
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Format JSON invalide'}, status=400)
            
        form = EncadrantForm(data, instance=encadrant)
        if form.is_valid():
            encadrant = form.save()
            return JsonResponse(encadrant_to_dict(encadrant))
        return JsonResponse({'form_errors': form.errors}, status=400)

    elif request.method == 'DELETE':
        if encadrant.stages.exists():
            return JsonResponse({'error': 'Impossible de supprimer un encadrant avec des stages actifs.'}, status=400)
        encadrant.delete()
        return JsonResponse({'deleted': True})


# =======================================================================
# Vues API Stages (SÉCURISÉES)
# =======================================================================

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated]) # Tous les utilisateurs authentifiés peuvent consulter
def stages_api(request):
    stages = Stage.objects.all().select_related('stagiaire', 'encadrant').order_by('-date_debut')
    # Ajout du filtre de statut (ex: /stages/api/?statut=En%20cours)
    statut = request.GET.get('statut')
    if statut:
        stages = stages.filter(statut=statut)
    
    return JsonResponse([stage_to_dict(s) for s in stages], safe=False)

@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([CanEditStages]) # Gestionnaires/Admins pour la création
def stage_create(request):
    # La logique de création que vous avez fournie était complexe (création stagiaire + stage)
    try:
        data = json.loads(request.body) 
    except json.JSONDecodeError:
        return JsonResponse({'error': 'Format JSON invalide'}, status=400)
    
    stagiaire_id = data.get('stagiaire')
    encadrant_id = data.get('encadrant')

    if not stagiaire_id:
        # LOGIQUE DE CRÉATION DE STAGIAIRE NON CONSERVÉE, ASSUMANT QU'IL FAUT L'ID
        return JsonResponse({'error': 'L\'ID du stagiaire est obligatoire pour créer le stage.'}, status=400)

    stage_data = {
        'theme': data.get('theme'), 'type_stage': data.get('type_stage'), 
        'date_debut': data.get('date_debut'), 'date_fin': data.get('date_fin'), 
        'stagiaire': stagiaire_id, 'encadrant': encadrant_id,
        'lieu_affectation': data.get('lieu_affectation'), # Ajout d'un champ commun
    }

    stage_form = StageForm(stage_data)
    if stage_form.is_valid():
        try:
            stage = stage_form.save()
            # Re-fetch pour la sérialisation
            stage = Stage.objects.select_related('stagiaire', 'encadrant').get(pk=stage.pk)
            return JsonResponse(stage_to_dict(stage), status=201)
        except Exception as e:
            return JsonResponse({'error': f"Erreur lors de la sauvegarde: {e}"}, status=500)
    else:
        return JsonResponse({'form_errors': stage_form.errors}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
@permission_classes([CanEditStages]) # Gestionnaires/Admins pour la modification/suppression
def stage_detail(request, pk):
    stage = get_object_or_404(Stage.objects.select_related('stagiaire', 'encadrant'), pk=pk)

    if request.method == 'GET':
        return JsonResponse(stage_to_dict(stage))
    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Format JSON invalide'}, status=400)
            
        form = StageForm(data, instance=stage)
        if form.is_valid():
            stage = form.save()
            stage = Stage.objects.select_related('stagiaire', 'encadrant').get(pk=stage.pk)
            return JsonResponse(stage_to_dict(stage))
        return JsonResponse({'form_errors': form.errors}, status=400)
    elif request.method == 'DELETE':
        if stage.rapports.exists():
            return JsonResponse({'error': 'Impossible de supprimer un stage avec un rapport associé.'}, status=400)
        stage.delete()
        return JsonResponse({'deleted': True})


# =======================================================================
# Vues API Rapports (SÉCURISÉES)
# =======================================================================

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated])
def rapports_api(request):
    rapports = Rapport.objects.all().select_related('stage__stagiaire', 'stage__encadrant').order_by('-date_depot')
    
    query = request.GET.get('q', '').lower()
    etat_filter = request.GET.get('etat', '')
    annee_filter = request.GET.get('annee', '')

    if query:
        rapports = rapports.filter(
            Q(stage__theme__icontains=query) |
            Q(stage__stagiaire__nom__icontains=query) |
            Q(stage__stagiaire__prenom__icontains=query)
        )

    if etat_filter:
        rapports = rapports.filter(etat=etat_filter)

    if annee_filter and annee_filter.isdigit():
        try:
            annee = int(annee_filter)
            rapports = rapports.filter(date_depot__year=annee)
        except ValueError:
            pass

    return JsonResponse([rapport_to_dict(r) for r in rapports], safe=False)

@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([IsAuthenticated]) # Tout utilisateur peut déposer un rapport
def rapport_create(request):
    # Utilisation de request.POST et request.FILES pour l'upload de fichiers
    form = RapportForm(request.POST, request.FILES)
    if form.is_valid():
        rapport = form.save()
        rapport = Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant').get(pk=rapport.pk)
        return JsonResponse(rapport_to_dict(rapport), status=201)
    return JsonResponse({'form_errors': form.errors}, status=400)

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated])
def rapport_detail(request, pk):
    rapport = get_object_or_404(Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant'), pk=pk)
    return JsonResponse(rapport_to_dict(rapport))


@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([CanValidateRapports]) # Gestionnaires/Admins pour la validation
def rapport_valider(request, pk):
    rapport = get_object_or_404(Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant'), pk=pk)
    
    if rapport.etat == 'Validé':
        return JsonResponse({"error": "Déjà validé."}, status=400)
        
    rapport.etat = 'Validé'
    rapport.save()
    
    # Mettre à jour le statut du stage à "Validé" si nécessaire
    stage = rapport.stage
    if stage.statut != 'Validé':
        stage.statut = 'Validé'
        stage.save()
        
    return JsonResponse(rapport_to_dict(rapport))

@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([CanValidateRapports]) # Gestionnaires/Admins pour l'archivage
def rapport_archiver(request, pk):
    rapport = get_object_or_404(Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant'), pk=pk)
    
    if rapport.etat != 'Validé':
        return JsonResponse({"error": "Un rapport ne peut être archivé que s'il est Validé."}, status=400)
        
    rapport.etat = 'Archivé'
    rapport.save()
    return JsonResponse(rapport_to_dict(rapport))

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated])
def rapport_download(request, pk):
    rapport = get_object_or_404(Rapport, pk=pk)
    
    if not rapport.fichier:
        return JsonResponse({"error": "Fichier non trouvé"}, status=404)
        
    # Ceci est la vue de téléchargement direct de fichier (pour les appels de type XHR/fetch)
    file_path = rapport.fichier.path
    if not os.path.exists(file_path):
        raise Http404("Fichier sur le disque introuvable.")

    with open(file_path, 'rb') as fh:
        response = HttpResponse(fh.read(), content_type="application/pdf")
        response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
        return response


# =======================================================================
# Vues API Dashboard (SÉCURISÉES)
# =======================================================================

def get_monthly_stage_count():
    """Compte le nombre de stages qui ont commencé chaque mois de l'année en cours."""
    current_year = date.today().year
    
    monthly_counts_qs = Stage.objects.filter(
        date_debut__year=current_year
    ).annotate(
        month=ExtractMonth('date_debut')
    ).values('month').annotate(
        count=Count('id')
    ).order_by('month')
    
    monthly_data = {i: 0 for i in range(1, 13)}
    for item in monthly_counts_qs:
        monthly_data[item['month']] = item['count']
        
    month_names = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    
    formatted_data = [
        {'name': month_names[i-1], 'Stages': monthly_data[i]}
        for i in range(1, 13)
    ]
    
    return formatted_data


def get_dashboard_data():
    """Collecte toutes les statistiques pour le dashboard."""
    total_stagiaires = Stagiaire.objects.count()
    total_encadrants = Encadrant.objects.count()
    
    stages_counts = Stage.objects.values('statut').annotate(count=Count('statut'))
    stages_dict = {item['statut']: item['count'] for item in stages_counts}
    total_stages = Stage.objects.count()
    
    rapports_counts = Rapport.objects.values('etat').annotate(count=Count('etat'))
    rapports_dict = {item['etat']: item['count'] for item in rapports_counts}
    total_rapports = Rapport.objects.count()

    today = date.today()
    # Stages en retard (Date de fin passée mais statut non Validé/Terminé)
    stages_a_verifier = Stage.objects.filter(
        statut__in=['En cours', 'En attente'], 
        date_fin__lt=today
    ).count() 
    
    seven_days_later = today + relativedelta(days=+7)
    stages_bientot_finis = Stage.objects.filter(
        statut='En cours', 
        date_fin__range=[today, seven_days_later]
    ).count()
    
    stage_status_data = [
        {'name': statut, 'value': stages_dict.get(statut, 0)}
        for statut in stages_dict.keys()
    ]
    
    monthly_stages_data = get_monthly_stage_count()
    
    return {
        'total_stagiaires': total_stagiaires,
        'total_encadrants': total_encadrants,
        'stages_encours': stages_dict.get('En cours', 0),
        'stages_valides': stages_dict.get('Validé', 0),
        'stages_termines': stages_dict.get('Terminé', 0),
        'total_stages': total_stages,
        'rapports_en_attente': rapports_dict.get('En attente', 0),
        'rapports_valides': rapports_dict.get('Validé', 0),
        'rapports_archives': rapports_dict.get('Archivé', 0),
        'total_rapports': total_rapports,
        'stages_retard_non_valides': stages_a_verifier,
        'stages_bientot_finis': stages_bientot_finis,
        'stages_by_status': stage_status_data, 
        'monthly_stages': monthly_stages_data, 
    }

@require_http_methods(["GET"])
@permission_classes([IsAuthenticated]) # Le dashboard est accessible à tous les utilisateurs
def dashboard_api(request):
    """API endpoint pour les données du dashboard."""
    data = get_dashboard_data()
    return JsonResponse(data)


# =======================================================================
# NOUVELLES VUES POUR LA RECHERCHE ET LE DÉTAIL DU DOSSIER STAGIAIRE
# =======================================================================

def stagiaire_to_detail_dict(stagiaire):
    """
    Sérialise le stagiaire avec tous ses stages et rapports associés.
    (Fonction déplacée au niveau global)
    """
    # Utilisez la fonction existante stagiaire_to_dict pour les infos de base
    detail_dict = stagiaire_to_dict(stagiaire)
    
    # Récupérer tous les stages du stagiaire, triés du plus récent au plus ancien
    # Utiliser select_related ici pour optimiser les requêtes sur les relations
    stages = Stage.objects.filter(stagiaire=stagiaire).select_related('encadrant').order_by('-date_debut')
    
    detail_dict['stages'] = []
    
    for stage in stages:
        # Récupérer le rapport associé au stage (si plusieurs, prendre le premier/plus récent)
        stage_rapport = Rapport.objects.filter(stage=stage).first() 
        
        # Structure de l'Encadrant
        # Note: Assurez-vous que le modèle Encadrant a bien un champ 'interne'
        encadrant_type = 'Interne' if getattr(stage.encadrant, 'interne', False) else 'Externe'
        encadrant_nom = f"{stage.encadrant.nom} {stage.encadrant.prenom} ({encadrant_type})"
        
        # Structure du Rapport
        rapport_dict = None
        if stage_rapport:
            rapport_dict = {
                'statut': stage_rapport.etat,
                'date_depot': stage_rapport.date_depot.strftime('%Y-%m-%d') if stage_rapport.date_depot else None,
                # URL de téléchargement (utilise la vue de téléchargement)
                'download_url': f"/api/rapport/{stage_rapport.id}/download/", 
            }
        
        detail_dict['stages'].append({
            'id': stage.id,
            'theme': stage.theme,
            'date_debut': stage.date_debut.strftime('%Y-%m-%d'),
            'date_fin': stage.date_fin.strftime('%Y-%m-%d'),
            'statut': stage.statut,
            'type_stage': stage.type_stage,
            'encadrant_nom': encadrant_nom,
            'rapport': rapport_dict,
        })

    return detail_dict

@csrf_exempt
@require_http_methods(["GET"])
def stagiaire_detail_api(request, pk):
    """ API pour obtenir les détails d'un stagiaire et son historique de stages (via ID) """
    try:
        stagiaire = Stagiaire.objects.get(pk=pk)
    except Stagiaire.DoesNotExist:
        return JsonResponse({"error": "Stagiaire non trouvé"}, status=404)

    data = stagiaire_to_detail_dict(stagiaire)
    return JsonResponse(data, safe=False)

@csrf_exempt
@require_http_methods(["GET"])
def search_stagiaire_by_matricule(request):
    """ 
    Recherche un stagiaire par son matricule pour trouver son ID et rediriger.
    URL: /stagiaires/api/search-by-matricule/?matricule=STG-XXXX
    """
    matricule = request.GET.get('matricule', '').strip()

    if not matricule:
        return JsonResponse({"error": "Matricule manquant"}, status=400)

    try:
        # Recherche exacte du stagiaire par le champ 'matricule'
        stagiaire = Stagiaire.objects.get(matricule__iexact=matricule) # utiliser iexact pour recherche insensible à la casse
    except Stagiaire.DoesNotExist:
        return JsonResponse({"error": f"Stagiaire avec matricule {matricule} non trouvé. (Vérifiez les archives/l'orthographe)"}, status=404)

    # Si trouvé, on retourne juste l'ID pour permettre la redirection (Front-end)
    return JsonResponse({
        'id': stagiaire.id,
        'nom': stagiaire.nom,
        'prenom': stagiaire.prenom,
        'matricule': stagiaire.matricule
    })