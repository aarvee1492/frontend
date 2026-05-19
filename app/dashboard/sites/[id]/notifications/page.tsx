'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Mail, MessageSquare, BellOff, Save, CheckCircle2 } from 'lucide-react';

export default function NotificationsPage() {
  const [channel, setChannel] = useState<'email' | 'sms' | 'both' | 'none'>('email');
  const [active, setActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyClient()
      .then(c => {
        setChannel(c.notification_channel || 'email');
        setActive(Boolean(c.notifications_active));
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      await api.updateMyNotifications({ notification_channel: channel, notifications_active: active });
      setSavedAt(new Date());
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <Topbar title="Notifications" subtitle="Choose how you want to be alerted when thresholds are exceeded" />
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto', maxWidth: 720 }}>
        {error && <Banner kind="error" message={error} />}
        {savedAt && <Banner kind="success" message="Preferences saved" />}

        {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Notification Channel</h3>
            <p style={{ fontSize: 12.5, color: '#64748B', marginBottom: 14 }}>
              How you want to be reached when one of your thresholds triggers an alert.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 24 }}>
              <Tile active={channel === 'email'} onClick={() => setChannel('email')}
                icon={<Mail size={16} />} label="Email only" hint="Sent to your contact email" />
              <Tile active={channel === 'sms'} onClick={() => setChannel('sms')}
                icon={<MessageSquare size={16} />} label="SMS only" hint="Sent to your phone number" comingSoon />
              <Tile active={channel === 'both'} onClick={() => setChannel('both')}
                icon={<><Mail size={14} /><MessageSquare size={14} /></>}
                label="Email + SMS" hint="Both channels" comingSoon />
              <Tile active={channel === 'none'} onClick={() => setChannel('none')}
                icon={<BellOff size={16} />} label="Off" hint="No notifications will be sent" />
            </div>

            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Master Switch</h3>
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
              background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 6, cursor: 'pointer',
            }}>
              <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} style={{ width: 16, height: 16 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>
                  Notifications are {active ? 'ENABLED' : 'PAUSED'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Toggle off to silence all notifications temporarily without losing your channel preference.
                </div>
              </div>
            </label>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
              <button className="btn-primary" onClick={save} disabled={saving}>
                <Save size={14} /> {saving ? 'Saving…' : 'Save Preferences'}
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Tile({ active, onClick, icon, label, hint, comingSoon }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; hint: string; comingSoon?: boolean;
}) {
  return (
    <button onClick={onClick} style={{
      textAlign: 'left', padding: 14, borderRadius: 8,
      background: active ? '#EBF2FA' : 'white',
      border: active ? '2px solid #2D5A8E' : '1px solid #E2E8F0',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 6,
        background: active ? '#2D5A8E' : '#F1F5F9',
        color: active ? 'white' : '#64748B',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, marginBottom: 10,
      }}>{icon}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 2 }}>
        {label}
        {comingSoon && (
          <span style={{ marginLeft: 8, padding: '1px 6px', borderRadius: 9999,
            background: '#FFFBEB', color: '#D97706', fontSize: 9, fontWeight: 700,
            letterSpacing: 0.5, verticalAlign: 'middle' }}>SOON</span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: '#64748B' }}>{hint}</div>
    </button>
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

function Banner({ kind, message }: { kind: 'error' | 'success'; message: string }) {
  const style = kind === 'error'
    ? { background: '#FEF2F2', border: '1px solid #FECACA', color: '#DC2626' }
    : { background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#059669' };
  return (
    <div style={{ ...style, padding: '10px 14px', borderRadius: 6, fontSize: 13, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
      {kind === 'success' && <CheckCircle2 size={15} />}
      {message}
    </div>
  );
}
