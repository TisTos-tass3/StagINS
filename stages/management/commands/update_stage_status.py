# stages/management/commands/update_stage_status.py
from django.core.management.base import BaseCommand
from stages.models import Stage
from datetime import date

class Command(BaseCommand):
    help = 'Met à jour automatiquement les statuts des stages'

    def handle(self, *args, **options):
        self.stdout.write('Début de la mise à jour des statuts des stages...')
        
        stages_mis_a_jour = Stage.mettre_a_jour_tous_les_statuts()
        
        self.stdout.write(
            self.style.SUCCESS(
                f' Mise à jour terminée ! {stages_mis_a_jour} stages mis à jour.'
            )
        )