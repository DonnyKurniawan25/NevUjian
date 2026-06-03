# 🎓 NevUjian - Sistem Ujian Online Modern

Sistem manajemen ujian online yang powerful dengan fitur AI untuk penilaian otomatis dan tampilan mobile-responsive.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Python](https://img.shields.io/badge/python-3.8+-blue.svg)
![React](https://img.shields.io/badge/react-18.0+-61dafb.svg)

## ✨ Fitur Utama

### 🎯 Manajemen Ujian
- ✅ Buat dan kelola ujian dengan mudah
- ✅ Multiple choice dan essay questions
- ✅ Pengaturan waktu dan durasi ujian
- ✅ Acak soal dan jawaban
- ✅ Batasan pelanggaran (tab switching detection)

### 🤖 AI-Powered
- ✅ Penilaian otomatis untuk soal essay menggunakan AI
- ✅ Feedback detail untuk setiap jawaban
- ✅ Konfigurasi AI yang fleksibel
- ✅ Support multiple AI providers

### 👥 Multi-Mode Access
- ✅ **Login Required**: Siswa harus login
- ✅ **Guest Allowed**: Siswa tanpa akun bisa ikut
- ✅ **Both**: Fleksibel, siswa bisa pilih
- ✅ Public link untuk akses mudah
- ✅ Token-based access control

### 📱 Mobile Responsive
- ✅ Bottom navigation bar untuk mobile
- ✅ Touch-optimized interface
- ✅ Responsive di semua ukuran layar
- ✅ Dark mode support
- ✅ Safe area support untuk notched devices

### 📊 Monitoring & Analytics
- ✅ Real-time monitoring peserta ujian
- ✅ Deteksi pelanggaran otomatis
- ✅ Laporan hasil ujian detail
- ✅ Export hasil ke berbagai format
- ✅ Dashboard statistik

## 🚀 Tech Stack

### Backend
- **Framework**: Django 4.2+
- **Database**: SQLite (development), PostgreSQL (production ready)
- **API**: Django REST Framework
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenAI API, Anthropic Claude

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Context API
- **Styling**: Custom CSS with CSS Variables
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📋 Prerequisites

- Python 3.8 atau lebih tinggi
- Node.js 16 atau lebih tinggi
- npm atau yarn
- Git

## 🛠️ Installation

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/NevUjian.git
cd NevUjian
```

### 2. Setup Backend

```bash
cd backend

# Buat virtual environment
python -m venv venv

# Aktifkan virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Jalankan migrasi database
python manage.py migrate

# Buat superuser
python manage.py createsuperuser

# Jalankan development server
python manage.py runserver
```

Backend akan berjalan di `http://localhost:8000`

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

## ⚙️ Configuration

### Backend Configuration

Buat file `.env` di folder `backend/`:

```env
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optional, default SQLite)
# DATABASE_URL=postgresql://user:password@localhost:5432/nevujian

# AI Settings
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### Frontend Configuration

File `frontend/vite.config.js` sudah dikonfigurasi untuk proxy ke backend.

## 📱 Mobile Features

Lihat [MOBILE_RESPONSIVE.md](MOBILE_RESPONSIVE.md) untuk dokumentasi lengkap fitur mobile.

### Quick Overview:
- Bottom navigation bar
- Touch-optimized UI
- Responsive breakpoints
- Safe area support
- Landscape mode support

## 🎨 Screenshots

### Desktop View
![Dashboard Desktop](screenshots/dashboard-desktop.png)
![Exam List Desktop](screenshots/exam-list-desktop.png)

### Mobile View
![Dashboard Mobile](screenshots/dashboard-mobile.png)
![Bottom Navigation](screenshots/bottom-nav-mobile.png)

## 📚 API Documentation

### Authentication Endpoints

```
POST /api/accounts/register/     - Register new user
POST /api/accounts/login/        - Login user
POST /api/accounts/logout/       - Logout user
GET  /api/accounts/profile/      - Get user profile
```

### Exam Endpoints

```
GET    /api/exams/              - List all exams
POST   /api/exams/              - Create new exam
GET    /api/exams/{id}/         - Get exam detail
PUT    /api/exams/{id}/         - Update exam
DELETE /api/exams/{id}/         - Delete exam
GET    /api/exams/{id}/questions/ - Get exam questions
POST   /api/exams/{id}/questions/ - Add question
```

### Public Access Endpoints

```
GET  /api/public/exam/{code}/   - Get exam by code
POST /api/public/exam/{code}/start/ - Start exam session
POST /api/public/exam/{code}/submit/ - Submit answers
```

## 🧪 Testing

### Backend Tests

```bash
cd backend
python manage.py test
```

### Frontend Tests

```bash
cd frontend
npm run test
```

## 🚀 Deployment

### Backend Deployment (Railway/Heroku)

1. Set environment variables
2. Configure database (PostgreSQL)
3. Run migrations
4. Collect static files
5. Deploy

### Frontend Deployment (Vercel/Netlify)

```bash
cd frontend
npm run build
```

Upload `dist/` folder atau connect dengan Git.

## 📖 User Guide

### Untuk Admin/Guru

1. **Login** ke sistem
2. **Buat Ujian** baru dari menu Ujian
3. **Tambah Soal** ke ujian
4. **Atur Pengaturan** ujian (waktu, mode akses, dll)
5. **Bagikan Link** atau kode ujian ke siswa
6. **Monitor** peserta yang sedang mengerjakan
7. **Lihat Hasil** dan berikan feedback

### Untuk Siswa

1. **Akses Link** ujian atau masukkan kode ujian
2. **Login** atau isi data diri (jika guest)
3. **Baca Instruksi** ujian dengan teliti
4. **Kerjakan Soal** sesuai waktu yang ditentukan
5. **Submit** jawaban sebelum waktu habis
6. **Lihat Hasil** (jika diizinkan oleh guru)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/yourusername)

## 🙏 Acknowledgments

- Django & Django REST Framework team
- React & Vite team
- Lucide Icons
- All contributors and testers

## 📞 Support

Jika ada pertanyaan atau masalah:
- 📧 Email: support@nevujian.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/NevUjian/issues)
- 📖 Docs: [Documentation](https://docs.nevujian.com)

## 🗺️ Roadmap

- [ ] PWA Support
- [ ] Real-time collaboration
- [ ] Video proctoring
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Mobile apps (iOS/Android)
- [ ] Integration dengan LMS populer

---

Made with ❤️ by NevUjian Team