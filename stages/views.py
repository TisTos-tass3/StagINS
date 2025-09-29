from django.shortcuts import render, redirect, get_object_or_404
from .models import Stagiaire, Encadrant, Stage, Rapport
from .forms import StagiaireForm, StageForm, EncadrantForm, RapportForm
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.db.models import Q
import json
from datetime import datetime, date
from django.db import models 
from django.db.models import Count, Avg, F
from datetime import date
from dateutil.relativedelta import relativedelta
from django.db.models import Count # Import nécessaire pour l'agrégation
from django.db.models.functions import ExtractMonth # Import nécessaire pour l'extraction du mois
from collections import defaultdict # Pour gérer les mois sans stage

# =======================================================================
# Fonctions de sérialisation (AJOUTÉES/CORRIGÉES)
# =======================================================================

def stagiaire_to_dict(stagiaire):
    if stagiaire is None:
        return None
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
    }

def encadrant_to_dict(encadrant):
    if encadrant is None:
        return None
    return {
        'id': encadrant.id,
        'nom': encadrant.nom,
        'prenom': encadrant.prenom,
        'institution': encadrant.institution,
        'email': encadrant.email,
        'telephone': encadrant.telephone,
    }

def stage_to_dict_light(stage):
    """Version légère pour les objets imbriqués (ex: Stage dans Rapport)"""
    return {
        'id': stage.id,
        'theme': stage.theme,
        'type_stage': stage.type_stage,
        'date_debut': stage.date_debut.isoformat(),
        'date_fin': stage.date_fin.isoformat(),
        'statut': stage.statut,
        'stagiaire_id': stage.stagiaire_id,
        'encadrant_id': stage.encadrant_id,
        # Inclusion des objets stagiaire et encadrant
        'stagiaire': stagiaire_to_dict(stage.stagiaire) if stage.stagiaire else None,
        'encadrant': encadrant_to_dict(stage.encadrant) if stage.encadrant else None,
        'rapports_count': stage.rapports.count(),
    }

def stage_to_dict(stage):
    """Version complète (pour la route principale /stages/api/)"""
    # Utilise la version light, mais vous pourriez ajouter plus de détails ici si nécessaire.
    return stage_to_dict_light(stage)


def rapport_to_dict(rapport):
    return {
        'id': rapport.id,
        'date_depot': rapport.date_depot.isoformat(),
        'etat': rapport.etat,
        'stage_id': rapport.stage_id,
        'fichier_url': f'/media/{rapport.fichier.name}' if rapport.fichier else None,
        # Sérialisation du stage avec les détails stagiaire/encadrant
        'stage': stage_to_dict_light(rapport.stage), 
    }

# =======================================================================
# Vues d'interface utilisateur (inchangées)
# =======================================================================

def home(request):
    stages = Stage.objects.all()
    return render(request, 'stages/home.html', {'stages': stages})

def add_stagiaire(request):
    if request.method == 'POST':
        form = StagiaireForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = StagiaireForm()
    return render(request, 'stages/add_stagiaire.html', {'form': form})

def add_stage(request):
    if request.method == 'POST':
        form = StageForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = StageForm()
    return render(request, 'stages/add_stage.html', {'form': form})

# =======================================================================
# Vues API Stagiaires (Mise à jour pour utiliser stagiaire_to_dict)
# =======================================================================

@require_http_methods(["GET"])
def stagiaires_api(request):
    # Utiliser .all() au lieu de .values() pour utiliser stagiaire_to_dict
    stagiaires = Stagiaire.objects.all().order_by('nom', 'prenom')
    return JsonResponse([stagiaire_to_dict(s) for s in stagiaires], safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def stagiaire_create(request):
    data = json.loads(request.body)
    form = StagiaireForm(data)
    if form.is_valid():
        stagiaire = form.save()
        return JsonResponse(stagiaire_to_dict(stagiaire), status=201)
    return JsonResponse(form.errors, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def stagiaire_detail(request, pk):
    stagiaire = get_object_or_404(Stagiaire, pk=pk)

    if request.method == 'GET':
        return JsonResponse(stagiaire_to_dict(stagiaire))
    elif request.method == 'PUT':
        data = json.loads(request.body)
        form = StagiaireForm(data, instance=stagiaire)
        if form.is_valid():
            stagiaire = form.save()
            return JsonResponse(stagiaire_to_dict(stagiaire))
        return JsonResponse(form.errors, status=400)
    elif request.method == 'DELETE':
        stagiaire.delete()
        return JsonResponse({'deleted': True})
    
# =======================================================================
# Vues API Encadrants (Ajout de la fonction pour la sérialisation)
# =======================================================================
    
@require_http_methods(["GET"])
def encadrants_api(request):
    encadrants = Encadrant.objects.all().order_by('nom', 'prenom')
    return JsonResponse([encadrant_to_dict(e) for e in encadrants], safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def add_encadrant(request): # Le nom 'add_encadrant' est conservé de l'original, mais sert d'API create
    data = json.loads(request.body)
    form = EncadrantForm(data)
    if form.is_valid():
        encadrant = form.save()
        return JsonResponse(encadrant_to_dict(encadrant), status=201)
    return JsonResponse(form.errors, status=400)

@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def encadrant_detail(request, pk):
    encadrant = get_object_or_404(Encadrant, pk=pk)

    if request.method == 'GET':
        return JsonResponse(encadrant_to_dict(encadrant))
    elif request.method == 'PUT':
        data = json.loads(request.body)
        form = EncadrantForm(data, instance=encadrant)
        if form.is_valid():
            encadrant = form.save()
            return JsonResponse(encadrant_to_dict(encadrant))
        return JsonResponse(form.errors, status=400)
    elif request.method == 'DELETE':
        encadrant.delete()
        return JsonResponse({'deleted': True})

# =======================================================================
# Vues API Stages (CORRECTION CRITIQUE)
# =======================================================================

@require_http_methods(["GET"])
def stages_api(request):
    # ✅ FIX: Utiliser select_related pour inclure stagiaire et encadrant en une seule requête
    stages = Stage.objects.all().select_related('stagiaire', 'encadrant').order_by('-date_debut')
    return JsonResponse([stage_to_dict(s) for s in stages], safe=False) 

@csrf_exempt
@require_http_methods(["POST"])
def stage_create(request):
    data = json.loads(request.body)
    stagiaire_id = data.get('stagiaire')
    encadrant_id = data.get('encadrant')

    # Si stage créé à partir du formulaire multi-étapes (nouvel stagiaire + stage)
    if not stagiaire_id:
        stagiaire_data = {
            'nom': data.get('nom'), 'prenom': data.get('prenom'), 'ecole': data.get('ecole'),
            'specialite': data.get('specialite'), 'niveau_etude': data.get('niveau_etude'),
            'email': data.get('email'), 'telephone': data.get('telephone'),
        }
        stagiaire_form = StagiaireForm(stagiaire_data)
        if stagiaire_form.is_valid():
            stagiaire = stagiaire_form.save()
            stagiaire_id = stagiaire.id
        else:
            return JsonResponse({'error': 'Erreur de création du stagiaire', 'details': stagiaire_form.errors}, status=400)

    stage_data = {
        'theme': data.get('theme'), 'type_stage': data.get('type_stage'), 
        'date_debut': data.get('date_debut'), 'date_fin': data.get('date_fin'), 
        'stagiaire': stagiaire_id, 'encadrant': encadrant_id,
    }

    stage_form = StageForm(stage_data)
    if stage_form.is_valid():
        try:
            stage = stage_form.save(commit=False)
            stage.stagiaire = Stagiaire.objects.get(pk=stagiaire_id)
            stage.encadrant = Encadrant.objects.get(pk=encadrant_id) if encadrant_id else None
            stage.save() # Le save() du modèle met à jour le statut
            return JsonResponse(stage_to_dict(stage), status=201)
        except Exception as e:
            return JsonResponse({'error': f"Erreur lors de la sauvegarde: {e}"}, status=500)
    else:
        return JsonResponse({'error': 'Erreur de création du stage', 'details': stage_form.errors}, status=400)


@csrf_exempt
@require_http_methods(["GET", "PUT", "DELETE"])
def stage_detail(request, pk):
    # ✅ FIX: Utiliser select_related
    stage = get_object_or_404(Stage.objects.select_related('stagiaire', 'encadrant'), pk=pk)

    if request.method == 'GET':
        return JsonResponse(stage_to_dict(stage))
    elif request.method == 'PUT':
        data = json.loads(request.body)
        form = StageForm(data, instance=stage)
        if form.is_valid():
            stage = form.save()
            # Re-fetch l'objet avec les relations pour la réponse (car form.save ne fait pas select_related)
            stage = Stage.objects.select_related('stagiaire', 'encadrant').get(pk=stage.pk)
            return JsonResponse(stage_to_dict(stage))
        return JsonResponse(form.errors, status=400)
    elif request.method == 'DELETE':
        stage.delete()
        return JsonResponse({'deleted': True})


# =======================================================================
# Vues API Rapports (Mise à jour pour utiliser rapport_to_dict et Q)
# =======================================================================

@require_http_methods(["GET"])
def rapports_api(request):
    rapports = Rapport.objects.all().select_related('stage__stagiaire', 'stage__encadrant').order_by('-date_depot')
    
    query = request.GET.get('q', '').lower()
    etat_filter = request.GET.get('etat', '')
    annee_filter = request.GET.get('annee', '')

    if query:
        # Filtrer par thème de stage, nom/prénom de stagiaire
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
@require_http_methods(["GET", "PUT", "DELETE"])
def rapport_detail(request, pk):
    rapport = get_object_or_404(Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant'), pk=pk)

    if request.method == 'GET':
        return JsonResponse(rapport_to_dict(rapport))
    elif request.method == 'PUT':
        # Gestion des fichiers dans le formulaire
        form = RapportForm(request.POST, request.FILES, instance=rapport)
        if form.is_valid():
            rapport = form.save()
            return JsonResponse(rapport_to_dict(rapport))
        return JsonResponse(form.errors, status=400)
    elif request.method == 'DELETE':
        if rapport.etat != 'En attente':
            return JsonResponse({"error": "Seul un rapport en attente peut être supprimé."}, status=400)
        rapport.delete()
        return JsonResponse({"deleted": True})
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)


@csrf_exempt
@require_http_methods(["POST"])
def rapport_create(request):
    form = RapportForm(request.POST, request.FILES)
    if form.is_valid():
        rapport = form.save()
        # Re-fetch pour la sérialisation correcte (inclure stage/stagiaire/encadrant)
        rapport = Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant').get(pk=rapport.pk)
        return JsonResponse(rapport_to_dict(rapport), status=201)
    return JsonResponse(form.errors, status=400)

@csrf_exempt
@require_http_methods(["POST"])
def rapport_valider(request, pk):
    rapport = get_object_or_404(Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant'), pk=pk)
    if rapport.etat == 'Validé':
        return JsonResponse({"error": "Déjà validé."}, status=400)
    rapport.etat = 'Validé'
    rapport.save()
    stage = rapport.stage
    if stage.statut != 'Validé':
        stage.statut = 'Validé'
        stage.save()
    return JsonResponse(rapport_to_dict(rapport))

@csrf_exempt
@require_http_methods(["POST"])
def rapport_archiver(request, pk):
    rapport = get_object_or_404(Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant'), pk=pk)
    if rapport.etat != 'Validé':
        return JsonResponse({"error": "Un rapport ne peut être archivé que s'il est Validé."}, status=400)
    rapport.etat = 'Archivé'
    rapport.save()
    return JsonResponse(rapport_to_dict(rapport))

@require_http_methods(["GET"])
def rapport_download(request, pk):
    rapport = get_object_or_404(Rapport, pk=pk)
    if rapport.fichier:
        # Pour une API, il est préférable de renvoyer l'URL du fichier pour que le frontend le télécharge directement
        return JsonResponse({"download_url": rapport.fichier.url})
    return JsonResponse({"error": "Fichier non trouvé"}, status=404)

def get_monthly_stage_count():
    """Compte le nombre de stages qui ont commencé chaque mois de l'année en cours."""
    current_year = date.today().year
    
    # 1. Filtrer les stages de l'année en cours
    monthly_counts_qs = Stage.objects.filter(
        date_debut__year=current_year
    ).annotate(
        # Extraire le mois de la date de début
        month=ExtractMonth('date_debut')
    ).values('month').annotate(
        # Compter le nombre de stages pour ce mois
        count=Count('id')
    ).order_by('month')
    
    # 2. Créer un dictionnaire pour stocker les résultats, initialisé à 0 pour les 12 mois
    monthly_data = {i: 0 for i in range(1, 13)}
    
    # 3. Mettre à jour les mois avec les vraies données
    for item in monthly_counts_qs:
        monthly_data[item['month']] = item['count']
        
    # 4. Formater les données pour le frontend (avec le nom du mois)
    month_names = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"]
    
    formatted_data = [
        {'name': month_names[i-1], 'Stages': monthly_data[i]}
        for i in range(1, 13)
    ]
    
    return formatted_data


def get_dashboard_data():
   
    # 1. Totaux
    total_stagiaires = Stagiaire.objects.count()
    total_encadrants = Encadrant.objects.count()
    
    # 2. Suivi des Stages
    stages_counts = Stage.objects.values('statut').annotate(count=Count('statut'))
    stages_dict = {item['statut']: item['count'] for item in stages_counts}
    total_stages = Stage.objects.count()
    
    # 3. Suivi des Rapports
    # ... (le reste du code de suivi des rapports)
    rapports_counts = Rapport.objects.values('etat').annotate(count=Count('etat'))
    rapports_dict = {item['etat']: item['count'] for item in rapports_counts}
    total_rapports = Rapport.objects.count()

    # 4. Stages en retard ou bientôt terminés
    today = date.today()
    stages_termines_non_valides = stages_dict.get('Terminé', 0)
    stages_a_verifier = Stage.objects.filter(statut='En cours', date_fin__lt=today).count()
    seven_days_later = today + relativedelta(days=+7)
    stages_bientot_finis = Stage.objects.filter(statut='En cours', date_fin__range=[today, seven_days_later]).count()
    
    # 5. Top Encadrants -> SUPPRIMÉ

    # 6. Stages par statut pour le graphique circulaire (NOUVELLE DONNÉE)
    stage_status_data = [
        {'name': statut, 'value': stages_dict.get(statut, 0)}
        for statut in ['En cours', 'Validé', 'Terminé'] # Liste des statuts pertinents
    ]
    
    # 7. Stages par mois (NOUVELLE DONNÉE)
    monthly_stages_data = get_monthly_stage_count()
    
    return {
        'total_stagiaires': total_stagiaires,
        'total_encadrants': total_encadrants,
        'stages_encours': stages_dict.get('En cours', 0),
        'stages_termines': stages_dict.get('Terminé', 0),
        'stages_valides': stages_dict.get('Validé', 0),
        'total_stages': total_stages,
        'rapports_en_attente': rapports_dict.get('En attente', 0),
        'rapports_valides': rapports_dict.get('Validé', 0),
        'rapports_archives': rapports_dict.get('Archivé', 0),
        'total_rapports': total_rapports,
        'stages_retard_non_valides': stages_a_verifier,
        'stages_bientot_finis': stages_bientot_finis,
        # NOUVELLES DONNÉES POUR LES GRAPHIQUES
        'stages_by_status': stage_status_data, 
        'monthly_stages': monthly_stages_data, 
        # 'top_encadrants': top_encadrants_list # SUPPRIMÉ
    }

@require_http_methods(["GET"])
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

# NOTE FINALE : N'oubliez pas d'ajouter les deux routes suivantes dans votre urls.py :
# path('stagiaires/api/<int:pk>/detail/', views.stagiaire_detail_api, name='stagiaire_detail_api'),
# path('stagiaires/api/search-by-matricule/', views.search_stagiaire_by_matricule, name='search_stagiaire_by_matricule'),