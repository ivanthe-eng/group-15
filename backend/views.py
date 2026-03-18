from django.contrib.auth import authenticate
from django.db.models import Count, Avg, Q
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    CustomUser, InternshipPlacement, WeeklyLog,
    LogStatusHistory, EvaluationCriteria, Evaluation
)
from .serializers import (
    UserSerializer, RegisterSerializer, PlacementSerializer,
    WeeklyLogSerializer, LogStatusHistorySerializer,
    EvaluationSerializer, EvaluationCriteriaSerializer
)
from .permissions import IsAdmin, IsStudent, IsSupervisor, IsAdminOrReadOnly

VALID_TRANSITIONS = {
    'draft': ['submitted'],
    'submitted': ['reviewed', 'draft'],
    'reviewed': ['approved', 'draft'],
    'approved': [],
}


# ── Auth ─────────────────────────────────────────────────────────────────────

@api_view(['GET','POST'])
@permission_classes([AllowAny])
def ping(request):
    return Response({'message': 'ILES backend is running.'})


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    user = authenticate(
        username=request.data.get('username'),
        password=request.data.get('password')
    )
    if not user:
        return Response({'error': 'Invalid credentials.'}, status=400)
    refresh = RefreshToken.for_user(user)
    return Response({
        'access': str(refresh.access_token),
        'refresh': str(refresh),
        'user': {'id': user.id, 'username': user.username, 'email': user.email, 'role': user.role},
    })


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    s = RegisterSerializer(data=request.data)
    if s.is_valid():
        user = s.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=201)
    return Response(s.errors, status=400)


@api_view(['GET'])
def current_user(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET'])
def users_by_role(request):
    role = request.query_params.get('role')
    qs = CustomUser.objects.filter(is_active=True)
    if role:
        qs = qs.filter(role=role)
    return Response(UserSerializer(qs, many=True).data)


# ── Placements ───────────────────────────────────────────────────────────────

class PlacementListCreateView(generics.ListCreateAPIView):
    serializer_class = PlacementSerializer

    def get_permissions(self):
        return [IsAdmin()] if self.request.method == 'POST' else [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return InternshipPlacement.objects.select_related(
                'student', 'workplace_supervisor', 'academic_supervisor'
            ).all()
        if user.role == 'student':
            return InternshipPlacement.objects.filter(student=user)
        if user.role == 'workplace_supervisor':
            return InternshipPlacement.objects.filter(workplace_supervisor=user)
        if user.role == 'academic_supervisor':
            return InternshipPlacement.objects.filter(academic_supervisor=user)
        return InternshipPlacement.objects.none()


class PlacementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlacementSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return InternshipPlacement.objects.all()
        if user.role == 'student':
            return InternshipPlacement.objects.filter(student=user)
        return InternshipPlacement.objects.filter(
            Q(workplace_supervisor=user) | Q(academic_supervisor=user)
        )


# ── Weekly Logs ───────────────────────────────────────────────────────────────

class WeeklyLogListCreateView(generics.ListCreateAPIView):
    serializer_class = WeeklyLogSerializer

    def get_permissions(self):
        return [IsStudent()] if self.request.method == 'POST' else [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        placement_id = self.request.query_params.get('placement')
        if user.role == 'student':
            qs = WeeklyLog.objects.filter(placement__student=user)
        elif user.role == 'workplace_supervisor':
            qs = WeeklyLog.objects.filter(placement__workplace_supervisor=user)
        elif user.role == 'academic_supervisor':
            qs = WeeklyLog.objects.filter(placement__academic_supervisor=user)
        else:
            qs = WeeklyLog.objects.all()
        if placement_id:
            qs = qs.filter(placement_id=placement_id)
        return qs.select_related('placement__student').prefetch_related('status_history')

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


class WeeklyLogDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = WeeklyLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'student':
            return WeeklyLog.objects.filter(placement__student=user)
        if user.role == 'workplace_supervisor':
            return WeeklyLog.objects.filter(placement__workplace_supervisor=user)
        if user.role == 'academic_supervisor':
            return WeeklyLog.objects.filter(placement__academic_supervisor=user)
        return WeeklyLog.objects.all()

    def update(self, request, *args, **kwargs):
        log = self.get_object()
        if request.user.role == 'student' and log.status != 'draft':
            return Response({'error': 'You can only edit Draft logs.'}, status=403)
        return super().update(request, *args, **kwargs)

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


@api_view(['POST'])
def submit_log(request, pk):
    try:
        log = WeeklyLog.objects.get(pk=pk, placement__student=request.user)
    except WeeklyLog.DoesNotExist:
        return Response({'error': 'Log not found.'}, status=404)
    if log.status != 'draft':
        return Response({'error': 'Only Draft logs can be submitted.'}, status=400)
    if timezone.now().date() > log.placement.end_date:
        return Response({'error': 'Submission deadline has passed.'}, status=403)
    old = log.status
    log.status = 'submitted'
    log.submitted_at = timezone.now()
    log.save()
    LogStatusHistory.objects.create(log=log, changed_by=request.user, from_status=old, to_status='submitted')
    return Response({'message': 'Log submitted.', 'status': log.status})


@api_view(['POST'])
def review_log(request, pk):
    try:
        log = WeeklyLog.objects.get(pk=pk)
    except WeeklyLog.DoesNotExist:
        return Response({'error': 'Log not found.'}, status=404)
    user = request.user
    p = log.placement
    if user not in (p.workplace_supervisor, p.academic_supervisor):
        return Response({'error': 'Not your assigned log.'}, status=403)
    new_status = request.data.get('status', 'reviewed')
    comment = request.data.get('comment', '')
    if new_status not in VALID_TRANSITIONS.get(log.status, []):
        return Response({'error': f"Cannot go from '{log.status}' to '{new_status}'."}, status=400)
    old = log.status
    log.status = new_status
    log.save()
    LogStatusHistory.objects.create(log=log, changed_by=user, from_status=old, to_status=new_status, comment=comment)
    return Response({'message': f'Log marked {new_status}.', 'status': log.status})


@api_view(['POST'])
def approve_log(request, pk):
    try:
        log = WeeklyLog.objects.get(pk=pk)
    except WeeklyLog.DoesNotExist:
        return Response({'error': 'Log not found.'}, status=404)
    user = request.user
    p = log.placement
    if user not in (p.workplace_supervisor, p.academic_supervisor):
        return Response({'error': 'Not your assigned log.'}, status=403)
    if log.status != 'reviewed':
        return Response({'error': 'Only Reviewed logs can be approved.'}, status=400)
    old = log.status
    log.status = 'approved'
    log.save()
    LogStatusHistory.objects.create(
        log=log, changed_by=user, from_status=old, to_status='approved',
        comment=request.data.get('comment', '')
    )
    return Response({'message': 'Log approved.', 'status': log.status})


@api_view(['GET'])
def log_audit_trail(request, pk):
    try:
        log = WeeklyLog.objects.get(pk=pk)
    except WeeklyLog.DoesNotExist:
        return Response({'error': 'Log not found.'}, status=404)
    user = request.user
    p = log.placement
    if not (user.role == 'admin' or user in (p.student, p.workplace_supervisor, p.academic_supervisor)):
        return Response({'error': 'Access denied.'}, status=403)
    history = LogStatusHistory.objects.filter(log=log).order_by('changed_at')
    return Response(LogStatusHistorySerializer(history, many=True).data)


# ── Supervisor ────────────────────────────────────────────────────────────────

@api_view(['GET'])
def supervisor_queue(request):
    user = request.user
    if user.role not in ('workplace_supervisor', 'academic_supervisor'):
        return Response({'error': 'Supervisors only.'}, status=403)
    base = Q(placement__workplace_supervisor=user) | Q(placement__academic_supervisor=user)
    pending = WeeklyLog.objects.filter(base, status='submitted').distinct()
    for_approval = WeeklyLog.objects.filter(base, status='reviewed').distinct()
    return Response({
        'pending_review': WeeklyLogSerializer(pending, many=True).data,
        'pending_approval': WeeklyLogSerializer(for_approval, many=True).data,
    })


# ── Evaluations ───────────────────────────────────────────────────────────────

class EvaluationListCreateView(generics.ListCreateAPIView):
    serializer_class = EvaluationSerializer

    def get_permissions(self):
        return [IsSupervisor()] if self.request.method == 'POST' else [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        placement_id = self.request.query_params.get('placement')
        qs = Evaluation.objects.select_related('criteria', 'evaluator', 'placement')
        if user.role != 'admin':
            qs = qs.filter(evaluator=user)
        if placement_id:
            qs = qs.filter(placement_id=placement_id)
        return qs

    def perform_create(self, serializer):
        evaluation = serializer.save()
        evaluation.placement.compute_final_score()

    def get_serializer_context(self):
        return {**super().get_serializer_context(), 'request': self.request}


class EvaluationCriteriaListView(generics.ListCreateAPIView):
    queryset = EvaluationCriteria.objects.all()
    serializer_class = EvaluationCriteriaSerializer
    permission_classes = [IsAdminOrReadOnly]


@api_view(['GET'])
def placement_score(request, pk):
    try:
        placement = InternshipPlacement.objects.get(pk=pk)
    except InternshipPlacement.DoesNotExist:
        return Response({'error': 'Placement not found.'}, status=404)
    user = request.user
    p = placement
    if not (user.role == 'admin' or user in (p.student, p.workplace_supervisor, p.academic_supervisor)):
        return Response({'error': 'Access denied.'}, status=403)
    placement.compute_final_score()
    return Response({
        'placement_id': placement.id,
        'student': placement.student.username,
        'company': placement.company_name,
        'computed_score': str(placement.computed_score) if placement.computed_score else None,
        'letter_grade': placement.letter_grade or None,
        'score_computed_at': placement.score_computed_at,
        'evaluations': EvaluationSerializer(
            placement.evaluations.all(), many=True, context={'request': request}
        ).data,
    })


# ── Dashboards ────────────────────────────────────────────────────────────────

@api_view(['GET'])
def student_dashboard(request):
    if request.user.role != 'student':
        return Response({'error': 'Students only.'}, status=403)
    placements = InternshipPlacement.objects.filter(
        student=request.user
    ).prefetch_related('logs', 'evaluations')
    result = []
    for p in placements:
        logs = p.logs.all()
        total = logs.count()
        approved = logs.filter(status='approved').count()
        result.append({
            'placement_id': p.id,
            'company': p.company_name,
            'start_date': p.start_date,
            'end_date': p.end_date,
            'is_active': p.is_active,
            'total_logs': total,
            'submitted_logs': logs.filter(status__in=['submitted', 'reviewed', 'approved']).count(),
            'approved_logs': approved,
            'computed_score': str(p.computed_score) if p.computed_score else None,
            'letter_grade': p.letter_grade or None,
            'log_statuses': list(logs.values('week_number', 'status').order_by('week_number')),
        })
    return Response({'placements': result})


@api_view(['GET'])
def supervisor_dashboard(request):
    user = request.user
    if user.role not in ('workplace_supervisor', 'academic_supervisor'):
        return Response({'error': 'Supervisors only.'}, status=403)
    placements = InternshipPlacement.objects.filter(
        Q(workplace_supervisor=user) | Q(academic_supervisor=user)
    ).prefetch_related('logs', 'student')
    interns = []
    for p in placements:
        logs = p.logs.all()
        total = logs.count()
        approved = logs.filter(status='approved').count()
        interns.append({
            'student': p.student.username,
            'company': p.company_name,
            'placement_id': p.id,
            'total_logs': total,
            'pending_review': logs.filter(status='submitted').count(),
            'approved': approved,
            'completion_pct': round(approved / max(total, 1) * 100, 1),
        })
    return Response({
        'pending_total': sum(i['pending_review'] for i in interns),
        'interns': interns,
    })


@api_view(['GET'])
def admin_dashboard(request):
    if request.user.role != 'admin':
        return Response({'error': 'Admins only.'}, status=403)
    log_status_breakdown = list(
        WeeklyLog.objects.values('status').annotate(count=Count('id')).order_by('status')
    )
    grade_dist = list(
        InternshipPlacement.objects.exclude(letter_grade='')
        .values('letter_grade').annotate(count=Count('id')).order_by('letter_grade')
    )
    avg_by_company = list(
        InternshipPlacement.objects.exclude(computed_score=None)
        .values('company_name').annotate(avg_score=Avg('computed_score')).order_by('-avg_score')[:10]
    )
    supervisor_queue = []
    for s in CustomUser.objects.filter(role__in=['workplace_supervisor', 'academic_supervisor']):
        pending = WeeklyLog.objects.filter(
            Q(placement__workplace_supervisor=s) | Q(placement__academic_supervisor=s),
            status='submitted'
        ).count()
        if pending > 0:
            supervisor_queue.append({'supervisor': s.username, 'pending': pending})
    supervisor_queue.sort(key=lambda x: -x['pending'])
    return Response({
        'totals': {
            'students': CustomUser.objects.filter(role='student').count(),
            'placements': InternshipPlacement.objects.count(),
            'logs': WeeklyLog.objects.count(),
        },
        'log_status_breakdown': log_status_breakdown,
        'grade_distribution': grade_dist,
        'avg_score_by_company': avg_by_company,
        'supervisor_queue': supervisor_queue,
    })