"""Utility functions for exam management."""
import secrets
import string
from decimal import Decimal
from django.utils import timezone


def generate_exam_code(length=8):
    """Generate a unique exam code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(length))


def generate_guest_token():
    """Generate a secure temporary access token for guest participants."""
    return secrets.token_urlsafe(48)


def calculate_score(session):
    """Calculate the score for a given exam session."""
    from .models import StudentAnswer

    answers = session.answers.select_related('question', 'selected_choice').all()
    total_points = session.exam.total_points

    if total_points == 0:
        return Decimal('0.00')

    earned_points = Decimal('0.00')
    for answer in answers:
        if answer.question.question_type == 'multiple_choice':
            if answer.selected_choice and answer.selected_choice.is_correct:
                answer.is_correct = True
                answer.points_earned = Decimal(str(answer.question.points))
                earned_points += answer.points_earned
            else:
                answer.is_correct = False
                answer.points_earned = Decimal('0.00')
            answer.save(update_fields=['is_correct', 'points_earned'])
        elif answer.question.question_type == 'essay':
            earned_points += Decimal(str(answer.points_earned or 0))

    # Score as percentage (0-100)
    score = (earned_points / Decimal(str(total_points))) * Decimal('100')
    return score.quantize(Decimal('0.01'))


def check_duplicate_guest(exam, data, ip_address=None):
    """
    Check if a guest participant is a duplicate based on exam settings.
    Returns (is_duplicate: bool, message: str).
    """
    from .models import GuestParticipant

    guests = GuestParticipant.objects.filter(exam=exam)

    if exam.guest_prevent_duplicate_by_nis and data.get('nis'):
        if guests.filter(nis=data['nis']).exists():
            return True, 'Peserta dengan NIS ini sudah mengerjakan ujian.'

    if exam.guest_prevent_duplicate_by_nisn and data.get('nisn'):
        if guests.filter(nisn=data['nisn']).exists():
            return True, 'Peserta dengan NISN ini sudah mengerjakan ujian.'

    if exam.guest_prevent_duplicate_by_email and data.get('email'):
        if guests.filter(email=data['email']).exists():
            return True, 'Peserta dengan email ini sudah mengerjakan ujian.'

    if exam.guest_prevent_duplicate_by_name_class:
        if guests.filter(
            full_name__iexact=data.get('full_name', ''),
            class_name__iexact=data.get('class_name', '')
        ).exists():
            return True, 'Peserta dengan nama dan kelas ini sudah mengerjakan ujian.'

    if exam.guest_prevent_duplicate_by_ip and ip_address:
        if guests.filter(ip_address=ip_address).exists():
            return True, 'Ujian sudah dikerjakan dari alamat IP ini.'

    return False, ''


def get_client_ip(request):
    """Extract client IP address from request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        return x_forwarded_for.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def auto_submit_timed_out_sessions():
    """Auto-submit sessions that have exceeded their time limit."""
    from .models import ExamSession

    timed_out = ExamSession.objects.filter(
        status='in_progress',
        end_time__lt=timezone.now()
    )

    for session in timed_out:
        session.status = 'timed_out'
        session.submitted_at = session.end_time
        session.score = calculate_score(session)
        session.save(update_fields=['status', 'submitted_at', 'score'])
