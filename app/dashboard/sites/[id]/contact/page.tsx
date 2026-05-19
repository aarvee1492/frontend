'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Save, CheckCircle2 } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyClient()
      .then(c => {
        setName(c.contact_name || '');
        setEmail(c.contact_email || '');
        setPhone(c.contact_phone || '');
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true); setError(null);
    try {
      await api.updateMyContact({ contact_name: name, contact_email: email, contact_phone: phone });
      setSavedAt(new Date());
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <header style={{
        background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Contact Information</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>The person who should receive alerts when thresholds trigger</div>
        </div>
      </header>
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto', maxWidth: 640 }}>
        {error && <Banner kind="error" message={error} />}
        {savedAt && <Banner kind="success" message="Contact info updated" />}
        {loading ? <div className="spinner" style={{ margin: '40px auto' }} /> : (
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="form-label">Full Name</label>
                <input className="form-input" type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Jane Doe" />
              </div>
              <div>
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane@example.com" />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Used when notification channel is Email or Email + SMS.</p>
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 555-123-4567" />
                <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Used when notification channel is SMS or Email + SMS.</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                <button className="btn-primary" onClick={save} disabled={saving}>
                  <Save size={14} /> {saving ? 'Saving…' : 'Save Contact Info'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
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
