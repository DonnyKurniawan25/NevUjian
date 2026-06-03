from django.db import models
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import StudentProfile
from .serializers import (
    UserSerializer, LoginSerializer, RegisterSerializer,
    StudentCreateSerializer, ChangePasswordSerializer,
    StudentProfileSerializer,
)

User = get_user_model()


class IsAdminOrTeacher(permissions.BasePermission):
    """Only admin or teacher can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'teacher')


class LoginView(generics.GenericAPIView):
    """Login endpoint - returns JWT tokens."""
    serializer_class = LoginSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': UserSerializer(user).data,
        })


class RegisterView(generics.CreateAPIView):
    """Register a new user."""
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        refresh = RefreshToken.for_user(user)

        return Response({
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            },
            'user': UserSerializer(user).data,
        }, status=status.HTTP_201_CREATED)


class ProfileView(generics.RetrieveUpdateAPIView):
    """Get or update current user profile."""
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class ChangePasswordView(generics.GenericAPIView):
    """Change password for authenticated user."""
    serializer_class = ChangePasswordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return Response({'detail': 'Password berhasil diubah.'})


class StudentViewSet(viewsets.ModelViewSet):
    """CRUD for student accounts - admin/teacher only."""
    permission_classes = [IsAdminOrTeacher]

    def get_serializer_class(self):
        if self.action == 'create':
            return StudentCreateSerializer
        return UserSerializer

    def get_queryset(self):
        queryset = User.objects.filter(role='student').select_related('student_profile')
        class_name = self.request.query_params.get('class_name')
        search = self.request.query_params.get('search')

        if class_name:
            queryset = queryset.filter(student_profile__class_name=class_name)
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(username__icontains=search) |
                models.Q(student_profile__nis__icontains=search)
            )
        return queryset

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()

    @action(detail=False, methods=['get'])
    def classes(self, request):
        """Get list of all class names."""
        classes = StudentProfile.objects.values_list(
            'class_name', flat=True
        ).distinct().order_by('class_name')
        return Response(list(classes))
