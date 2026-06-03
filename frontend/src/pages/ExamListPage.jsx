import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../api/examApi';
import { Plus, Search, FileText, Settings, BarChart3, Copy, ExternalLink, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamListPage() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    examApi.getExams({ search }).then(res => {
      const data = res.data.results || res.data;
      setExams(Array.isArray(data) ? data : []);
    }).catch(() => toast.error('Gagal memuat ujian'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search]);

  const copyLink = (code) => {
    navigator.clipboard.writeText(`${window.location.origin}/exam/${code}`);
    toast.success('Link ujian disalin!');
  };

  const handleDelete = async (id) => {
    if (!confirm('Yakin hapus ujian ini?')) return;
    try {
      await examApi.deleteExam(id);
      toast.success('Ujian dihapus');
      load();
    } catch { toast.error('Gagal menghapus'); }
  };

  return (
    <div className="slide-up">
      <div className="flex-between mb-2">
        <div style={{ position: 'relative', width: 300 }}>
          <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="form-input" placeholder="Cari ujian..."
            style={{ paddingLeft: '2.25rem' }}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/exams/create')}>
          <Plus size={16} /> Buat Ujian
        </button>
      </div>

      {loading ? (
        <div className="loading-spinner"><div className="spinner" /></div>
      ) : exams.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><FileText size={28} /></div>
            <div className="empty-state-title">Belum ada ujian</div>
            <div className="empty-state-text">Klik "Buat Ujian" untuk membuat ujian baru</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {exams.map(exam => (
            <div key={exam.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div className="flex-between">
                <div style={{ flex: 1 }}>
                  <div className="flex" style={{ gap: '0.5rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{exam.title}</h3>
                    <span className={`badge ${exam.access_mode === 'login_required' ? 'badge-primary' : exam.access_mode === 'guest_allowed' ? 'badge-success' : 'badge-warning'}`}>
                      {exam.access_mode === 'login_required' ? '🔒 Login' : exam.access_mode === 'guest_allowed' ? '🌐 Guest' : '🔄 Both'}
                    </span>
                    <span className={`badge ${exam.is_ongoing ? 'badge-success' : exam.is_upcoming ? 'badge-warning' : 'badge-gray'}`}>
                      {exam.is_ongoing ? 'Berlangsung' : exam.is_upcoming ? 'Akan Datang' : 'Selesai'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <span>📚 {exam.subject}</span>
                    <span>🏫 {exam.class_target}</span>
                    <span>📝 {exam.total_questions} soal</span>
                    <span>👥 {exam.session_count || 0} peserta</span>
                    <span>🔑 {exam.exam_code}</span>
                  </div>
                </div>
                <div className="flex" style={{ gap: '0.35rem' }}>
                  {exam.public_link_enabled && (
                    <button className="btn btn-ghost btn-icon" title="Salin Link" onClick={() => copyLink(exam.exam_code)}>
                      <Copy size={15} />
                    </button>
                  )}
                  <button className="btn btn-ghost btn-icon" title="Kelola Soal"
                    onClick={() => navigate(`/exams/${exam.id}/questions`)}>
                    <Settings size={15} />
                  </button>
                  <button className="btn btn-ghost btn-icon" title="Hasil Ujian"
                    onClick={() => navigate(`/exams/${exam.id}/results`)}>
                    <BarChart3 size={15} />
                  </button>
                  <button className="btn btn-ghost btn-icon" title="Edit"
                    onClick={() => navigate(`/exams/${exam.id}/edit`)}>
                    <FileText size={15} />
                  </button>
                  <button className="btn btn-ghost btn-icon" title="Hapus" style={{ color: 'var(--danger-500)' }}
                    onClick={() => handleDelete(exam.id)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
