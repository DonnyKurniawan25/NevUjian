from rest_framework import serializers
from exams.models import Exam, GuestParticipant, ExamSession, StudentAnswer, Question
from exams.serializers import QuestionStudentSerializer


class PublicExamSerializer(serializers.ModelSerializer):
    """Public exam info - no sensitive data."""
    teacher_name = serializers.SerializerMethodField()
    total_questions = serializers.ReadOnlyField()
    is_ongoing = serializers.ReadOnlyField()
    is_upcoming = serializers.ReadOnlyField()
    is_ended = serializers.ReadOnlyField()

    class Meta:
        model = Exam
        fields = [
            'id', 'title', 'description', 'subject', 'teacher_name',
            'class_target', 'access_mode', 'exam_code',
            'require_exam_token', 'duration_minutes',
            'start_time', 'end_time', 'total_questions',
            'is_ongoing', 'is_upcoming', 'is_ended',
            'shuffle_questions', 'show_result', 'max_violations',
        ]

    def get_teacher_name(self, obj):
        return obj.teacher.get_full_name() or obj.teacher.username


class TokenValidationSerializer(serializers.Serializer):
    """Validate exam token."""
    exam_token = serializers.CharField()

    def validate_exam_token(self, value):
        exam = self.context.get('exam')
        if not exam:
            raise serializers.ValidationError('Ujian tidak ditemukan.')
        if value != exam.exam_token:
            raise serializers.ValidationError('Token ujian salah.')
        return value


class GuestRegistrationSerializer(serializers.Serializer):
    """Register as guest participant."""
    full_name = serializers.CharField(max_length=255)
    nis = serializers.CharField(max_length=50)
    nisn = serializers.CharField(max_length=50, required=False, allow_blank=True)
    class_name = serializers.CharField(max_length=50)
    gender = serializers.CharField(max_length=1, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    exam_token = serializers.CharField(required=False, allow_blank=True)

    def validate(self, data):
        exam = self.context.get('exam')

        # Validate exam token if required
        if exam.require_exam_token:
            token = data.get('exam_token', '')
            if not token:
                raise serializers.ValidationError(
                    {'exam_token': 'Token ujian diperlukan.'}
                )
            if token != exam.exam_token:
                raise serializers.ValidationError(
                    {'exam_token': 'Token ujian salah.'}
                )

        return data


class GuestExamSessionSerializer(serializers.ModelSerializer):
    """Session detail for guest participants."""
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    exam_subject = serializers.CharField(source='exam.subject', read_only=True)
    participant_name = serializers.ReadOnlyField()
    time_remaining_seconds = serializers.ReadOnlyField()
    questions = serializers.SerializerMethodField()
    saved_answers = serializers.SerializerMethodField()

    class Meta:
        model = ExamSession
        fields = [
            'id', 'exam', 'exam_title', 'exam_subject',
            'participant_name', 'started_at', 'end_time',
            'submitted_at', 'status', 'score', 'violation_count',
            'time_remaining_seconds', 'questions', 'saved_answers',
        ]

    def get_questions(self, obj):
        pg_questions = obj.exam.questions.prefetch_related('choices').filter(question_type='multiple_choice')
        essay_questions = obj.exam.questions.prefetch_related('choices').filter(question_type='essay')
        
        if obj.exam.shuffle_questions:
            pg_questions = pg_questions.order_by('?')
            essay_questions = essay_questions.order_by('?')
        else:
            pg_questions = pg_questions.order_by('order')
            essay_questions = essay_questions.order_by('order')
            
        questions = list(pg_questions) + list(essay_questions)
        return QuestionStudentSerializer(questions, many=True).data

    def get_saved_answers(self, obj):
        answers = StudentAnswer.objects.filter(session=obj).values(
            'question_id', 'selected_choice_id', 'essay_answer'
        )
        return {
            str(a['question_id']): {
                'selected_choice': a['selected_choice_id'],
                'essay_answer': a['essay_answer'],
            } for a in answers
        }


class GuestAnswerSerializer(serializers.Serializer):
    """Submit an answer for a guest session."""
    question_id = serializers.IntegerField()
    selected_choice = serializers.IntegerField(required=False, allow_null=True)
    essay_answer = serializers.CharField(required=False, allow_blank=True)


class GuestExamResultSerializer(serializers.ModelSerializer):
    """Result for guest after submitting exam."""
    participant_name = serializers.ReadOnlyField()
    exam_title = serializers.CharField(source='exam.title', read_only=True)
    exam_subject = serializers.CharField(source='exam.subject', read_only=True)
    passing_score = serializers.DecimalField(
        source='exam.passing_score', max_digits=5, decimal_places=2, read_only=True
    )
    is_passed = serializers.SerializerMethodField()

    class Meta:
        model = ExamSession
        fields = [
            'id', 'exam_title', 'exam_subject', 'participant_name',
            'started_at', 'submitted_at', 'status', 'score',
            'violation_count', 'passing_score', 'is_passed',
        ]

    def get_is_passed(self, obj):
        if obj.score is None:
            return False
        return obj.score >= obj.exam.passing_score
