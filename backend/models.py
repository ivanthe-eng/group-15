from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
from decimal import Decimal


class CustomUser(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student Intern'),
        ('workplace_supervisor', 'Workplace Supervisor'),
        ('academic_supervisor', 'Academic Supervisor'),
        ('admin', 'Admin'),
    ]
    role = models.CharField(max_length=30, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class InternshipPlacement(models.Model):
    student = models.ForeignKey(
        CustomUser, on_delete=models.CASCADE,
        related_name='placements',
        limit_choices_to={'role': 'student'}
    )
    workplace_supervisor = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='supervised_placements',
        limit_choices_to={'role': 'workplace_supervisor'}
    )
    academic_supervisor = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='academic_placements',
        limit_choices_to={'role': 'academic_supervisor'}
    )
    company_name = models.CharField(max_length=200)
    start_date = models.DateField()
    end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    computed_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    letter_grade = models.CharField(max_length=2, blank=True)
    score_computed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(end_date__gt=models.F('start_date')),
                name='end_date_after_start_date'
            )
        ]

    def __str__(self):
        return f"{self.student.username} @ {self.company_name}"

    def compute_final_score(self):
        evaluations = self.evaluations.select_related('criteria').all()
        if not evaluations.exists():
            return None
        total_weight = sum(e.criteria.weight for e in evaluations)
        if total_weight == 0:
            return None
        weighted_sum = sum(
            e.score * (e.criteria.weight / total_weight)
            for e in evaluations
        )
        self.computed_score = round(weighted_sum, 2)
        self.letter_grade = self._to_letter(self.computed_score)
        self.score_computed_at = timezone.now()
        self.save(update_fields=['computed_score', 'letter_grade', 'score_computed_at'])
        return self.computed_score

    @staticmethod
    def _to_letter(score):
        if score >= 80: return 'A'
        if score >= 70: return 'B'
        if score >= 60: return 'C'
        if score >= 50: return 'D'
        return 'F'


class WeeklyLog(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('submitted', 'Submitted'),
        ('reviewed', 'Reviewed'),
        ('approved', 'Approved'),
    ]
    placement = models.ForeignKey(
        InternshipPlacement, on_delete=models.CASCADE, related_name='logs'
    )
    week_number = models.PositiveIntegerField()
    activities = models.TextField()
    challenges = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    submitted_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('placement', 'week_number')
        ordering = ['week_number']

    def __str__(self):
        return f"Week {self.week_number} — {self.placement.student.username} [{self.status}]"


class LogStatusHistory(models.Model):
    log = models.ForeignKey(
        WeeklyLog, on_delete=models.CASCADE, related_name='status_history'
    )
    changed_by = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True
    )
    from_status = models.CharField(max_length=20)
    to_status = models.CharField(max_length=20)
    comment = models.TextField(blank=True)
    changed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['changed_at']

    def __str__(self):
        return f"{self.log} | {self.from_status} → {self.to_status}"


class EvaluationCriteria(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    weight = models.DecimalField(max_digits=5, decimal_places=2)

    class Meta:
        verbose_name_plural = 'Evaluation Criteria'

    def __str__(self):
        return f"{self.name} ({self.weight}%)"


class Evaluation(models.Model):
    EVALUATOR_TYPE_CHOICES = [
        ('workplace', 'Workplace Supervisor'),
        ('academic', 'Academic Supervisor'),
    ]
    placement = models.ForeignKey(
        InternshipPlacement, on_delete=models.CASCADE, related_name='evaluations'
    )
    evaluator = models.ForeignKey(
        CustomUser, on_delete=models.SET_NULL, null=True
    )
    evaluator_type = models.CharField(max_length=20, choices=EVALUATOR_TYPE_CHOICES)
    criteria = models.ForeignKey(EvaluationCriteria, on_delete=models.CASCADE)
    score = models.DecimalField(max_digits=5, decimal_places=2)
    comments = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('placement', 'evaluator', 'criteria')

    def __str__(self):
        return f"{self.evaluator_type} eval — {self.placement}"