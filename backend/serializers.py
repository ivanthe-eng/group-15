from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError as DjangoValidationError
from .models import (
    CustomUser, InternshipPlacement, WeeklyLog,
    LogStatusHistory, EvaluationCriteria, Evaluation
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'email', 'role', 'phone']
        read_only_fields = ['id']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={'input_type': 'password'},
    )
    confirm_password = serializers.CharField(
        write_only=True,
        style={'input_type': 'password'},
    )
    email = serializers.EmailField(required=True)
    phone = serializers.CharField(
        required=False,
        allow_blank=True,
        default='',
    )
    role = serializers.ChoiceField(
        choices=[
            ('student', 'Student Intern'),
            ('workplace_supervisor', 'Workplace Supervisor'),
            ('academic_supervisor', 'Academic Supervisor'),
            ('admin', 'Admin'),
        ]
    )

    class Meta:
        model = CustomUser
        fields = [
            'username',
            'email',
            'password',
            'confirm_password',
            'role',
            'phone',
        ]

    def validate_username(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Username cannot be empty.')
        if CustomUser.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError('That username is already taken.')
        return value

    def validate_email(self, value):
        value = value.strip().lower()
        if not value:
            raise serializers.ValidationError('Email address is required.')
        if CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('An account with that email already exists.')
        return value

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError('Password must be at least 8 characters.')
        if value.isdigit():
            raise serializers.ValidationError('Password cannot be entirely numeric.')
        if value.isalpha():
            raise serializers.ValidationError(
                'Password must contain at least one number or special character.'
            )
        return value

    def validate(self, data):
        password = data.get('password')
        confirm_password = data.pop('confirm_password', None)
        if password != confirm_password:
            raise serializers.ValidationError({
                'confirm_password': 'Passwords do not match.'
            })
        try:
            validate_password(password)
        except DjangoValidationError as e:
            raise serializers.ValidationError({'password': list(e.messages)})

        return data

    def create(self, validated_data):
        # confirm_password already removed in validate()
        return CustomUser.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            role=validated_data.get('role', 'student'),
            phone=validated_data.get('phone', ''),
        )

class PlacementSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(
        source='student.username', read_only=True
    )
    workplace_supervisor_username = serializers.CharField(
        source='workplace_supervisor.username', read_only=True
    )
    academic_supervisor_username = serializers.CharField(
        source='academic_supervisor.username', read_only=True
    )

    class Meta:
        model = InternshipPlacement
        fields = [
            'id',
            'student', 'student_username',
            'workplace_supervisor', 'workplace_supervisor_username',
            'academic_supervisor', 'academic_supervisor_username',
            'company_name',
            'start_date', 'end_date',
            'is_active',
            'computed_score', 'letter_grade', 'score_computed_at',
            'created_at',
        ]
        read_only_fields = [
            'computed_score', 'letter_grade',
            'score_computed_at', 'created_at',
        ]

    def validate(self, data):
        start = data.get('start_date')
        end = data.get('end_date')
        student = data.get('student')

        if not start or not end:
            raise serializers.ValidationError('Both start_date and end_date are required.')

        if end <= start:
            raise serializers.ValidationError({
                'end_date': 'End date must be after start date.'
            })

        qs = InternshipPlacement.objects.filter(
            student=student,
            is_active=True,
            start_date__lt=end,
            end_date__gt=start,
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'This student already has an active placement overlapping those dates.'
            )

        return data

class LogStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_username = serializers.CharField(
        source='changed_by.username', read_only=True
    )

    class Meta:
        model = LogStatusHistory
        fields = [
            'id', 'log',
            'changed_by', 'changed_by_username',
            'from_status', 'to_status',
            'comment', 'changed_at',
        ]
        read_only_fields = fields

class WeeklyLogSerializer(serializers.ModelSerializer):
    student_username = serializers.CharField(
        source='placement.student.username', read_only=True
    )
    placement_company = serializers.CharField(
        source='placement.company_name', read_only=True
    )
    status_history = LogStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = WeeklyLog
        fields = [
            'id', 'placement',
            'week_number', 'activities', 'challenges',
            'status', 'submitted_at',
            'created_at', 'updated_at',
            'student_username', 'placement_company',
            'status_history',
        ]
        read_only_fields = [
            'status', 'submitted_at',
            'created_at', 'updated_at',
        ]

    def validate_week_number(self, value):
        if value < 1:
            raise serializers.ValidationError('Week number must be at least 1.')
        if value > 52:
            raise serializers.ValidationError('Week number cannot exceed 52.')
        return value

    def validate_activities(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError('Activities field cannot be empty.')
        if len(value) < 20:
            raise serializers.ValidationError(
                'Please describe your activities in at least 20 characters.'
            )
        return value

    def validate(self, data):
        request = self.context.get('request')
        placement = data.get('placement') or (
            self.instance.placement if self.instance else None
        )

        # Student can only create logs for their own placement
        if placement and request and request.user.role == 'student':
            if placement.student != request.user:
                raise serializers.ValidationError(
                    'You can only create logs for your own placement.'
                )
            
        week_number = data.get('week_number')
        if week_number and placement:
            qs = WeeklyLog.objects.filter(
                placement=placement,
                week_number=week_number,
            )
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    f'A log for week {week_number} already exists for this placement.'
                )

        return data

class EvaluationCriteriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EvaluationCriteria
        fields = ['id', 'name', 'description', 'weight']

    def validate_weight(self, value):
        if value <= 0:
            raise serializers.ValidationError('Weight must be greater than 0.')
        if value > 100:
            raise serializers.ValidationError('Weight cannot exceed 100.')
        return value

class EvaluationSerializer(serializers.ModelSerializer):
    criteria_name = serializers.CharField(
        source='criteria.name', read_only=True
    )
    criteria_weight = serializers.DecimalField(
        source='criteria.weight',
        max_digits=5,
        decimal_places=2,
        read_only=True,
    )
    evaluator_username = serializers.CharField(
        source='evaluator.username', read_only=True
    )

    class Meta:
        model = Evaluation
        fields = [
            'id', 'placement',
            'evaluator', 'evaluator_username', 'evaluator_type',
            'criteria', 'criteria_name', 'criteria_weight',
            'score', 'comments',
            'submitted_at',
        ]
        read_only_fields = ['evaluator', 'evaluator_type', 'submitted_at']

    def validate_score(self, value):
        if value < 0:
            raise serializers.ValidationError('Score cannot be negative.')
        if value > 100:
            raise serializers.ValidationError('Score cannot exceed 100.')
        return value

    def validate(self, data):
        request = self.context.get('request')
        if not request:
            raise serializers.ValidationError('Request context is required.')

        placement = data.get('placement')
        criteria = data.get('criteria')
        evaluator = request.user

        # Only supervisors can evaluate
        role_map = {
            'workplace_supervisor': 'workplace',
            'academic_supervisor': 'academic',
        }
        evaluator_type = role_map.get(evaluator.role)
        if not evaluator_type:
            raise serializers.ValidationError(
                'Only supervisors can submit evaluations.'
            )

        # Supervisor must be assigned to this placement
        if evaluator_type == 'workplace':
            if placement.workplace_supervisor != evaluator:
                raise serializers.ValidationError(
                    'You are not the workplace supervisor for this placement.'
                )
        if evaluator_type == 'academic':
            if placement.academic_supervisor != evaluator:
                raise serializers.ValidationError(
                    'You are not the academic supervisor for this placement.'
                )

        
        qs = Evaluation.objects.filter(
            placement=placement,
            evaluator=evaluator,
            criteria=criteria,
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError(
                'You have already submitted an evaluation for this criteria on this placement.'
            )

        
        data['evaluator'] = evaluator
        data['evaluator_type'] = evaluator_type

        return data