from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import (
    Exam, Question, AnswerChoice, GuestParticipant,
    ExamSession, StudentAnswer, AISetting,
)

User = get_user_model()


class AnswerChoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnswerChoice
        fields = ['id', 'choice_text', 'is_correct', 'order']


class AnswerChoiceStudentSerializer(serializers.ModelSerializer):
    """Serializer for students - hides is_correct field."""
    class Meta:
        model = AnswerChoice
        fields = ['id', 'choice_text', 'order']


class QuestionSerializer(serializers.ModelSerializer):
    choices = AnswerChoiceSerializer(many=True, required=False)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'points',
                  'order', 'image', 'explanation', 'choices']

    def create(self, validated_data):
        choices_data = validated_data.pop('choices', [])
        question = Question.objects.create(**validated_data)
        for i, choice_data in enumerate(choices_data):
            choice_data['order'] = i
            AnswerChoice.objects.create(question=question, **choice_data)
        return question

    def update(self, instance, validated_data):
        choices_data = validated_data.pop('choices', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if choices_data is not None:
            instance.choices.all().delete()
            for i, choice_data in enumerate(choices_data):
                choice_data['order'] = i
                AnswerChoice.objects.create(question=instance, **choice_data)

        return instance


class QuestionStudentSerializer(serializers.ModelSerializer):
    """Serializer for students taking exam - hides correct answer and explanation."""
    choices = AnswerChoiceStudentSerializer(many=True, read_only=True)

    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'points',
                  'order', 'image', 'choices']


class ExamListSerializer(serializers.ModelSerializer):
    """Compact serializer for exam lists."""
    teacher_name = serializers.SerializerMethodField()
    total_questions = serializers.ReadOnlyField()
    total_points = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_ended = serializers.ReadOnlyField()
    session_count = serializers.SerializerMethodField()

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'subject', 'teacher_name',
            'class_target', 'access_mode', 'exam_code',
            'public_link_enabled', 'require_exam_token',
            'start_time', 'end_time', 'duration_minutes',
            'total_questions', 'total_points', 'is_active',
            'is_ongoing', 'is_upcoming', 'is_ended',
            'session_count', 'created_at',
        ]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() or obj.teacher.username

    def get_session_count(self, obj):
        return obj.sessions.count()


class ExamDetailSerializer(serializers.ModelSerializer):
    """Full serializer for exam CRUD."""
    questions = QuestionSerializer(many=True, read_only=True)
    teacher_name = serializers.SerializerMethodField()
    total_questions = serializers.ReadOnlyField()
    total_points = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'subject', 'teacher', 'teacher_name',
            'class_target', 'access_mode', 'exam_code',
            'public_link_enabled', 'require_exam_token', 'exam_token',
            'guest_allow_retake', 'guest_prevent_duplicate_by_nis',
            'guest_prevent_duplicate_by_nisn', 'guest_prevent_duplicate_by_email',
            'guest_prevent_duplicate_by_name_class', 'guest_prevent_duplicate_by_ip',
            'start_time', 'end_time', 'duration_minutes',
            'shuffle_questions', 'shuffle_answers',
            'show_result', 'max_violations', 'passing_score',
            'is_active', 'is_ongoing',
            'total_questions', 'total_points',
            'questions', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'exam_code', 'created_at', 'updated_at']

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() or obj.teacher.username


class GuestParticipantSerializer(serializers.ModelSerializer):
    class Meta:
        model = GuestParticipant
        fields = [
            'id', 'full_name', 'nis', 'nisn', 'class_name',
            'gender', 'phone', 'email', 'created_at',
        ]


class StudentAnswerSerializer(serializers.ModelSerializer):
    question_text = serializers.CharField(source='question.question_text', read_only=True)
    question_type = serializers.CharField(source='question.question_type', read_only=True)
    question_order = serializers.IntegerField(source='question.order', read_only=True)
    question_points = serializers.IntegerField(source='question.points', read_only=True)
    selected_choice_text = serializers.SerializerMethodField()

    class Meta:
        model = StudentAnswer
        fields = [
            'id', 'question', 'question_text', 'question_type', 'question_order', 'question_points',
            'selected_choice', 'selected_choice_text', 'essay_answer',
            'is_correct', 'points_earned', 'ai_feedback', 'answered_at',
        ]

    def get_selected_choice_text(self, obj):
        if obj.selected_choice:
            return obj.selected_choice.choice_text
        return None


class ExamSessionSerializer(serializers.ModelSerializer):
    """Serializer for exam sessions with participant info."""
    participant_name = serializers.ReadOnlyField()
    participant_type = serializers.ReadOnlyField()
    time_remaining_seconds = serializers.ReadOnlyField()
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    answers = StudentAnswerSerializer(many=True, read_only=True)

    # Student info
    student_nis = serializers.SerializerMethodField()
    student_nisn = serializers.SerializerMethodField()
    student_class = serializers.SerializerMethodField()

    # Guest info
    guest_nis = serializers.CharField(source='guest_participant.nis', read_only=True, default='')
    guest_nisn = serializers.CharField(source='guest_participant.nisn', read_only=True, default='')
    guest_class = serializers.CharField(source='guest_participant.class_name', read_only=True, default='')

    class Meta:
        model = ExamSession
        fields = [
            'id', 'exam', 'exam_title', 'student', 'guest_participant',
            'participant_name', 'participant_type',
            'student_nis', 'student_nisn', 'student_class',
            'guest_nis', 'guest_nisn', 'guest_class',
            'started_at', 'end_time', 'submitted_at',
            'status', 'score', 'violation_count',
            'time_remaining_seconds', 'ip_address', 'user_agent',
            'answers',
        ]

    def get_student_nis(self, obj):
        if obj.student and hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.nis
        return ''

    def get_student_nisn(self, obj):
        if obj.student and hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.nisn
        return ''

    def get_student_class(self, obj):
        if obj.student and hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.class_name
        return ''


class ExamResultSerializer(serializers.Serializer):
    """Unified result serializer for both login and guest students."""
    session_id = serializers.UUIDField(source='id')
    participant_name = serializers.SerializerMethodField()
    nis = serializers.SerializerMethodField()
    nisn = serializers.SerializerMethodField()
    class_name = serializers.SerializerMethodField()
    participant_type = serializers.SerializerMethodField()
    score = serializers.DecimalField(max_digits=5, decimal_places=2)
    status = serializers.CharField()
    status_display = serializers.CharField(source='get_status_display')
    started_at = serializers.DateTimeField()
    submitted_at = serializers.DateTimeField()
    violation_count = serializers.IntegerField()

    def get_participant_name(self, obj):
        if obj.student:
            return obj.student.get_full_name() or obj.student.username
        elif obj.guest_participant:
            return obj.guest_participant.full_name
        return '-'

    def get_nis(self, obj):
        if obj.student and hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.nis
        elif obj.guest_participant:
            return obj.guest_participant.nis
        return '-'

    def get_nisn(self, obj):
        if obj.student and hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.nisn
        elif obj.guest_participant:
            return obj.guest_participant.nisn
        return '-'

    def get_class_name(self, obj):
        if obj.student and hasattr(obj.student, 'student_profile'):
            return obj.student.student_profile.class_name
        elif obj.guest_participant:
            return obj.guest_participant.class_name
        return '-'

    def get_participant_type(self, obj):
        if obj.student:
            return 'Siswa Login'
        return 'Peserta Tanpa Login'


class AISettingSerializer(serializers.ModelSerializer):
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = AISetting
        fields = [
            'provider', 'is_active', 'base_url', 'model_name',
            'timeout', 'temperature', 'max_tokens', 'api_key',
            'last_checked', 'last_status', 'updated_by', 'updated_by_name',
            'updated_at'
        ]
        read_only_fields = ['last_checked', 'last_status', 'updated_by', 'updated_by_name', 'updated_at']

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return obj.updated_by.get_full_name() or obj.updated_by.username
        return '-'

    def update(self, instance, validated_data):
        api_key = validated_data.get('api_key', None)
        if api_key is not None:
            if '*' in api_key:
                validated_data.pop('api_key')
        return super().update(instance, validated_data)

    def to_representation(self, instance):
        """Obfuscate API Key when sending to frontend."""
        rep = super().to_representation(instance)
        key = rep.get('api_key', '')
        if key:
            if len(key) > 8:
                rep['api_key'] = f"{key[:4]}***********************{key[-4:]}"
            else:
                rep['api_key'] = "********"
        return rep

