import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { guestApi } from '../api/publicApi';
import { useGuest } from '../context/GuestContext';
import { ArrowLeft, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function GuestFormPage() {
  const { examCode } = useParams();
  const navigate = useNavigate();
  const { saveGuestData } = useGuest();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    full_name: '', nis: '', nisn: '', class_name: '',
    gender: '', phone: '', email: '', exam_token: '',
  });

  useEffect(() => {
    guestApi.getExam(examCode).then(res => setExam(res.data)).catch(() => {
      toast.error('Ujian tidak ditemukan');
      navigate('/');
    });
  }, [examCode]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await guestApi.register(examCode, form);
      saveGuestData(res.data.access_token, {
        guest_id: res.data.guest_id,
        full_name: res.data.full_name,
      });
      toast.success('Registrasi berhasil!');
      navigate(`/exam/${examCode}/instruction`);
    } catch (err) {
      const data = err.response?.data;
      if (data?.error) toast.error(data.error);
      else if (data && typeof data === 'object') {
        Object.values(data).flat().forEach(msg => toast.error(String(msg)));
      } else toast.error('Registrasi gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="public-layout">
      <div className="public-card" style={{ maxWidth: 520 }}>
        <div className="public-logo">
          <div className="public-logo-icon">N</div>
          <span className="public-logo-text">NevUjian</span>
        </div>

        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--gray-400)', marginBottom: '1rem' }}
          onClick={() => navigate(`/exam/${examCode}`)}>
          <ArrowLeft size={14} /> Kembali
        </button>

        <h2 className="public-title">Isi Data Diri</h2>
        <p className="public-subtitle">{exam?.title || 'Memuat...'}</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nama Lengkap <span className="required">*</span></label>
            <input className="form-input" value={form.full_name}
              onChange={e => set('full_name', e.target.value)} required
              placeholder="Masukkan nama lengkap" autoFocus />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">NIS <span className="required">*</span></label>
              <input className="form-input" value={form.nis}
                onChange={e => set('nis', e.target.value)} required
                placeholder="Nomor Induk Siswa" />
            </div>
            <div className="form-group">
              <label className="form-label">Kelas <span className="required">*</span></label>
              <input className="form-input" value={form.class_name}
                onChange={e => set('class_name', e.target.value)} required
                placeholder="Contoh: X-IPA-1" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Jenis Kelamin <span style={{ fontSize: '0.7rem', color: 'var(--gray-500)' }}>(opsional)</span></label>
              <select className="form-select" value={form.gender} onChange={e => set('gender', e.target.value)}>
                <option value="">Pilih</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
            {exam?.require_exam_token ? (
              <div className="form-group">
                <label className="form-label">Token Ujian <span className="required">*</span></label>
                <input className="form-input" value={form.exam_token}
                  onChange={e => set('exam_token', e.target.value)}
                  required={exam.require_exam_token}
                  placeholder="Masukkan token dari guru" />
              </div>
            ) : (
              <div className="form-group" />
            )}
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: '1.25rem' }}
            disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Send size={16} /> Lanjutkan</>}
          </button>
        </form>
      </div>
    </div>
  );
}
