from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with role support."""
    ROLE_CHOICES = [
        ('admin', 'Admin'),
        ('teacher', 'Guru'),
        ('student', 'Siswa'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)

    class Meta:
        db_table = 'users'
        verbose_name = 'Pengguna'
        verbose_name_plural = 'Pengguna'

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.get_role_display()})"

    @property
    def is_admin_or_teacher(self):
        return self.role in ('admin', 'teacher')


class StudentProfile(models.Model):
    """Extended profile for student users."""
    GENDER_CHOICES = [
        ('L', 'Laki-laki'),
        ('P', 'Perempuan'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='student_profile')
    nis = models.CharField(max_length=50, unique=True, verbose_name='NIS')
    nisn = models.CharField(max_length=50, blank=True, verbose_name='NISN')
    class_name = models.CharField(max_length=50, verbose_name='Kelas')
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    phone = models.CharField(max_length=20, blank=True)

    class Meta:
        db_table = 'student_profiles'
        verbose_name = 'Profil Siswa'
        verbose_name_plural = 'Profil Siswa'

    def __str__(self):
        return f"{self.user.get_full_name()} - {self.nis} ({self.class_name})"
