from django.urls import path
from .views import (
    PublicExamDetailView,
    ValidateTokenView,
    GuestRegisterView,
    GuestStartExamView,
    GuestExamSessionDetailView,
    GuestAnswerView,
    GuestSubmitExamView,
    GuestViolationView,
)

urlpatterns = [
    # Public exam endpoints
    path('exams/<str:exam_code>/',
         PublicExamDetailView.as_view(), name='public-exam-detail'),
    path('exams/<str:exam_code>/validate-token/',
         ValidateTokenView.as_view(), name='public-validate-token'),
    path('exams/<str:exam_code>/guest-register/',
         GuestRegisterView.as_view(), name='public-guest-register'),
    path('exams/<str:exam_code>/start/',
         GuestStartExamView.as_view(), name='public-guest-start'),

    # Guest exam session endpoints
    path('exam-sessions/<uuid:session_id>/',
         GuestExamSessionDetailView.as_view(), name='public-exam-session'),
    path('exam-sessions/<uuid:session_id>/answer/',
         GuestAnswerView.as_view(), name='public-guest-answer'),
    path('exam-sessions/<uuid:session_id>/submit/',
         GuestSubmitExamView.as_view(), name='public-guest-submit'),
    path('exam-sessions/<uuid:session_id>/violation/',
         GuestViolationView.as_view(), name='public-guest-violation'),
]
