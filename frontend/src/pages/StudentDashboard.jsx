import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { examApi } from '../api/examApi';
import { Play, Clock, CheckCircle, FileText, Lock, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exams, setExams] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenModal, setTokenModal] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingDocxId, setDownloadingDocxId] = useState(null);

  const handlePrintSheet = async (sessionId, examTitle) => {
    try {
      setDownloadingId(sessionId);
      const res = await examApi.exportSessionPDF(sessionId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lembar_ujian_${examTitle.replace(/\s+/g, '_')}.pdf`;
      a.click();
      toast.success('PDF Lembar Ujian berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh PDF');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePrintWord = async (sessionId, examTitle) => {
    try {
      setDownloadingDocxId(sessionId);
      const res = await examApi.exportSessionDocx(sessionId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lembar_ujian_${examTitle.replace(/\s+/g, '_')}.docx`;
      a.click();
      toast.success('Word Lembar Ujian berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh berkas Word');
    } finally {
      setDownloadingDocxId(null);
    }
  };

  useEffect(() => {
    Promise.all([
      examApi.getStudentExams().then(r => r.data.results || r.data).catch(() => []),
      examApi.getMyExamSessions().then(r => r.data.results || r.data).catch(() => []),
    ]).then(([e, s]) => {
      setExams(Array.isArray(e) ? e : []);
      setSessions(Array.isArray(s) ? s : []);
    }).finally(() => setLoading(false));
  }, []);

  const startExam = async (examId, token = null) => {
    try {
      const payload = token ? { exam_token: token } : {};
      const res = await examApi.startExamSession(examId, payload);
      navigate(`/student/exam-session/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memulai ujian');
    }
  };

  const handleStart = (exam) => {
    if (exam.require_exam_token) {
      setTokenModal(exam);
    } else {
      startExam(exam.id);
    }
  };

  const submitToken = () => {
    if (!tokenInput.trim()) { toast.error('Masukkan token'); return; }
    startExam(tokenModal.id, tokenInput);
    setTokenModal(null);
    setTokenInput('');
  };

  const hasSession = (examId) => sessions.find(s => s.exam === examId);

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="slide-up">
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Selamat datang, {user?.first_name || user?.username}! 👋</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          {user?.student_profile?.class_name ? `Kelas ${user.student_profile.class_name}` : 'Dashboard Siswa'}
        </p>
      </div>

      {/* Active Exams */}
      <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>📝 Ujian Tersedia</h3>
      {exams.filter(e => e.is_ongoing).length === 0 ? (
        <div className="card mb-2">
          <div className="empty-state" style={{ padding: '2rem' }}>
            <div className="empty-state-title">Tidak ada ujian aktif</div>
            <div className="empty-state-text">Ujian akan muncul saat guru mengaktifkannya</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '0.75rem', marginBottom: '1.5rem' }}>
          {exams.filter(e => e.is_ongoing).map(exam => {
            const session = hasSession(exam.id);
            return (
              <div key={exam.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
                <div className="flex-between">
                  <div>
                    <h4 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>{exam.title}</h4>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                      <span>📚 {exam.subject}</span>
                      <span>📝 {exam.total_questions} soal</span>
                      <span>⏱️ {exam.duration_minutes} menit</span>
                      {exam.require_exam_token && <span className="badge badge-warning"><Lock size={10} /> Token Diperlukan</span>}
                    </div>
                  </div>
                  {session?.status === 'in_progress' ? (
                    <button className="btn btn-warning" onClick={() => navigate(`/student/exam-session/${session.id}`)}>
                      <Play size={16} /> Lanjutkan
                    </button>
                  ) : session?.status === 'submitted' || session?.status === 'timed_out' ? (
                    <span className="badge badge-success" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
                      <CheckCircle size={14} /> Selesai
                    </span>
                  ) : (
                    <button className="btn btn-primary" onClick={() => handleStart(exam)}>
                      <Play size={16} /> Mulai Ujian
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Exam History */}
      {sessions.length > 0 && (
        <>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem' }}>📊 Riwayat Ujian</h3>
          <div className="card">
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Ujian</th>
                    <th>Status</th>
                    <th>Pelanggaran</th>
                    <th>Waktu</th>
                    <th className="text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 600 }}>{s.exam_title}</td>
                      <td>
                        <span className={`badge ${s.status === 'submitted' ? 'badge-success' : s.status === 'in_progress' ? 'badge-warning' : 'badge-danger'}`}>
                          {s.status === 'submitted' ? 'Selesai' : s.status === 'in_progress' ? 'Berlangsung' : s.status === 'timed_out' ? 'Waktu Habis' : 'Dihentikan'}
                        </span>
                      </td>
                      <td>{s.violation_count}</td>
                      <td style={{ fontSize: '0.78rem' }}>{new Date(s.started_at).toLocaleString('id')}</td>
                      <td className="text-center">
                        {s.status !== 'in_progress' && (
                          <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePrintSheet(s.id, s.exam_title)}
                              disabled={downloadingId === s.id}
                              style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              {downloadingId === s.id ? (
                                <><div className="spinner" style={{ width: 10, height: 10, borderWidth: 1 }} /> Cetak</>
                              ) : (
                                <><Printer size={12} /> Cetak PDF</>
                              )}
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handlePrintWord(s.id, s.exam_title)}
                              disabled={downloadingDocxId === s.id}
                              style={{ padding: '0.25rem 0.5rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              {downloadingDocxId === s.id ? (
                                <><div className="spinner" style={{ width: 10, height: 10, borderWidth: 1 }} /> Cetak</>
                              ) : (
                                <><FileText size={12} /> Cetak Word</>
                              )}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Token Modal */}
      {tokenModal && (
        <div className="modal-overlay" onClick={() => setTokenModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🔑 Token Ujian Diperlukan</h3>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Masukkan token yang diberikan oleh guru untuk memulai ujian <strong>{tokenModal.title}</strong>.
              </p>
              <input className="form-input" placeholder="Masukkan token ujian"
                value={tokenInput} onChange={e => setTokenInput(e.target.value)}
                autoFocus onKeyDown={e => e.key === 'Enter' && submitToken()} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setTokenModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={submitToken}>Mulai Ujian</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
