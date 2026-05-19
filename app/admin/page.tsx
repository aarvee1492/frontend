'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken, getUser } from '@/lib/api';
import { Plus, Search, LogOut, Users, ChevronRight, Trash2 } from 'lucide-react';

const LOGO_URL = 'https://www.amesouth.com/wp-content/uploads/logo.png';

export default function AdminClientsPage() {
  const router = useRouter();
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ client_name: '', project_code: '', email: '', password: '' });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getClients(search, page, 10);
      setClients(res.clients);
      setTotal(res.total);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user) load(); /* eslint-disable-next-line */ }, [user, page, search]);

  const handleCreate = async () => {
    setCreating(true); setCreateError('');
    try {
      await api.createClient(form);
      setShowCreate(false);
      setForm({ client_name: '', project_code: '', email: '', password: '' });
      load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete client "${name}"? This will also delete all their sites and data.`)) return;
    try { await api.deleteClient(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  const handleLogout = () => { clearToken(); router.push('/'); };
  const totalPages = Math.ceil(total / 10);

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC' }}>
      <header style={{
        background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src={LOGO_URL} alt="AME South" style={{ height: 30, objectFit: 'contain' }} />
          <span style={{ color: '#CBD5E1' }}>|</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Admin Portal</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>{user?.email}</span>
          <button className="btn-secondary" onClick={handleLogout} style={{ fontSize: 12 }}>
            <LogOut size={13} /> Logout
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B' }}>Clients</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>{total} client{total !== 1 ? 's' : ''} total</p>
          </div>
          <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New Client</button>
        </div>

        <div className="card" style={{ marginBottom: 16, padding: 14 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
            <input className="form-input" placeholder="Search by name or project code…" value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }} style={{ paddingLeft: 34 }} />
          </div>
        </div>

        {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
          <>
            <div className="card">
              {clients.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>
                  <Users size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
                  <p style={{ fontSize: 14 }}>No clients found</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Client</th><th>Project Code</th><th>Email</th>
                      <th>Sites</th><th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map(c => (
                      <tr key={c.id}>
                        <td style={{ fontWeight: 600, color: '#1E293B' }}>{c.client_name}</td>
                        <td>{c.project_code || '—'}</td>
                        <td style={{ color: '#64748B' }}>{c.email}</td>
                        <td><span className="badge badge-blue">{c.site_count}</span></td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <Link href={`/admin/clients/${c.id}`} className="btn-icon" title="Open">
                              <ChevronRight size={14} />
                            </Link>
                            <button className="btn-icon" onClick={() => handleDelete(c.id, c.client_name)}
                              title="Delete" style={{ color: '#DC2626' }}>
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {totalPages > 1 && (
              <div className="pagination" style={{ marginTop: 16, justifyContent: 'center' }}>
                <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button key={i} className={`page-btn ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                    {i + 1}
                  </button>
                ))}
                <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
              </div>
            )}
          </>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal-content">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1E293B' }}>New Client</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Client Name</label>
                <input className="form-input" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })} placeholder="Acme Construction" />
              </div>
              <div>
                <label className="form-label">Project Code</label>
                <input className="form-input" value={form.project_code} onChange={e => setForm({ ...form, project_code: e.target.value })} placeholder="ACME-2024" />
              </div>
              <div>
                <label className="form-label">Login Email</label>
                <input className="form-input" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="client@example.com" />
              </div>
              <div>
                <label className="form-label">Initial Password</label>
                <input className="form-input" type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 characters" />
              </div>
              {createError && <div style={{ color: '#DC2626', fontSize: 13 }}>{createError}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreate} disabled={creating || !form.client_name || !form.email || !form.password}>
                {creating ? 'Creating…' : 'Create Client'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
