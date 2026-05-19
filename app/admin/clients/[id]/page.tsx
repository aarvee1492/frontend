'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken, getUser } from '@/lib/api';
import { Plus, ArrowLeft, MapPin, ChevronRight, LogOut, Trash2 } from 'lucide-react';

const LOGO_URL = 'https://www.amesouth.com/wp-content/uploads/logo.png';

export default function AdminClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const clientId = Number(params?.id);
  const [client, setClient] = useState<any>(null);
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ site_name: '', video_url: '' });
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([api.getClient(clientId), api.getSites(clientId, '', 1, 50)]);
      setClient(c);
      setSites(s.sites);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user && clientId) load(); /* eslint-disable-next-line */ }, [user, clientId]);

  const handleCreateSite = async () => {
    setCreating(true); setCreateError('');
    try {
      await api.createSite(clientId, form);
      setShowCreate(false);
      setForm({ site_name: '', video_url: '' });
      load();
    } catch (e: any) { setCreateError(e.message); }
    finally { setCreating(false); }
  };

  const handleDeleteSite = async (id: number, name: string) => {
    if (!confirm(`Delete site "${name}"?`)) return;
    try { await api.deleteSite(id); load(); }
    catch (e: any) { alert(e.message); }
  };

  const handleLogout = () => { clearToken(); router.push('/'); };

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
        <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, marginBottom: 16, textDecoration: 'none' }}>
          <ArrowLeft size={14} /> Back to clients
        </Link>

        {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : client && (
          <>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1E293B' }}>{client.client_name}</h1>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                {client.project_code || 'No project code'} · {client.email}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B' }}>Sites</h2>
              <button className="btn-primary" onClick={() => setShowCreate(true)}><Plus size={14} /> New Site</button>
            </div>

            <div className="card">
              {sites.length === 0 ? (
                <div style={{ padding: 60, textAlign: 'center', color: '#94A3B8' }}>
                  <MapPin size={32} style={{ opacity: 0.4, marginBottom: 12 }} />
                  <p style={{ fontSize: 14 }}>No sites yet</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Site</th><th>Sensors</th><th>Demo Mode</th><th>Thresholds</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sites.map(s => (
                      <tr key={s.id}>
                        <td style={{ fontWeight: 600, color: '#1E293B' }}>{s.site_name}</td>
                        <td>{s.sensor_count}</td>
                        <td>
                          {s.demo_active ? (
                            <span style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '2px 8px', borderRadius: 9999,
                              background: 'rgba(0, 176, 80, 0.1)', color: '#00B050',
                              fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                              fontFamily: 'JetBrains Mono, monospace',
                            }}>● STREAMING</span>
                          ) : (
                            <span style={{ color: '#94A3B8', fontSize: 12 }}>Off</span>
                          )}
                        </td>
                        <td>{s.threshold_count}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: 4 }}>
                            <Link href={`/admin/sites/${s.id}`} className="btn-icon" title="Edit">
                              <ChevronRight size={14} />
                            </Link>
                            <button className="btn-icon" onClick={() => handleDeleteSite(s.id, s.site_name)}
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
          </>
        )}
      </div>

      {showCreate && (
        <div className="modal-overlay" onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="modal-content">
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1E293B' }}>New Site</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label className="form-label">Site Name</label>
                <input className="form-input" value={form.site_name}
                  onChange={e => setForm({ ...form, site_name: e.target.value })}
                  placeholder="e.g. Project Alpha · Section 3" />
              </div>
              <div>
                <label className="form-label">Camera URL (optional)</label>
                <input className="form-input" value={form.video_url}
                  onChange={e => setForm({ ...form, video_url: e.target.value })}
                  placeholder="YouTube, Vimeo, or direct MP4 URL" />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                  Can be set later. Supports YouTube/Vimeo/MP4.
                </p>
              </div>
              {createError && <div style={{ color: '#DC2626', fontSize: 13 }}>{createError}</div>}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleCreateSite} disabled={creating || !form.site_name}>
                {creating ? 'Creating…' : 'Create Site'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
