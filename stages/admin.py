from django.contrib import admin
from .models import Stagiaire, Encadrant, Stage, Rapport

@admin.register(Stagiaire)
class StagiaireAdmin(admin.ModelAdmin):
    list_display = ('prenom', 'nom', 'ecole', 'specialite', 'email', 'telephone', 'matricule')
    search_fields = ('prenom', 'nom', 'email', 'ecole', 'specialite', 'matricule')


@admin.register(Encadrant)
class EncadrantAdmin(admin.ModelAdmin):
    list_display = ('prenom', 'nom', 'institution', 'email', 'telephone')
    list_filter = ('institution',)
    search_fields = ('prenom', 'nom', 'email')


@admin.register(Stage)
class StageAdmin(admin.ModelAdmin):
    list_display = ('theme', 'type_stage', 'stagiaire', 'encadrant', 'date_debut', 'date_fin', 'statut')
    list_filter = ('type_stage', 'statut', 'date_debut', 'date_fin')
    search_fields = ('theme', 'stagiaire__prenom', 'stagiaire__nom', 'encadrant__prenom', 'encadrant__nom')


@admin.register(Rapport)
class RapportAdmin(admin.ModelAdmin):
    list_display = ('stage', 'etat', 'date_depot', 'derniere_modif')
    list_filter = ('etat', 'date_depot')
    search_fields = ('stage__theme', 'stage__stagiaire__prenom', 'stage__stagiaire__nom')