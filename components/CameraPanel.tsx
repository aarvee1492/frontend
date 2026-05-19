'use client';

import { useEffect, useState } from 'react';
import { Video, Maximize2, AlertCircle } from 'lucide-react';

interface CameraPanelProps {
  videoUrl: string;
  siteName: string;
}

type SourceType = 'youtube' | 'vimeo' | 'video' | 'none' | 'iframe';

function detectSourceType(url: string): SourceType {
  if (!url) return 'none';
  const u = url.toLowerCase().trim();
  if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
  if (u.includes('vimeo.com')) return 'vimeo';
  if (/\.(mp4|webm|ogg|m4v|mov)(\?|$)/i.test(u)) return 'video';
  return 'iframe';
}

function toYouTubeEmbed(url: string): string {
  // Strip every bit of YouTube chrome we're allowed to via URL parameters.
  // Paired with pointer-events:none on the iframe in the render below, this
  // completely eliminates the hover overlays (title bar, "Watch on YouTube" link,
  // related-video grid). The video plays silently and continuously, like a real
  // live camera stream.
  //
  // YouTube's loop=1 only works when paired with playlist=VIDEO_ID pointing to
  // the same video.
  const params = (videoId: string) => [
    'autoplay=1',
    'mute=1',
    'loop=1',
    `playlist=${videoId}`,
    'controls=0',          // hide bottom controls bar
    'modestbranding=1',    // minimize YouTube logo
    'rel=0',               // no related videos at end
    'iv_load_policy=3',    // hide annotations
    'disablekb=1',         // disable keyboard interactions
    'fs=0',                // hide native fullscreen button (we have our own)
    'playsinline=1',       // play inline on mobile (no fullscreen takeover)
  ].join('&');

  // youtu.be/VIDEO_ID
  let m = url.match(/youtu\.be\/([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?${params(m[1])}`;
  // youtube.com/watch?v=VIDEO_ID
  m = url.match(/[?&]v=([\w-]+)/);
  if (m) return `https://www.youtube.com/embed/${m[1]}?${params(m[1])}`;
  // youtube.com/embed/VIDEO_ID — already an embed, just append loop params
  m = url.match(/\/embed\/([\w-]+)/);
  if (m) {
    const sep = url.includes('?') ? '&' : '?';
    return url + `${sep}${params(m[1])}`;
  }
  return url;
}

function toVimeoEmbed(url: string): string {
  const m = url.match(/vimeo\.com\/(\d+)/);
  if (m) return `https://player.vimeo.com/video/${m[1]}?autoplay=1&muted=1&loop=1&title=0&byline=0&portrait=0&controls=0`;
  return url;
}

export default function CameraPanel({ videoUrl, siteName }: CameraPanelProps) {
  const [now, setNow] = useState<Date>(new Date());
  const [fsRef, setFsRef] = useState<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const type = detectSourceType(videoUrl);
  const handleFullscreen = () => {
    if (!fsRef) return;
    if (!document.fullscreenElement) fsRef.requestFullscreen?.();
    else document.exitFullscreen?.();
  };

  return (
    <section className="card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="card-header" style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, fontWeight: 600, color: '#1E293B' }}>
          <Video size={16} style={{ color: '#2D5A8E' }} />
          Site Camera Feed
        </div>
        <button className="btn-secondary" onClick={handleFullscreen} style={{ fontSize: 11.5, padding: '5px 10px' }}>
          <Maximize2 size={12} /> Fullscreen
        </button>
      </div>

      <div ref={setFsRef} style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden', minHeight: 240 }}>
        {type === 'none' && <CameraPlaceholder message="No camera URL configured for this site" />}
        {type === 'youtube' && (
          <iframe src={toYouTubeEmbed(videoUrl)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
            allow="autoplay; encrypted-media; fullscreen" allowFullScreen title="Site camera feed" />
        )}
        {type === 'vimeo' && (
          <iframe src={toVimeoEmbed(videoUrl)}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0, pointerEvents: 'none' }}
            allow="autoplay; encrypted-media; fullscreen" allowFullScreen title="Site camera feed" />
        )}
        {type === 'video' && (
          <video src={videoUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', background: '#0a0a0a' }}
            autoPlay loop muted playsInline controls />
        )}
        {type === 'iframe' && (
          <iframe src={videoUrl}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
            allow="autoplay; encrypted-media; fullscreen" allowFullScreen title="Site camera feed" />
        )}

        {type !== 'none' && (
          <>
            <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 5 }}>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(220, 38, 38, 0.18)', border: '1px solid rgba(220, 38, 38, 0.55)',
                padding: '3px 9px 3px 7px', borderRadius: 12,
                fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                color: 'white', fontWeight: 700, letterSpacing: 1,
              }}>
                <span style={{ width: 6, height: 6, background: '#DC2626', borderRadius: '50%', animation: 'cam-blink 1.4s infinite' }} />
                REC
              </div>
            </div>
            <div style={{
              position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 5,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(255,255,255,0.88)',
              letterSpacing: 0.4, pointerEvents: 'none',
            }}>
              <div style={{ background: 'rgba(0,0,0,0.55)', padding: '4px 10px', borderRadius: 4, backdropFilter: 'blur(4px)' }}>
                {now.toISOString().slice(0, 19).replace('T', ' ')}
              </div>
              <div style={{ background: 'rgba(0,0,0,0.55)', padding: '4px 10px', borderRadius: 4, color: '#D4D4D4', backdropFilter: 'blur(4px)' }}>
                {siteName}
              </div>
            </div>
          </>
        )}
      </div>

      <style jsx>{`
        @keyframes cam-blink { 0%, 50% { opacity: 1; } 51%, 100% { opacity: 0.25; } }
      `}</style>
    </section>
  );
}

function CameraPlaceholder({ message }: { message: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.55)' }}>
      <div style={{ textAlign: 'center' }}>
        <AlertCircle size={32} style={{ color: 'rgba(0, 160, 255, 0.4)', marginBottom: 8 }} />
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.4, color: 'rgba(255,255,255,0.55)' }}>
          {message}
        </div>
        <div style={{ marginTop: 8, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          Admin can set the camera URL in the site editor
        </div>
      </div>
    </div>
  );
}
