from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('ping/', views.ping),
    path('auth/login/', views.login_view),
    path('auth/register/', views.register_view),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me/', views.current_user),
    path('users/', views.users_by_role),
    path('placements/', views.PlacementListCreateView.as_view()),
    path('placements/<int:pk>/', views.PlacementDetailView.as_view()),
    path('placements/<int:pk>/score/', views.placement_score),
    path('logs/', views.WeeklyLogListCreateView.as_view()),
    path('logs/<int:pk>/', views.WeeklyLogDetailView.as_view()),
    path('logs/<int:pk>/submit/', views.submit_log),
    path('logs/<int:pk>/review/', views.review_log),
    path('logs/<int:pk>/approve/', views.approve_log),
    path('logs/<int:pk>/history/', views.log_audit_trail),
    path('supervisor/queue/', views.supervisor_queue),
    path('evaluations/', views.EvaluationListCreateView.as_view()),
    path('criteria/', views.EvaluationCriteriaListView.as_view()),
    path('dashboard/student/', views.student_dashboard),
    path('dashboard/supervisor/', views.supervisor_dashboard),
    path('dashboard/admin/', views.admin_dashboard),
]