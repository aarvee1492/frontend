'use client';

import React, { useMemo, useRef, useCallback } from 'react';
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Brush, ReferenceLine
} from 'recharts';
import { Download } from 'lucide-react';

const COLORS = ['#007AC2', '#D26900', '#1E8449', '#6C3483', '#148F77', '#BA4A00', '#2471A3', '#922B21', '#17A589', '#C0392B'];

// Renders a pulsing halo only at the last data point. Returns an empty <g>
// for all other indices (Recharts calls this for every point along the line).
function makeLastPointDot(color: string, dataLength: number) {
  return (props: any) => {
    const { cx, cy, index } = props;
    if (cx == null || cy == null || index !== dataLength - 1) {
      return <g key={`d-${index}`} />;
    }
    return (
      <g key={`last-${index}`} style={{ pointerEvents: 'none' }}>
        <circle cx={cx} cy={cy} r={4} fill={color} opacity={0.4}>
          <animate attributeName="r"       values="4;11;4" dur="1.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="1.6s" repeatCount="indefinite" />
        </circle>
        <circle cx={cx} cy={cy} r={3.5} fill={color} stroke="white" strokeWidth={1.5} />
      </g>
    );
  };
}

interface DualAxisChartProps {
  data: any[];
  leftSensors: string[];
  rightSensors: string[];
  title: string;
  leftMin?: number | null;
  leftMax?: number | null;
  rightMin?: number | null;
  rightMax?: number | null;
  autoScale?: boolean;
  thresholds?: { sensor_name: string; condition: string; threshold_value: number | null; threshold_max?: number | null }[];
  showDownload?: boolean;
  sharedScale?: boolean;   // When true, both Y-axes share identical 0-N scale with whole-number ticks
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ts = label ? new Date(label) : null;
  const formatted = ts
    ? ts.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) +
      '  ' + ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div style={{
      background: 'rgba(255,255,255,0.97)', border: '1px solid #E2E8F0',
      borderRadius: 6, padding: '10px 14px', fontSize: 12,
      boxShadow: '0 4px 16px rgba(0,0,0,0.08)', maxWidth: 300,
      fontFamily: 'DM Sans, sans-serif',
    }}>
      <p style={{ fontWeight: 600, color: '#334155', marginBottom: 6, fontSize: 11, borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
        {formatted}
      </p>
      {payload.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 20, marginBottom: 2, padding: '1px 0' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 3, borderRadius: 1, background: entry.color }} />
            <span style={{ color: '#64748B', fontSize: 12 }}>{entry.name}</span>
          </span>
          <span style={{ fontWeight: 600, color: '#1E293B', fontVariantNumeric: 'tabular-nums', fontSize: 12 }}>
            {entry.value != null ? Number(entry.value).toFixed(3) : '—'}
          </span>
        </div>
      ))}
    </div>
  );
}

function CustomLegend({ payload }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 16, paddingTop: 4, flexWrap: 'wrap' }}>
      {payload?.map((entry: any, i: number) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#475569' }}>
          <span style={{ width: 14, height: 3, borderRadius: 1, background: entry.color }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function DualAxisChart({
  data, leftSensors, rightSensors, title,
  leftMin, leftMax, rightMin, rightMax,
  autoScale = true, thresholds = [], showDownload = false,
  sharedScale = false,
}: DualAxisChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    let idx = 0;
    [...leftSensors, ...rightSensors].forEach(s => { map[s] = COLORS[idx % COLORS.length]; idx++; });
    return map;
  }, [leftSensors, rightSensors]);

  const domains = useMemo(() => {
    if (sharedScale) {
      // Unified scale: 0 to (max rounded up to nearest 100), 4 ticks total
      let max = 0;
      const allSensors = [...leftSensors, ...rightSensors];
      data.forEach(d => {
        allSensors.forEach(s => {
          const v = d[s];
          if (v != null && isFinite(v) && v > max) max = v;
        });
      });
      const top = Math.max(100, Math.ceil(max / 100) * 100);
      // Pick a "nice" step for the two intermediate ticks
      const niceSteps = [25, 50, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 2500, 5000];
      const idealStep = top / 3;
      const step = niceSteps.find(s => s >= idealStep) || Math.ceil(idealStep / 100) * 100;
      const ticks = [0, step, step * 2, top];
      return {
        leftDomain:  [0, top] as [number, number],
        rightDomain: [0, top] as [number, number],
        sharedTicks: ticks,
      };
    }
    if (!autoScale) {
      return {
        leftDomain:  [leftMin  != null ? Number(leftMin)  : 'auto', leftMax  != null ? Number(leftMax)  : 'auto'] as [any, any],
        rightDomain: [rightMin != null ? Number(rightMin) : 'auto', rightMax != null ? Number(rightMax) : 'auto'] as [any, any],
        sharedTicks: undefined as number[] | undefined,
      };
    }
    const computeRange = (sensors: string[]): [number, number] => {
      let min = Infinity, max = -Infinity;
      data.forEach(d => {
        sensors.forEach(s => {
          const v = d[s];
          if (v != null && isFinite(v)) { if (v < min) min = v; if (v > max) max = v; }
        });
      });
      if (!isFinite(min)) return [0, 1];
      const padding = (max - min) * 0.08 || 0.5;
      return [min - padding, max + padding];
    };
    return {
      leftDomain:  leftSensors.length  ? computeRange(leftSensors)  : [0, 1] as [number, number],
      rightDomain: rightSensors.length ? computeRange(rightSensors) : [0, 1] as [number, number],
      sharedTicks: undefined as number[] | undefined,
    };
  }, [data, leftSensors, rightSensors, autoScale, sharedScale, leftMin, leftMax, rightMin, rightMax]);

  const formatTimestamp = (ts: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleDownload = useCallback(() => {
    if (!chartRef.current) return;
    const svg = chartRef.current.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const rect = svg.getBoundingClientRect();
    canvas.width = rect.width * 2; canvas.height = rect.height * 2;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.scale(2, 2); ctx.fillStyle = 'white'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `${title || 'chart'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  }, [title]);

  if (!data.length || (!leftSensors.length && !rightSensors.length)) {
    return (
      <div style={{
        height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#94A3B8', fontSize: 14, background: '#FAFBFC', borderRadius: 8, border: '1px dashed #E2E8F0',
      }}>
        Waiting for sensor data…
      </div>
    );
  }

  return (
    <div ref={chartRef} style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {(title || showDownload) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          {title && <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1E293B', margin: 0 }}>{title}</h3>}
          {showDownload && (
            <button onClick={handleDownload} style={{
              display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 4,
              border: '1px solid #E2E8F0', background: 'white', cursor: 'pointer', fontSize: 11,
              color: '#64748B', fontFamily: 'DM Sans, sans-serif',
            }} title="Download chart as PNG">
              <Download size={12} /> Download
            </button>
          )}
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis
              dataKey="timestamp" tickFormatter={formatTimestamp}
              tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'DM Sans' }}
              axisLine={{ stroke: '#E2E8F0' }} tickLine={false} dy={4}
            />
            <YAxis
              yAxisId="left" domain={domains.leftDomain as any}
              allowDataOverflow={!autoScale && !sharedScale}
              ticks={domains.sharedTicks as any}
              tickFormatter={sharedScale ? (v: number) => String(Math.round(v)) : undefined}
              tick={{ fontSize: 10, fill: sharedScale ? '#64748B' : '#007AC2', fontFamily: 'DM Sans' }}
              axisLine={{ stroke: '#E2E8F0' }} tickLine={false} width={60}
            />
            {(rightSensors.length > 0 || sharedScale) && (
              <YAxis
                yAxisId="right" orientation="right" domain={domains.rightDomain as any}
                allowDataOverflow={!autoScale && !sharedScale}
                ticks={domains.sharedTicks as any}
                tickFormatter={sharedScale ? (v: number) => String(Math.round(v)) : undefined}
                tick={{ fontSize: 10, fill: sharedScale ? '#64748B' : '#D26900', fontFamily: 'DM Sans' }}
                axisLine={{ stroke: sharedScale ? '#E2E8F0' : '#FADBD8' }} tickLine={false} width={60}
              />
            )}
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
            <Brush dataKey="timestamp" height={24} stroke="#4A7FC4" fill="#F8FAFC" tickFormatter={formatTimestamp} travellerWidth={8} />
            {thresholds.map((t, i) => {
              const isLeft = leftSensors.includes(t.sensor_name);
              const isRight = rightSensors.includes(t.sensor_name);
              if ((!isLeft && !isRight) || t.threshold_value == null) return null;
              return (
                <ReferenceLine key={`th-${i}`} y={t.threshold_value} yAxisId={isLeft ? 'left' : 'right'}
                  stroke="#DC2626" strokeDasharray="6 4" strokeWidth={1}
                  label={{ value: `${t.condition} ${t.threshold_value}`, fill: '#DC2626', fontSize: 9, position: 'insideTopRight', fontFamily: 'DM Sans' }}
                />
              );
            })}
            {leftSensors.map(sensor => (
              <Line key={sensor} yAxisId="left" type="monotone" dataKey={sensor} name={sensor}
                stroke={colorMap[sensor]} strokeWidth={1.8}
                dot={makeLastPointDot(colorMap[sensor], data.length)}
                activeDot={{ r: 4, strokeWidth: 1, fill: 'white', stroke: colorMap[sensor] }}
                connectNulls isAnimationActive={false}
              />
            ))}
            {rightSensors.map(sensor => (
              <Line key={sensor} yAxisId="right" type="monotone" dataKey={sensor} name={sensor}
                stroke={colorMap[sensor]} strokeWidth={1.8} strokeDasharray="6 3"
                dot={makeLastPointDot(colorMap[sensor], data.length)}
                activeDot={{ r: 4, strokeWidth: 1, fill: 'white', stroke: colorMap[sensor] }}
                connectNulls isAnimationActive={false}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
