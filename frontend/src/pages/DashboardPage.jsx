import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { examApi } from '../api/examApi';
import { FileText, Users, Clock, TrendingUp, CheckCircle, AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ exams: 0, active: 0, sessions: 0 });
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    examApi.getExams().then(res => {
      const data = res.data.results || res.data;
      const list = Array.isArray(data) ? data : [];
      setExams(list.slice(0, 5));
      setStats({
        exams: list.length,
        active: list.filter(e => e.is_ongoing).length,
        sessions: list.reduce((sum, e) => sum + (e.session_count || 0), 0),
      });
    }).catch(() => { });
  }, []);

  return (
    <div className="slide-up">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-500)' }}>
            <FileText size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.exams}</div>
            <div className="stat-card-label">Total Ujian</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--success-50)', color: 'var(--success-500)' }}>
            <CheckCircle size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.active}</div>
            <div className="stat-card-label">Ujian Aktif</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: 'var(--warning-50)', color: 'var(--warning-500)' }}>
            <Users size={22} />
          </div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.sessions}</div>
            <div className="stat-card-label">Total Peserta</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Ujian Terbaru</h3>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/exams/create')}>
            + Buat Ujian
          </button>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {exams.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><FileText size={28} /></div>
              <div className="empty-state-title">Belum ada ujian</div>
              <div className="empty-state-text">Buat ujian pertama Anda untuk memulai</div>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Judul</th>
                    <th>Mata Pelajaran</th>
                    <th>Mode Akses</th>
                    <th>Status</th>
                    <th>Peserta</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map(exam => (
                    <tr key={exam.id} style={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/exams/${exam.id}/results`)}>
                      <td style={{ fontWeight: 600 }}>{exam.title}</td>
                      <td>{exam.subject}</td>
                      <td>
                        <span className={`badge ${exam.access_mode === 'login_required' ? 'badge-primary' : exam.access_mode === 'guest_allowed' ? 'badge-success' : 'badge-warning'}`}>
                          {exam.access_mode === 'login_required' ? 'Login' : exam.access_mode === 'guest_allowed' ? 'Guest' : 'Keduanya'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${exam.is_ongoing ? 'badge-success' : exam.is_upcoming ? 'badge-warning' : 'badge-gray'}`}>
                          {exam.is_ongoing ? 'Berlangsung' : exam.is_upcoming ? 'Akan Datang' : 'Selesai'}
                        </span>
                      </td>
                      <td>{exam.session_count || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
