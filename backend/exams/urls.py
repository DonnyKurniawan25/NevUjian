from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ExamViewSet, QuestionViewSet,
    StudentExamListView, StudentExamSessionView,
    StudentExamSessionDetailView, AnswerView,
    SubmitExamView, ViolationView,
    ExportExcelView, ExportPDFView,
    MyExamSessionsView,
    AISettingView, AITestConnectionView,
    AIGenerateQuestionsView, AIGradeEssaysView,
    TeacherExamSessionDetailView, ManualGradeAnswerView,
    ExportSessionPDFView, ExportSessionDocxView,
    ExportQuestionsDocxView,
)

router = DefaultRouter()
router.register(r'exams', ExamViewSet, basename='exams')

urlpatterns = [
    path('', include(router.urls)),

    # Teacher session detail & manual grading
    path('exams/sessions/<uuid:session_id>/', TeacherExamSessionDetailView.as_view(), name='teacher-exam-session-detail'),
    path('exams/sessions/<uuid:session_id>/export-pdf/', ExportSessionPDFView.as_view(), name='export-session-pdf'),
    path('exams/sessions/<uuid:session_id>/export-docx/', ExportSessionDocxView.as_view(), name='export-session-docx'),
    path('exams/answers/<int:answer_id>/grade/', ManualGradeAnswerView.as_view(), name='manual-grade-answer'),

    # AI Integration Settings & Helpers
    path('ai/settings/', AISettingView.as_view(), name='ai-settings'),
    path('ai/settings/test-connection/', AITestConnectionView.as_view(), name='ai-test-connection'),
    path('exams/<int:exam_id>/ai-generate-questions/', AIGenerateQuestionsView.as_view(), name='ai-generate-questions'),
    path('student/exam-sessions/<uuid:session_id>/grade-essays/', AIGradeEssaysView.as_view(), name='ai-grade-essays'),

    # Question management (nested under exam)
    path('exams/<int:exam_id>/questions/',
         QuestionViewSet.as_view({'get': 'list', 'post': 'create'}),
         name='exam-questions'),
    path('exams/<int:exam_id>/questions/<int:pk>/',
         QuestionViewSet.as_view({'get': 'retrieve', 'put': 'update', 'patch': 'partial_update', 'delete': 'destroy'}),
         name='exam-question-detail'),
    path('exams/<int:exam_id>/questions/reorder/',
         QuestionViewSet.as_view({'post': 'reorder'}),
         name='exam-questions-reorder'),
    path('exams/<int:exam_id>/questions/bulk-create/',
         QuestionViewSet.as_view({'post': 'bulk_create'}),
         name='exam-questions-bulk-create'),
    path('exams/<int:exam_id>/questions/import-excel/',
         QuestionViewSet.as_view({'post': 'import_excel'}),
         name='exam-questions-import-excel'),
    path('exams/<int:exam_id>/questions/download-template/',
         QuestionViewSet.as_view({'get': 'download_template'}),
         name='exam-questions-download-template'),
    path('exams/<int:exam_id>/questions/delete-all/',
         QuestionViewSet.as_view({'delete': 'delete_all'}),
         name='exam-questions-delete-all'),
    path('exams/<int:exam_id>/questions/export-word/',
         ExportQuestionsDocxView.as_view(),
         name='exam-questions-export-word'),

    # Export
    path('exams/<int:exam_id>/export/excel/',
         ExportExcelView.as_view(), name='export-excel'),
    path('exams/<int:exam_id>/export/pdf/',
         ExportPDFView.as_view(), name='export-pdf'),

    # Student endpoints
    path('student/exams/', StudentExamListView.as_view(), name='student-exams'),
    path('student/exams/<int:exam_id>/start/',
         StudentExamSessionView.as_view(), name='student-exam-start'),
    path('student/exam-sessions/',
         MyExamSessionsView.as_view(), name='my-exam-sessions'),
    path('student/exam-sessions/<uuid:session_id>/',
         StudentExamSessionDetailView.as_view(), name='student-exam-session-detail'),
    path('student/exam-sessions/<uuid:session_id>/answer/',
         AnswerView.as_view(), name='student-answer'),
    path('student/exam-sessions/<uuid:session_id>/submit/',
         SubmitExamView.as_view(), name='student-submit'),
    path('student/exam-sessions/<uuid:session_id>/violation/',
         ViolationView.as_view(), name='student-violation'),
]

