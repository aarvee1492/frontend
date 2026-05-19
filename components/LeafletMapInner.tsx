'use client';

import { useRef } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, LayersControl, ScaleControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Crosshair } from 'lucide-react';

// Custom AME-blue drop pin as an inline SVG, served as a data URI so it works
// in production without any image-asset path quirks.
const PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36">
  <path d="M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z" fill="#2D5A8E" stroke="white" stroke-width="2"/>
  <circle cx="12" cy="12" r="4.5" fill="white"/>
</svg>`;

const pinIcon = L.icon({
  iconUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(PIN_SVG),
  iconSize: [28, 36],
  iconAnchor: [14, 36],
});

const ESRI_SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ESRI_SATELLITE_ATTRIB =
  'Tiles &copy; Esri';

const ESRI_STREET_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
const ESRI_STREET_ATTRIB =
  'Tiles &copy; Esri';

interface Props {
  lat: number;
  lng: number;
  siteName: string;
}

export default function LeafletMapInner({ lat, lng, siteName }: Props) {
  const mapRef = useRef<L.Map | null>(null);

  const handleRecenter = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (mapRef.current) {
      mapRef.current.flyTo([lat, lng], 17, { duration: 0.8 });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapContainer
        ref={mapRef}
        center={[lat, lng]}
        zoom={17}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#0a0a0a' }}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="Satellite">
            <TileLayer url={ESRI_SATELLITE_URL} attribution={ESRI_SATELLITE_ATTRIB} maxZoom={19} />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Street">
            <TileLayer url={ESRI_STREET_URL} attribution={ESRI_STREET_ATTRIB} maxZoom={19} />
          </LayersControl.BaseLayer>
        </LayersControl>

        <Marker position={[lat, lng]} icon={pinIcon} />

        <ScaleControl position="bottomleft" imperial metric />
      </MapContainer>

      {/* Center-on-site control — sits above the Leaflet pane */}
      <button
        onClick={handleRecenter}
        title="Center on site"
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          zIndex: 1000,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: 'white',
          border: '1px solid #E2E8F0',
          borderRadius: 6,
          fontSize: 11,
          fontWeight: 600,
          color: '#2D5A8E',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          fontFamily: 'DM Sans, sans-serif',
        }}
      >
        <Crosshair size={12} /> Center on site
      </button>
    </div>
  );
}
