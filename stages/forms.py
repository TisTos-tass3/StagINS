from django import forms
from .models import Stagiaire, Stage, Encadrant, Rapport

class StagiaireForm(forms.ModelForm):
    NIVEAU_ETUDE_CHOICES = [
        ('Bac +2', 'Bac +2'),
        ('Bac +3', 'Bac +3'),
        ('Bac +5', 'Bac +5'),
        ('Bac +8', 'Bac +8'),
    ]
    niveau_etude = forms.ChoiceField(
        choices=NIVEAU_ETUDE_CHOICES,
        required=False,
        label="Niveau d'étude"
    )

    class Meta:
        model = Stagiaire
        fields = ['nom', 'prenom', 'ecole', 'specialite', 'niveau_etude', 'email', 'telephone']



class StageForm(forms.ModelForm):
    class Meta:
        model = Stage
        fields = [
            'theme', 'type_stage', 'date_debut', 'date_fin', 
            'stagiaire', 'encadrant', 
            'direction', 'division', 'unite', 'service',
            'decision', 'lettre_acceptation'
        ]

    def clean(self):
        cleaned_data = super().clean()
        direction = cleaned_data.get('direction')
        division = cleaned_data.get('division')
        unite = cleaned_data.get('unite')
        service = cleaned_data.get('service')
        
      
        if direction == 'BCR':
            if not unite:
                raise forms.ValidationError({
                    'unite': "L'unité d'affectation est obligatoire pour la direction BCR."
                })
            
            cleaned_data['division'] = None
        else:
            
            cleaned_data['unite'] = None
            cleaned_data['service'] = None
        
        return cleaned_data

    def clean_lettre_acceptation(self):
        fichier = self.cleaned_data.get('lettre_acceptation')
        if fichier:
            nom_fichier = fichier.name.lower()
            if not (nom_fichier.endswith('.pdf') or 
                   nom_fichier.endswith('.jpg') or 
                   nom_fichier.endswith('.jpeg') or 
                   nom_fichier.endswith('.png')):
                raise forms.ValidationError("Format de fichier non autorisé. Formats acceptés: PDF, JPG, JPEG, PNG.")
                    
            if fichier.size > 10 * 1024 * 1024:
                raise forms.ValidationError("La taille du fichier ne doit pas dépasser 10 Mo.")
        
        return fichier

class EncadrantForm(forms.ModelForm):
    class Meta:
        model = Encadrant
        fields = '__all__'

    def clean(self):
        cleaned_data = super().clean()
        institution = cleaned_data.get('institution')
        nom_institution = cleaned_data.get('nom_institution')
        
       
        if institution == 'Externe' and not nom_institution:
            raise forms.ValidationError({
                'nom_institution': "Le nom de l'institution est obligatoire pour un encadrant externe."
            })
        
        if institution == 'Interne':
            cleaned_data['nom_institution'] = None
        
        return cleaned_data
class RapportForm(forms.ModelForm):
    class Meta:
        model = Rapport
        fields = ['stage', 'fichier']
    
    def clean(self):
        cleaned_data = super().clean()
        stage = cleaned_data.get('stage')
        
        
        if stage and Rapport.objects.filter(stage=stage).exists():
            raise forms.ValidationError("Ce stage a déjà un rapport associé.")
        
    
        if stage:
            rapports_meme_theme = Rapport.objects.filter(stage__theme=stage.theme)
            if rapports_meme_theme.exists():
                raise forms.ValidationError(f"Un rapport avec le thème '{stage.theme}' existe déjà.")
        
        return cleaned_data
    
    def clean_fichier(self):
        f = self.cleaned_data.get('fichier')
        if f:
            name = f.name.lower()
            if not (name.endswith('.pdf') or name.endswith('.doc') or name.endswith('.docx') or name.endswith('.odt')):
                raise forms.ValidationError("Format de fichier non autorisé. Autorisé: PDF, DOC, DOCX, ODT.")
            if f.size > 15 * 1024 * 1024:
                raise forms.ValidationError("Taille du fichier supérieure à 15 Mo.")
        return f