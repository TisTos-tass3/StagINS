
from django.db import models
from datetime import date, datetime
from django.utils import timezone
from django.contrib.auth.models import AbstractUser 
from django.core.exceptions import ValidationError 

# ==============================================================================
# Modèle d'Utilisateur Personnalisé 
# ==============================================================================

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Administrateur'),
        ('gestionnaire', 'Gestionnaire de Stages'),
        ('consultant', 'Consultant'),
        ('encadrant', 'Encadrant'),
    )
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='consultant')

    
    def can_edit_stages(self):
        return self.role in ['admin', 'gestionnaire']
    
    def can_validate_rapports(self):
        return self.role in ['admin', 'gestionnaire']

    def can_delete(self):
        return self.role == 'admin'

    def __str__(self):
        return self.username


# ==============================================================================
# Modèles de l'Application Stages
# ==============================================================================

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
        from .business_rules import BusinessRules

       
        if not self.pk:  
            BusinessRules.appliquer_regles_avant_sauvegarde(self)

        if not self.matricule:
            super().save(*args, **kwargs) 
            self.matricule = f"STG-{date.today}-{self.id}"
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
    nom_institution = models.CharField(max_length=150, blank=True, null=True, verbose_name="Nom de l'institution")
    email = models.EmailField(unique=True)
    telephone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.prenom} {self.nom}"



class Stage(models.Model):
    theme = models.CharField(max_length=255)

    
    direction = models.CharField(max_length=100, verbose_name="Direction", blank=True, null=True)
   
    division = models.CharField(max_length=100, verbose_name="Division", blank=True, null=True)
   
    
   
    unite = models.CharField(max_length=100, verbose_name="Unité d'affectation", blank=True, null=True)
   
    service = models.CharField(max_length=100, blank=True, null=True, verbose_name="Service d'affectation")
   
    
    
    
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
    decision = models.CharField(
        max_length=100, 
        blank=True, 
        null=True, 
        verbose_name="Numéro de décision"
    )
    lettre_acceptation = models.FileField(
        upload_to='lettres_acceptation/', 
        blank=True, 
        null=True,
        verbose_name="Lettre d'acceptation scannée"
    )
    
    
    stagiaire = models.ForeignKey(
        'Stagiaire', 
        on_delete=models.CASCADE,
        related_name='stages_stagiaire' 
    )
    encadrant = models.ForeignKey(
        'Encadrant', 
        on_delete=models.SET_NULL, 
        null=True,
        blank=True,
        related_name='stages_encadrant'
    )

    def __str__(self):
        return f"{self.theme} ({self.stagiaire})"

    def save(self, *args, **kwargs):
        from .business_rules import BusinessRules

       
        BusinessRules.appliquer_regles_avant_sauvegarde(self)

       
        self.mettre_a_jour_statut_automatique()

        super().save(*args, **kwargs)
    
    def mettre_a_jour_statut_automatique(self):
        """Met à jour automatiquement le statut du stage en fonction des dates"""
        today = date.today()
        
       
        if self.statut == "Validé":
            return
            
       
        if isinstance(self.date_fin, str):
            try:
                self.date_fin = datetime.strptime(self.date_fin, "%Y-%m-%d").date()
            except ValueError:
               
                pass
        

        if self.date_debut and self.date_fin:
            if today < self.date_debut:
                
                self.statut = "En cours"  
            elif self.date_debut <= today <= self.date_fin:
                
                self.statut = "En cours"
            elif today > self.date_fin:
                
                self.statut = "Terminé"

    @classmethod
    def mettre_a_jour_tous_les_statuts(cls):
        """Méthode pour mettre à jour tous les statuts des stages (à appeler quotidiennement)"""
        today = date.today()
        stages_a_mettre_a_jour = []
        
        
        stages = cls.objects.exclude(statut='Validé')
        
        for stage in stages:
            ancien_statut = stage.statut
            
           
            if stage.date_debut and stage.date_fin:
                if today < stage.date_debut:
                    nouveau_statut = "En cours"
                elif stage.date_debut <= today <= stage.date_fin:
                    nouveau_statut = "En cours"
                elif today > stage.date_fin:
                    nouveau_statut = "Terminé"
                else:
                    nouveau_statut = ancien_statut
                
               
                if nouveau_statut != ancien_statut:
                    stage.statut = nouveau_statut
                    stages_a_mettre_a_jour.append(stage)
        
         
        if stages_a_mettre_a_jour:
            cls.objects.bulk_update(stages_a_mettre_a_jour, ['statut'])
            print(f"{len(stages_a_mettre_a_jour)} stages mis à jour automatiquement")
    


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
        from .business_rules import BusinessRules
      
        if self.pk:
            BusinessRules.appliquer_regles_avant_sauvegarde(self)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Rapport pour {self.stage.theme} ({self.stage.stagiaire.nom})"