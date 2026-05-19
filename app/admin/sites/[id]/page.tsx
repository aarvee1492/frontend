'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, clearToken, getUser } from '@/lib/api';
import { ArrowLeft, Save, UploadCloud, Play, Pause, LogOut, RefreshCcw, CheckCircle2 } from 'lucide-react';

const LOGO_URL = 'https://www.amesouth.com/wp-content/uploads/logo.png';

export default function AdminSiteEditorPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = Number(params?.id);
  const [site, setSite] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    site_name: '', video_url: '',
    alert_email: '', alert_phone: '',
    latitude: '', longitude: '',
  });
  const [savingDetails, setSavingDetails] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Demo mode form (two-phase)
  const [demoActive, setDemoActive] = useState(false);
  const [demoStartedAt, setDemoStartedAt] = useState('');
  const [demoHistoryEndAt, setDemoHistoryEndAt] = useState('');
  const [demoHistoryInterval, setDemoHistoryInterval] = useState(30);
  const [demoInterval, setDemoInterval] = useState(5);
  const [savingDemo, setSavingDemo] = useState(false);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') { router.push('/'); return; }
    setUser(u);
  }, [router]);

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.getSite(siteId);
      setSite(s);
      setForm({
        site_name: s.site_name, video_url: s.video_url || '',
        alert_email: s.alert_email || '', alert_phone: s.alert_phone || '',
        latitude:  s.latitude  != null ? String(s.latitude)  : '',
        longitude: s.longitude != null ? String(s.longitude) : '',
      });
      setDemoActive(s.demo_active);
      setDemoStartedAt(s.demo_started_at ? s.demo_started_at.slice(0, 19) : '');
      setDemoHistoryEndAt(s.demo_history_end_at ? s.demo_history_end_at.slice(0, 19) : '');
      setDemoInterval(s.demo_interval_seconds || 5);
      setDemoHistoryInterval(s.demo_history_interval_seconds || 30);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (user && siteId) load(); /* eslint-disable-next-line */ }, [user, siteId]);

  const saveDetails = async () => {
    setSavingDetails(true); setError(null);
    try {
      const payload: any = {
        site_name: form.site_name,
        video_url: form.video_url,
        alert_email: form.alert_email,
        alert_phone: form.alert_phone,
      };
      if (form.latitude.trim() !== '') {
        const lat = Number(form.latitude);
        if (isNaN(lat) || lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90');
        payload.latitude = lat;
      }
      if (form.longitude.trim() !== '') {
        const lng = Number(form.longitude);
        if (isNaN(lng) || lng < -180 || lng > 180) throw new Error('Longitude must be between -180 and 180');
        payload.longitude = lng;
      }
      await api.updateSite(siteId, payload);
      setSavedAt(new Date());
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSavingDetails(false); }
  };

  const saveDemo = async () => {
    setSavingDemo(true); setError(null);
    try {
      await api.setSiteDemo(siteId, {
        demo_started_at: demoActive ? (demoStartedAt || new Date().toISOString()) : 'null',
        demo_history_end_at: demoActive ? (demoHistoryEndAt || 'null') : 'null',
        demo_history_interval_seconds: demoHistoryInterval,
        demo_interval_seconds: demoInterval,
      });
      setSavedAt(new Date());
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSavingDemo(false); }
  };

  const resetDemoNow = async () => {
    if (!confirm('Reset demo? This sets a 1-day pre-history ending at the current moment, then streams new points at the live interval.')) return;
    setSavingDemo(true);
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const fmt = (d: Date) => d.toISOString().slice(0, 19);
      setDemoStartedAt(fmt(oneDayAgo));
      setDemoHistoryEndAt(fmt(now));
      setDemoActive(true);
      await api.setSiteDemo(siteId, {
        demo_started_at: fmt(oneDayAgo),
        demo_history_end_at: fmt(now),
        demo_history_interval_seconds: demoHistoryInterval,
        demo_interval_seconds: demoInterval,
      });
      setSavedAt(new Date());
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSavingDemo(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null); setUploadResult(null);
    try {
      const result = await api.uploadData(siteId, file);
      setUploadResult(result);
      load();
    } catch (e: any) { setError(e.message); }
    finally { setUploading(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
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

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '32px' }}>
        {site && (
          <Link href={`/admin/clients/${site.client_id}`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            color: '#64748B', fontSize: 13, marginBottom: 16, textDecoration: 'none',
          }}>
            <ArrowLeft size={14} /> Back to {site.client_name}
          </Link>
        )}

        {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : site && (
          <>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', marginBottom: 24 }}>{site.site_name}</h1>

            {error && <Banner kind="error" message={error} onClose={() => setError(null)} />}
            {savedAt && <Banner kind="success" message="Saved" onClose={() => setSavedAt(null)} />}

            {/* Site details */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 16 }}>Site Details</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                <div>
                  <label className="form-label">Site Name</label>
                  <input className="form-input" value={form.site_name} onChange={e => setForm({ ...form, site_name: e.target.value })} />
                </div>
                <div>
                  <label className="form-label">Camera URL</label>
                  <input className="form-input" value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })}
                    placeholder="YouTube watch/embed URL, Vimeo, or direct MP4 link" />
                  <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                    Auto-detects type. YouTube videos auto-loop when embedded; set the video to Public or Unlisted (not Private).
                  </p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label className="form-label">Latitude</label>
                    <input className="form-input" type="text" inputMode="decimal"
                      value={form.latitude}
                      onChange={e => setForm({ ...form, latitude: e.target.value })}
                      placeholder="30.363030" />
                  </div>
                  <div>
                    <label className="form-label">Longitude</label>
                    <input className="form-input" type="text" inputMode="decimal"
                      value={form.longitude}
                      onChange={e => setForm({ ...form, longitude: e.target.value })}
                      placeholder="-91.031987" />
                  </div>
                </div>
                <p style={{ fontSize: 11, color: '#94A3B8', margin: '-4px 0 0' }}>
                  Site location for the map view. Leave blank to hide the map for this site.
                </p>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="btn-primary" onClick={saveDetails} disabled={savingDetails}>
                    <Save size={14} /> {savingDetails ? 'Saving…' : 'Save Site Details'}
                  </button>
                </div>
              </div>
            </div>

            {/* Demo mode */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Demo Streaming Mode</h2>
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                    Makes sensor data appear to populate live every N seconds, starting from a reference timestamp.
                  </p>
                </div>
                {site.demo_active && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px', borderRadius: 9999,
                    background: 'rgba(0, 176, 80, 0.1)', color: '#00B050',
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.4,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>● ACTIVE</span>
                )}
              </div>

              <div style={{ display: 'grid', gap: 12 }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
                  background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer',
                }}>
                  <input type="checkbox" checked={demoActive} onChange={e => setDemoActive(e.target.checked)} style={{ width: 16, height: 16 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {demoActive ? <Play size={13} /> : <Pause size={13} />}
                      Demo streaming {demoActive ? 'ENABLED' : 'DISABLED'}
                    </div>
                  </div>
                </label>

                {demoActive && (
                  <>
                    <div style={{
                      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                      padding: 14, background: '#F8FAFC',
                      border: '1px solid #E2E8F0', borderRadius: 6,
                    }}>
                      <div style={{ gridColumn: 'span 2', fontSize: 11, fontWeight: 700, color: '#94A3B8',
                        textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        History Phase (pre-history visible on open)
                      </div>
                      <div>
                        <label className="form-label">Timeline Start</label>
                        <input className="form-input" type="datetime-local"
                          value={demoStartedAt} onChange={e => setDemoStartedAt(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">History End / Live Start</label>
                        <input className="form-input" type="datetime-local"
                          value={demoHistoryEndAt} onChange={e => setDemoHistoryEndAt(e.target.value)} />
                      </div>
                      <div style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">History Interval (seconds between points)</label>
                        <input className="form-input" type="number" min={1} value={demoHistoryInterval}
                          onChange={e => setDemoHistoryInterval(Number(e.target.value))} style={{ width: 200 }} />
                        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                          Spacing of points in the history phase. Default 30 (1 day = 2,880 points).
                        </p>
                      </div>
                    </div>

                    <div style={{
                      padding: 14, background: 'rgba(0, 176, 80, 0.04)',
                      border: '1px solid rgba(0, 176, 80, 0.25)', borderRadius: 6,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#00B050',
                        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
                        Live Phase (after history end)
                      </div>
                      <label className="form-label">Live Interval (seconds between new points)</label>
                      <input className="form-input" type="number" min={1} value={demoInterval}
                        onChange={e => setDemoInterval(Number(e.target.value))} style={{ width: 200 }} />
                      <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>
                        Spacing of new points after history end. Default 5 (one new point every 5 seconds).
                      </p>
                    </div>

                    <div style={{ fontSize: 11, color: '#64748B', padding: '8px 0 0' }}>
                      Tip: leave "History End / Live Start" empty to use single-phase mode (uniform interval throughout).
                    </div>
                  </>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <button className="btn-secondary" onClick={resetDemoNow} disabled={savingDemo}>
                    <RefreshCcw size={13} /> Reset Demo To Now
                  </button>
                  <button className="btn-primary" onClick={saveDemo} disabled={savingDemo}>
                    <Save size={14} /> {savingDemo ? 'Saving…' : 'Save Demo Settings'}
                  </button>
                </div>
              </div>
            </div>

            {/* Sensor data upload */}
            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Sensor Data</h2>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14 }}>
                {site.sensor_count} sensor{site.sensor_count !== 1 ? 's' : ''} currently loaded. Upload a CSV or Excel
                file to replace the current data. Geokon TOA5 format is detected automatically.
              </p>

              <div className="drop-zone" onClick={() => fileInputRef.current?.click()}>
                <UploadCloud size={32} style={{ color: '#94A3B8', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13, color: '#475569' }}>
                  {uploading ? 'Uploading...' : 'Click to upload a CSV or Excel file'}
                </div>
                <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
              </div>

              {uploadResult && (
                <div style={{ marginTop: 12, padding: 12, background: '#ECFDF5', border: '1px solid #6EE7B7', borderRadius: 6, fontSize: 12, color: '#059669' }}>
                  ✓ Loaded {uploadResult.row_count} rows · {uploadResult.sensors?.length || 0} sensors detected
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Banner({ kind, message, onClose }: { kind: 'error' | 'success'; message: string; onClose: () => void }) {
  const style = kind === 'error'
    ? { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }
    : { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669' };
  return (
    <div style={{ ...style, padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {kind === 'success' && <CheckCircle2 size={15} />}
        {message}
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  );
}
