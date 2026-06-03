from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, StudentProfile


class StudentProfileInline(admin.StackedInline):
    model = StudentProfile
    can_delete = False
    verbose_name_plural = 'Profil Siswa'


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'is_active']
    list_filter = ['role', 'is_active', 'is_staff']
    search_fields = ['username', 'email', 'first_name', 'last_name']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Info Tambahan', {'fields': ('role', 'phone', 'avatar')}),
    )

    def get_inlines(self, request, obj=None):
        if obj and obj.role == 'student':
            return [StudentProfileInline]
        return []


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'nis', 'nisn', 'class_name', 'gender']
    list_filter = ['class_name', 'gender']
    search_fields = ['user__first_name', 'user__last_name', 'nis', 'nisn']
