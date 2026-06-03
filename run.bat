@echo off
title NevUjian Launcher
echo ===================================================
echo           🎓 NevUjian - Online Exam System         
echo ===================================================
echo.

:: Check backend folder and venv
if not exist "backend" (
    echo [ERROR] Folder 'backend' tidak ditemukan!
    goto error
)

if not exist "backend\venv" (
    echo [WARNING] Virtual environment 'venv' tidak ditemukan di folder backend.
    echo Membuat virtual environment baru...
    cd backend
    python -m venv venv
    if errorlevel 1 (
        echo [ERROR] Gagal membuat virtual environment. Pastikan Python terinstall.
        cd ..
        goto error
    )
    echo Menginstall dependencies backend...
    call venv\Scripts\activate
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Gagal menginstall dependencies backend.
        cd ..
        goto error
    )
    echo Menjalankan migrasi database...
    python manage.py migrate
    cd ..
)

:: Check frontend folder and node_modules
if not exist "frontend" (
    echo [ERROR] Folder 'frontend' tidak ditemukan!
    goto error
)

if not exist "frontend\node_modules" (
    echo [WARNING] Folder 'node_modules' tidak ditemukan di folder frontend.
    echo Menginstall dependencies frontend...
    cd frontend
    npm install
    if errorlevel 1 (
        echo [ERROR] Gagal menginstall dependencies frontend. Pastikan Node.js terinstall.
        cd ..
        goto error
    )
    cd ..
)

:: Start Backend
echo Menjalankan Backend (Django)...
start "NevUjian Backend (Django)" cmd /k "cd backend && call venv\Scripts\activate && python manage.py runserver 8000"

:: Start Frontend
echo Menjalankan Frontend (Vite)...
start "NevUjian Frontend (Vite)" cmd /k "cd frontend && npm run dev"

echo.
echo ===================================================
echo Server sedang berjalan:
echo - Frontend: http://localhost:3000
echo - Backend : http://localhost:8000
echo ===================================================
echo.
echo Membuka browser ke http://localhost:3000...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Tekan tombol apa saja untuk menutup jendela launcher ini.
echo (Server backend dan frontend akan tetap berjalan di jendela terpisah).
pause > nul
exit

:error
echo.
echo Terjadi kesalahan. Proses dibatalkan.
pause
exit
