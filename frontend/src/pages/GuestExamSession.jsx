import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestApi } from '../api/publicApi';
import { useGuest } from '../context/GuestContext';
import { Clock, Send, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Trophy, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GuestExamSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { guestToken, clearGuest } = useGuest();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const intervalRef = useRef(null);
  const hasLeftRef = useRef(false);

  const handlePrintSheet = async () => {
    try {
      setDownloadingPDF(true);
      const res = await guestApi.exportSessionPDF(sessionId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lembar_ujian_${result?.participant_name || 'guest'}.pdf`;
      a.click();
      toast.success('PDF Lembar Ujian berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh PDF');
    } finally {
      setDownloadingPDF(false);
    }
  };

  const handlePrintWord = async () => {
    try {
      setDownloadingDocx(true);
      const res = await guestApi.exportSessionDocx(sessionId);
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `lembar_ujian_${result?.participant_name || 'guest'}.docx`;
      a.click();
      toast.success('Word Lembar Ujian berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh berkas Word');
    } finally {
      setDownloadingDocx(false);
    }
  };



  useEffect(() => {
    if (!guestToken) { navigate('/'); return; }
    guestApi.getSession(sessionId).then(res => {
      setSession(res.data);
      setQuestions(res.data.questions || []);
      setAnswers(res.data.saved_answers || {});
      setTimeLeft(res.data.time_remaining_seconds || 0);
      if (res.data.status !== 'in_progress') {
        setResult(res.data);
      }
    }).catch(() => { toast.error('Sesi tidak ditemukan'); navigate('/'); })
      .finally(() => setLoading(false));
  }, [sessionId, guestToken]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || result) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timeLeft > 0, result]);

  // Tab switch detection (client-side warning only)
  useEffect(() => {
    if (result || !session || session.status !== 'in_progress') return;

    const handleLeave = () => {
      hasLeftRef.current = true;
    };

    const handleReturn = () => {
      if (hasLeftRef.current) {
        hasLeftRef.current = false;
        alert("PERINGATAN: Anda terdeteksi meninggalkan halaman ujian!\nHarap tetap berada di halaman ini sampai ujian selesai.");
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleLeave();
      } else {
        handleReturn();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleLeave);
    window.addEventListener('focus', handleReturn);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleLeave);
      window.removeEventListener('focus', handleReturn);
    };
  }, [session, result]);

  const saveAnswer = async (questionId, choiceId, essayText = '') => {
    setAnswers(prev => ({ ...prev, [questionId]: { selected_choice: choiceId, essay_answer: essayText } }));
    try {
      await guestApi.saveAnswer(sessionId, { question_id: questionId, selected_choice: choiceId, essay_answer: essayText });
    } catch { /* silent */ }
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !confirm('Yakin mengumpulkan ujian?')) return;
    setSubmitting(true);
    try {
      const res = await guestApi.submitExam(sessionId);
      setResult(res.data);
      clearInterval(intervalRef.current);
      toast.success(auto ? 'Waktu habis, ujian dikumpulkan' : 'Ujian berhasil dikumpulkan!');
    } catch { toast.error('Gagal mengumpulkan'); }
    finally { setSubmitting(false); }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  if (loading) return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;

  // Result Screen
  if (result) {
    return (
      <div className="public-layout">
        <div className="public-card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {result.status === 'terminated' ? '🚫' : '🎉'}
          </div>
          <h2 className="public-title">
            {result.status === 'terminated' ? 'Ujian Dihentikan' : 'Ujian Selesai!'}
          </h2>

          <p style={{ color: 'var(--gray-300)', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
            {result.status === 'terminated'
              ? 'Ujian Anda telah dihentikan secara otomatis karena Anda melebihi batas maksimal pelanggaran tab switching.'
              : 'Jawaban Anda telah berhasil dikirim. Nilai Anda akan diperiksa dan dinilai oleh admin atau guru.'}
          </p>

          <div style={{
            padding: '1rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.04)', textAlign: 'left',
            fontSize: '0.82rem', display: 'grid', gap: '0.4rem',
            marginBottom: '1.5rem'
          }}>
            <div className="flex-between"><span style={{ color: 'var(--gray-400)' }}>Ujian</span><span>{result.exam_title}</span></div>
            <div className="flex-between"><span style={{ color: 'var(--gray-400)' }}>Peserta</span><span>{result.participant_name}</span></div>
            <div className="flex-between"><span style={{ color: 'var(--gray-400)' }}>Pelanggaran</span><span>{result.violation_count || 0}</span></div>
            <div className="flex-between"><span style={{ color: 'var(--gray-400)' }}>Status</span>
              <span className={`badge ${result.status === 'terminated' ? 'badge-danger' : 'badge-success'}`} style={{ fontSize: '0.75rem' }}>
                {result.status === 'terminated' ? 'Dihentikan' : 'Selesai'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <button className="btn btn-secondary btn-md" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handlePrintSheet} disabled={downloadingPDF}>
              {downloadingPDF ? (
                <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> PDF...</>
              ) : (
                <><Printer size={14} /> Cetak PDF</>
              )}
            </button>
            <button className="btn btn-secondary btn-md" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              onClick={handlePrintWord} disabled={downloadingDocx}>
              {downloadingDocx ? (
                <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Word...</>
              ) : (
                <><FileText size={14} /> Cetak Word</>
              )}
            </button>
          </div>

          <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
            onClick={() => { clearGuest(); navigate('/'); }}>
            Selesai
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;
  const timerClass = timeLeft > 300 ? 'safe' : timeLeft > 60 ? 'warning' : 'danger';

  return (
    <div className="exam-session-layout">
      <div className="exam-topbar">
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{session?.exam_title}</div>
        <div className={`exam-timer ${timerClass}`}>
          <Clock size={16} /> {formatTime(timeLeft)}
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => handleSubmit(false)} disabled={submitting}>
          <Send size={14} /> Kumpulkan
        </button>
      </div>

      <div className="exam-session-grid">
        <div>
          {q && (
            <div className="question-card slide-up" key={q.id}>
              <div className="flex-between mb-1">
                <span className="badge badge-primary">Soal {currentQ + 1} dari {questions.length}</span>
                <span className="badge badge-gray">{q.points} poin</span>
              </div>
              <div className="question-text">{q.question_text}</div>

              {q.question_type === 'multiple_choice' ? (
                <div>
                  {q.choices?.map(choice => (
                    <div key={choice.id}
                      className={`choice-option ${answers[q.id]?.selected_choice === choice.id ? 'selected' : ''}`}
                      onClick={() => saveAnswer(q.id, choice.id)}>
                      <div className="choice-radio" />
                      <div className="choice-text">{choice.choice_text}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <textarea className="form-textarea" rows={6}
                  placeholder="Tulis jawaban di sini..."
                  value={answers[q.id]?.essay_answer || ''}
                  onChange={e => saveAnswer(q.id, null, e.target.value)} />
              )}

              <div className="flex-between mt-2">
                <button className="btn btn-secondary" disabled={currentQ === 0}
                  onClick={() => setCurrentQ(currentQ - 1)}>
                  <ChevronLeft size={16} /> Sebelumnya
                </button>
                <button className="btn btn-primary" disabled={currentQ === questions.length - 1}
                  onClick={() => setCurrentQ(currentQ + 1)}>
                  Selanjutnya <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ position: 'sticky', top: 72 }}>
            <div className="card-header">
              <span className="card-title" style={{ fontSize: '0.85rem' }}>Navigasi Soal</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {answeredCount}/{questions.length}
              </span>
            </div>
            <div className="question-nav">
              {questions.map((qq, i) => (
                <button key={qq.id}
                  className={`question-nav-btn ${i === currentQ ? 'active' : ''} ${answers[qq.id] ? 'answered' : ''}`}
                  onClick={() => setCurrentQ(i)}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
