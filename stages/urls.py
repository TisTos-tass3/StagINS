from django.urls import path
from . import views

urlpatterns = [
    # Routes pour stagiaires
    path('', views.home, name='home'),
    path('add_stagiaire/', views.add_stagiaire, name='add_stagiaire'),
    path('stagiaires/api/', views.stagiaires_api, name='stagiaires_api'),
    path('stagiaires/api/create/', views.stagiaire_create, name='create_stagiaire'),
    path('stagiaires/api/<int:pk>/', views.stagiaire_detail, name='stagiaire_detail'),

    # Routes pour encadrants
    path('encadrants/api/', views.encadrants_api, name='encadrants_api'),
    path('encadrants/api/create/', views.encadrant_create, name='create_encadrant'),
    path('encadrants/api/<int:pk>/', views.encadrant_detail, name='encadrant_detail'),

    # Routes pour stages
    path('stages/api/', views.stages_api, name='stages_api'),
    path('stages/api/create/', views.stage_create, name='stage_create'),
    path('stages/api/<int:pk>/', views.stage_detail, name='stage_detail'),

    # Routes pour les rapports
    path('rapports/api/', views.rapports_api, name='rapports_api'),
    path('rapports/api/create/', views.rapport_create, name='rapport_create'),
    path('rapports/api/<int:pk>/', views.rapport_detail, name='rapport_detail'), 
    path('rapports/api/<int:pk>/valider/', views.rapport_valider, name='rapport_valider'),
    path('rapports/api/<int:pk>/archiver/', views.rapport_archiver, name='rapport_archiver'),
    path('rapports/api/<int:pk>/download/', views.rapport_download, name='rapport_download'),
    

    # Route pour le tableau de bord
    path('dashboard/api/', views.dashboard_api, name='dashboard_api'),
    path('stagiaires/api/search-by-matricule/', views.search_stagiaire_by_matricule, name='search_stagiaire_by_matricule'),

    path('stagiaires/api/<int:pk>/detail/', views.stagiaire_detail_api, name='stagiaire_detail_api'),

   # Routes d'Authentification 
    path('auth/login/', views.login_api, name='login_api'),
    path('auth/logout/', views.logout_api, name='logout_api'),
    path('auth/current-user/', views.current_user_api, name='current_user_api'),

    # Route pour générer une attestation de stage
    path('stages/api/<int:pk>/generer-attestation/', views.generer_attestation, name='generer_attestation'),
]
