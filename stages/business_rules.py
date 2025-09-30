# Fichier : business_rules.py
from django.core.exceptions import ValidationError
from django.utils import timezone
from datetime import timedelta
from django.apps import apps  # NOUVEL IMPORT
import re

class BusinessRules:
    """
    Classe contenant toutes les règles métier du système de gestion des stages
    """
    
    # Constantes
    NIVEAUX_ETUDE_AUTORISES = ['Bac +2', 'Bac +3', 'Bac +5', 'Bac +8']
    FORMATS_FICHIER_AUTORISES = ['.pdf', '.doc', '.docx', '.odt']
    TAILLE_MAX_FICHIER = 15 * 1024 * 1024  # 15 Mo

    # Méthode utilitaire pour obtenir les modèles
    @staticmethod
    def get_model(model_name):
        return apps.get_model('stages', model_name)
    
    # =========================================================================
    # RÈGLES POUR STAGIAIRES
    # =========================================================================
    
    @staticmethod
    def valider_creation_stagiaire(data):
        """
        Valide la création d'un stagiaire selon les règles métier
        """
        Stagiaire = BusinessRules.get_model('Stagiaire')
        errors = {}
        
        # Vérification du téléphone (uniquement chiffres)
        if data.get('telephone') and not data['telephone'].isdigit():
            errors['telephone'] = 'Le téléphone ne doit contenir que des chiffres.'
        
        # Vérification du niveau d'étude
        niveau_etude = data.get('niveau_etude')
        if niveau_etude and niveau_etude not in BusinessRules.NIVEAUX_ETUDE_AUTORISES:
            errors['niveau_etude'] = f"Niveau d'étude non valide. Choisissez parmi: {', '.join(BusinessRules.NIVEAUX_ETUDE_AUTORISES)}"
        
        # Vérification email unique
        email = data.get('email')
        if email and Stagiaire.objects.filter(email=email).exists():
            errors['email'] = 'Un stagiaire avec cet email existe déjà.'
        
        if errors:
            raise ValidationError(errors)
    
    @staticmethod
    def valider_modification_stagiaire(stagiaire, data):
        """
        Valide la modification d'un stagiaire selon les règles métier
        """
        errors = {}
        
        # Vérification que le matricule n'est pas modifié
        if 'matricule' in data and data['matricule'] != stagiaire.matricule:
            errors['matricule'] = 'Le matricule ne peut pas être modifié.'
        
        # Vérification du téléphone (uniquement chiffres)
        if 'telephone' in data and data['telephone'] and not data['telephone'].isdigit():
            errors['telephone'] = 'Le téléphone ne doit contenir que des chiffres.'
        
        # Vérification du niveau d'étude
        if 'niveau_etude' in data and data['niveau_etude'] not in BusinessRules.NIVEAUX_ETUDE_AUTORISES:
            errors['niveau_etude'] = f"Niveau d'étude non valide. Choisissez parmi: {', '.join(BusinessRules.NIVEAUX_ETUDE_AUTORISES)}"
        
        if errors:
            raise ValidationError(errors)
    
    @staticmethod
    def peut_supprimer_stagiaire(stagiaire):
        """
        Vérifie si un stagiaire peut être supprimé selon les règles métier
        """
        Stage = BusinessRules.get_model('Stage')
        
        # Vérification s'il a des stages en cours
        stages_en_cours = Stage.objects.filter(stagiaire=stagiaire, statut='En cours')
        if stages_en_cours.exists():
            return False, "Impossible de supprimer un stagiaire ayant des stages en cours."
        
        return True, None
    
    # =========================================================================
    # RÈGLES POUR STAGES
    # =========================================================================
    
    @staticmethod
    def valider_creation_stage(data):
        """
        Valide la création d'un stage selon les règles métier
        """
        Stage = BusinessRules.get_model('Stage')
        errors = {}
        
        # Vérification des dates
        date_debut = data.get('date_debut')
        date_fin = data.get('date_fin')
        
        if date_debut and date_fin:
            if date_fin <= date_debut:
                errors['date_fin'] = 'La date de fin doit être après la date de début.'
            
            # Vérification des chevauchements pour le même stagiaire
            stagiaire_id = data.get('stagiaire')
            if stagiaire_id:
                chevauchements = Stage.objects.filter(
                    stagiaire_id=stagiaire_id,
                    date_debut__lt=date_fin,
                    date_fin__gt=date_debut
                )
                if chevauchements.exists():
                    errors['date_debut'] = 'Ce stagiaire a déjà un stage pendant cette période.'
                    errors['date_fin'] = 'Ce stagiaire a déjà un stage pendant cette période.'
        
        if errors:
            raise ValidationError(errors)
    
    @staticmethod
    def valider_modification_stage(stage, data):
        """
        Valide la modification d'un stage selon les règles métier
        """
        Stage = BusinessRules.get_model('Stage')
        errors = {}
        
        # Vérification si le stage peut être modifié
        if not BusinessRules.peut_modifier_stage(stage):
            errors['stage'] = 'Impossible de modifier un stage avec un rapport validé ou archivé.'
        
        # Vérification des dates
        date_debut = data.get('date_debut', stage.date_debut)
        date_fin = data.get('date_fin', stage.date_fin)
        
        if date_fin <= date_debut:
            errors['date_fin'] = 'La date de fin doit être après la date de début.'
        
        # Vérification des chevauchements (exclure le stage actuel)
        stagiaire_id = data.get('stagiaire', stage.stagiaire_id)
        if stagiaire_id and date_debut and date_fin:
            chevauchements = Stage.objects.filter(
                stagiaire_id=stagiaire_id,
                date_debut__lt=date_fin,
                date_fin__gt=date_debut
            ).exclude(pk=stage.pk)
            
            if chevauchements.exists():
                errors['date_debut'] = 'Ce stagiaire a déjà un stage pendant cette période.'
                errors['date_fin'] = 'Ce stagiaire a déjà un stage pendant cette période.'
        
        if errors:
            raise ValidationError(errors)
    
    @staticmethod
    def peut_modifier_stage(stage):
        """
        Vérifie si un stage peut être modifié selon les règles métier
        """
        Rapport = BusinessRules.get_model('Rapport')
        return not stage.rapports.filter(etat__in=['Validé', 'Archivé']).exists()
    
    @staticmethod
    def peut_supprimer_stage(stage):
        """
        Vérifie si un stage peut être supprimé selon les règles métier
        """
        Rapport = BusinessRules.get_model('Rapport')
        if stage.rapports.filter(etat__in=['Validé', 'Archivé']).exists():
            return False, "Impossible de supprimer un stage avec un rapport validé ou archivé."
        
        return True, None
    
    @staticmethod
    def calculer_statut_stage(date_debut, date_fin, rapport_valide=False):
        """
        Calcule le statut d'un stage selon les règles métier
        """
        if rapport_valide:
            return 'Validé'
        
        today = timezone.now().date()
        if today <= date_fin:
            return 'En cours'
        else:
            return 'Terminé'
    
    # =========================================================================
    # RÈGLES POUR RAPPORTS
    # =========================================================================
    
    @staticmethod
    def valider_creation_rapport(data, fichier=None):
        """
        Valide la création d'un rapport selon les règles métier
        """
        Rapport = BusinessRules.get_model('Rapport')
        Stage = BusinessRules.get_model('Stage')
        
        errors = {}
        
        stage_id = data.get('stage')
        if stage_id:
            stage = Stage.objects.get(pk=stage_id)
            
            # Vérification thème unique
            rapports_meme_theme = Rapport.objects.filter(stage__theme=stage.theme)
            if rapports_meme_theme.exists():
                errors['stage'] = 'Un rapport avec ce thème existe déjà.'
            
            # Vérification un seul rapport en attente par stage
            rapports_attente = Rapport.objects.filter(stage=stage, etat='En attente')
            if rapports_attente.exists():
                errors['stage'] = 'Ce stage a déjà un rapport en attente.'
        
        # Validation du fichier
        if fichier:
            file_errors = BusinessRules.valider_fichier_rapport(fichier)
            errors.update(file_errors)
        
        if errors:
            raise ValidationError(errors)
    
    @staticmethod
    def valider_modification_rapport(rapport, data, fichier=None):
        """
        Valide la modification d'un rapport selon les règles métier
        """
        errors = {}
        
        # Vérification si le rapport peut être modifié
        if not BusinessRules.peut_modifier_rapport(rapport):
            errors['rapport'] = 'Impossible de modifier un rapport validé ou archivé.'
        
        # Validation du fichier si fourni
        if fichier:
            file_errors = BusinessRules.valider_fichier_rapport(fichier)
            errors.update(file_errors)
        
        if errors:
            raise ValidationError(errors)
    
    @staticmethod
    def valider_fichier_rapport(fichier):
        """
        Valide le fichier d'un rapport selon les règles métier
        """
        errors = {}
        
        # Vérification du format
        nom_fichier = fichier.name.lower()
        format_valide = any(nom_fichier.endswith(ext) for ext in BusinessRules.FORMATS_FICHIER_AUTORISES)
        
        if not format_valide:
            errors['fichier'] = f"Format de fichier non autorisé. Formats acceptés: {', '.join(BusinessRules.FORMATS_FICHIER_AUTORISES)}"
        
        # Vérification de la taille
        if fichier.size > BusinessRules.TAILLE_MAX_FICHIER:
            errors['fichier'] = f"Taille du fichier supérieure à {BusinessRules.TAILLE_MAX_FICHIER // (1024*1024)} Mo."
        
        return errors
    
    @staticmethod
    def peut_modifier_rapport(rapport):
        """
        Vérifie si un rapport peut être modifié selon les règles métier
        """
        return rapport.etat == 'En attente'
    
    @staticmethod
    def peut_supprimer_rapport(rapport):
        """
        Vérifie si un rapport peut être supprimé selon les règles métier
        """
        if rapport.etat != 'En attente':
            return False, "Seul un rapport en attente peut être supprimé."
        
        return True, None
    
    @staticmethod
    def valider_workflow_rapport(rapport, nouvelle_action):
        """
        Valide les transitions du workflow des rapports
        """
        if nouvelle_action == 'valider':
            if rapport.etat != 'En attente':
                return False, "Seul un rapport en attente peut être validé."
        
        elif nouvelle_action == 'archiver':
            if rapport.etat != 'Validé':
                return False, "Seul un rapport validé peut être archivé."
        
        return True, None
    
    # =========================================================================
    # ALERTES ET CONTRÔLES TEMPORELS
    # =========================================================================
    
    @staticmethod
    def get_alertes_stages():
        """
        Récupère les alertes concernant les stages selon les règles métier
        """
        Stage = BusinessRules.get_model('Stage')
        Rapport = BusinessRules.get_model('Rapport')
        
        today = timezone.now().date()
        sept_jours = today + timedelta(days=7)
        trente_jours = today - timedelta(days=30)
        
        # Stages se terminant dans 7 jours
        stages_bientot_termines = Stage.objects.filter(
            statut='En cours',
            date_fin__range=[today, sept_jours]
        )
        
        # Stages en retard de rapport (+30 jours après fin)
        stages_retard_rapport = Stage.objects.filter(
            statut='Terminé',
            date_fin__lte=trente_jours
        ).exclude(
            rapports__etat__in=['Validé', 'Archivé']
        )
        
        return {
            'bientot_termines': {
                'count': stages_bientot_termines.count(),
                'stages': stages_bientot_termines
            },
            'en_retard_rapport': {
                'count': stages_retard_rapport.count(),
                'stages': stages_retard_rapport
            }
        }
    
    @staticmethod
    def get_stages_necessitant_attention():
        """
        Récupère tous les stages nécessitant une attention particulière
        """
        alertes = BusinessRules.get_alertes_stages()
        
        stages_attention = []
        
        # Ajouter les stages bientôt terminés
        for stage in alertes['bientot_termines']['stages']:
            stages_attention.append({
                'stage': stage,
                'type_alerte': 'bientot_termine',
                'message': f"Se termine le {stage.date_fin.strftime('%d/%m/%Y')}",
                'severite': 'warning'
            })
        
        # Ajouter les stages en retard
        for stage in alertes['en_retard_rapport']['stages']:
            jours_retard = (timezone.now().date() - stage.date_fin).days
            stages_attention.append({
                'stage': stage,
                'type_alerte': 'retard_rapport',
                'message': f"En retard de rapport depuis {jours_retard} jours",
                'severite': 'error'
            })
        
        return stages_attention
    
    # =========================================================================
    # UTILITAIRES
    # =========================================================================
    
    @staticmethod
    def appliquer_regles_avant_sauvegarde(instance):
        """
        Applique les règles métier automatiques avant sauvegarde
        """
        if hasattr(instance, '_meta') and instance._meta.model_name == 'stage':
            # Recalcul du statut du stage
            rapport_valide = instance.rapports.filter(etat='Validé').exists()
            instance.statut = BusinessRules.calculer_statut_stage(
                instance.date_debut, 
                instance.date_fin, 
                rapport_valide
            )
        
        elif hasattr(instance, '_meta') and instance._meta.model_name == 'rapport':
            # Date de dépôt automatique pour nouveau rapport
            if not instance.pk:
                instance.date_depot = timezone.now()
    
    @staticmethod
    def get_resume_regles_metier():
        """
        Retourne un résumé des règles métier pour affichage
        """
        return {
            'stagiaire': {
                'creation': [
                    'Matricule généré automatiquement',
                    'Email unique dans le système',
                    'Nom et prénom obligatoires',
                    f"Niveau d'étude parmi: {', '.join(BusinessRules.NIVEAUX_ETUDE_AUTORISES)}",
                    'Téléphone uniquement chiffres (optionnel)'
                ],
                'modification': [
                    'Matricule non modifiable'
                ],
                'suppression': [
                    'Impossible si stages en cours',
                    'Suppression en cascade avec les stages'
                ]
            },
            'stage': {
                'creation': [
                    'Date fin > Date début',
                    'Pas de chevauchement de dates pour même stagiaire',
                    'Statut calculé automatiquement'
                ],
                'modification': [
                    'Impossible si rapport validé',
                    'Modification dates → recalcul statut'
                ],
                'suppression': [
                    'Impossible si rapport validé',
                    'Suppression en cascade avec rapports'
                ]
            },
            'rapport': {
                'creation': [
                    f'Formats autorisés: {", ".join(BusinessRules.FORMATS_FICHIER_AUTORISES)}',
                    'Taille maximale: 15 Mo',
                    'Un seul rapport "En attente" par stage',
                    'Date dépôt automatique',
                    'Thème unique dans le système'
                ],
                'workflow': [
                    'En attente → Validé → Archivé',
                    'Validation rapport → validation stage',
                    'Seul "Validé" peut être archivé'
                ]
            },
            'alertes': [
                'Alerte: Stage finissant dans 7 jours',
                'Retard: Stage terminé sans rapport depuis +30 jours'
            ]
        }