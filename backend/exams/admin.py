from django.contrib import admin
from .models import (
    Exam, Question, AnswerChoice, GuestParticipant,
    ExamSession, StudentAnswer,
)


class QuestionInline(admin.TabularInline):
    model = Question
    extra = 0
    show_change_link = True


class AnswerChoiceInline(admin.TabularInline):
    model = AnswerChoice
    extra = 4


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'subject', 'teacher', 'access_mode', 'exam_code',
        'start_time', 'end_time', 'is_active',
    ]
    list_filter = ['access_mode', 'is_active', 'subject']
    search_fields = ['title', 'exam_code', 'subject']
    readonly_fields = ['exam_code', 'created_at', 'updated_at']
    inlines = [QuestionInline]

    fieldsets = (
        ('Informasi Umum', {
            'fields': ('title', 'description', 'subject', 'teacher', 'class_target')
        }),
        ('Mode Akses', {
            'fields': (
                'access_mode', 'exam_code', 'public_link_enabled',
                'require_exam_token', 'exam_token',
            )
        }),
        ('Pengaturan Guest', {
            'fields': (
                'guest_allow_retake',
                'guest_prevent_duplicate_by_nis',
                'guest_prevent_duplicate_by_nisn',
                'guest_prevent_duplicate_by_email',
                'guest_prevent_duplicate_by_name_class',
                'guest_prevent_duplicate_by_ip',
            ),
            'classes': ('collapse',),
        }),
        ('Jadwal & Durasi', {
            'fields': ('start_time', 'end_time', 'duration_minutes')
        }),
        ('Pengaturan Ujian', {
            'fields': (
                'shuffle_questions', 'shuffle_answers',
                'show_result', 'max_violations', 'passing_score', 'is_active',
            )
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ['exam', 'order', 'question_type', 'points']
    list_filter = ['exam', 'question_type']
    inlines = [AnswerChoiceInline]


@admin.register(GuestParticipant)
class GuestParticipantAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'nis', 'class_name', 'exam', 'created_at']
    list_filter = ['exam', 'class_name']
    search_fields = ['full_name', 'nis', 'nisn', 'email']
    readonly_fields = ['access_token', 'token_expires_at', 'created_at']


@admin.register(ExamSession)
class ExamSessionAdmin(admin.ModelAdmin):
    list_display = [
        'participant_name', 'exam', 'participant_type',
        'status', 'score', 'violation_count', 'started_at',
    ]
    list_filter = ['status', 'exam']
    readonly_fields = ['id', 'started_at']


@admin.register(StudentAnswer)
class StudentAnswerAdmin(admin.ModelAdmin):
    list_display = ['session', 'question', 'is_correct', 'points_earned']
    list_filter = ['is_correct']
