import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { examApi } from '../api/examApi';
import { useAuth } from '../context/AuthContext';
import { Save, ArrowLeft, Lock, Globe, Shuffle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', subject: '', class_target: '',
    access_mode: 'login_required', public_link_enabled: false,
    require_exam_token: false, exam_token: '',
    guest_allow_retake: false,
    guest_prevent_duplicate_by_nis: true, guest_prevent_duplicate_by_nisn: false,
    guest_prevent_duplicate_by_email: false, guest_prevent_duplicate_by_name_class: false,
    guest_prevent_duplicate_by_ip: false,
    start_time: '', end_time: '', duration_minutes: 60,
    shuffle_questions: false, shuffle_answers: false,
    show_result: true, max_violations: 3, passing_score: 70,
    is_active: true, teacher: user?.id,
  });

  useEffect(() => {
    if (isEdit) {
      examApi.getExam(id).then(res => {
        const d = res.data;
        setForm({
          ...d,
          start_time: d.start_time?.slice(0, 16) || '',
          end_time: d.end_time?.slice(0, 16) || '',
        });
      }).catch(() => toast.error('Gagal memuat data ujian'));
    }
  }, [id]);

  const set = (key, val) => setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form, teacher: user.id };
      if (isEdit) {
        await examApi.updateExam(id, payload);
        toast.success('Ujian berhasil diperbarui');
      } else {
        const res = await examApi.createExam(payload);
        toast.success('Ujian berhasil dibuat');
        navigate(`/exams/${res.data.id}/questions`);
        return;
      }
      navigate('/exams');
    } catch (err) {
      const errors = err.response?.data;
      if (errors && typeof errors === 'object') {
        Object.values(errors).flat().forEach(msg => toast.error(String(msg)));
      } else {
        toast.error('Gagal menyimpan ujian');
      }
    } finally { setLoading(false); }
  };

  const Toggle = ({ label, hint, checked, onChange }) => (
    <div className="toggle-wrapper">
      <div>
        <div className="toggle-label">{label}</div>
        {hint && <div className="toggle-hint">{hint}</div>}
      </div>
      <label className="toggle">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} />
        <span className="toggle-slider" />
      </label>
    </div>
  );

  return (
    <div className="slide-up">
      <button className="btn btn-ghost mb-2" onClick={() => navigate('/exams')}>
        <ArrowLeft size={16} /> Kembali
      </button>

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className="card mb-2">
          <div className="card-header"><h3 className="card-title">📝 Informasi Ujian</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Judul Ujian <span className="required">*</span></label>
              <input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} required placeholder="Contoh: Ujian Tengah Semester Matematika" />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mata Pelajaran <span className="required">*</span></label>
                <input className="form-input" value={form.subject} onChange={e => set('subject', e.target.value)} required placeholder="Contoh: Matematika" />
              </div>
              <div className="form-group">
                <label className="form-label">Kelas Target</label>
                <input className="form-input" value={form.class_target} onChange={e => set('class_target', e.target.value)} placeholder="Contoh: X-IPA-1, X-IPA-2" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Deskripsi</label>
              <textarea className="form-textarea" value={form.description} onChange={e => set('description', e.target.value)} placeholder="Deskripsi ujian (opsional)" rows={3} />
            </div>
          </div>
        </div>

        {/* Access Mode */}
        <div className="card mb-2">
          <div className="card-header"><h3 className="card-title">🔐 Mode Akses Peserta</h3></div>
          <div className="card-body">
            <div className="access-mode-grid">
              {[
                { value: 'login_required', icon: '🔒', title: 'Login Siswa', desc: 'Siswa wajib login menggunakan akun' },
                { value: 'guest_allowed', icon: '🌐', title: 'Tanpa Login', desc: 'Siswa cukup isi data diri tanpa login' },
                { value: 'both', icon: '🔄', title: 'Keduanya', desc: 'Siswa bisa pilih login atau tanpa login' },
              ].map(opt => (
                <div key={opt.value}
                  className={`access-mode-option ${form.access_mode === opt.value ? 'selected' : ''}`}
                  onClick={() => set('access_mode', opt.value)}>
                  <div className="access-mode-icon" style={{
                    background: form.access_mode === opt.value ? 'var(--primary-50)' : 'var(--bg-tertiary)',
                    fontSize: '1.5rem',
                  }}>{opt.icon}</div>
                  <div className="access-mode-content">
                    <div className="access-mode-title">{opt.title}</div>
                    <div className="access-mode-desc">{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {form.access_mode !== 'login_required' && (
              <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.75rem' }}>⚙️ Pengaturan Guest</div>
                <Toggle label="Aktifkan Link Publik" hint="Peserta bisa akses ujian via link"
                  checked={form.public_link_enabled} onChange={v => set('public_link_enabled', v)} />
                <Toggle label="Memerlukan Token Ujian" hint="Peserta harus memasukkan token untuk akses"
                  checked={form.require_exam_token} onChange={v => set('require_exam_token', v)} />
                {form.require_exam_token && (
                  <div className="form-group" style={{ marginTop: '0.5rem' }}>
                    <label className="form-label">Token Ujian</label>
                    <input className="form-input" value={form.exam_token} onChange={e => set('exam_token', e.target.value)} placeholder="Masukkan token ujian" />
                  </div>
                )}
                <Toggle label="Boleh Mengulang" hint="Guest bisa mengerjakan ulang ujian"
                  checked={form.guest_allow_retake} onChange={v => set('guest_allow_retake', v)} />

                {!form.guest_allow_retake && (
                  <>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, marginTop: '0.75rem', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                      Cegah Duplikat Berdasarkan:
                    </div>
                    <Toggle label="NIS" checked={form.guest_prevent_duplicate_by_nis} onChange={v => set('guest_prevent_duplicate_by_nis', v)} />
                    <Toggle label="NISN" checked={form.guest_prevent_duplicate_by_nisn} onChange={v => set('guest_prevent_duplicate_by_nisn', v)} />
                    <Toggle label="Email" checked={form.guest_prevent_duplicate_by_email} onChange={v => set('guest_prevent_duplicate_by_email', v)} />
                    <Toggle label="Nama + Kelas" checked={form.guest_prevent_duplicate_by_name_class} onChange={v => set('guest_prevent_duplicate_by_name_class', v)} />
                    <Toggle label="Alamat IP" checked={form.guest_prevent_duplicate_by_ip} onChange={v => set('guest_prevent_duplicate_by_ip', v)} />
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Schedule */}
        <div className="card mb-2">
          <div className="card-header"><h3 className="card-title">📅 Jadwal & Durasi</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Waktu Mulai <span className="required">*</span></label>
                <input type="datetime-local" className="form-input" value={form.start_time} onChange={e => set('start_time', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Waktu Selesai <span className="required">*</span></label>
                <input type="datetime-local" className="form-input" value={form.end_time} onChange={e => set('end_time', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Durasi (menit) <span className="required">*</span></label>
                <input type="number" className="form-input" value={form.duration_minutes} onChange={e => set('duration_minutes', parseInt(e.target.value) || 0)} min={1} required />
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="card mb-2">
          <div className="card-header"><h3 className="card-title">⚙️ Pengaturan Ujian</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nilai Minimal Lulus</label>
                <input type="number" className="form-input" value={form.passing_score} onChange={e => set('passing_score', e.target.value)} min={0} max={100} />
              </div>
              <div className="form-group">
                <label className="form-label">Maksimal Pelanggaran</label>
                <input type="number" className="form-input" value={form.max_violations} onChange={e => set('max_violations', parseInt(e.target.value) || 0)} min={1} />
              </div>
            </div>
            <Toggle label="Acak Soal" checked={form.shuffle_questions} onChange={v => set('shuffle_questions', v)} />
            <Toggle label="Acak Jawaban" checked={form.shuffle_answers} onChange={v => set('shuffle_answers', v)} />
            <Toggle label="Tampilkan Hasil ke Peserta" checked={form.show_result} onChange={v => set('show_result', v)} />
            <Toggle label="Ujian Aktif" checked={form.is_active} onChange={v => set('is_active', v)} />
          </div>
        </div>

        <div className="flex" style={{ gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-secondary" onClick={() => navigate('/exams')}>Batal</button>
          <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
            {loading ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> : <><Save size={16} /> {isEdit ? 'Simpan Perubahan' : 'Buat Ujian'}</>}
          </button>
        </div>
      </form>
    </div>
  );
}
