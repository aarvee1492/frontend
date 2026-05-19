'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Plus, Trash2, Save, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function ThresholdsPage() {
  const params = useParams();
  const siteId = Number(params?.id);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [sensors, setSensors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | 'new' | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [ts, ss] = await Promise.all([api.getThresholds(siteId), api.getSensors(siteId)]);
      setThresholds(ts);
      setSensors(ss);
      setError(null);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (siteId) load(); /* eslint-disable-next-line */ }, [siteId]);

  const updateField = (id: number, field: string, value: any) => {
    setThresholds(ts => ts.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const save = async (t: any) => {
    setSaving(t.id);
    try {
      await api.updateThreshold(t.id, {
        sensor_name: t.sensor_name, condition: t.condition,
        threshold_value: t.threshold_value, threshold_max: t.threshold_max,
        alert_message: t.alert_message,
      });
      setSavedAt(new Date());
    } catch (e: any) { setError(e.message); }
    finally { setSaving(null); }
  };

  const remove = async (id: number) => {
    if (!confirm('Delete this threshold?')) return;
    try { await api.deleteThreshold(id); load(); }
    catch (e: any) { setError(e.message); }
  };

  const addNew = async () => {
    if (sensors.length === 0) { setError('No sensors available'); return; }
    setSaving('new');
    try {
      await api.createThreshold(siteId, {
        sensor_name: sensors[0].sensor_name, sensor_unit: sensors[0].unit,
        condition: '>', threshold_value: 0, threshold_max: null, alert_message: '',
      });
      load();
    } catch (e: any) { setError(e.message); }
    finally { setSaving(null); }
  };

  return (
    <>
      <Topbar title="Thresholds" subtitle="Set alert conditions for sensor readings" />
      <div style={{ flex: 1, padding: '20px 32px 32px', overflow: 'auto' }}>
        {error && <Banner kind="error" message={error} onClose={() => setError(null)} />}
        {savedAt && <Banner kind="success" message="Threshold saved" onClose={() => setSavedAt(null)} />}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <p style={{ fontSize: 13, color: '#64748B' }}>
            {thresholds.length} threshold{thresholds.length !== 1 ? 's' : ''} configured
          </p>
          <button className="btn-primary" onClick={addNew} disabled={saving === 'new'}>
            <Plus size={14} /> Add Threshold
          </button>
        </div>
        {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Sensor</th><th>Condition</th><th>Value</th><th>Max (range)</th>
                  <th>Alert Message</th><th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {thresholds.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: '#94A3B8' }}>
                    <AlertTriangle size={28} style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />
                    No thresholds yet. Add one to receive alerts when readings cross a limit.
                  </td></tr>
                ) : thresholds.map(t => (
                  <tr key={t.id}>
                    <td>
                      <select className="form-select" value={t.sensor_name}
                        onChange={e => updateField(t.id, 'sensor_name', e.target.value)} style={{ fontSize: 13 }}>
                        {sensors.map(s => <option key={s.id} value={s.sensor_name}>{s.sensor_name}</option>)}
                      </select>
                    </td>
                    <td>
                      <select className="form-select" value={t.condition}
                        onChange={e => updateField(t.id, 'condition', e.target.value)} style={{ width: 110, fontSize: 13 }}>
                        <option value=">">Above (&gt;)</option>
                        <option value="<">Below (&lt;)</option>
                        <option value="=">Equals (=)</option>
                        <option value="range">In range</option>
                      </select>
                    </td>
                    <td>
                      <input className="form-input" type="number" step="any" value={t.threshold_value ?? ''}
                        onChange={e => updateField(t.id, 'threshold_value', e.target.value === '' ? null : Number(e.target.value))}
                        style={{ width: 100, fontSize: 13 }} />
                    </td>
                    <td>
                      <input className="form-input" type="number" step="any" value={t.threshold_max ?? ''}
                        onChange={e => updateField(t.id, 'threshold_max', e.target.value === '' ? null : Number(e.target.value))}
                        style={{ width: 100, fontSize: 13 }} disabled={t.condition !== 'range'} />
                    </td>
                    <td>
                      <input className="form-input" type="text" placeholder="Optional"
                        value={t.alert_message ?? ''} onChange={e => updateField(t.id, 'alert_message', e.target.value)}
                        style={{ fontSize: 13 }} />
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button className="btn-icon" title="Save" onClick={() => save(t)}
                          disabled={saving === t.id} style={{ color: '#2D5A8E' }}>
                          <Save size={14} />
                        </button>
                        <button className="btn-icon" title="Delete" onClick={() => remove(t.id)} style={{ color: '#DC2626' }}>
                          <Trash2 size={14} />
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
    </>
  );
}

function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header style={{
      background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 56,
      display: 'flex', alignItems: 'center', flexShrink: 0,
    }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>{title}</div>
        {subtitle && <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{subtitle}</div>}
      </div>
    </header>
  );
}

function Banner({ kind, message, onClose }: { kind: 'error' | 'success'; message: string; onClose: () => void }) {
  const style = kind === 'error'
    ? { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }
    : { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669' };
  return (
    <div style={{ ...style, padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {kind === 'success' && <CheckCircle2 size={15} />}
        {message}
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16 }}>×</button>
    </div>
  );
}
