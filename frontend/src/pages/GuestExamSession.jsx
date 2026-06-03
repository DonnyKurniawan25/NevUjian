import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestApi } from '../api/publicApi';
import { useGuest } from '../context/GuestContext';
import { Clock, Send, ChevronLeft, ChevronRight, AlertTriangle, CheckCircle, Trophy } from 'lucide-react';
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
  const intervalRef = useRef(null);

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

  // Tab switch detection
  useEffect(() => {
    if (result) return;
    const handler = () => {
      if (document.hidden && session?.status === 'in_progress') {
        alert("PERINGATAN: Anda tidak diperbolehkan membuka tab baru atau meninggalkan halaman ujian! Halaman akan kembali ke soal.");
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
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
    const score = parseFloat(result.score) || 0;
    const passed = score >= (parseFloat(result.passing_score) || 70);
    return (
      <div className="public-layout">
        <div className="public-card" style={{ maxWidth: 480, textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>
            {result.status === 'terminated' ? '🚫' : passed ? '🎉' : '📊'}
          </div>
          <h2 className="public-title">
            {result.status === 'terminated' ? 'Ujian Dihentikan' : 'Ujian Selesai!'}
          </h2>

          {result.score != null && (
            <div style={{
              margin: '1.5rem auto', width: 140, height: 140,
              borderRadius: '50%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: passed
                ? 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))'
                : 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))',
              border: `3px solid ${passed ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}`,
            }}>
              <div style={{ fontSize: '2.25rem', fontWeight: 800, color: passed ? '#4ade80' : '#f87171' }}>
                {score.toFixed(0)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--gray-400)' }}>dari 100</div>
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <span className={`badge ${passed ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
              {passed ? '✅ LULUS' : '❌ TIDAK LULUS'}
            </span>
          </div>

          <div style={{
            padding: '1rem', borderRadius: 'var(--radius-md)',
            background: 'rgba(255,255,255,0.04)', textAlign: 'left',
            fontSize: '0.82rem', display: 'grid', gap: '0.4rem',
          }}>
            <div className="flex-between"><span style={{ color: 'var(--gray-400)' }}>Ujian</span><span>{result.exam_title}</span></div>
            <div className="flex-between"><span style={{ color: 'var(--gray-400)' }}>Peserta</span><span>{result.participant_name}</span></div>
            <div className="flex-between"><span style={{ color: 'var(--gray-400)' }}>Pelanggaran</span><span>{result.violation_count || 0}</span></div>
          </div>

          <button className="btn btn-primary btn-lg mt-2" style={{ width: '100%' }}
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: '1rem', padding: '1rem', maxWidth: 1200, margin: '0 auto' }}>
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
