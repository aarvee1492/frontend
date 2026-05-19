'use client';

import dynamic from 'next/dynamic';
import { MapPin, ExternalLink, AlertCircle } from 'lucide-react';

// Leaflet requires `window`, so it can't render server-side.
// Dynamic-import with ssr:false defers loading until the browser is ready.
const LeafletMapInner = dynamic(() => import('./LeafletMapInner'), {
  ssr: false,
  loading: () => (
    <div style={{
      display: 'grid', placeItems: 'center', height: '100%',
      background: '#0a0a0a', color: 'rgba(255,255,255,0.4)', fontSize: 11,
      fontFamily: 'JetBrains Mono, monospace', letterSpacing: 1, textTransform: 'uppercase',
    }}>
      Loading map…
    </div>
  ),
});

interface MapPanelProps {
  latitude: number | null;
  longitude: number | null;
  siteName: string;
}

export default function MapPanel({ latitude, longitude, siteName }: MapPanelProps) {
  const hasCoords = latitude != null && longitude != null;

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
          <MapPin size={16} style={{ color: '#2D5A8E' }} />
          Site Location
        </div>
        {hasCoords && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: 11.5, padding: '5px 10px', textDecoration: 'none' }}
          >
            <ExternalLink size={12} /> Open in Maps
          </a>
        )}
      </div>

      <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden', minHeight: 240 }}>
        {!hasCoords ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: '#F1F5F9', color: '#94A3B8' }}>
            <div style={{ textAlign: 'center' }}>
              <AlertCircle size={32} style={{ color: '#CBD5E1', marginBottom: 8 }} />
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase',
                letterSpacing: 1.4, color: '#94A3B8',
              }}>
                No coordinates configured for this site
              </div>
              <div style={{ marginTop: 8, fontSize: 11, color: '#CBD5E1' }}>
                Admin can set latitude and longitude in the site editor
              </div>
            </div>
          </div>
        ) : (
          <LeafletMapInner lat={latitude!} lng={longitude!} siteName={siteName} />
        )}

        {/* Coordinate label overlay — mirrors the camera panel's site label.
            zIndex 1100 to sit above Leaflet controls (z-index ≤ 1000). */}
        {hasCoords && (
          <div style={{
            position: 'absolute', bottom: 12, right: 12, zIndex: 1100,
            background: 'rgba(255,255,255,0.92)',
            padding: '4px 10px', borderRadius: 4,
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5,
            color: '#1E293B', fontWeight: 600, letterSpacing: 0.3,
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            border: '1px solid #E2E8F0',
            pointerEvents: 'none',
          }}>
            {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
          </div>
        )}
      </div>
    </section>
  );
}
