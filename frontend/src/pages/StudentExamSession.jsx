import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../api/examApi';
import { Clock, Send, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

export default function StudentExamSession() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const intervalRef = useRef(null);
  const hasLeftRef = useRef(false);

  const load = async () => {
    try {
      const res = await examApi.getExamSession(sessionId);
      setSession(res.data);
      setQuestions(res.data.questions || []);
      setAnswers(res.data.saved_answers || {});
      setTimeLeft(res.data.time_remaining_seconds || 0);

      if (res.data.status !== 'in_progress') {
        toast.error('Sesi ujian sudah berakhir');
        navigate('/student/dashboard');
      }
    } catch { toast.error('Gagal memuat sesi ujian'); navigate('/student/dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [sessionId]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(intervalRef.current); handleSubmit(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [timeLeft > 0]);

  // Tab switch detection (client-side warning only)
  useEffect(() => {
    if (!session || session.status !== 'in_progress') return;

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
  }, [session]);

  const saveAnswer = async (questionId, choiceId, essayText = '') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { selected_choice: choiceId, essay_answer: essayText }
    }));
    try {
      await examApi.saveAnswer(sessionId, {
        question_id: questionId,
        selected_choice: choiceId,
        essay_answer: essayText,
      });
    } catch { /* silently fail, answers are saved locally */ }
  };

  const handleSubmit = async (auto = false) => {
    if (!auto && !confirm('Yakin ingin mengumpulkan ujian? Jawaban tidak bisa diubah lagi.')) return;
    setSubmitting(true);
    try {
      await examApi.submitExam(sessionId);
      toast.success(auto ? 'Waktu habis, ujian otomatis dikumpulkan' : 'Ujian berhasil dikumpulkan!');
      navigate('/student/dashboard');
    } catch { toast.error('Gagal mengumpulkan ujian'); }
    finally { setSubmitting(false); }
  };

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const timerClass = timeLeft > 300 ? 'safe' : timeLeft > 60 ? 'warning' : 'danger';

  if (loading) return <div className="loading-spinner" style={{ minHeight: '100vh' }}><div className="spinner" /></div>;
  if (!session) return null;

  const q = questions[currentQ];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="exam-session-layout">
      {/* Top Bar */}
      <div className="exam-topbar">
        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{session.exam_title}</div>
        <div className={`exam-timer ${timerClass}`}>
          <Clock size={16} /> {formatTime(timeLeft)}
        </div>
        <button className="btn btn-danger btn-sm" onClick={() => handleSubmit(false)} disabled={submitting}>
          <Send size={14} /> Kumpulkan
        </button>
      </div>

      <div className="exam-session-grid">
        {/* Question Area */}
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
                  placeholder="Tulis jawaban Anda di sini..."
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

        {/* Question Navigation */}
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
