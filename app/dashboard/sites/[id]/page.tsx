'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import CameraPanel from '@/components/CameraPanel';
import MapPanel from '@/components/MapPanel';
import StreamingChart from '@/components/StreamingChart';

interface SiteData {
  id: number; site_name: string; video_url: string;
  latitude: number | null; longitude: number | null;
  client_id: number; client_name: string;
  sensor_count: number;
  sensors: { id: number; sensor_name: string; unit: string }[];
}

const SENSOR_COLORS: Record<string, string> = {
  'PZ-Base': '#007AC2',
  'TPC': '#D26900',
};

export default function MonitoringPage() {
  const params = useParams();
  const siteId = Number(params?.id);
  const [site, setSite] = useState<SiteData | null>(null);
  const [thresholds, setThresholds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [latest, setLatest] = useState<Record<string, number | null>>({});
  const [recentlyChanged, setRecentlyChanged] = useState<Set<string>>(new Set());
  const prevLatestRef = useRef<Record<string, number | null>>({});

  useEffect(() => {
    if (Object.keys(latest).length === 0) return;
    const prev = prevLatestRef.current;
    if (Object.keys(prev).length > 0) {
      const changed = new Set<string>();
      Object.keys(latest).forEach(name => {
        if (prev[name] !== latest[name]) changed.add(name);
      });
      if (changed.size > 0) {
        setRecentlyChanged(changed);
        const t = setTimeout(() => setRecentlyChanged(new Set()), 1200);
        prevLatestRef.current = latest;
        return () => clearTimeout(t);
      }
    }
    prevLatestRef.current = latest;
  }, [latest]);

  useEffect(() => {
    if (!siteId) return;
    Promise.all([
      api.getSite(siteId),
      api.getThresholds(siteId).catch(() => []),
    ])
      .then(([s, t]) => { setSite(s); setThresholds(Array.isArray(t) ? t : []); })
      .catch(e => setError(e.message || 'Failed to load site'))
      .finally(() => setLoading(false));
  }, [siteId]);

  if (loading) return <div style={{ display: 'grid', placeItems: 'center', flex: 1 }}><div className="spinner" /></div>;
  if (error)   return <div style={{ padding: 24, color: '#DC2626' }}>{error}</div>;
  if (!site)   return null;

  const sensorNames = site.sensors.map(s => s.sensor_name);
  // If all sensors share the same unit, put them all on a single shared axis
  // (so the lines are visually comparable). Only fall back to dual-axis when
  // units actually differ.
  const allUnits = Array.from(new Set(site.sensors.map(s => s.unit).filter(Boolean)));
  const allSameUnit = allUnits.length <= 1;
  const leftSensors  = allSameUnit
    ? sensorNames
    : (sensorNames.length >= 1 ? [sensorNames[0]] : []);
  const rightSensors = allSameUnit
    ? []
    : (sensorNames.length >= 2 ? sensorNames.slice(1) : []);

  return (
    <>
      <header style={{
        background: 'white', borderBottom: '1px solid #E2E8F0',
        padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#64748B' }}>Client Portal</span>
          <span style={{ color: '#CBD5E1', margin: '0 6px' }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>{site.site_name}</span>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          padding: '4px 11px 4px 9px',
          background: 'rgba(0, 176, 80, 0.08)',
          border: '1px solid rgba(0, 176, 80, 0.3)',
          borderRadius: 12,
          fontSize: 11, color: '#00B050', fontWeight: 600,
          letterSpacing: 0.4, textTransform: 'uppercase',
        }}>
          <span style={{ width: 6, height: 6, background: '#00B050', borderRadius: '50%', animation: 'live-pulse 1.6s infinite' }} />
          Live · streaming
        </div>
      </header>

      <div style={{ padding: '20px 32px 0', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1E293B', letterSpacing: '-0.3px' }}>{site.site_name}</h1>
            <p style={{ fontSize: 13, color: '#64748B', marginTop: 3 }}>
              {site.client_name} · {site.sensors.length} sensor{site.sensors.length !== 1 ? 's' : ''} streaming
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
            {site.sensors.slice(0, 3).map(s => {
              const val = latest[s.sensor_name];
              const color = SENSOR_COLORS[s.sensor_name] || '#2D5A8E';
              const isFlashing = recentlyChanged.has(s.sensor_name);
              return (
                <div key={s.id} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                  padding: '5px 11px', borderRadius: 6,
                  background: isFlashing ? 'rgba(0, 122, 194, 0.12)' : 'transparent',
                  transition: 'background 0.7s ease-out',
                  position: 'relative',
                }}>
                  <span style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5,
                    color: '#94A3B8', fontWeight: 600, marginBottom: 2 }}>{s.sensor_name}</span>
                  <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 600, color }}>
                    {val != null ? `${val.toFixed(1)} ${s.unit}` : `— ${s.unit}`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{
        flex: 1, padding: '16px 32px 32px',
        display: 'grid', gridTemplateRows: 'minmax(280px, 0.85fr) minmax(0, 1.15fr)',
        gap: 16, overflow: 'hidden', minHeight: 0,
      }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
          minHeight: 0, overflow: 'hidden',
        }}>
          <CameraPanel videoUrl={site.video_url || ''} siteName={site.site_name} />
          <MapPanel latitude={site.latitude} longitude={site.longitude} siteName={site.site_name} />
        </div>
        <StreamingChart
          siteId={siteId}
          leftSensors={leftSensors}
          rightSensors={rightSensors}
          thresholds={thresholds}
          pollIntervalMs={5_000}
          onLatestUpdate={setLatest}
          sharedScale={allSameUnit}
        />
      </div>

      <style jsx>{`
        @keyframes live-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(0, 176, 80, 0.6); }
          70%  { box-shadow: 0 0 0 7px rgba(0, 176, 80, 0); }
          100% { box-shadow: 0 0 0 0 rgba(0, 176, 80, 0); }
        }
      `}</style>
    </>
  );
}
