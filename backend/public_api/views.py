from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.response import Response

from exams.models import Exam, GuestParticipant, ExamSession, StudentAnswer
from exams.utils import check_duplicate_guest, get_client_ip, calculate_score
from .permissions import GuestTokenPermission
from .serializers import (
    PublicExamSerializer, TokenValidationSerializer,
    GuestRegistrationSerializer, GuestExamSessionSerializer,
    GuestAnswerSerializer, GuestExamResultSerializer,
)


class PublicExamDetailView(generics.GenericAPIView):
    """GET /api/public/exams/{exam_code}/ - Public exam info."""
    permission_classes = [permissions.AllowAny]

    def get(self, request, exam_code):
        try:
            exam = Exam.objects.get(
                exam_code=exam_code,
                is_active=True,
                public_link_enabled=True,
            )
        except Exam.DoesNotExist:
            return Response(
                {'error': 'Ujian tidak ditemukan atau tidak tersedia.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not exam.allows_guest and exam.access_mode != 'both':
            return Response(
                {'error': 'Ujian ini memerlukan login siswa.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = PublicExamSerializer(exam)
        return Response(serializer.data)


class ValidateTokenView(generics.GenericAPIView):
    """POST /api/public/exams/{exam_code}/validate-token/ - Validate exam token."""
    permission_classes = [permissions.AllowAny]
    serializer_class = TokenValidationSerializer

    def post(self, request, exam_code):
        try:
            exam = Exam.objects.get(exam_code=exam_code, is_active=True)
        except Exam.DoesNotExist:
            return Response(
                {'error': 'Ujian tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not exam.require_exam_token:
            return Response({'valid': True, 'message': 'Token tidak diperlukan.'})

        serializer = self.get_serializer(
            data=request.data, context={'exam': exam}
        )
        if serializer.is_valid():
            return Response({'valid': True, 'message': 'Token valid.'})
        return Response(
            {'valid': False, 'errors': serializer.errors},
            status=status.HTTP_400_BAD_REQUEST
        )


class GuestRegisterView(generics.GenericAPIView):
    """POST /api/public/exams/{exam_code}/guest-register/ - Register guest."""
    permission_classes = [permissions.AllowAny]
    serializer_class = GuestRegistrationSerializer

    def post(self, request, exam_code):
        try:
            exam = Exam.objects.get(
                exam_code=exam_code,
                is_active=True,
                public_link_enabled=True,
            )
        except Exam.DoesNotExist:
            return Response(
                {'error': 'Ujian tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not exam.allows_guest:
            return Response(
                {'error': 'Ujian ini tidak menerima peserta tanpa login.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate exam schedule
        if not exam.is_ongoing:
            if exam.is_upcoming:
                return Response(
                    {'error': f'Ujian belum dimulai. Jadwal: {exam.start_time.strftime("%d/%m/%Y %H:%M")}'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            return Response(
                {'error': 'Ujian telah berakhir.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data, context={'exam': exam})
        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data
        ip_address = get_client_ip(request)

        # Check for duplicates
        if not exam.guest_allow_retake:
            is_dup, msg = check_duplicate_guest(exam, data, ip_address)
            if is_dup:
                return Response(
                    {'error': msg},
                    status=status.HTTP_409_CONFLICT
                )

        # Create guest participant with temporary token
        guest = GuestParticipant.objects.create(
            exam=exam,
            full_name=data['full_name'],
            nis=data['nis'],
            nisn=data.get('nisn', ''),
            class_name=data['class_name'],
            gender=data.get('gender', ''),
            phone=data.get('phone', ''),
            email=data.get('email', ''),
            token_used=data.get('exam_token', ''),
            ip_address=ip_address,
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        return Response({
            'message': 'Registrasi berhasil.',
            'guest_id': guest.id,
            'access_token': guest.access_token,
            'full_name': guest.full_name,
            'exam': PublicExamSerializer(exam).data,
        }, status=status.HTTP_201_CREATED)


class GuestStartExamView(generics.GenericAPIView):
    """POST /api/public/exams/{exam_code}/start/ - Start guest exam session."""
    permission_classes = [GuestTokenPermission]

    def post(self, request, exam_code):
        guest = request.guest_participant
        exam = guest.exam

        if exam.exam_code != exam_code:
            return Response(
                {'error': 'Token tidak sesuai dengan ujian ini.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check schedule
        if not exam.is_ongoing:
            if exam.is_upcoming:
                return Response({'error': 'Ujian belum dimulai.'}, status=400)
            return Response({'error': 'Ujian telah berakhir.'}, status=400)

        # Check if already has active session
        existing = ExamSession.objects.filter(
            guest_participant=guest, status='in_progress'
        ).first()
        if existing:
            serializer = GuestExamSessionSerializer(existing)
            return Response(serializer.data)

        # Check if already submitted and no retake
        if not exam.guest_allow_retake:
            submitted = ExamSession.objects.filter(
                guest_participant=guest,
                status__in=['submitted', 'timed_out']
            ).exists()
            if submitted:
                return Response(
                    {'error': 'Anda sudah mengerjakan ujian ini.'},
                    status=status.HTTP_409_CONFLICT
                )

        # Create session
        end_time = min(
            timezone.now() + timezone.timedelta(minutes=exam.duration_minutes),
            exam.end_time
        )
        session = ExamSession.objects.create(
            exam=exam,
            guest_participant=guest,
            end_time=end_time,
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT', ''),
        )

        serializer = GuestExamSessionSerializer(session)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GuestExamSessionDetailView(generics.GenericAPIView):
    """GET /api/public/exam-sessions/{session_id}/ - Get guest session detail."""
    permission_classes = [GuestTokenPermission]

    def get(self, request, session_id):
        guest = request.guest_participant

        try:
            session = ExamSession.objects.select_related(
                'exam', 'guest_participant'
            ).get(pk=session_id, guest_participant=guest)
        except ExamSession.DoesNotExist:
            return Response(
                {'error': 'Sesi ujian tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Auto-submit if timed out
        if session.is_timed_out:
            session.status = 'timed_out'
            session.submitted_at = session.end_time
            session.score = calculate_score(session)
            session.save()

        serializer = GuestExamSessionSerializer(session)
        return Response(serializer.data)


class GuestAnswerView(generics.GenericAPIView):
    """POST /api/public/exam-sessions/{session_id}/answer/ - Save guest answer."""
    permission_classes = [GuestTokenPermission]
    serializer_class = GuestAnswerSerializer

    def post(self, request, session_id):
        guest = request.guest_participant

        try:
            session = ExamSession.objects.get(
                pk=session_id, guest_participant=guest
            )
        except ExamSession.DoesNotExist:
            return Response(
                {'error': 'Sesi ujian tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != 'in_progress':
            return Response(
                {'error': 'Sesi ujian sudah berakhir.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if session.is_timed_out:
            return Response(
                {'error': 'Waktu ujian telah habis.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        answer, created = StudentAnswer.objects.update_or_create(
            session=session,
            question_id=data['question_id'],
            defaults={
                'selected_choice_id': data.get('selected_choice'),
                'essay_answer': data.get('essay_answer', ''),
            }
        )

        return Response({
            'message': 'Jawaban tersimpan.',
            'question_id': data['question_id'],
            'saved': True,
        })


class GuestSubmitExamView(generics.GenericAPIView):
    """POST /api/public/exam-sessions/{session_id}/submit/ - Submit guest exam."""
    permission_classes = [GuestTokenPermission]

    def post(self, request, session_id):
        guest = request.guest_participant

        try:
            session = ExamSession.objects.get(
                pk=session_id, guest_participant=guest
            )
        except ExamSession.DoesNotExist:
            return Response(
                {'error': 'Sesi ujian tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != 'in_progress':
            return Response(
                {'error': 'Sesi ujian sudah berakhir.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.status = 'submitted'
        session.submitted_at = timezone.now()
        session.score = calculate_score(session)
        session.save()

        # Return result if show_result is enabled
        if session.exam.show_result:
            serializer = GuestExamResultSerializer(session)
            return Response(serializer.data)

        return Response({
            'message': 'Ujian berhasil dikumpulkan.',
            'status': 'submitted',
        })


class GuestViolationView(generics.GenericAPIView):
    """POST /api/public/exam-sessions/{session_id}/violation/ - Record guest violation."""
    permission_classes = [GuestTokenPermission]

    def post(self, request, session_id):
        guest = request.guest_participant

        try:
            session = ExamSession.objects.get(
                pk=session_id, guest_participant=guest
            )
        except ExamSession.DoesNotExist:
            return Response(
                {'error': 'Sesi ujian tidak ditemukan.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if session.status != 'in_progress':
            return Response(
                {'error': 'Sesi ujian sudah berakhir.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session.violation_count += 1
        terminated = False

        if session.violation_count >= session.exam.max_violations:
            session.status = 'terminated'
            session.submitted_at = timezone.now()
            session.score = calculate_score(session)
            terminated = True

        session.save()

        return Response({
            'violation_count': session.violation_count,
            'max_violations': session.exam.max_violations,
            'terminated': terminated,
        })
