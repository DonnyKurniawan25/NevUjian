from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User, StudentProfile


class StudentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentProfile
        fields = ['id', 'nis', 'nisn', 'class_name', 'gender', 'phone']


class UserSerializer(serializers.ModelSerializer):
    student_profile = StudentProfileSerializer(read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'full_name', 'role', 'phone', 'avatar', 'student_profile',
                  'is_active', 'date_joined']
        read_only_fields = ['id', 'date_joined']

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data['username'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Username atau password salah.')
        if not user.is_active:
            raise serializers.ValidationError('Akun tidak aktif.')
        data['user'] = user
        return data


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True)
    nis = serializers.CharField(required=False, allow_blank=True)
    nisn = serializers.CharField(required=False, allow_blank=True)
    class_name = serializers.CharField(required=False, allow_blank=True)
    gender = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'password', 'password_confirm', 'role', 'phone',
                  'nis', 'nisn', 'class_name', 'gender']

    def validate(self, data):
        if data['password'] != data.pop('password_confirm'):
            raise serializers.ValidationError({'password_confirm': 'Password tidak cocok.'})
        return data

    def create(self, validated_data):
        nis = validated_data.pop('nis', '')
        nisn = validated_data.pop('nisn', '')
        class_name = validated_data.pop('class_name', '')
        gender = validated_data.pop('gender', '')

        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data, password=password)

        if user.role == 'student' and nis:
            StudentProfile.objects.create(
                user=user,
                nis=nis,
                nisn=nisn,
                class_name=class_name,
                gender=gender,
            )

        return user


class StudentCreateSerializer(serializers.ModelSerializer):
    """Serializer for admin/teacher to create student accounts."""
    password = serializers.CharField(write_only=True, min_length=6)
    nis = serializers.CharField()
    nisn = serializers.CharField(required=False, allow_blank=True)
    class_name = serializers.CharField()
    gender = serializers.CharField(required=False, allow_blank=True)
    student_phone = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'password', 'phone', 'nis', 'nisn', 'class_name',
                  'gender', 'student_phone']

    def create(self, validated_data):
        nis = validated_data.pop('nis')
        nisn = validated_data.pop('nisn', '')
        class_name = validated_data.pop('class_name')
        gender = validated_data.pop('gender', '')
        student_phone = validated_data.pop('student_phone', '')
        password = validated_data.pop('password')

        user = User.objects.create_user(
            **validated_data,
            password=password,
            role='student'
        )

        StudentProfile.objects.create(
            user=user,
            nis=nis,
            nisn=nisn,
            class_name=class_name,
            gender=gender,
            phone=student_phone,
        )

        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Password lama salah.')
        return value
