import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus, Search, Edit, Trash2, Shield, GraduationCap, Users as UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import { authApi } from '../api/authApi';

export default function UserManagementPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [form, setForm] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        password: '',
        role: 'student',
        is_active: true
    });

    const load = async () => {
        setLoading(true);
        try {
            // Placeholder - ganti dengan API call yang sesuai
            // const res = await authApi.getUsers({ search, role: filterRole });
            // setUsers(res.data);

            // Mock data untuk demo
            setUsers([
                { id: 1, username: 'admin', email: 'admin@example.com', first_name: 'Admin', last_name: 'User', role: 'admin', is_active: true },
                { id: 2, username: 'teacher1', email: 'teacher@example.com', first_name: 'John', last_name: 'Doe', role: 'teacher', is_active: true },
                { id: 3, username: 'student1', email: 'student@example.com', first_name: 'Jane', last_name: 'Smith', role: 'student', is_active: true },
            ]);
        } catch (error) {
            toast.error('Gagal memuat data user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [search, filterRole]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                // await authApi.updateUser(editingUser.id, form);
                toast.success('User berhasil diupdate');
            } else {
                // await authApi.createUser(form);
                toast.success('User berhasil ditambahkan');
            }
            setShowModal(false);
            resetForm();
            load();
        } catch (error) {
            toast.error('Gagal menyimpan user');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Yakin hapus user ini?')) return;
        try {
            // await authApi.deleteUser(id);
            toast.success('User berhasil dihapus');
            load();
        } catch {
            toast.error('Gagal menghapus user');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setForm({
            username: user.username,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            password: '',
            role: user.role,
            is_active: user.is_active
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setForm({
            username: '',
            email: '',
            first_name: '',
            last_name: '',
            password: '',
            role: 'student',
            is_active: true
        });
        setEditingUser(null);
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <Shield size={16} />;
            case 'teacher': return <UsersIcon size={16} />;
            case 'student': return <GraduationCap size={16} />;
            default: return <UsersIcon size={16} />;
        }
    };

    const getRoleBadge = (role) => {
        const badges = {
            admin: 'badge-danger',
            teacher: 'badge-primary',
            student: 'badge-success'
        };
        return badges[role] || 'badge-gray';
    };

    const filteredUsers = users.filter(user => {
        const matchSearch = user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.first_name.toLowerCase().includes(search.toLowerCase()) ||
            user.last_name.toLowerCase().includes(search.toLowerCase());
        const matchRole = filterRole === 'all' || user.role === filterRole;
        return matchSearch && matchRole;
    });

    return (
        <div className="slide-up">
            {/* Header Actions */}
            <div className="flex-between mb-2">
                <div className="user-search-row">
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
                        <input
                            className="form-input"
                            placeholder="Cari user..."
                            style={{ paddingLeft: '2.25rem' }}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                    <select
                        className="form-select"
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        style={{ minWidth: '150px' }}
                    >
                        <option value="all">Semua Role</option>
                        <option value="admin">Admin</option>
                        <option value="teacher">Guru</option>
                        <option value="student">Siswa</option>
                    </select>
                </div>
                <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                    <UserPlus size={16} /> Tambah User
                </button>
            </div>

            {/* Stats */}
            <div className="stat-grid" style={{ marginBottom: '1.5rem' }}>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--danger-50)', color: 'var(--danger-500)' }}>
                        <Shield size={22} />
                    </div>
                    <div className="stat-card-content">
                        <div className="stat-card-value">{users.filter(u => u.role === 'admin').length}</div>
                        <div className="stat-card-label">Admin</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--primary-50)', color: 'var(--primary-500)' }}>
                        <UsersIcon size={22} />
                    </div>
                    <div className="stat-card-content">
                        <div className="stat-card-value">{users.filter(u => u.role === 'teacher').length}</div>
                        <div className="stat-card-label">Guru</div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-card-icon" style={{ background: 'var(--success-50)', color: 'var(--success-500)' }}>
                        <GraduationCap size={22} />
                    </div>
                    <div className="stat-card-content">
                        <div className="stat-card-value">{users.filter(u => u.role === 'student').length}</div>
                        <div className="stat-card-label">Siswa</div>
                    </div>
                </div>
            </div>

            {/* User List */}
            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">Daftar User</h3>
                </div>
                <div className="card-body" style={{ padding: 0 }}>
                    {loading ? (
                        <div className="loading-spinner"><div className="spinner" /></div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon"><UsersIcon size={28} /></div>
                            <div className="empty-state-title">Tidak ada user</div>
                            <div className="empty-state-text">Belum ada user yang sesuai dengan filter</div>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th className="hide-mobile">Nama Lengkap</th>
                                        <th className="hide-mobile">Email</th>
                                        <th>Role</th>
                                        <th className="hide-mobile">Status</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td style={{ fontWeight: 600 }}>{user.username}</td>
                                            <td className="hide-mobile">{user.first_name} {user.last_name}</td>
                                            <td className="hide-mobile">{user.email}</td>
                                            <td>
                                                <span className={`badge ${getRoleBadge(user.role)}`}>
                                                    {getRoleIcon(user.role)}
                                                    <span style={{ marginLeft: '0.25rem' }}>
                                                        {user.role === 'admin' ? 'Admin' : user.role === 'teacher' ? 'Guru' : 'Siswa'}
                                                    </span>
                                                </span>
                                            </td>
                                            <td className="hide-mobile">
                                                <span className={`badge ${user.is_active ? 'badge-success' : 'badge-gray'}`}>
                                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="exam-actions" style={{ background: 'transparent', padding: 0 }}>
                                                    <button
                                                        className="btn btn-sm btn-ghost action-btn"
                                                        onClick={() => handleEdit(user)}
                                                        data-label="Edit User"
                                                        title="Edit user">
                                                        <Edit size={16} />
                                                        <span>Edit</span>
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger action-btn"
                                                        onClick={() => handleDelete(user.id)}
                                                        data-label="Hapus User"
                                                        title="Hapus user">
                                                        <Trash2 size={16} />
                                                        <span>Hapus</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Form */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3 className="modal-title">{editingUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                            <button className="btn-icon btn-ghost" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Username <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            value={form.username}
                                            onChange={e => setForm({ ...form, username: e.target.value })}
                                            required
                                            disabled={editingUser}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email <span className="required">*</span></label>
                                        <input
                                            type="email"
                                            className="form-input"
                                            value={form.email}
                                            onChange={e => setForm({ ...form, email: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Nama Depan <span className="required">*</span></label>
                                        <input
                                            className="form-input"
                                            value={form.first_name}
                                            onChange={e => setForm({ ...form, first_name: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Nama Belakang</label>
                                        <input
                                            className="form-input"
                                            value={form.last_name}
                                            onChange={e => setForm({ ...form, last_name: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">Password {!editingUser && <span className="required">*</span>}</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                            required={!editingUser}
                                            placeholder={editingUser ? 'Kosongkan jika tidak ingin mengubah' : ''}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Role <span className="required">*</span></label>
                                        <select
                                            className="form-select"
                                            value={form.role}
                                            onChange={e => setForm({ ...form, role: e.target.value })}
                                            required
                                        >
                                            <option value="student">Siswa</option>
                                            <option value="teacher">Guru</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="toggle-wrapper">
                                        <div>
                                            <div className="toggle-label">Status Aktif</div>
                                            <div className="toggle-hint">User dapat login ke sistem</div>
                                        </div>
                                        <label className="toggle">
                                            <input
                                                type="checkbox"
                                                checked={form.is_active}
                                                onChange={e => setForm({ ...form, is_active: e.target.checked })}
                                            />
                                            <span className="toggle-slider" />
                                        </label>
                                    </label>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? 'Update' : 'Tambah'} User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Made with Bob
