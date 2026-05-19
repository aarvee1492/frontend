'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { MapPin, ChevronRight, Activity } from 'lucide-react';

interface SiteSummary { id: number; site_name: string; sensor_count: number; demo_active: boolean; }
interface MyClient { id: number; client_name: string; project_code: string; sites: SiteSummary[]; }

export default function ClientDashboardPage() {
  const router = useRouter();
  const [client, setClient] = useState<MyClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.getMyClient()
      .then(c => {
        setClient(c);
        if (c.sites && c.sites.length === 1) {
          router.replace(`/dashboard/sites/${c.sites[0].id}`);
        }
      })
      .catch(e => setError(e.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <>
      <header style={{
        background: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#1E293B' }}>Dashboard</div>
          {client && <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>{client.client_name} · {client.project_code || 'No project code'}</div>}
        </div>
      </header>
      <div style={{ flex: 1, padding: '24px 32px', overflow: 'auto' }}>
        {loading && <div className="spinner" style={{ margin: '60px auto' }} />}
        {error && <div style={{ padding: 16, background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 6, color: '#DC2626' }}>{error}</div>}
        {client && client.sites.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, color: '#64748B', fontSize: 14,
            background: 'white', border: '1px dashed #E2E8F0', borderRadius: 8 }}>
            <MapPin size={36} style={{ opacity: 0.4, margin: '0 auto 12px', display: 'block' }} />
            No sites have been assigned to you yet. Contact your administrator.
          </div>
        )}
        {client && client.sites.length > 1 && (
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1E293B', marginBottom: 14 }}>Your Sites</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
              {client.sites.map(s => (
                <Link key={s.id} href={`/dashboard/sites/${s.id}`} style={{
                  display: 'block', textDecoration: 'none', background: 'white',
                  border: '1px solid #E2E8F0', borderRadius: 8, padding: 18, transition: 'all 0.15s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ width: 36, height: 36, background: '#EBF2FA', borderRadius: 6,
                      display: 'grid', placeItems: 'center', color: '#2D5A8E' }}>
                      <MapPin size={18} />
                    </div>
                    <ChevronRight size={16} color="#CBD5E1" />
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1E293B', marginBottom: 6 }}>{s.site_name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#64748B' }}>
                    <Activity size={12} />
                    {s.sensor_count} sensor{s.sensor_count !== 1 ? 's' : ''}
                    {s.demo_active && (
                      <span style={{ marginLeft: 'auto', padding: '1px 8px', borderRadius: 9999,
                        background: 'rgba(0, 176, 80, 0.1)', border: '1px solid rgba(0, 176, 80, 0.3)',
                        color: '#00B050', fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10, fontWeight: 600, letterSpacing: 0.5 }}>● LIVE</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
