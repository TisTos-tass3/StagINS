# Fichier : models.py
from django.db import models
from datetime import date, datetime
from django.utils import timezone
from datetime import date, datetime

class Stagiaire(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    ecole = models.CharField(max_length=150, blank=True, null=True)
    specialite = models.CharField(max_length=150, blank=True, null=True)
    niveau_etude = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)
    matricule = models.CharField(max_length=50, unique=True, blank=True, null=True)

    def save(self, *args, **kwargs):
        # Import conditionnel pour éviter la circularité
        from .business_rules import BusinessRules
        
        # Appliquer les règles métier avant sauvegarde
        if not self.pk:  # Nouveau stagiaire
            BusinessRules.appliquer_regles_avant_sauvegarde(self)
        
        if not self.matricule:
            super().save(*args, **kwargs)
            today = date.today().strftime("%Y%m%d")
            self.matricule = f"STG-{today}-{self.id}"
            kwargs['force_insert'] = False
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.prenom} {self.nom} ({self.matricule})"

class Encadrant(models.Model):
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    institution = models.CharField(
        max_length=20,
        choices=[('Interne', 'Interne'), ('Externe', 'Externe')]
    )
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"

class Stage(models.Model):
    theme = models.CharField(max_length=255)
    lieu_affectation = models.CharField(
        max_length=150, 
        blank=True, 
        null=True, 
        verbose_name="Lieu d'Affectation"
    )
    type_stage = models.CharField(
        max_length=20,
        choices=[('Academique', 'Académique'), ('Professionnel', 'Professionnel')]
    )
    date_debut = models.DateField()
    date_fin = models.DateField()
    statut = models.CharField(
        max_length=20,
        choices=[('En cours', 'En cours'), ('Terminé', 'Terminé'), ('Validé', 'Validé')],
        default='En cours'
    
    )
    stagiaire = models.ForeignKey('Stagiaire', on_delete=models.CASCADE)
    encadrant = models.ForeignKey('Encadrant', on_delete=models.SET_NULL, null=True)
   

    def save(self, *args, **kwargs):
        # Import conditionnel pour éviter la circularité
        from .business_rules import BusinessRules
        
        # Appliquer les règles métier avant sauvegarde
        BusinessRules.appliquer_regles_avant_sauvegarde(self)
        
        today = date.today()
        if isinstance(self.date_fin, str):
            self.date_fin = datetime.strptime(self.date_fin, "%Y-%m-%d").date()
        
        # Statut calculé automatiquement (sauf si déjà validé)
        if self.statut != "Validé":
            if today <= self.date_fin:
                self.statut = "En cours"
            else:
                self.statut = "Terminé"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.theme} ({self.stagiaire})"

class Rapport(models.Model):
    ETAT_CHOICES = [
        ('En attente', 'En attente'),
        ('Validé', 'Validé'),
        ('Archivé', 'Archivé'),
    ]

    stage = models.ForeignKey('Stage', on_delete=models.CASCADE, related_name='rapports')
    etat = models.CharField(max_length=20, choices=ETAT_CHOICES, default='En attente')
    date_depot = models.DateTimeField(auto_now_add=True)
    derniere_modif = models.DateTimeField(auto_now=True)
    fichier = models.FileField(upload_to='rapports/')

    def save(self, *args, **kwargs):
        # Import conditionnel pour éviter la circularité
        from .business_rules import BusinessRules
        
        # Appliquer les règles métier avant sauvegarde
        BusinessRules.appliquer_regles_avant_sauvegarde(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Rapport pour {self.stage.theme} ({self.stage.stagiaire.nom})"