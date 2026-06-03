import uuid
import secrets
import string
from django.db import models
from django.conf import settings
from django.utils import timezone


class Exam(models.Model):
    """Model ujian dengan dukungan mode akses siswa."""
    ACCESS_MODE_CHOICES = [
        ('login_required', 'Login Siswa'),
        ('guest_allowed', 'Tanpa Login (Guest)'),
        ('both', 'Keduanya'),
    ]

    # Basic Info
    title = models.CharField(max_length=255, verbose_name='Judul Ujian')
    description = models.TextField(blank=True, verbose_name='Deskripsi')
    subject = models.CharField(max_length=100, verbose_name='Mata Pelajaran')
    teacher = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='exams',
        verbose_name='Guru'
    )
    class_target = models.CharField(max_length=255, verbose_name='Kelas Target', blank=True,
                                     help_text='Kelas yang bisa mengikuti ujian, pisahkan dengan koma')

    # Access Mode
    access_mode = models.CharField(
        max_length=20,
        choices=ACCESS_MODE_CHOICES,
        default='login_required',
        verbose_name='Mode Akses'
    )
    exam_code = models.CharField(
        max_length=20,
        unique=True,
        verbose_name='Kode Ujian',
        help_text='Kode unik untuk link publik'
    )
    public_link_enabled = models.BooleanField(default=False, verbose_name='Link Publik Aktif')
    require_exam_token = models.BooleanField(default=False, verbose_name='Memerlukan Token Ujian')
    exam_token = models.CharField(max_length=50, blank=True, verbose_name='Token Ujian')

    # Guest Settings
    guest_allow_retake = models.BooleanField(
        default=False, verbose_name='Guest Boleh Mengulang'
    )
    guest_prevent_duplicate_by_nis = models.BooleanField(
        default=True, verbose_name='Cegah Duplikat NIS'
    )
    guest_prevent_duplicate_by_nisn = models.BooleanField(
        default=False, verbose_name='Cegah Duplikat NISN'
    )
    guest_prevent_duplicate_by_email = models.BooleanField(
        default=False, verbose_name='Cegah Duplikat Email'
    )
    guest_prevent_duplicate_by_name_class = models.BooleanField(
        default=False, verbose_name='Cegah Duplikat Nama+Kelas'
    )
    guest_prevent_duplicate_by_ip = models.BooleanField(
        default=False, verbose_name='Cegah Duplikat IP'
    )

    # Schedule & Duration
    start_time = models.DateTimeField(verbose_name='Waktu Mulai')
    end_time = models.DateTimeField(verbose_name='Waktu Selesai')
    duration_minutes = models.PositiveIntegerField(verbose_name='Durasi (menit)')

    # Exam Settings
    shuffle_questions = models.BooleanField(default=False, verbose_name='Acak Soal')
    shuffle_answers = models.BooleanField(default=False, verbose_name='Acak Jawaban')
    show_result = models.BooleanField(default=True, verbose_name='Tampilkan Hasil')
    max_violations = models.PositiveIntegerField(default=3, verbose_name='Maksimal Pelanggaran')
    passing_score = models.DecimalField(
        max_digits=5, decimal_places=2, default=70,
        verbose_name='Nilai Minimal Lulus'
    )
    is_active = models.BooleanField(default=True, verbose_name='Aktif')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'exams'
        verbose_name = 'Ujian'
        verbose_name_plural = 'Ujian'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.exam_code})"

    def save(self, *args, **kwargs):
        if not self.exam_code:
            self.exam_code = self._generate_exam_code()
        super().save(*args, **kwargs)

    @staticmethod
    def _generate_exam_code():
        """Generate unique 8-character exam code."""
        chars = string.ascii_uppercase + string.digits
        while True:
            code = ''.join(secrets.choice(chars) for _ in range(8))
            if not Exam.objects.filter(exam_code=code).exists():
                return code

    @property
    def is_ongoing(self):
        now = timezone.now()
        return self.start_time <= now <= self.end_time and self.is_active

    @property
    def is_upcoming(self):
        return timezone.now() < self.start_time

    @property
    def is_ended(self):
        return timezone.now() > self.end_time

    @property
    def total_questions(self):
        return self.questions.count()

    @property
    def total_points(self):
        return self.questions.aggregate(total=models.Sum('points'))['total'] or 0

    @property
    def allows_guest(self):
        return self.access_mode in ('guest_allowed', 'both')

    @property
    def requires_login(self):
        return self.access_mode in ('login_required', 'both')


class Question(models.Model):
    """Model soal ujian."""
    TYPE_CHOICES = [
        ('multiple_choice', 'Pilihan Ganda'),
        ('essay', 'Essay'),
    ]

    exam = models.ForeignKey(Exam, related_name='questions', on_delete=models.CASCADE)
    question_text = models.TextField(verbose_name='Teks Soal')
    question_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES, default='multiple_choice',
        verbose_name='Tipe Soal'
    )
    points = models.PositiveIntegerField(default=1, verbose_name='Poin')
    order = models.PositiveIntegerField(default=0, verbose_name='Urutan')
    image = models.ImageField(upload_to='questions/', null=True, blank=True, verbose_name='Gambar')
    explanation = models.TextField(blank=True, verbose_name='Pembahasan')

    class Meta:
        db_table = 'questions'
        verbose_name = 'Soal'
        verbose_name_plural = 'Soal'
        ordering = ['order']

    def __str__(self):
        return f"Soal {self.order} - {self.exam.title}"


class AnswerChoice(models.Model):
    """Model pilihan jawaban."""
    question = models.ForeignKey(Question, related_name='choices', on_delete=models.CASCADE)
    choice_text = models.CharField(max_length=500, verbose_name='Teks Pilihan')
    is_correct = models.BooleanField(default=False, verbose_name='Jawaban Benar')
    order = models.PositiveIntegerField(default=0, verbose_name='Urutan')

    class Meta:
        db_table = 'answer_choices'
        verbose_name = 'Pilihan Jawaban'
        verbose_name_plural = 'Pilihan Jawaban'
        ordering = ['order']

    def __str__(self):
        return f"{self.choice_text} ({'✓' if self.is_correct else '✗'})"


class GuestParticipant(models.Model):
    """Model peserta tanpa login (guest)."""
    GENDER_CHOICES = [
        ('L', 'Laki-laki'),
        ('P', 'Perempuan'),
    ]

    exam = models.ForeignKey(
        Exam, related_name='guest_participants', on_delete=models.CASCADE
    )
    full_name = models.CharField(max_length=255, verbose_name='Nama Lengkap')
    nis = models.CharField(max_length=50, verbose_name='NIS')
    nisn = models.CharField(max_length=50, blank=True, verbose_name='NISN')
    class_name = models.CharField(max_length=50, verbose_name='Kelas')
    gender = models.CharField(
        max_length=1, choices=GENDER_CHOICES, blank=True, verbose_name='Jenis Kelamin'
    )
    phone = models.CharField(max_length=20, blank=True, verbose_name='Nomor HP')
    email = models.EmailField(blank=True, verbose_name='Email')
    token_used = models.CharField(max_length=50, blank=True, verbose_name='Token Digunakan')
    ip_address = models.GenericIPAddressField(null=True, blank=True, verbose_name='Alamat IP')
    user_agent = models.TextField(blank=True, verbose_name='User Agent')

    # Temporary access token for guest session
    access_token = models.CharField(
        max_length=255, unique=True, verbose_name='Token Akses',
        help_text='Token sementara untuk mengakses sesi ujian'
    )
    token_expires_at = models.DateTimeField(verbose_name='Token Kadaluarsa')

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'guest_participants'
        verbose_name = 'Peserta Guest'
        verbose_name_plural = 'Peserta Guest'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} ({self.nis}) - {self.exam.title}"

    @property
    def is_token_valid(self):
        return timezone.now() < self.token_expires_at

    def save(self, *args, **kwargs):
        if not self.access_token:
            self.access_token = secrets.token_urlsafe(48)
        if not self.token_expires_at:
            # Token valid for the duration of the exam + 1 hour buffer
            self.token_expires_at = self.exam.end_time + timezone.timedelta(hours=1)
        super().save(*args, **kwargs)


class ExamSession(models.Model):
    """Model sesi ujian - support siswa login dan guest."""
    STATUS_CHOICES = [
        ('in_progress', 'Sedang Berlangsung'),
        ('submitted', 'Telah Dikumpulkan'),
        ('timed_out', 'Waktu Habis'),
        ('terminated', 'Dihentikan'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    exam = models.ForeignKey(Exam, related_name='sessions', on_delete=models.CASCADE)

    # Participant - either student (login) or guest
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='exam_sessions',
        verbose_name='Siswa (Login)'
    )
    guest_participant = models.ForeignKey(
        GuestParticipant,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='exam_sessions',
        verbose_name='Peserta Guest'
    )

    started_at = models.DateTimeField(auto_now_add=True, verbose_name='Waktu Mulai')
    end_time = models.DateTimeField(verbose_name='Batas Waktu')
    submitted_at = models.DateTimeField(
        null=True, blank=True, verbose_name='Waktu Submit'
    )
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default='in_progress',
        verbose_name='Status'
    )
    score = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        verbose_name='Nilai'
    )
    violation_count = models.PositiveIntegerField(
        default=0, verbose_name='Jumlah Pelanggaran'
    )
    ip_address = models.GenericIPAddressField(
        null=True, blank=True, verbose_name='Alamat IP'
    )
    user_agent = models.TextField(blank=True, verbose_name='User Agent')

    class Meta:
        db_table = 'exam_sessions'
        verbose_name = 'Sesi Ujian'
        verbose_name_plural = 'Sesi Ujian'
        ordering = ['-started_at']
        constraints = [
            models.CheckConstraint(
                check=~models.Q(student__isnull=True, guest_participant__isnull=True),
                name='session_must_have_participant'
            )
        ]

    def __str__(self):
        participant = self.participant_name
        return f"{participant} - {self.exam.title} ({self.get_status_display()})"

    @property
    def participant_name(self):
        if self.student:
            return self.student.get_full_name() or self.student.username
        elif self.guest_participant:
            return self.guest_participant.full_name
        return 'Unknown'

    @property
    def participant_type(self):
        if self.student:
            return 'login'
        return 'guest'

    @property
    def is_timed_out(self):
        return timezone.now() > self.end_time and self.status == 'in_progress'

    @property
    def time_remaining_seconds(self):
        if self.status != 'in_progress':
            return 0
        remaining = (self.end_time - timezone.now()).total_seconds()
        return max(0, int(remaining))


class StudentAnswer(models.Model):
    """Model jawaban siswa (login & guest)."""
    session = models.ForeignKey(
        ExamSession, related_name='answers', on_delete=models.CASCADE
    )
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_choice = models.ForeignKey(
        AnswerChoice, null=True, blank=True,
        on_delete=models.SET_NULL, verbose_name='Pilihan Jawaban'
    )
    essay_answer = models.TextField(blank=True, verbose_name='Jawaban Essay')
    is_correct = models.BooleanField(null=True, verbose_name='Benar')
    points_earned = models.DecimalField(
        max_digits=5, decimal_places=2, default=0,
        verbose_name='Poin Didapat'
    )
    ai_feedback = models.TextField(blank=True, null=True, verbose_name='Feedback AI')
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_answers'
        verbose_name = 'Jawaban Siswa'
        verbose_name_plural = 'Jawaban Siswa'
        unique_together = ['session', 'question']

    def __str__(self):
        return f"Jawaban {self.session.participant_name} - Soal {self.question.order}"


class AISetting(models.Model):
    """Singleton model for global AI configuration settings."""
    PROVIDER_CHOICES = [
        ('9router', '9Router (lokal)'),
        ('openrouter', 'OpenRouter'),
        ('openai', 'OpenAI'),
        ('custom', 'Custom (OpenAI-compatible)'),
    ]

    provider = models.CharField(max_length=50, choices=PROVIDER_CHOICES, default='custom', verbose_name='Provider')
    is_active = models.BooleanField(default=False, verbose_name='Aktifkan AI')
    base_url = models.CharField(max_length=255, default='https://api.xiaomimimo.com/v1', blank=True, verbose_name='Base URL')
    model_name = models.CharField(max_length=100, default='mimo-v2.5-pro', blank=True, verbose_name='Model')
    timeout = models.PositiveIntegerField(default=120, verbose_name='Timeout (detik)')
    temperature = models.FloatField(default=0.4, verbose_name='Temperature')
    max_tokens = models.PositiveIntegerField(default=8000, verbose_name='Max Tokens')
    api_key = models.CharField(max_length=255, blank=True, verbose_name='API Key')
    
    last_checked = models.DateTimeField(null=True, blank=True, verbose_name='Terakhir Dicek')
    last_status = models.TextField(blank=True, verbose_name='Status Terakhir')
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='ai_settings_updated',
        verbose_name='Diubah Oleh'
    )
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'ai_settings'
        verbose_name = 'Pengaturan AI'
        verbose_name_plural = 'Pengaturan AI'

    def __str__(self):
        return f"AI Settings ({self.get_provider_display()} - {'Aktif' if self.is_active else 'Nonaktif'})"

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
