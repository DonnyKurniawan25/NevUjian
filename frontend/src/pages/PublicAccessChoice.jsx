import { useParams, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';

export default function PublicAccessChoice() {
  const { examCode } = useParams();
  const navigate = useNavigate();

  return (
    <div className="public-layout">
      <div className="public-card" style={{ maxWidth: 500 }}>
        <div className="public-logo">
          <div className="public-logo-icon">N</div>
          <span className="public-logo-text">NevUjian</span>
        </div>
        <h2 className="public-title">Pilih Mode Akses</h2>
        <p className="public-subtitle">Bagaimana Anda ingin mengakses ujian ini?</p>

        <div style={{ display: 'grid', gap: '1rem' }}>
          <div
            style={{
              padding: '1.5rem', borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'all 0.2s',
              background: 'rgba(99,102,241,0.05)',
            }}
            onClick={() => navigate(`/login?redirect=/exam/${examCode}`)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary-400)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <LogIn size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Masuk dengan Akun</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                  Login menggunakan akun siswa yang terdaftar. Hasil ujian terhubung ke akun.
                </p>
              </div>
            </div>
          </div>

          <div
            style={{
              padding: '1.5rem', borderRadius: 'var(--radius-lg)',
              border: '2px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', transition: 'all 0.2s',
              background: 'rgba(20,184,166,0.05)',
            }}
            onClick={() => navigate(`/exam/${examCode}/guest-form`)}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-400)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.transform = 'none'; }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{
                width: 52, height: 52, borderRadius: 'var(--radius-lg)',
                background: 'linear-gradient(135deg, var(--accent-500), var(--accent-600))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <UserPlus size={24} color="white" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.25rem' }}>Masuk Tanpa Login</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--gray-400)' }}>
                  Isi data diri Anda dan langsung mulai ujian tanpa perlu membuat akun.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
