from django import forms
from .models import Stagiaire, Stage,Encadrant,Rapport

class StagiaireForm(forms.ModelForm):
    class Meta:
        model = Stagiaire
        fields = ['nom', 'prenom', 'ecole', 'filiere', 'email', 'telephone']

class StageForm(forms.ModelForm):
    class Meta:
        model = Stage
        fields = ['theme', 'type_stage', 'date_debut', 'date_fin', 'statut', 'stagiaire', 'encadrant']


class EncadrantForm(forms.ModelForm):
    class Meta:
        model = Encadrant
        fields = '__all__'

class RapportForm(forms.ModelForm):
    class Meta:
        model = Rapport
        fields = ['stage', 'fichier']
    
    def clean_fichier(self):
        f = self.cleaned_data.get('fichier')
        if f:
            name = f.name.lower()
            if not (name.endswith('.pdf') or name.endswith('.doc') or name.endswith('.docx') or name.endswith('.odt')):
                raise forms.ValidationError("Format de fichier non autorisé. Autorisé: PDF, DOC, DOCX, ODT.")
            if f.size > 15 * 1024 * 1024:
                raise forms.ValidationError("Taille du fichier supérieure à 15 Mo.")
        return f
