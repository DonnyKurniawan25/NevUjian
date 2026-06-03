import { useState, useEffect } from 'react';
import examApi from '../api/examApi';
import { Save, RefreshCw, CheckCircle, XCircle, AlertCircle, Info, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AISettingsPage() {
  const [settings, setSettings] = useState({
    provider: 'custom',
    is_active: false,
    base_url: 'https://api.xiaomimimo.com/v1',
    model_name: 'mimo-v2.5-pro',
    timeout: 120,
    temperature: 0.4,
    max_tokens: 8000,
    api_key: '',
    last_checked: null,
    last_status: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await examApi.getAISettings();
      if (res.data) {
        setSettings(res.data);
        // Pre-populate test result from last_status if exists
        if (res.data.last_checked) {
          const isOk = res.data.last_status?.startsWith('Terhubung');
          setTestResult({
            success: isOk,
            message: isOk ? 'Terhubung' : 'Terputus',
            response: res.data.last_status,
            last_checked: res.data.last_checked
          });
        }
      }
    } catch (err) {
      toast.error('Gagal mengambil pengaturan AI.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProviderChange = (e) => {
    const val = e.target.value;
    let base_url = settings.base_url;
    let model_name = settings.model_name;

    if (val === 'openai') {
      base_url = 'https://api.openai.com/v1';
      model_name = 'gpt-4o-mini';
    } else if (val === 'openrouter') {
      base_url = 'https://openrouter.ai/api/v1';
      model_name = 'google/gemini-flash-1.5';
    } else if (val === '9router') {
      base_url = 'https://api.9router.com/v1';
      model_name = 'openai/gpt-4o-mini';
    } else if (val === 'custom') {
      base_url = 'https://api.xiaomimimo.com/v1';
      model_name = 'mimo-v2.5-pro';
    }

    setSettings(prev => ({
      ...prev,
      provider: val,
      base_url,
      model_name
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await examApi.updateAISettings(settings);
      toast.success('Pengaturan AI berhasil disimpan.');
      setSettings(res.data);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menyimpan pengaturan.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings.base_url) {
      toast.error('Base URL wajib diisi untuk tes koneksi.');
      return;
    }
    try {
      setTesting(true);
      setTestResult(null);
      const res = await examApi.testAIConnection(settings);
      const data = res.data;
      setTestResult({
        success: data.success,
        message: data.message,
        response: data.response,
        last_checked: data.last_checked
      });

      if (data.success) {
        toast.success('Koneksi AI berhasil terhubung!');
      } else {
        toast.error('Koneksi AI gagal terhubung.');
      }
      
      // Update local last status and checked
      setSettings(prev => ({
        ...prev,
        last_checked: data.last_checked,
        last_status: data.last_status
      }));
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Gagal melakukan tes koneksi.';
      toast.error(errorMsg);
      setTestResult({
        success: false,
        message: 'Koneksi Gagal',
        response: errorMsg,
        last_checked: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-center" style={{ minHeight: '300px', flexDirection: 'column', gap: '1rem' }}>
        <RefreshCw className="animate-spin text-primary" size={32} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Memuat pengaturan AI...</p>
      </div>
    );
  }

  return (
    <div className="slide-up">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
          
          {/* Left Column: Form */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Konfigurasi Provider</h3>
            </div>
            <form onSubmit={handleSave} className="card-body">
              <div className="form-group">
                <div className="toggle-wrapper" style={{ padding: '0.25rem 0' }}>
                  <div>
                    <span className="toggle-label" style={{ fontWeight: 600 }}>Aktifkan Fitur AI</span>
                    <p className="toggle-hint">Aktifkan pembuatan soal otomatis & koreksi essay otomatis</p>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={settings.is_active}
                      onChange={handleInputChange}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Provider AI</label>
                <select
                  name="provider"
                  className="form-select"
                  value={settings.provider}
                  onChange={handleProviderChange}
                >
                  <option value="openai">OpenAI (Official)</option>
                  <option value="openrouter">OpenRouter</option>
                  <option value="9router">9Router (Lokal)</option>
                  <option value="custom">Custom (OpenAI-Compatible)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Base URL <span className="required">*</span></label>
                <input
                  type="text"
                  name="base_url"
                  className="form-input"
                  placeholder="https://api.openai.com/v1"
                  value={settings.base_url}
                  onChange={handleInputChange}
                  required
                />
                <p className="form-hint">Endpoint API dasar, contoh: https://api.xiaomimimo.com/v1 atau https://api.openai.com/v1</p>
              </div>

              <div className="form-group">
                <label className="form-label">Model Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="model_name"
                  className="form-input"
                  placeholder="gpt-4o-mini"
                  value={settings.model_name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">API Key</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    name="api_key"
                    className="form-input"
                    placeholder="Masukkan API Key"
                    value={settings.api_key}
                    onChange={handleInputChange}
                    style={{ paddingRight: '2.5rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    style={{
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      border: 'none', background: 'none', color: 'var(--text-tertiary)', cursor: 'pointer'
                    }}
                  >
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="form-hint">API Key Anda akan disamarkan demi keamanan data.</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Temperature (Kreativitas)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    name="temperature"
                    className="form-input"
                    value={settings.temperature}
                    onChange={handleInputChange}
                  />
                  <p className="form-hint">Nilai rendah (0.2) lebih fokus/kaku. Tinggi (0.8) lebih kreatif.</p>
                </div>
                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Max Tokens</label>
                    <input
                      type="number"
                      name="max_tokens"
                      className="form-input"
                      value={settings.max_tokens}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Timeout (detik)</label>
                    <input
                      type="number"
                      name="timeout"
                      className="form-input"
                      value={settings.timeout}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  {testing ? (
                    <>
                      <RefreshCw className="animate-spin" size={16} />
                      Menguji...
                    </>
                  ) : (
                    'Tes Koneksi'
                  )}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                >
                  <Save size={16} />
                  {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Status & Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Status Card */}
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Status Koneksi</h3>
              </div>
              <div className="card-body">
                {testResult ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '0.75rem',
                      padding: '1rem', borderRadius: 'var(--radius-md)',
                      background: testResult.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                      border: `1.5px solid ${testResult.success ? 'var(--success-500)' : 'var(--danger-500)'}`,
                      color: testResult.success ? 'var(--success-600)' : 'var(--danger-600)',
                      boxShadow: testResult.success ? '0 0 15px rgba(34,197,94,0.15)' : '0 0 15px rgba(239,68,68,0.15)',
                      transition: 'all 0.3s ease'
                    }}>
                      {testResult.success ? <CheckCircle size={28} /> : <XCircle size={28} />}
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
                          {testResult.success ? 'Terhubung' : 'Terputus'}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '2px' }}>
                          Dicek pada: {new Date(testResult.last_checked).toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response / Detail Error:</span>
                      <pre style={{
                        marginTop: '0.5rem', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                        fontSize: '0.8rem', fontFamily: 'monospace', color: 'var(--text-primary)',
                        maxHeight: '150px', overflowY: 'auto'
                      }}>
                        {testResult.response}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                    <AlertCircle size={32} style={{ color: 'var(--text-tertiary)', marginBottom: '0.75rem' }} />
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Belum ada tes koneksi yang dijalankan.</p>
                    <button onClick={handleTestConnection} disabled={testing} className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }}>
                      Jalankan Tes Sekarang
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tips Card */}
            <div className="card">
              <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Info size={18} className="text-primary" />
                  <h3 className="card-title">Tips & Keterangan</h3>
                </div>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <p>Fitur AI ini menggunakan API yang kompatibel dengan standar OpenAI. Anda dapat menggunakan beberapa provider berikut:</p>
                
                <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li>
                    <strong>OpenAI (Official):</strong> Base URL: <code>https://api.openai.com/v1</code>. Gunakan model seperti <code>gpt-4o-mini</code> atau <code>gpt-4o</code>.
                  </li>
                  <li>
                    <strong>OpenRouter:</strong> Base URL: <code>https://openrouter.ai/api/v1</code>. Menyediakan akses ke model-model open-source seperti Deepseek, Gemini, Claude, dll.
                  </li>
                  <li>
                    <strong>9Router (Lokal):</strong> Base URL: <code>https://api.9router.com/v1</code>. Provider lokal yang menyediakan model berkecepatan tinggi dengan biaya rendah.
                  </li>
                  <li>
                    <strong>Xiaomi MIMO / Lainnya:</strong> Gunakan opsi <strong>Custom</strong> dan sesuaikan Base URL serta Model Name sesuai penyedia API pihak ketiga Anda.
                  </li>
                </ul>

                <div style={{
                  padding: '0.75rem 1rem', background: 'var(--primary-50)', borderLeft: '3px solid var(--primary-500)',
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0', color: 'var(--primary-700)', fontSize: '0.8rem'
                }}>
                  Pastikan Anda menekan tombol <strong>Simpan</strong> setelah koneksi berhasil untuk menerapkan konfigurasi AI ke seluruh sistem ujian.
                </div>
              </div>
            </div>

          </div>
          
        </div>
      </div>
    </div>
  );
}
