Explication du fonctionnement du code - Gestion des statuts de stage

**Fichier: views.py**

Sérialisation des stages

```python
def stage_to_dict_light(stage):
    return {
        'statut': stage.statut,  # Récupère le statut du stage
        # ...
    }

```
Mise à jour automatique du statut
```python
def get_dashboard_data():
    stages_counts = Stage.objects.values('statut').annotate(count=Count('statut'))
    stages_dict = {item['statut']: item['count'] for item in stages_counts}
    
    stages_a_verifier = Stage.objects.filter(
        statut__in=['En cours', 'En attente'], 
        date_fin__lt=today
    ).count()
    
    stages_bientot_finis = Stage.objects.filter(
        statut='En cours', 
        date_fin__range=[today, seven_days_later]
    ).count()
```
Validation des rapports et mise à jour du statut
```python
@csrf_exempt
@require_http_methods(["POST"])
@permission_classes([CanValidateRapports]) 
def rapport_valider(request, pk):
    rapport.etat = 'Validé'
    rapport.save()
    
    stage = rapport.stage
    if stage.statut != 'Validé':
        stage.statut = 'Validé'
        stage.save()
```
Génération d'attestation
```python
def generer_attestation(request, pk):
    if stage.statut != 'Validé':
        return JsonResponse({'error': 'Seuls les stages validés peuvent générer une attestation.'}, status=400)
```
Rôle dans la logique
- Filtrage des stages par statut
- Validation automatique des statuts basée sur les dates
- Contrôle d'accès pour certaines fonctionnalités
- Statistiques du dashboard
  
**Fichier: models.py**

Définition du champ statut

```python
class Stage(models.Model):
    statut = models.CharField(
        max_length=20,
        choices=[('En cours', 'En cours'), ('Terminé', 'Terminé'), ('Validé', 'Validé')],
        default='En cours'
    )
```
Mise à jour automatique basée sur les dates
```python
def mettre_a_jour_statut_automatique(self):
    today = date.today()
    if self.statut == "Validé":
        return
    if self.date_debut and self.date_fin:
        if today < self.date_debut:
            self.statut = "En cours"
        elif self.date_debut <= today <= self.date_fin:
            self.statut = "En cours"
        elif today > self.date_fin:
            self.statut = "Terminé"
```
Méthode de mise à jour en masse
```python
@classmethod
def mettre_a_jour_tous_les_statuts(cls):
    stages = cls.objects.exclude(statut='Validé')
```
Rôle dans la logique
- Définition des statuts possibles
- Mise à jour automatique basée sur la date
- Préservation du statut 'Validé'
- Exclusion des stages validés des mises à jour automatiques
  
**Fichier: update_stage_status.py**


Rôle complet
```python
class Command(BaseCommand):
    help = 'Met à jour automatiquement les statuts des stages'

    def handle(self, *args, **options):
        stages_mis_a_jour = Stage.mettre_a_jour_tous_les_statuts()
```
Rôle dans la logique
- Commande Django pour exécuter la mise à jour des statuts
- Appel quotidien possible via cron job
- Automatisation du processus de mise à jour
  
**Fichier: Stages.jsx (React)**


Filtrage par statut
```javascript
const [advancedFilters, setAdvancedFilters] = useState({});
```
Génération d'attestation conditionnelle
```javascript
const handleGenerateAttestation = async (stage, signataire, fonctionSignataire, format) => {
    // Vérifié côté backend
};
```
Affichage conditionnel du bouton d'attestation
```javascript
const handleAttestationClick = (stage) => {
    setAttestationStage(stage);
};
```
Rôle dans la logique
- Interface utilisateur pour filtrer par statut
- Contrôle d'affichage des fonctionnalités
- UX adaptée au statut

  
**Fichier: StagesTable.jsx (React)**


Configuration des couleurs de statut
```javascript
const statusConfig = {
    'En cours': 'bg-blue-100 text-blue-800',
    'Terminé': 'bg-red-100 text-red-800',
    'Validé': 'bg-green-100 text-green-800',
    'default': 'bg-gray-100 text-gray-800'
};
```
Colonne statut dans le tableau
```javascript
{ 
    key: 'statut', 
    label: 'Statut', 
    isStatus: true,
    statusConfig: statusConfig
}
```
Actions conditionnelles basées sur le statut
```javascript
const customActions = [
    {
        icon: <FileBadge size={18} />,
        title: stage => stage.statut === 'Validé' 
            ? "Générer attestation" 
            : "Stage non validé - Impossible de générer l'attestation",
        className: stage => stage.statut === 'Validé' 
            ? "text-purple-600 hover:text-purple-800 transition-colors" 
            : "text-gray-400 cursor-not-allowed",
        condition: (stage) => stage.statut === 'Validé',
        onClick: onGenerateAttestation
    }
];
```
Rôle dans la logique
- Affichage visuel du statut (couleurs)
- Contrôle des actions disponibles
- Feedback utilisateur sur les restrictions
 
Flux complet du statut

1. En cours → Statut automatique basé sur les dates
2. Terminé → Statut automatique quand la date de fin est dépassée
3. Validé → Statut manuel après validation du rapport
4. Validé → Statut final qui bloque les modifications automatiques

Le statut "Validé" agit comme un verrou empêchant les modifications automatiques et permettant l'accès à des fonctionnalités avancées comme la génération d'attestations.

