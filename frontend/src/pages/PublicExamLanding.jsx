import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestApi } from '../api/publicApi';
import { examApi } from '../api/examApi';
import { useAuth } from '../context/AuthContext';
import { Clock, FileText, Users, Calendar, AlertCircle, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function PublicExamLanding() {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tokenModal, setTokenModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');

  useEffect(() => {
    guestApi.getExam(examCode)
      .then(res => setExam(res.data))
      .catch(err => setError(err.response?.data?.error || 'Ujian tidak ditemukan'))
      .finally(() => setLoading(false));
  }, [examCode]);

  const startStudentExam = async (token = null) => {
    try {
      const payload = token ? { exam_token: token } : {};
      const res = await examApi.startExamSession(exam.id, payload);
      navigate(`/student/exam-session/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memulai ujian');
    }
  };

  const handleContinue = () => {
    if (user && user.role === 'student') {
      if (exam.require_exam_token) {
        setTokenModal(true);
      } else {
        startStudentExam();
      }
    } else {
      if (exam.access_mode === 'both') {
        navigate(`/exam/${examCode}/access`);
      } else if (exam.access_mode === 'guest_allowed') {
        navigate(`/exam/${examCode}/guest-form`);
      } else {
        navigate(`/login?redirect=/exam/${examCode}`);
      }
    }
  };

  const submitToken = () => {
    if (!tokenInput.trim()) {
      toast.error('Masukkan token');
      return;
    }
    startStudentExam(tokenInput);
    setTokenModal(false);
    setTokenInput('');
  };

  if (loading) return (
    <div className="public-layout">
      <div className="loading-spinner"><div className="spinner" /></div>
    </div>
  );

  if (error) return (
    <div className="public-layout">
      <div className="public-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😕</div>
        <h2 className="public-title">Ujian Tidak Ditemukan</h2>
        <p className="public-subtitle">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="public-layout">
      <div className="public-card" style={{ maxWidth: 520 }}>
        <div className="public-logo">
          <div className="public-logo-icon">N</div>
          <span className="public-logo-text">NevUjian</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, marginBottom: '0.5rem' }}>{exam.title}</h1>
          <p style={{ color: 'var(--gray-400)', fontSize: '0.9rem' }}>{exam.description || exam.subject}</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {[
            { icon: '📚', label: 'Mata Pelajaran', value: exam.subject },
            { icon: '⏱️', label: 'Durasi', value: `${exam.duration_minutes} menit` },
            { icon: '📝', label: 'Jumlah Soal', value: `${exam.total_questions} soal` },
            { icon: '👨‍🏫', label: 'Guru', value: exam.teacher_name },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '0.75rem', borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{item.icon}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', marginBottom: '0.1rem' }}>{item.label}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.value}</div>
            </div>
          ))}
        </div>

        {/* Status */}
        {exam.is_ongoing ? (
          <div style={{
            padding: '0.75rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)',
            marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#4ade80',
          }}>
            ✅ Ujian sedang berlangsung
          </div>
        ) : exam.is_upcoming ? (
          <div style={{
            padding: '0.75rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
            marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#fbbf24',
          }}>
            ⏳ Ujian belum dimulai — {new Date(exam.start_time).toLocaleString('id')}
          </div>
        ) : (
          <div style={{
            padding: '0.75rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            marginBottom: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#f87171',
          }}>
            ❌ Ujian telah berakhir
          </div>
        )}

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
          onClick={handleContinue} disabled={!exam.is_ongoing}>
          {user && user.role === 'student'
            ? `Mulai Ujian sebagai ${user.first_name || user.username}`
            : exam.access_mode === 'both'
              ? 'Pilih Mode Akses'
              : exam.access_mode === 'guest_allowed'
                ? 'Isi Data Diri'
                : 'Login untuk Mulai'}
        </button>
      </div>

      {/* Token Modal */}
      {tokenModal && (
        <div className="modal-overlay" onClick={() => setTokenModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔑 Token Ujian Diperlukan</h3>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Masukkan token yang diberikan oleh guru untuk memulai ujian <strong>{exam.title}</strong>.
              </p>
              <input className="form-input" placeholder="Masukkan token ujian"
                value={tokenInput} onChange={e => setTokenInput(e.target.value)}
                autoFocus onKeyDown={e => e.key === 'Enter' && submitToken()} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTokenModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={submitToken}>Mulai Ujian</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

