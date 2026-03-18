from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import (
    CustomUser,
    InternshipPlacement,
    WeeklyLog,
    LogStatusHistory,
    EvaluationCriteria,
    Evaluation,
)


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display = ['username', 'email', 'role', 'phone', 'is_active']
    list_filter = ['role', 'is_active']
    search_fields = ['username', 'email']
    fieldsets = UserAdmin.fieldsets + (
        ('ILES role', {'fields': ('role', 'phone')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('ILES role', {'fields': ('role', 'phone')}),
    )


@admin.register(InternshipPlacement)
class PlacementAdmin(admin.ModelAdmin):
    list_display = [
        'student', 'company_name', 'start_date',
        'end_date', 'is_active', 'letter_grade', 'computed_score'
    ]
    list_filter = ['is_active', 'letter_grade']
    search_fields = ['student__username', 'company_name']
    readonly_fields = ['computed_score', 'letter_grade', 'score_computed_at']


@admin.register(WeeklyLog)
class WeeklyLogAdmin(admin.ModelAdmin):
    list_display = ['placement', 'week_number', 'status', 'submitted_at', 'updated_at']
    list_filter = ['status']
    search_fields = ['placement__student__username', 'placement__company_name']
    readonly_fields = ['submitted_at', 'created_at', 'updated_at']


@admin.register(LogStatusHistory)
class LogStatusHistoryAdmin(admin.ModelAdmin):
    list_display = ['log', 'changed_by', 'from_status', 'to_status', 'changed_at']
    list_filter = ['from_status', 'to_status']
    readonly_fields = ['changed_at']

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(EvaluationCriteria)
class EvaluationCriteriaAdmin(admin.ModelAdmin):
    list_display = ['name', 'weight', 'description']


@admin.register(Evaluation)
class EvaluationAdmin(admin.ModelAdmin):
    list_display = ['placement', 'evaluator', 'evaluator_type', 'criteria', 'score', 'submitted_at']
    list_filter = ['evaluator_type']
    search_fields = ['placement__student__username', 'evaluator__username']
    readonly_fields = ['submitted_at']