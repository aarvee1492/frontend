'use client';

import { useEffect, useState, useRef } from 'react';
import DualAxisChart from './DualAxisChart';
import { api } from '@/lib/api';
import { LayoutPanelTop, GalleryVertical } from 'lucide-react';

interface StreamingChartProps {
  siteId: number;
  leftSensors: string[];
  rightSensors: string[];
  pollIntervalMs?: number;
  thresholds?: any[];
  onLatestUpdate?: (latest: Record<string, number | null>) => void;
  sharedScale?: boolean;
}

type Mode = 'combined' | 'separate';

export default function StreamingChart({
  siteId, leftSensors, rightSensors,
  pollIntervalMs = 30_000, thresholds = [], onLatestUpdate,
  sharedScale = false,
}: StreamingChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>(() => {
    if (typeof window === 'undefined') return 'combined';
    return (localStorage.getItem('btls2_chart_mode') as Mode) || 'combined';
  });
  const fetchingRef = useRef(false);
  const onLatestUpdateRef = useRef(onLatestUpdate);

  useEffect(() => { onLatestUpdateRef.current = onLatestUpdate; }, [onLatestUpdate]);

  useEffect(() => {
    const sensors = [...leftSensors, ...rightSensors];
    if (sensors.length === 0) return;
    const fetchData = async () => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      try {
        const res = await api.getChartData(siteId, sensors, false);
        const points = res.data || [];
        setData(points);
        setStreaming(Boolean(res.streaming));
        setLastUpdate(new Date());
        setError(null);
        if (points.length > 0 && onLatestUpdateRef.current) {
          const latest = points[points.length - 1];
          const out: Record<string, number | null> = {};
          sensors.forEach(s => { out[s] = latest[s] ?? null; });
          onLatestUpdateRef.current(out);
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load chart data');
      } finally {
        fetchingRef.current = false;
      }
    };
    fetchData();
    const t = setInterval(fetchData, pollIntervalMs);
    return () => clearInterval(t);
  }, [siteId, leftSensors.join('|'), rightSensors.join('|'), pollIntervalMs]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('btls2_chart_mode', mode);
  }, [mode]);

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', flex: 1 }}>
      <div className="card-header" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
          <LayoutPanelTop size={16} style={{ color: '#2D5A8E' }} />
          Sensor Readings
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#64748B' }}>
            <span style={{ color: '#007AC2', fontWeight: 700 }}>{data.length.toLocaleString()}</span> readings logged
            {streaming && lastUpdate && (
              <> · last update <RelativeTime ts={lastUpdate} /></>
            )}
          </span>
          <ToggleGroup mode={mode} onChange={setMode} />
        </div>
      </div>

      <div style={{ flex: 1, padding: '12px 12px 4px', minHeight: 0, position: 'relative' }}>
        {error && (
          <div style={{ padding: 12, background: '#FEF2F2', border: '1px solid #FECACA',
            borderRadius: 6, color: '#DC2626', fontSize: 13, margin: 12 }}>{error}</div>
        )}
        {data.length === 0 && !error && (
          <div style={{ height: '100%', display: 'grid', placeItems: 'center', color: '#94A3B8', fontSize: 13 }}>
            Waiting for sensor data…
          </div>
        )}
        {data.length > 0 && mode === 'combined' && (
          <DualAxisChart data={data} leftSensors={leftSensors} rightSensors={rightSensors}
            title="" thresholds={thresholds} showDownload autoScale={!sharedScale} sharedScale={sharedScale} />
        )}
        {data.length > 0 && mode === 'separate' && (() => {
          const allSensors = [...leftSensors, ...rightSensors];
          return (
            <div style={{ display: 'grid', gridTemplateRows: `repeat(${allSensors.length}, 1fr)`, gap: 12, height: '100%' }}>
              {allSensors.map(name => (
                <DualAxisChart
                  key={name}
                  data={data}
                  leftSensors={[name]}
                  rightSensors={[]}
                  title={name}
                  thresholds={thresholds.filter(t => t.sensor_name === name)}
                  autoScale
                />
              ))}
            </div>
          );
        })()}
      </div>
    </section>
  );
}

function ToggleGroup({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const btn = (m: Mode, label: string, icon: React.ReactNode) => (
    <button onClick={() => onChange(m)} style={{
      padding: '4px 12px', background: mode === m ? '#2D5A8E' : 'transparent',
      color: mode === m ? 'white' : '#64748B',
      boxShadow: mode === m ? '0 1px 2px rgba(45,90,142,0.3)' : 'none',
      border: 'none', borderRadius: 4, cursor: 'pointer',
      fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600,
      letterSpacing: 0.1, display: 'inline-flex', alignItems: 'center', gap: 5, transition: 'all 0.15s',
    }}>{icon} {label}</button>
  );
  return (
    <div style={{ display: 'inline-flex', background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 6, padding: 2 }}>
      {btn('combined', 'Combined', <LayoutPanelTop size={12} />)}
      {btn('separate', 'Separate', <GalleryVertical size={12} />)}
    </div>
  );
}

function RelativeTime({ ts }: { ts: Date }) {
  const [, force] = useState(0);
  useEffect(() => {
    const t = setInterval(() => force(n => n + 1), 1000);
    return () => clearInterval(t);
  }, []);
  const secs = Math.floor((Date.now() - ts.getTime()) / 1000);
  if (secs < 2) return <>just now</>;
  if (secs < 60) return <>{secs}s ago</>;
  return <>{Math.floor(secs / 60)}m ago</>;
}
