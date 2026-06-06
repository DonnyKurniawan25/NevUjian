import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examApi } from '../api/examApi';
import { ArrowLeft, Plus, Trash2, Save, GripVertical, Upload, Sparkles, FileText, ImagePlus, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ExamQuestionsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ question_text: '', question_type: 'multiple_choice', points: 1, explanation: '', image: null, existingImage: null, remove_image: false, choices: [{ choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }] });
  
  const [importModal, setImportModal] = useState(false);
  const [excelFile, setExcelFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [importErrors, setImportErrors] = useState([]);

  const [aiModal, setAiModal] = useState(false);
  const [aiForm, setAiForm] = useState({ topic: '', question_type: 'multiple_choice', count: 5, points: 10 });
  const [generating, setGenerating] = useState(false);
  const [exportingDocx, setExportingDocx] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  const handleExportDocx = async () => {
    try {
      setExportingDocx(true);
      const res = await examApi.exportQuestionsDocx(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `lembar_soal_${exam?.title?.replace(/\s+/g, '_') || id}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Lembar soal Word berhasil diunduh');
    } catch {
      toast.error('Gagal mengunduh berkas Word');
    } finally {
      setExportingDocx(false);
    }
  };

  const handleGenerateAI = async () => {
    if (!aiForm.topic.trim()) {
      toast.error('Topik soal wajib diisi');
      return;
    }
    setGenerating(true);
    try {
      await examApi.generateQuestionsAI(id, aiForm);
      toast.success('Soal berhasil dibuat otomatis menggunakan AI!');
      setAiModal(false);
      if (page === 1) {
        load(1);
      } else {
        setPage(1);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat soal dengan AI. Pastikan AI settings sudah aktif.');
      console.error(err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      const res = await examApi.downloadQuestionsTemplate(id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `template_soal_ujian_${id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Gagal mengunduh template');
    }
  };

  const handleUploadExcel = async () => {
    if (!excelFile) {
      toast.error('Pilih file Excel terlebih dahulu');
      return;
    }
    setImporting(true);
    setImportErrors([]);
    try {
      await examApi.importExcelQuestions(id, excelFile);
      toast.success('Soal berhasil diimpor!');
      setImportModal(false);
      setExcelFile(null);
      if (page === 1) {
        load(1);
      } else {
        setPage(1);
      }
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setImportErrors(data.errors);
      } else if (data?.error) {
        toast.error(data.error);
      } else {
        toast.error('Gagal mengimpor soal');
      }
    } finally {
      setImporting(false);
    }
  };

  const load = async (currentPage = page) => {
    try {
      const [examRes, qRes] = await Promise.all([
        examApi.getExam(id),
        examApi.getQuestions(id, { page: currentPage })
      ]);
      setExam(examRes.data);
      const qData = qRes.data.results || qRes.data;
      setQuestions(Array.isArray(qData) ? qData : []);
      
      const total = qRes.data.count ?? (Array.isArray(qData) ? qData.length : 0);
      setTotalQuestions(total);
      setTotalPages(qRes.data.count ? Math.ceil(qRes.data.count / 20) : 1);
    } catch { 
      toast.error('Gagal memuat data'); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    load(page);
  }, [id, page]);

  const resetForm = () => {
    setForm({ question_text: '', question_type: 'multiple_choice', points: 1, explanation: '', image: null, existingImage: null, remove_image: false, choices: [{ choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }] });
    setEditing(null);
  };

  const handleSave = async () => {
    if (!form.question_text.trim()) { toast.error('Teks soal wajib diisi'); return; }
    if (form.question_type === 'multiple_choice') {
      const filled = form.choices.filter(c => c.choice_text.trim());
      if (filled.length < 2) { toast.error('Minimal 2 pilihan jawaban'); return; }
      if (!form.choices.some(c => c.is_correct)) { toast.error('Pilih jawaban yang benar'); return; }
    }
    try {
      if (editing) {
        await examApi.updateQuestion(id, editing, form);
        toast.success('Soal diperbarui');
      } else {
        await examApi.createQuestion(id, form);
        toast.success('Soal ditambahkan');
      }
      resetForm();
      load(page);
    } catch { toast.error('Gagal menyimpan soal'); }
  };

  const handleEdit = (q) => {
    setEditing(q.id);
    setForm({
      question_text: q.question_text,
      question_type: q.question_type,
      points: q.points,
      explanation: q.explanation || '',
      image: null,
      existingImage: q.image || null,
      remove_image: false,
      choices: q.choices?.length ? q.choices.map(c => ({ choice_text: c.choice_text, is_correct: c.is_correct }))
        : [{ choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }, { choice_text: '', is_correct: false }],
    });
    // Smooth scroll to form on mobile
    setTimeout(() => {
      const formEl = document.getElementById('question-form-card');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = async (qId) => {
    if (!confirm('Hapus soal ini?')) return;
    try { 
      await examApi.deleteQuestion(id, qId); 
      toast.success('Soal dihapus'); 
      load(page); 
    } catch { 
      toast.error('Gagal menghapus'); 
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('PERINGATAN: Apakah Anda yakin ingin menghapus SEMUA soal dalam ujian ini? Tindakan ini tidak dapat dibatalkan.')) return;
    setLoading(true);
    try {
      await examApi.deleteAllQuestions(id);
      toast.success('Semua soal berhasil dihapus!');
      if (page === 1) {
        load(1);
      } else {
        setPage(1);
      }
    } catch {
      toast.error('Gagal menghapus semua soal');
    } finally {
      setLoading(false);
    }
  };

  const getPageNumbers = () => {
    const range = [];
    const delta = 2; // number of pages to show before and after current page
    for (let i = Math.max(2, page - delta); i <= Math.min(totalPages - 1, page + delta); i++) {
      range.push(i);
    }
    range.unshift(1);
    if (totalPages > 1) {
      range.push(totalPages);
    }
    // Remove duplicates and sort numerically
    const uniqueRange = Array.from(new Set(range)).sort((a, b) => a - b);
    
    // Fix positioning of ellipsis dynamically
    const finalRange = [];
    for (let k = 0; k < uniqueRange.length; k++) {
      const current = uniqueRange[k];
      const next = uniqueRange[k + 1];
      finalRange.push(current);
      if (next && next - current > 1) {
        finalRange.push('...');
      }
    }
    return finalRange;
  };

  const updateChoice = (index, key, value) => {
    const newChoices = [...form.choices];
    if (key === 'is_correct') {
      newChoices.forEach((c, i) => c.is_correct = i === index);
    } else {
      newChoices[index] = { ...newChoices[index], [key]: value };
    }
    setForm({ ...form, choices: newChoices });
  };

  const addChoice = () => setForm({ ...form, choices: [...form.choices, { choice_text: '', is_correct: false }] });
  const removeChoice = (i) => { if (form.choices.length <= 2) return; setForm({ ...form, choices: form.choices.filter((_, idx) => idx !== i) }); };

  if (loading) return <div className="loading-spinner"><div className="spinner" /></div>;

  return (
    <div className="slide-up">
      <div className="exam-questions-header">
        <button className="btn btn-ghost btn-back" onClick={() => navigate('/exams')}><ArrowLeft size={16} /> Kembali</button>
        <div className="exam-questions-actions-wrapper">
          <div className="exam-questions-meta">
            <span className="exam-title-badge">{exam?.title}</span>
            <span className="questions-count-badge">{totalQuestions} soal</span>
          </div>
          <div className="exam-questions-buttons">
            <button className="btn btn-secondary btn-sm" onClick={handleDownloadTemplate}>Unduh Template Excel</button>
            <button className="btn btn-secondary btn-sm" onClick={() => { setAiModal(true); setAiForm({ topic: '', question_type: 'multiple_choice', count: 5, points: 10 }); }} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary-600)', background: 'var(--primary-50)', border: '1px solid var(--primary-200)' }}>
              <Sparkles size={14} /> Buat Soal AI
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => { setImportModal(true); setExcelFile(null); setImportErrors([]); }}>Import Excel</button>
            {totalQuestions > 0 && (
              <button 
                className="btn btn-danger btn-sm" 
                onClick={handleDeleteAll} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Trash2 size={14} /> Hapus Semua
              </button>
            )}
            <button className="btn btn-secondary btn-sm" onClick={handleExportDocx} disabled={exportingDocx || totalQuestions === 0} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {exportingDocx ? (
                <><div className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5 }} /> Mengunduh...</>
              ) : (
                <><FileText size={14} /> Export Word</>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="questions-layout">
        {/* Question List */}
        <div>
          {questions.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-title">Belum ada soal</div>
                <div className="empty-state-text">Tambahkan soal menggunakan form di samping</div>
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {questions.map((q, i) => (
                <div key={q.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                  <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                    <div className="flex gap-1" style={{ alignItems: 'center' }}>
                      <span className="badge badge-primary">Soal {(page - 1) * 20 + i + 1}</span>
                      <span className="badge badge-gray">{q.question_type === 'multiple_choice' ? 'PG' : 'Essay'}</span>
                      <span className="badge badge-gray">{q.points} poin</span>
                    </div>
                    <div className="flex gap-1">
                      <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(q)}>Edit</button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--danger-500)' }} onClick={() => handleDelete(q.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.6 }}>{q.question_text}</p>
                  {q.image && (
                    <div style={{ marginTop: '0.75rem' }}>
                      <img src={q.image} alt="Gambar soal" style={{
                        maxWidth: '100%', maxHeight: 200, borderRadius: 'var(--radius-md)',
                        border: '1px solid rgba(255,255,255,0.1)', objectFit: 'contain',
                      }} />
                    </div>
                  )}
                  {q.choices?.length > 0 && (
                    <div style={{ marginTop: '0.75rem' }}>
                      {q.choices.map((c, j) => (
                        <div key={j} style={{
                          fontSize: '0.82rem', padding: '0.3rem 0', display: 'flex', gap: '0.5rem',
                          color: c.is_correct ? 'var(--success-600)' : 'var(--text-secondary)',
                          fontWeight: c.is_correct ? 600 : 400,
                        }}>
                          <span>{String.fromCharCode(65 + j)}.</span>
                          <span>{c.choice_text} {c.is_correct && '✓'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginTop: '1.5rem',
                  marginBottom: '1rem',
                  flexWrap: 'wrap'
                }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Sebelumnya
                  </button>
                  
                  {getPageNumbers().map((pageNum, idx) => (
                    pageNum === '...' ? (
                      <span key={`dots-${idx}`} style={{ color: 'var(--text-secondary)', padding: '0 0.25rem' }}>...</span>
                    ) : (
                      <button
                        key={pageNum}
                        className={`btn btn-sm ${page === pageNum ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ minWidth: '2rem', padding: '0.25rem 0.5rem' }}
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </button>
                    )
                  ))}
                  
                  <button
                    className="btn btn-secondary btn-sm"
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Question Form */}
        <div id="question-form-card" className="card" style={{ position: 'sticky', top: 80 }}>
          <div className="card-header">
            <h3 className="card-title">{editing ? '✏️ Edit Soal' : '➕ Tambah Soal'}</h3>
            {editing && <button className="btn btn-ghost btn-sm" onClick={resetForm}>Batal</button>}
          </div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Teks Soal <span className="required">*</span></label>
              <textarea className="form-textarea" value={form.question_text}
                onChange={e => setForm({ ...form, question_text: e.target.value })}
                placeholder="Tulis soal di sini..." rows={4} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tipe</label>
                <select className="form-select" value={form.question_type}
                  onChange={e => setForm({ ...form, question_type: e.target.value })}>
                  <option value="multiple_choice">Pilihan Ganda</option>
                  <option value="essay">Essay</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Poin</label>
                <input type="number" className="form-input" value={form.points}
                  onChange={e => setForm({ ...form, points: parseInt(e.target.value) || 1 })} min={1} />
              </div>
            </div>

            {form.question_type === 'multiple_choice' && (
              <div className="form-group">
                <label className="form-label">Pilihan Jawaban</label>
                {form.choices.map((c, i) => (
                  <div key={i} className="flex gap-1 mb-1" style={{ alignItems: 'center' }}>
                    <input type="radio" name="correct" checked={c.is_correct}
                      onChange={() => updateChoice(i, 'is_correct', true)}
                      style={{ accentColor: 'var(--primary-500)' }} />
                    <input className="form-input" value={c.choice_text}
                      onChange={e => updateChoice(i, 'choice_text', e.target.value)}
                      placeholder={`Pilihan ${String.fromCharCode(65 + i)}`}
                      style={{ flex: 1 }} />
                    {form.choices.length > 2 && (
                      <button type="button" className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => removeChoice(i)} style={{ color: 'var(--danger-500)' }}>
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="btn btn-ghost btn-sm mt-1" onClick={addChoice}>
                  <Plus size={14} /> Tambah Pilihan
                </button>
              </div>
            )}

            {/* Image Upload */}
            <div className="form-group">
              <label className="form-label">Gambar Soal (opsional)</label>
              {(form.image || (form.existingImage && !form.remove_image)) ? (
                <div style={{
                  position: 'relative', display: 'inline-block',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 'var(--radius-md)',
                  overflow: 'hidden', maxWidth: '100%',
                }}>
                  <img
                    src={form.image ? URL.createObjectURL(form.image) : form.existingImage}
                    alt="Preview"
                    style={{ maxWidth: '100%', maxHeight: 180, display: 'block', objectFit: 'contain' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setForm({ ...form, image: null, existingImage: form.existingImage, remove_image: true });
                    }}
                    style={{
                      position: 'absolute', top: 6, right: 6,
                      background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '50%',
                      width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#fff', padding: 0,
                    }}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div
                  style={{
                    border: '2px dashed rgba(255,255,255,0.12)', borderRadius: 'var(--radius-md)',
                    padding: '1.25rem', textAlign: 'center', cursor: 'pointer',
                    background: 'rgba(255,255,255,0.02)', transition: 'border-color 0.2s',
                  }}
                  onClick={() => document.getElementById('question-image-input').click()}
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--primary-400)'; }}
                  onDragLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setForm({ ...form, image: file, remove_image: false });
                    }
                  }}
                >
                  <ImagePlus size={28} style={{ color: 'var(--primary-400)', marginBottom: '0.4rem' }} />
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Klik atau tarik gambar ke sini</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--gray-500)', marginTop: '0.2rem' }}>PNG, JPG, GIF (Maks 5MB)</div>
                  <input
                    id="question-image-input"
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files[0]) {
                        setForm({ ...form, image: e.target.files[0], remove_image: false });
                      }
                    }}
                  />
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Pembahasan (opsional)</label>
              <textarea className="form-textarea" value={form.explanation}
                onChange={e => setForm({ ...form, explanation: e.target.value })}
                placeholder="Penjelasan jawaban benar" rows={2} />
            </div>

            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
              <Save size={16} /> {editing ? 'Simpan Perubahan' : 'Tambah Soal'}
            </button>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {importModal && (
        <div className="modal-overlay" onClick={() => !importing && setImportModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📥 Import Soal dari Excel</h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Pastikan format berkas Excel Anda sudah sesuai dengan template. Unduh template jika belum memilikinya.
              </p>
              
              <div style={{
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: 'var(--radius-md)',
                padding: '2rem 1.5rem',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.02)',
                cursor: 'pointer',
                position: 'relative',
                marginBottom: '1rem'
              }}
              onClick={() => document.getElementById('excel-file-input').click()}>
                <input
                  id="excel-file-input"
                  type="file"
                  accept=".xlsx, .xls"
                  style={{ display: 'none' }}
                  onChange={e => setExcelFile(e.target.files[0])}
                />
                <Upload size={32} style={{ color: 'var(--primary-400)', marginBottom: '0.5rem', margin: '0 auto' }} />
                <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>
                  {excelFile ? excelFile.name : 'Pilih atau Tarik File Excel ke Sini'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                  Format yang didukung: .xlsx, .xls
                </div>
              </div>

              {importErrors.length > 0 && (
                <div style={{
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.75rem 1rem',
                  maxHeight: 180,
                  overflowY: 'auto',
                  marginBottom: '1rem'
                }}>
                  <div style={{ color: '#f87171', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.3rem' }}>
                    Terdapat error pada file Excel:
                  </div>
                  <ul style={{ paddingLeft: '1.25rem', fontSize: '0.78rem', color: '#f87171', display: 'grid', gap: '0.25rem' }}>
                    {importErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setImportModal(false)} disabled={importing}>Batal</button>
              <button className="btn btn-primary" onClick={handleUploadExcel} disabled={importing || !excelFile}>
                {importing ? <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> : 'Import Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Generate Modal */}
      {aiModal && (
        <div className="modal-overlay" onClick={() => !generating && setAiModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} className="text-primary" /> Buat Soal Otomatis dengan AI
              </h3>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Topik atau Materi Soal <span className="required">*</span></label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Contoh: Hukum Newton, Aljabar Linear, Pola Kalimat"
                  value={aiForm.topic}
                  onChange={e => setAiForm({ ...aiForm, topic: e.target.value })}
                  required
                />
                <p className="form-hint">AI akan membuat soal berdasarkan materi yang Anda masukkan.</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tipe Soal</label>
                  <select
                    className="form-select"
                    value={aiForm.question_type}
                    onChange={e => setAiForm({ ...aiForm, question_type: e.target.value })}
                  >
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="essay">Essay</option>
                  </select>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Jumlah Soal</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      max={50}
                      value={aiForm.count}
                      onChange={e => setAiForm({ ...aiForm, count: parseInt(e.target.value) || 5 })}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Poin per Soal</label>
                    <input
                      type="number"
                      className="form-input"
                      min={1}
                      value={aiForm.points}
                      onChange={e => setAiForm({ ...aiForm, points: parseInt(e.target.value) || 10 })}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAiModal(false)} disabled={generating}>Batal</button>
              <button className="btn btn-primary" onClick={handleGenerateAI} disabled={generating || !aiForm.topic.trim()}>
                {generating ? (
                  <>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, marginRight: '0.25rem' }} />
                    Menghasilkan Soal...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Buat Soal
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
