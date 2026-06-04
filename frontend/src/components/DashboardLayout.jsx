import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, FileText, Users, LogOut, Moon, Sun,
  Menu, X, ChevronRight, GraduationCap, ClipboardList, Cpu, UserCog
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') { document.documentElement.setAttribute('data-theme', 'dark'); return true; }
    return false;
  });

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const adminLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: FileText, label: 'Ujian', path: '/exams' },
    { icon: UserCog, label: 'Kelola User', path: '/users' },
    { icon: Cpu, label: 'Pengaturan AI', path: '/settings/ai' },
  ];

  const studentLinks = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/student/dashboard' },
  ];

  const links = user?.role === 'student' ? studentLinks : adminLinks;

  const pageTitle = () => {
    if (location.pathname === '/dashboard' || location.pathname === '/student/dashboard') return 'Dashboard';
    if (location.pathname === '/exams') return 'Daftar Ujian';
    if (location.pathname === '/exams/create') return 'Buat Ujian Baru';
    if (location.pathname === '/settings/ai') return 'Pengaturan AI';
    if (location.pathname.includes('/edit')) return 'Edit Ujian';
    if (location.pathname.includes('/questions')) return 'Kelola Soal';
    if (location.pathname.includes('/results')) return 'Hasil Ujian';
    return 'NevUjian';
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">N</div>
          <span className="sidebar-brand">NevUjian</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-title">Menu Utama</div>
          {links.map(link => (
            <button
              key={link.path}
              className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => { navigate(link.path); setSidebarOpen(false); }}
            >
              <link.icon />
              <span>{link.label}</span>
              {isActive(link.path) && <ChevronRight style={{ marginLeft: 'auto', width: 14, opacity: 0.5 }} />}
            </button>
          ))}
        </nav>

        {/* User info */}
        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem', color: 'white', flexShrink: 0
          }}>
            {(user?.first_name?.[0] || user?.username?.[0] || 'U').toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--gray-500)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button className="btn-icon btn-ghost" onClick={handleLogout} title="Logout"
            style={{ color: 'var(--gray-500)' }}>
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button className="btn-icon btn-ghost" onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ display: 'none' }}>
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <h1 className="topbar-title">{pageTitle()}</h1>
          </div>
          <div className="topbar-right">
            <button className="btn-icon btn-ghost" onClick={toggleTheme} title="Toggle Theme">
              {dark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        <div className="page-content fade-in">
          {children}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        <div className="mobile-nav-items">
          {links.map(link => (
            <button
              key={link.path}
              className={`mobile-nav-item ${isActive(link.path) ? 'active' : ''}`}
              onClick={() => { navigate(link.path); setSidebarOpen(false); }}
            >
              <link.icon />
              <span>{link.label}</span>
            </button>
          ))}
          <button
            className="mobile-nav-item"
            onClick={toggleTheme}
            title="Toggle Theme"
          >
            {dark ? <Sun /> : <Moon />}
            <span>Tema</span>
          </button>
          <button
            className="mobile-nav-item"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut />
            <span>Keluar</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
