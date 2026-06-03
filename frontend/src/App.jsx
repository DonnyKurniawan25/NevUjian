import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { GuestProvider } from './context/GuestContext';

// Layouts
import DashboardLayout from './components/DashboardLayout';

// Auth Pages
import LoginPage from './pages/LoginPage';

// Admin/Teacher Pages
import DashboardPage from './pages/DashboardPage';
import ExamListPage from './pages/ExamListPage';
import ExamFormPage from './pages/ExamFormPage';
import ExamQuestionsPage from './pages/ExamQuestionsPage';
import ExamResultsPage from './pages/ExamResultsPage';
import AISettingsPage from './pages/AISettingsPage';

// Student Pages
import StudentDashboard from './pages/StudentDashboard';
import StudentExamSession from './pages/StudentExamSession';

// Public/Guest Pages
import PublicExamLanding from './pages/PublicExamLanding';
import PublicAccessChoice from './pages/PublicAccessChoice';
import GuestFormPage from './pages/GuestFormPage';
import ExamInstructionPage from './pages/ExamInstructionPage';
import GuestExamSession from './pages/GuestExamSession';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading-spinner"><div className="spinner" /></div>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={
        user ? <Navigate to={user.role === 'student' ? '/student/dashboard' : '/dashboard'} replace /> : <LoginPage />
      } />

      {/* Admin/Teacher Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['admin', 'teacher']}>
          <DashboardLayout><DashboardPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/exams" element={
        <ProtectedRoute roles={['admin', 'teacher']}>
          <DashboardLayout><ExamListPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/exams/create" element={
        <ProtectedRoute roles={['admin', 'teacher']}>
          <DashboardLayout><ExamFormPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/exams/:id/edit" element={
        <ProtectedRoute roles={['admin', 'teacher']}>
          <DashboardLayout><ExamFormPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/exams/:id/questions" element={
        <ProtectedRoute roles={['admin', 'teacher']}>
          <DashboardLayout><ExamQuestionsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/exams/:id/results" element={
        <ProtectedRoute roles={['admin', 'teacher']}>
          <DashboardLayout><ExamResultsPage /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/settings/ai" element={
        <ProtectedRoute roles={['admin', 'teacher']}>
          <DashboardLayout><AISettingsPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <ProtectedRoute roles={['student']}>
          <DashboardLayout><StudentDashboard /></DashboardLayout>
        </ProtectedRoute>
      } />
      <Route path="/student/exam-session/:sessionId" element={
        <ProtectedRoute roles={['student']}>
          <StudentExamSession />
        </ProtectedRoute>
      } />

      {/* Public/Guest Routes */}
      <Route path="/exam/:examCode" element={<PublicExamLanding />} />
      <Route path="/exam/:examCode/access" element={<PublicAccessChoice />} />
      <Route path="/exam/:examCode/guest-form" element={<GuestFormPage />} />
      <Route path="/exam/:examCode/instruction" element={<ExamInstructionPage />} />
      <Route path="/guest/exam-session/:sessionId" element={<GuestExamSession />} />

      {/* Default redirect */}
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'student' ? '/student/dashboard' : '/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GuestProvider>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.875rem',
                borderRadius: '10px',
                padding: '12px 16px',
              },
            }}
          />
        </GuestProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
