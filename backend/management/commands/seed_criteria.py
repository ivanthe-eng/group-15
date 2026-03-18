from django.core.management.base import BaseCommand
from backend.models import EvaluationCriteria


class Command(BaseCommand):
    help = 'Seeds default evaluation criteria with weights summing to 100'

    def handle(self, *args, **kwargs):
        criteria = [
            {
                'name': 'Workplace performance',
                'description': 'Assessed by workplace supervisor',
                'weight': 40.00
            },
            {
                'name': 'Academic assessment',
                'description': 'Assessed by academic supervisor',
                'weight': 30.00
            },
            {
                'name': 'Logbook quality',
                'description': 'Quality and consistency of weekly logs',
                'weight': 30.00
            },
        ]

        for c in criteria:
            obj, created = EvaluationCriteria.objects.get_or_create(
                name=c['name'],
                defaults=c
            )
            status = 'Created' if created else 'Already exists'
            self.stdout.write(f"{status}: {obj.name} ({obj.weight}%)")

        self.stdout.write(
            self.style.SUCCESS('Done. All weights sum to 100%.')
        )
