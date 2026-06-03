from rest_framework import permissions
from django.utils import timezone
from exams.models import GuestParticipant


class GuestTokenPermission(permissions.BasePermission):
    """
    Permission class for guest exam sessions.
    Validates the temporary access token sent in the Authorization header.
    Format: Guest <access_token>
    """
    message = 'Token akses guest tidak valid atau sudah kadaluarsa.'

    def has_permission(self, request, view):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')

        if not auth_header.startswith('Guest '):
            return False

        token = auth_header[6:]  # Remove 'Guest ' prefix

        try:
            guest = GuestParticipant.objects.select_related('exam').get(
                access_token=token
            )
        except GuestParticipant.DoesNotExist:
            return False

        # Check token expiry
        if not guest.is_token_valid:
            return False

        # Attach guest to request for use in views
        request.guest_participant = guest
        return True
