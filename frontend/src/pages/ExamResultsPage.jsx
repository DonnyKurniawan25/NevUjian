import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../api/examApi';
import { ArrowLeft, Download, FileSpreadsheet, FileText, Users, UserCheck, Globe, Sparkles, X, Check, AlertCircle, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [gradingAI, setGradingAI] = useState(false);

  const loadSessionDetail = async (sessionId) => {
    try {
      setDetailLoading(true);
      const res = await examApi.getTeacherExamSession(sessionId);
      setSessionDetail(res.data);
    } catch {
      toast.error('Gagal memuat detail sesi');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSessionId) {
      loadSessionDetail(selectedSessionId);
    } else {
      setSessionDetail(null);
    }
  }, [selectedSessionId]);

  const handleGradeEssaysAI = async (sessionId) => {
    try {
      setGradingAI(true);
      const res = await examApi.gradeEssaysAI(sessionId);
      if (res.data.success) {
        toast.success(`Berhasil menilai ${res.data.graded_count} jawaban essay.`);
      } else {
        toast.warning(`Selesai menilai dengan beberapa error: ${res.data.errors.join(', ')}`);
      }
      loadSessionDetail(sessionId);
      const resultsRes = await examApi.getResults(id, filter !== 'all' ? { type: filter } : {});
      setData(resultsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal melakukan penilaian essay AI.');
      console.error(err);
    } finally {
      setGradingAI(false);
    }
  };

  useEffect(() => {
    examApi.getResults(id, filter !== 'all' ? { type: filter } : {})
      .then(res => setData(res.data))
      .catch(() => toast.error('Gagal memuat hasil'))
      .finally(() => setLoading(false));
  }, [id, filter]);

  const handleExportExcel = async () => {
    try {
      const res = await examApi.exportExcel(id);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url; a.download = `hasil_ujian.xlsx`; a.click();
      toast.success('Excel berhasil diunduh');
    } catch { toast.error('Gagal export Excel'); }
  };

  const handleExportPDF = async () => {
    try {
      const res = await examApi.exportPDF(id);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url; a.download = `hasil_ujian.pdf`; a.click();
      toast.success('PDF berhasil diunduh');
    } catch { toast.error('Gagal export PDF'); }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return null;

  const { exam, results, summary } = data;

  return (
    <div className="slide-up">
      <div className="flex-between mb-2">
        <button className="btn btn-ghost" onClick={() => navigate('/exams')}><ArrowLeft size={16} /> Kembali</button>
        <div className="flex gap-1">
          <button className="btn btn-success btn-sm" onClick={handleExportExcel}>
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button className="btn btn-danger btn-sm" onClick={handleExportPDF}>
            <FileText size={14} /> Export PDF
          </button>
        </div>
      </div>

      {/* Exam Info */}
      <div className="card mb-2">
        <div className="card-body" style={{ padding: '1rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.3rem' }}>{exam.title}</h2>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span>📚 {exam.subject}</span>
            <span>🏫 {exam.class_target}</span>
            <span>📝 {exam.total_questions} soal</span>
            <span className={`badge ${exam.access_mode === 'login_required' ? 'badge-primary' : exam.access_mode === 'guest_allowed' ? 'badge-success' : 'badge-warning'}`}>
              {exam.access_mode === 'login_required' ? '🔒 Login' : exam.access_mode === 'guest_allowed' ? '🌐 Guest' : '🔄 Both'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-500)' }}><Users size={20} /></div>
          <div className="stat-card-value">{summary.total_participants}</div>
          <div className="stat-card-label">Total Peserta</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--success-50)', color: 'var(--success-500)' }}><UserCheck size={20} /></div>
          <div className="stat-card-value">{summary.login_participants}</div>
          <div className="stat-card-label">Siswa Login</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-500)' }}><Globe size={20} /></div>
          <div className="stat-card-value">{summary.guest_participants}</div>
          <div className="stat-card-label">Peserta Guest</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-500)' }}><FileText size={20} /></div>
          <div className="stat-card-value">{summary.average_score?.toFixed(1) || '0'}</div>
          <div className="stat-card-label">Rata-rata Nilai</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="card">
        <div className="card-header">
          <div className="tabs" style={{ borderBottom: 'none', marginBottom: 0 }}>
            {[
              { key: 'all', label: 'Semua', icon: Users },
              { key: 'login', label: 'Siswa Login', icon: UserCheck },
              { key: 'guest', label: 'Peserta Guest', icon: Globe },
            ].map(t => (
              <button key={t.key} className={`tab ${filter === t.key ? 'active' : ''}`}
                onClick={() => setFilter(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {results.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">Belum ada peserta</div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>No</th>
                    <th>Nama Peserta</th>
                    <th>NIS</th>
                    <th>NISN</th>
                    <th>Kelas</th>
                    <th>Tipe Peserta</th>
                    <th>Nilai</th>
                    <th>Status</th>
                    <th>Waktu Mulai</th>
                    <th>Waktu Selesai</th>
                    <th>Pelanggaran</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.session_id} onClick={() => setSelectedSessionId(r.session_id)} style={{ cursor: 'pointer' }} title="Klik untuk lihat detail jawaban">
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.participant_name}</td>
                      <td>{r.nis || '-'}</td>
                      <td>{r.nisn || '-'}</td>
                      <td>{r.class_name || '-'}</td>
                      <td>
                        <span className={`badge ${r.participant_type === 'Siswa Login' ? 'badge-primary' : 'badge-success'}`}>
                          {r.participant_type}
                        </span>
                      </td>
                      <td style={{ fontWeight: 700, color: parseFloat(r.score) >= 70 ? 'var(--success-600)' : 'var(--danger-500)' }}>
                        {r.score != null ? parseFloat(r.score).toFixed(1) : '-'}
                      </td>
                      <td>
                        <span className={`badge ${r.status === 'submitted' ? 'badge-success' : r.status === 'in_progress' ? 'badge-warning' : r.status === 'timed_out' ? 'badge-gray' : 'badge-danger'}`}>
                          {r.status_display}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.78rem' }}>{r.started_at ? new Date(r.started_at).toLocaleString('id') : '-'}</td>
                      <td style={{ fontSize: '0.78rem' }}>{r.submitted_at ? new Date(r.submitted_at).toLocaleString('id') : '-'}</td>
                      <td>
                        <span className={r.violation_count > 0 ? 'badge badge-danger' : ''}>
                          {r.violation_count}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      {selectedSessionId && (
        <div className="modal-overlay" onClick={() => setSelectedSessionId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 800, width: '95%' }}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Detail Jawaban Sesi Ujian</h3>
                {sessionDetail && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {sessionDetail.participant_name} ({sessionDetail.guest_nis || sessionDetail.student_nis || '-'}) • Kelas {sessionDetail.guest_class || sessionDetail.student_class || '-'}
                  </p>
                )}
              </div>
              <button className="btn-icon btn-ghost btn-sm" onClick={() => setSelectedSessionId(null)}>
                <X size={18} />
              </button>
            </div>
            
            <div className="modal-body" style={{ minHeight: '200px' }}>
              {detailLoading ? (
                <div className="flex-center" style={{ minHeight: '180px', flexDirection: 'column', gap: '1rem' }}>
                  <div className="spinner" />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Memuat detail jawaban...</p>
                </div>
              ) : sessionDetail ? (
                <div>
                  {/* Session Overview */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem',
                    marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Nilai Akhir:</span>
                      <div style={{ fontSize: '1.5rem', fontWeight: 800, color: parseFloat(sessionDetail.score) >= 70 ? 'var(--success-600)' : 'var(--danger-500)' }}>
                        {sessionDetail.score != null ? parseFloat(sessionDetail.score).toFixed(1) : '-'}
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Status:</span>
                      <div>
                        <span className={`badge ${sessionDetail.status === 'submitted' ? 'badge-success' : sessionDetail.status === 'in_progress' ? 'badge-warning' : 'badge-gray'}`} style={{ marginTop: '0.25rem' }}>
                          {sessionDetail.status === 'submitted' ? 'Telah Dikumpulkan' : sessionDetail.status === 'in_progress' ? 'Sedang Berlangsung' : 'Selesai'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pelanggaran:</span>
                      <div style={{ fontWeight: 600, color: sessionDetail.violation_count > 0 ? 'var(--danger-500)' : 'var(--text-primary)' }}>
                        {sessionDetail.violation_count} kali
                      </div>
                    </div>
                    {sessionDetail.answers?.some(a => a.question_type === 'essay') && (
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Aksi AI:</span>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          onClick={() => handleGradeEssaysAI(sessionDetail.id)}
                          disabled={gradingAI}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%', marginTop: '0.25rem',
                            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))', fontSize: '0.78rem', padding: '0.4rem 0.5rem'
                          }}
                        >
                          {gradingAI ? (
                            <>
                              <div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5, marginRight: '0.15rem' }} />
                              Menilai...
                            </>
                          ) : (
                            <>
                              <Sparkles size={12} />
                              Koreksi Essay AI
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Answers List */}
                  <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <BookOpen size={16} className="text-primary" /> Daftar Jawaban Peserta
                  </h4>
                  <div style={{ display: 'grid', gap: '1rem', maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
                    {sessionDetail.answers?.map((ans, idx) => (
                      <div key={ans.id} className="card" style={{ padding: '1rem', border: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span className="badge badge-gray" style={{ fontWeight: 700 }}>Soal {ans.question_order || (idx + 1)}</span>
                          <div className="flex gap-1" style={{ alignItems: 'center' }}>
                            <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>
                              {ans.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Essay'}
                            </span>
                            <span className={`badge ${ans.points_earned > 0 ? 'badge-success' : 'badge-danger'}`}>
                              {parseFloat(ans.points_earned)} / {ans.question_points || '-'} Poin
                            </span>
                          </div>
                        </div>

                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                          {ans.question_text}
                        </p>

                        {/* Answer Details based on question type */}
                        {ans.question_type === 'multiple_choice' ? (
                          <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jawaban Siswa:</div>
                            <div style={{
                              display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem',
                              fontSize: '0.85rem', fontWeight: 600,
                              color: ans.is_correct ? 'var(--success-600)' : 'var(--danger-500)'
                            }}>
                              {ans.is_correct ? <Check size={16} /> : <X size={16} />}
                              {ans.selected_choice_text || '(Tidak menjawab)'}
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gap: '0.75rem' }}>
                            <div style={{ background: 'var(--bg-secondary)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                              <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Jawaban Siswa:</span>
                              <p style={{ fontSize: '0.82rem', marginTop: '0.25rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                                {ans.essay_answer || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>(Tidak menjawab)</span>}
                              </p>
                            </div>

                            {ans.ai_feedback && (
                              <div style={{
                                padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.06)',
                                borderLeft: '3px solid var(--primary-400)', borderRadius: '0 var(--radius-md) var(--radius-md) 0'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--primary-600)', fontSize: '0.78rem', fontWeight: 700 }}>
                                  <Sparkles size={12} /> Analisis & Feedback AI
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.25rem', lineHeight: 1.5 }}>
                                  {ans.ai_feedback}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Gagal memuat detail jawaban</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedSessionId(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
