import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../api/examApi';
import {
  ArrowLeft, Download, FileSpreadsheet, FileText, Users, UserCheck, Globe,
  Sparkles, X, Check, AlertCircle, BookOpen, Trash2, Eye, PenLine, Save,
  Printer, Award, ClipboardCheck, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  // Detail/Sheet modal
  const [sheetSessionId, setSheetSessionId] = useState(null);
  const [sessionDetail, setSessionDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Grading states
  const [gradingAI, setGradingAI] = useState(false);
  const [gradingSingleAI, setGradingSingleAI] = useState({});
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editPoints, setEditPoints] = useState('');
  const [editFeedback, setEditFeedback] = useState('');
  const [savingManual, setSavingManual] = useState(false);

  // Delete confirm
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const loadResults = useCallback(async () => {
    try {
      const res = await examApi.getResults(id, filter !== 'all' ? { type: filter } : {});
      setData(res.data);
    } catch {
      toast.error('Gagal memuat hasil');
    } finally {
      setLoading(false);
    }
  }, [id, filter]);

  useEffect(() => { loadResults(); }, [loadResults]);

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
    if (sheetSessionId) {
      loadSessionDetail(sheetSessionId);
    } else {
      setSessionDetail(null);
      setEditingAnswerId(null);
    }
  }, [sheetSessionId]);

  // --- Delete Participant ---
  const handleDelete = async (sessionId) => {
    try {
      setDeleting(true);
      await examApi.deleteSession(sessionId);
      toast.success('Peserta berhasil dihapus.');
      setDeleteConfirmId(null);
      if (sheetSessionId === sessionId) setSheetSessionId(null);
      loadResults();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus peserta.');
    } finally {
      setDeleting(false);
    }
  };

  // --- AI Essay Grading ---
  const handleGradeEssaysAI = async (sessionId) => {
    try {
      setGradingAI(true);
      const res = await examApi.gradeEssaysAI(sessionId);
      if (res.data.success) {
        toast.success(`Berhasil menilai ${res.data.graded_count} jawaban essay.`);
      } else {
        toast.error(`Selesai dengan error: ${res.data.errors?.join(', ')}`);
      }
      loadSessionDetail(sessionId);
      loadResults();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal melakukan penilaian essay AI.');
    } finally {
      setGradingAI(false);
    }
  };

  const handleGradeSingleEssayAI = async (answerId) => {
    try {
      setGradingSingleAI(prev => ({ ...prev, [answerId]: true }));
      const res = await examApi.gradeSingleEssayAI(answerId);
      if (res.data.success) {
        toast.success('Jawaban essay berhasil dinilai oleh AI.');
      } else {
        toast.error('AI gagal menilai jawaban.');
      }
      loadSessionDetail(sheetSessionId);
      loadResults();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal melakukan penilaian essay AI.');
    } finally {
      setGradingSingleAI(prev => ({ ...prev, [answerId]: false }));
    }
  };

  // --- Manual Essay Grading ---
  const startEditAnswer = (ans) => {
    setEditingAnswerId(ans.id);
    setEditPoints(parseFloat(ans.points_earned || 0).toString());
    setEditFeedback('');
  };

  const cancelEdit = () => {
    setEditingAnswerId(null);
    setEditPoints('');
    setEditFeedback('');
  };

  const handleSaveManualGrade = async (answerId) => {
    try {
      setSavingManual(true);
      const res = await examApi.manualGradeAnswer(answerId, {
        points_earned: parseFloat(editPoints),
        feedback: editFeedback,
      });
      toast.success('Nilai berhasil disimpan.');
      cancelEdit();
      // Refresh session detail with new score
      loadSessionDetail(sheetSessionId);
      loadResults();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan nilai.');
    } finally {
      setSavingManual(false);
    }
  };

  // --- Exports ---
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

  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const handlePrintSheet = async (sessionId) => {
    try {
      setDownloadingPDF(true);
      const res = await examApi.exportSessionPDF(sessionId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lembar_ujian_${sessionDetail?.participant_name || sessionId}.pdf`;
      a.click();
      toast.success('PDF Lembar Ujian berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const handlePrintWord = async (sessionId) => {
    try {
      setDownloadingDocx(true);
      const res = await examApi.exportSessionDocx(sessionId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lembar_ujian_${sessionDetail?.participant_name || sessionId}.docx`;
      a.click();
      toast.success('Word Lembar Ujian berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh berkas Word');
    } finally {
      setDownloadingDocx(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;
  if (!data) return null;

  const { exam, results, summary } = data;

  // Count essay questions in session detail
  const hasEssay = sessionDetail?.answers?.some(a => a.question_type === 'essay');
  const totalEarned = sessionDetail?.answers?.reduce((sum, a) => sum + parseFloat(a.points_earned || 0), 0) || 0;
  const totalMax = sessionDetail?.answers?.reduce((sum, a) => sum + (a.question_points || 0), 0) || 0;

  return (
    <div className="slide-up">
      {/* Top Bar */}
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
          <div className="stat-card-icon" style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-500)' }}><Award size={20} /></div>
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
                    <th className="hide-mobile">NIS</th>
                    <th>Kelas</th>
                    <th className="hide-mobile">Tipe</th>
                    <th>Nilai</th>
                    <th>Status</th>
                    <th className="hide-mobile">Waktu Mulai</th>
                    <th style={{ textAlign: 'center' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => (
                    <tr key={r.session_id}>
                      <td>{i + 1}</td>
                      <td style={{ fontWeight: 600 }}>{r.participant_name}</td>
                      <td className="hide-mobile">{r.nis || '-'}</td>
                      <td>{r.class_name || '-'}</td>
                      <td className="hide-mobile">
                        <span className={`badge ${r.participant_type === 'Siswa Login' ? 'badge-primary' : 'badge-success'}`}>
                          {r.participant_type === 'Siswa Login' ? 'Login' : 'Guest'}
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
                      <td className="hide-mobile" style={{ fontSize: '0.78rem' }}>{r.started_at ? new Date(r.started_at).toLocaleString('id') : '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.35rem', justifyContent: 'center' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => setSheetSessionId(r.session_id)}
                            title="Lihat Lembar Ujian"
                            style={{ padding: '0.3rem 0.5rem', fontSize: '0.72rem' }}
                          >
                            <Eye size={13} /> Lihat
                          </button>
                          {deleteConfirmId === r.session_id ? (
                            <div style={{ display: 'flex', gap: '0.2rem' }}>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDelete(r.session_id)}
                                disabled={deleting}
                                style={{ padding: '0.3rem 0.45rem', fontSize: '0.72rem' }}
                              >
                                {deleting ? '...' : <><Check size={12} /> Ya</>}
                              </button>
                              <button
                                className="btn btn-ghost btn-sm"
                                onClick={() => setDeleteConfirmId(null)}
                                style={{ padding: '0.3rem 0.45rem', fontSize: '0.72rem' }}
                              >
                                Batal
                              </button>
                            </div>
                          ) : (
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(r.session_id); }}
                              title="Hapus Peserta"
                              style={{ padding: '0.3rem 0.45rem', fontSize: '0.72rem' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ======================== EXAM SHEET MODAL ======================== */}
      {sheetSessionId && (
        <div className="modal-overlay" onClick={() => setSheetSessionId(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="modal-header">
              <div style={{ flex: 1 }}>
                <h3 className="modal-title">
                  <ClipboardCheck size={20} className="text-primary" /> Lembar Hasil Ujian
                </h3>
                {sessionDetail && (
                  <p className="text-sm text-secondary mt-1">
                    {sessionDetail.participant_name} • {sessionDetail.guest_nis || sessionDetail.student_nis || '-'} • Kelas {sessionDetail.guest_class || sessionDetail.student_class || '-'}
                  </p>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {sessionDetail && hasEssay && (
                  <button
                    className="btn btn-sm btn-ai"
                    onClick={() => handleGradeEssaysAI(sessionDetail.id)}
                    disabled={gradingAI}
                  >
                    {gradingAI ? (
                      <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Menilai...</>
                    ) : (
                      <><Sparkles size={13} /> Koreksi Essay AI</>
                    )}
                  </button>
                )}
                {sessionDetail && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handlePrintSheet(sessionDetail.id)}
                    disabled={downloadingPDF}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {downloadingPDF ? (
                      <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Mengunduh...</>
                    ) : (
                      <><Printer size={13} /> Cetak PDF</>
                    )}
                  </button>
                )}
                {sessionDetail && (
                  <button
                    className="btn btn-sm btn-secondary"
                    onClick={() => handlePrintWord(sessionDetail.id)}
                    disabled={downloadingDocx}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {downloadingDocx ? (
                      <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Mengunduh...</>
                    ) : (
                      <><FileText size={13} /> Cetak Word</>
                    )}
                  </button>
                )}
                <button className="btn-icon btn-ghost btn-sm" onClick={() => setSheetSessionId(null)}>
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="modal-body">
              {detailLoading ? (
                <div className="flex-center" style={{ minHeight: '200px', flexDirection: 'column', gap: '1rem' }}>
                  <div className="spinner" />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Memuat lembar ujian...</p>
                </div>
              ) : sessionDetail ? (
                <div>
                  {/* ===== EXAM SHEET HEADER ===== */}
                  <div className="exam-sheet-card">
                    <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                        {exam.title}
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                        {exam.subject} • Kelas {exam.class_target}
                      </p>
                    </div>

                    <div className="exam-sheet-grid">
                      <div className="sheet-stat-box">
                        <div className="label">Nama Peserta</div>
                        <div className="value">{sessionDetail.participant_name}</div>
                      </div>
                      <div className="sheet-stat-box">
                        <div className="label">NIS</div>
                        <div className="value">{sessionDetail.guest_nis || sessionDetail.student_nis || '-'}</div>
                      </div>
                      <div className="sheet-stat-box">
                        <div className="label">Kelas</div>
                        <div className="value">{sessionDetail.guest_class || sessionDetail.student_class || '-'}</div>
                      </div>
                      <div className={`sheet-stat-box ${parseFloat(sessionDetail.score) >= 70 ? 'success' : 'danger'}`}>
                        <div className="label">Nilai Akhir</div>
                        <div className="value">{sessionDetail.score != null ? parseFloat(sessionDetail.score).toFixed(1) : '-'}</div>
                      </div>
                    </div>

                    {/* Score breakdown bar */}
                    <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        Poin: {totalEarned.toFixed(1)} / {totalMax}
                      </span>
                      <div style={{ flex: 1, height: 8, background: 'var(--bg-tertiary)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          width: totalMax > 0 ? `${(totalEarned / totalMax) * 100}%` : '0%',
                          height: '100%',
                          background: parseFloat(sessionDetail.score) >= 70
                            ? 'linear-gradient(90deg, var(--success-400), var(--success-500))'
                            : 'linear-gradient(90deg, var(--danger-400), var(--danger-500))',
                          borderRadius: 99,
                          transition: 'width 0.5s ease',
                        }} />
                      </div>
                      <span className={`badge ${sessionDetail.status === 'submitted' ? 'badge-success' : sessionDetail.status === 'in_progress' ? 'badge-warning' : 'badge-gray'}`} style={{ fontSize: '0.7rem' }}>
                        {sessionDetail.status === 'submitted' ? 'Dikumpulkan' : sessionDetail.status === 'in_progress' ? 'Berlangsung' : sessionDetail.status === 'timed_out' ? 'Waktu Habis' : 'Dihentikan'}
                      </span>
                    </div>
                  </div>

                  {/* ===== ANSWERS LIST ===== */}
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {sessionDetail.answers?.map((ans, idx) => {
                      const isEditing = editingAnswerId === ans.id;
                      const isEssay = ans.question_type === 'essay';
                      const ptsEarned = parseFloat(ans.points_earned || 0);
                      const ptsMax = ans.question_points || 0;
                      const pctColor = ptsMax > 0 && ptsEarned >= ptsMax * 0.5 ? 'var(--success-600)' : 'var(--danger-500)';

                      return (
                        <div key={ans.id} style={{
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-lg)',
                          background: 'var(--bg-primary)',
                          overflow: 'hidden',
                        }}>
                          {/* Question header bar */}
                          <div style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '0.6rem 1rem',
                            background: isEssay ? 'rgba(139,92,246,0.06)' : 'rgba(99,102,241,0.04)',
                            borderBottom: '1px solid var(--border-color)',
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                width: 28, height: 28, borderRadius: '50%', fontSize: '0.78rem', fontWeight: 800,
                                background: 'var(--primary-500)', color: '#fff',
                              }}>
                                {ans.question_order || (idx + 1)}
                              </span>
                              <span className="badge badge-gray" style={{ textTransform: 'capitalize', fontSize: '0.7rem' }}>
                                {isEssay ? '📝 Essay' : '📋 Pilihan Ganda'}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: pctColor }}>
                                {ptsEarned} / {ptsMax}
                              </span>
                              {isEssay && !isEditing && (
                                <div style={{ display: 'flex', gap: '0.3rem' }}>
                                  <button
                                    className="btn btn-ai btn-sm"
                                    onClick={() => handleGradeSingleEssayAI(ans.id)}
                                    disabled={gradingSingleAI[ans.id]}
                                    title="Koreksi dengan AI"
                                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                                  >
                                    {gradingSingleAI[ans.id] ? (
                                      <div className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} />
                                    ) : (
                                      <Sparkles size={13} />
                                    )}
                                    <span>AI</span>
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => startEditAnswer(ans)}
                                    title="Periksa Manual"
                                    style={{ padding: '0.2rem 0.4rem', fontSize: '0.72rem' }}
                                  >
                                    <PenLine size={13} /> Periksa
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Question body */}
                          <div style={{ padding: '0.85rem 1rem' }}>
                            <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.6rem', lineHeight: 1.55 }}>
                              {ans.question_text}
                            </p>

                            {/* MC Answer */}
                            {!isEssay && (
                              <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 0.85rem',
                                background: ans.is_correct ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)',
                                border: `1px solid ${ans.is_correct ? 'var(--success-200)' : 'var(--danger-200)'}`,
                                borderRadius: 'var(--radius-md)',
                              }}>
                                <div style={{
                                  width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  background: ans.is_correct ? 'var(--success-500)' : 'var(--danger-500)', color: '#fff', flexShrink: 0,
                                }}>
                                  {ans.is_correct ? <Check size={13} /> : <X size={13} />}
                                </div>
                                <span style={{ fontSize: '0.84rem', fontWeight: 600, color: ans.is_correct ? 'var(--success-700)' : 'var(--danger-600)' }}>
                                  {ans.selected_choice_text || <em style={{ color: 'var(--text-tertiary)' }}>(Tidak menjawab)</em>}
                                </span>
                              </div>
                            )}

                            {/* Essay Answer */}
                            {isEssay && (
                              <div style={{ display: 'grid', gap: '0.6rem' }}>
                                <div style={{
                                  background: 'var(--bg-secondary)', padding: '0.75rem',
                                  borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
                                }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.3px' }}>Jawaban Siswa</span>
                                  <p style={{ fontSize: '0.84rem', marginTop: '0.3rem', whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                                    {ans.essay_answer || <span style={{ fontStyle: 'italic', color: 'var(--text-tertiary)' }}>(Tidak menjawab)</span>}
                                  </p>
                                </div>

                                {/* AI Feedback */}
                                {ans.ai_feedback && !isEditing && (
                                  <div style={{
                                    padding: '0.65rem 0.85rem',
                                    background: ans.ai_feedback.startsWith('[Manual]')
                                      ? 'rgba(245,158,11,0.06)'
                                      : 'rgba(99,102,241,0.06)',
                                    borderLeft: `3px solid ${ans.ai_feedback.startsWith('[Manual]') ? 'var(--warning-400)' : 'var(--primary-400)'}`,
                                    borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', fontWeight: 700, color: ans.ai_feedback.startsWith('[Manual]') ? 'var(--warning-600)' : 'var(--primary-600)' }}>
                                      {ans.ai_feedback.startsWith('[Manual]') ? <><PenLine size={12} /> Koreksi Manual</> : <><Sparkles size={12} /> Feedback AI</>}
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.5 }}>
                                      {ans.ai_feedback.replace('[Manual] ', '')}
                                    </p>
                                  </div>
                                )}

                                {/* Manual Grading Form */}
                                {isEditing && (
                                  <div className="grading-box">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.6rem' }}>
                                      <PenLine size={14} style={{ color: 'var(--warning-600)' }} />
                                      <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--warning-700)' }}>Periksa Manual</span>
                                    </div>
                                    <div className="grading-form-grid">
                                      <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Poin (maks {ptsMax})</label>
                                        <input
                                          type="number"
                                          className="form-input"
                                          value={editPoints}
                                          onChange={e => setEditPoints(e.target.value)}
                                          min={0}
                                          max={ptsMax}
                                          step="0.5"
                                          style={{ padding: '0.4rem 0.5rem', fontSize: '0.9rem', fontWeight: 700, marginTop: '0.2rem' }}
                                        />
                                      </div>
                                      <div>
                                        <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Catatan / Feedback (opsional)</label>
                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="Masukkan catatan penilaian..."
                                          value={editFeedback}
                                          onChange={e => setEditFeedback(e.target.value)}
                                          style={{ padding: '0.4rem 0.5rem', fontSize: '0.82rem', marginTop: '0.2rem' }}
                                        />
                                      </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.6rem', justifyContent: 'flex-end' }}>
                                      <button className="btn btn-ghost btn-sm" onClick={cancelEdit} style={{ fontSize: '0.75rem' }}>
                                        <RotateCcw size={12} /> Batal
                                      </button>
                                      <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => handleSaveManualGrade(ans.id)}
                                        disabled={savingManual}
                                        style={{ fontSize: '0.75rem', background: 'var(--warning-500)', borderColor: 'var(--warning-500)' }}
                                      >
                                        {savingManual ? (
                                          <><div className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5 }} /> Menyimpan...</>
                                        ) : (
                                          <><Save size={12} /> Simpan Nilai</>
                                        )}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <p>Gagal memuat detail jawaban</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer" style={{ borderTop: '2px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {sessionDetail && `${sessionDetail.answers?.length || 0} soal dijawab`}
              </div>
              <button className="btn btn-secondary" onClick={() => setSheetSessionId(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
