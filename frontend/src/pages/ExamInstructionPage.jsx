import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestApi } from '../api/publicApi';
import { useGuest } from '../context/GuestContext';
import { Play, Clock, AlertTriangle, FileText, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamInstructionPage() {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const { guestInfo, guestToken, saveSessionId } = useGuest();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!guestToken) { navigate(`/exam/${examCode}/guest-form`); return; }
    guestApi.getExam(examCode).then(res => setExam(res.data)).catch(() => navigate(`/exam/${examCode}`));
  }, [examCode, guestToken]);

  const handleStart = async () => {
    setLoading(true);
    try {
      const res = await guestApi.startExam(examCode);
      saveSessionId(res.data.id);
      navigate(`/guest/exam-session/${res.data.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal memulai ujian');
    } finally { setLoading(false); }
  };

  if (!exam) return <div className="public-layout"><div className="loading-spinner"><div className="spinner" /></div></div>;

  return (
    <div className="public-layout">
      <div className="public-card" style={{ maxWidth: 540 }}>
        <div className="public-logo">
          <div className="public-logo-icon">N</div>
          <span className="public-logo-text">NevUjian</span>
        </div>

        <h2 className="public-title">Instruksi Ujian</h2>
        <p className="public-subtitle">Halo, {guestInfo?.full_name || 'Peserta'}! Baca instruksi sebelum memulai.</p>

        <div style={{
          padding: '1.25rem', borderRadius: 'var(--radius-md)',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>📋 {exam.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.82rem' }}>
            <div>📚 {exam.subject}</div>
            <div>📝 {exam.total_questions} soal</div>
            <div>⏱️ {exam.duration_minutes} menit</div>
            <div>🛡️ Mode Anti-Curang Aktif</div>
          </div>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.75rem' }}>📌 Peraturan Ujian:</h4>
          <ul style={{ fontSize: '0.82rem', color: 'var(--gray-300)', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <li>Pastikan koneksi internet Anda stabil.</li>
            <li>Dilarang keras berpindah tab atau membuka aplikasi lain selama ujian.</li>
            <li>Jika Anda membuka tab baru/pindah halaman, sistem akan memblokir aktivitas Anda dengan peringatan keras.</li>
            <li>Jawaban akan tersimpan otomatis setiap kali Anda memilih jawaban.</li>
            <li>Saat waktu habis, ujian akan otomatis dikumpulkan.</li>
            <li>Setelah mengumpulkan, jawaban tidak bisa diubah.</li>
          </ul>
        </div>

        <div style={{
          padding: '0.75rem', borderRadius: 'var(--radius-md)',
          background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)',
          marginBottom: '1.5rem', fontSize: '0.82rem', color: '#fbbf24',
          display: 'flex', gap: '0.5rem', alignItems: 'flex-start',
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
          <span>Dengan menekan tombol "Mulai Ujian", Anda menyetujui peraturan di atas dan waktu ujian akan langsung berjalan.</span>
        </div>

        <button className="btn btn-primary btn-lg" style={{ width: '100%' }}
          onClick={handleStart} disabled={loading}>
          {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Play size={18} /> Mulai Ujian</>}
        </button>
      </div>
    </div>
  );
}
