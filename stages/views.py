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
from datetime import datetime
from django.db import models # Ajout de l'importation de models

# Page d'accueil
def home(request):
    stages = Stage.objects.all()
    return render(request, 'stages//home.html', {'stages': stages})

# Ajouter un stagiaire
def add_stagiaire(request):
    if request.method == 'POST':
        form = StagiaireForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = StagiaireForm()
    return render(request, 'stages/add_stagiaire.html', {'form': form})

# Ajouter un stage
def add_stage(request):
    if request.method == 'POST':
        form = StageForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('home')
    else:
        form = StageForm()
    return render(request, 'stages/add_stage.html', {'form': form})

def stagiaires_api(request):
    stagiaires = list(Stagiaire.objects.values())
    return JsonResponse(stagiaires, safe=False)
@csrf_exempt
def stagiaire_create(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        form = StagiaireForm(data)
        if form.is_valid():
            stagiaire = form.save()
            return JsonResponse({
                'id': stagiaire.id,
                'nom': stagiaire.nom,
                'prenom': stagiaire.prenom,
                'email': stagiaire.email,
                'ecole': stagiaire.ecole,
                'filiere': stagiaire.filiere,
                'telephone': stagiaire.telephone,
            }, status=201)
        return JsonResponse(form.errors, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
@csrf_exempt
def stagiaire_detail(request, pk):
    try:
        stagiaire = Stagiaire.objects.get(pk=pk)
    except Stagiaire.DoesNotExist:
        return JsonResponse({'error': 'Stagiaire not found'}, status=404)

    if request.method == 'GET':
        data = {
            'id': stagiaire.id,
            'nom': stagiaire.nom,
            'prenom': stagiaire.prenom,
            'email': stagiaire.email,
            'ecole': stagiaire.ecole,
            'filiere': stagiaire.filiere,
            'telephone': stagiaire.telephone,
        }
        return JsonResponse(data)

    elif request.method == 'PUT':
        data = json.loads(request.body)
        stagiaire.nom = data.get('nom', stagiaire.nom)
        stagiaire.prenom = data.get('prenom', stagiaire.prenom)
        stagiaire.email = data.get('email', stagiaire.email)
        stagiaire.ecole = data.get('ecole', stagiaire.ecole)
        stagiaire.filiere = data.get('filiere', stagiaire.filiere)
        stagiaire.telephone = data.get('telephone', stagiaire.telephone)
        stagiaire.save()
        return JsonResponse({
            'id': stagiaire.id,
            'nom': stagiaire.nom,
            'prenom': stagiaire.prenom,
            'email': stagiaire.email,
            'ecole': stagiaire.ecole,
            'filiere': stagiaire.filiere,
            'telephone': stagiaire.telephone,
        })
        
    elif request.method == 'DELETE':
        stagiaire.delete()
        return JsonResponse({'message': 'Stagiaire deleted successfully'}, status=204)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

def encadrants_api(request):
    encadrants = list(Encadrant.objects.values())
    return JsonResponse(encadrants, safe=False)

@csrf_exempt
def add_encadrant(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        form = EncadrantForm(data)
        if form.is_valid():
            encadrant = form.save()
            return JsonResponse({
                'id': encadrant.id,
                'nom': encadrant.nom,
                'prenom': encadrant.prenom,
                'institution': encadrant.institution,
                'email': encadrant.email,
                'telephone': encadrant.telephone,
            })
        return JsonResponse(form.errors, status=400)

@csrf_exempt
def encadrant_detail(request, pk):
    try:
        encadrant = Encadrant.objects.get(pk=pk)
    except Encadrant.DoesNotExist:
        return JsonResponse({'error': 'Encadrant not found'}, status=404)

    if request.method == 'GET':
        return JsonResponse({
            'id': encadrant.id,
            'nom': encadrant.nom,
            'prenom': encadrant.prenom,
            'institution': encadrant.institution,
            'email': encadrant.email,
            'telephone': encadrant.telephone,
        })

    elif request.method == 'PUT':
        data = json.loads(request.body)
        encadrant.nom = data.get('nom', encadrant.nom)
        encadrant.prenom = data.get('prenom', encadrant.prenom)
        encadrant.institution = data.get('institution', encadrant.institution)
        encadrant.email = data.get('email', encadrant.email)
        encadrant.telephone = data.get('telephone', encadrant.telephone)
        encadrant.save()
        return JsonResponse({
            'id': encadrant.id,
            'nom': encadrant.nom,
            'prenom': encadrant.prenom,
            'institution': encadrant.institution,
            'email': encadrant.email,
            'telephone': encadrant.telephone,
        })

    elif request.method == 'DELETE':
        encadrant.delete()
        return JsonResponse({'message': 'Encadrant deleted successfully'}, status=204)

    return JsonResponse({'error': 'Invalid request method'}, status=405)

def stages_api(request):
    stages = list(Stage.objects.select_related('stagiaire','encadrant').values(
        'id','theme','type_stage','date_debut','date_fin','statut',
        'stagiaire_id','encadrant_id',
        'stagiaire__nom','stagiaire__prenom',
        'encadrant__nom','encadrant__prenom'
    ))
    return JsonResponse(stages, safe=False)

@csrf_exempt
def stage_create(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        date_debut = datetime.strptime(data['date_debut'], "%Y-%m-%d").date()
        date_fin = datetime.strptime(data['date_fin'], "%Y-%m-%d").date()
        stage = Stage.objects.create(
            theme=data['theme'],
            type_stage=data['type_stage'],
            date_debut=date_debut,
            date_fin=date_fin,
            stagiaire_id=data['stagiaire'],
            encadrant_id=data['encadrant']
        )
        return JsonResponse({
            'id': stage.id,
            'statut': stage.statut
        })

@csrf_exempt
def stage_detail(request, pk):
    try:
        stage = Stage.objects.get(pk=pk)
    except Stage.DoesNotExist:
        return JsonResponse({'error': 'Stage not found'}, status=404)

    if request.method == 'PUT':
        data = json.loads(request.body)
        stage.theme = data.get('theme', stage.theme)
        stage.type_stage = data.get('type_stage', stage.type_stage)
        stage.date_debut = data.get('date_debut', stage.date_debut)
        stage.date_fin = data.get('date_fin', stage.date_fin)
        if 'stagiaire' in data: stage.stagiaire_id = data['stagiaire']
        if 'encadrant' in data: stage.encadrant_id = data['encadrant']
        stage.save()
        return JsonResponse({'message': 'Stage updated', 'statut': stage.statut})

    elif request.method == 'DELETE':
        stage.delete()
        return JsonResponse({'message': 'Stage deleted'}, status=204)

    elif request.method == 'GET':
        return JsonResponse({
            'id': stage.id,
            'theme': stage.theme,
            'type_stage': stage.type_stage,
            'date_debut': stage.date_debut,
            'date_fin': stage.date_fin,
            'statut': stage.statut,
            'stagiaire_id': stage.stagiaire_id,
            'encadrant_id': stage.encadrant_id
        })

    return JsonResponse({'error': 'Invalid request method'}, status=405)

def rapport_to_dict(rapport):
    return {
        "id": rapport.id,
        "stage": {
            "id": rapport.stage.id,
            "theme": rapport.stage.theme,
            "statut": rapport.stage.statut,
            "stagiaire": {
                "id": rapport.stage.stagiaire.id,
                "nom": rapport.stage.stagiaire.nom,
                "prenom": rapport.stage.stagiaire.prenom,
            },
            "encadrant_id": rapport.stage.encadrant.id if rapport.stage.encadrant else None,
        },
        "etat": rapport.etat,
        "date_depot": rapport.date_depot.isoformat(),
        "derniere_modif": rapport.derniere_modif.isoformat() if rapport.derniere_modif else None,
        "fichier_url": rapport.fichier.url if rapport.fichier else None,
    }

@require_http_methods(["GET"])
def rapports_api(request):
    qs = Rapport.objects.select_related('stage__stagiaire', 'stage__encadrant').all().order_by('-date_depot')

    etat = request.GET.get('etat')
    annee = request.GET.get('annee')
    q = request.GET.get('q')

    if etat:
        qs = qs.filter(etat=etat)
    
    if annee:
        try:
            year = int(annee)
            qs = qs.filter(date_depot__year=year)
        except ValueError:
            pass

    if q:
        qs = qs.filter(Q(stage__theme__icontains=q) |
                       Q(stage__stagiaire__nom__icontains=q) |
                       Q(stage__stagiaire__prenom__icontains=q)).distinct()

    rapports = [rapport_to_dict(r) for r in qs]
    return JsonResponse(rapports, safe=False)

@csrf_exempt
@require_http_methods(["POST"])
def rapport_create(request):
    post = request.POST
    files = request.FILES

    form = RapportForm(post, files)
    if not form.is_valid():
        return JsonResponse({"errors": form.errors}, status=400)

    stage = form.cleaned_data['stage']
    if stage.statut not in ['Terminé', 'Validé']:
        return JsonResponse({"error": "Impossible de déposer un rapport : le stage doit être Terminé ou Validé."}, status=400)

    rapport = form.save(commit=False)
    rapport.date_depot = timezone.now()
    rapport.etat = 'En attente'
    rapport.save()
    return JsonResponse(rapport_to_dict(rapport), status=201)

@csrf_exempt
def rapport_detail(request, pk):
    rapport = get_object_or_404(Rapport, pk=pk)
    if request.method == "GET":
        return JsonResponse(rapport_to_dict(rapport))
    elif request.method == "PUT":
        if request.content_type.startswith('multipart/form-data'):
            form = RapportForm(request.POST, request.FILES, instance=rapport)
            if not form.is_valid():
                return JsonResponse({"errors": form.errors}, status=400)
            if rapport.etat != 'En attente':
                return JsonResponse({"error": "Impossible de modifier : rapport déjà validé ou archivé."}, status=400)
            rapport = form.save(commit=False)
            rapport.derniere_modif = timezone.now()
            rapport.save()
            return JsonResponse(rapport_to_dict(rapport))
        else:
            try:
                data = json.loads(request.body.decode())
            except Exception:
                return JsonResponse({"error": "Payload JSON invalide"}, status=400)
            return JsonResponse({"error": "Aucune donnée à mettre à jour"}, status=400)
    elif request.method == "DELETE":
        if rapport.etat != 'En attente':
            return JsonResponse({"error": "Impossible de supprimer : seul un rapport en attente peut être supprimé."}, status=400)
        rapport.delete()
        return JsonResponse({"deleted": True})
    else:
        return JsonResponse({"error": "Méthode non autorisée"}, status=405)

@csrf_exempt
@require_http_methods(["POST"])
def rapport_valider(request, pk):
    rapport = get_object_or_404(Rapport, pk=pk)
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
    rapport = get_object_or_404(Rapport, pk=pk)
    if rapport.etat != 'Validé':
        return JsonResponse({"error": "Un rapport ne peut être archivé que s'il est Validé."}, status=400)
    rapport.etat = 'Archivé'
    rapport.save()
    return JsonResponse(rapport_to_dict(rapport))

@require_http_methods(["GET"])
def rapport_download(request, pk):
    rapport = get_object_or_404(Rapport, pk=pk)
    if rapport.etat not in ['Validé', 'Archivé']:
        return JsonResponse({"error": "Téléchargement autorisé uniquement pour les rapports Validés ou Archivés."}, status=403)
    f = rapport.fichier
    if not f:
        return JsonResponse({"error": "Fichier non trouvé."}, status=404)
    return JsonResponse({"download_url": f.url})