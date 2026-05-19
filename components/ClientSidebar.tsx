'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { clearToken, getUser, api } from '@/lib/api';
import { LayoutDashboard, Gauge, Bell, User as UserIcon, LogOut, MapPin } from 'lucide-react';

const LOGO_URL = 'https://www.amesouth.com/wp-content/uploads/logo.png';

interface Site { id: number; site_name: string; }
interface ClientInfo { id: number; client_name: string; sites: Site[]; }

export default function ClientSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [user, setUserState] = useState<any>(null);

  useEffect(() => {
    setUserState(getUser());
    api.getMyClient().then(setClient).catch(() => setClient(null));
  }, []);

  const handleLogout = () => { clearToken(); router.push('/'); };

  const siteMatch = pathname.match(/\/dashboard\/sites\/(\d+)/);
  const activeSiteId = siteMatch ? Number(siteMatch[1]) : null;
  const lastSegment = pathname.split('/').pop();
  const isMonitoring = activeSiteId !== null && lastSegment === String(activeSiteId);

  const userInitials = (user?.display_name || user?.email || 'U')
    .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <aside style={{
      width: 240, background: 'white', borderRight: '1px solid #E2E8F0',
      display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', flexShrink: 0,
    }}>
      <div style={{
        padding: '14px 18px', borderBottom: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0,
      }}>
        <img src={LOGO_URL} alt="AME South" style={{ height: 28, objectFit: 'contain' }} />
      </div>

      <div style={{ padding: '18px 10px 4px', overflowY: 'auto', flex: 1 }}>
        <div style={navLabelStyle}>Workspace</div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {(client?.sites || []).map(s => (
            <li key={s.id}>
              <Link href={`/dashboard/sites/${s.id}`} style={{
                ...navItemStyle, ...(activeSiteId === s.id ? navItemActiveStyle : {}),
              }}>
                <MapPin size={15} style={{ flexShrink: 0, opacity: 0.85 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {s.site_name}
                </span>
              </Link>
            </li>
          ))}
          {(!client || client.sites.length === 0) && (
            <li style={{ padding: '8px 10px', color: '#94A3B8', fontSize: 12 }}>
              No sites assigned
            </li>
          )}
        </ul>

        {activeSiteId && (
          <>
            <div style={{ height: 1, background: '#E2E8F0', margin: '12px 4px' }} />
            <div style={navLabelStyle}>Settings</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <SidebarLink href={`/dashboard/sites/${activeSiteId}`} icon={<LayoutDashboard size={15} />} label="Monitoring" active={isMonitoring} />
              <SidebarLink href={`/dashboard/sites/${activeSiteId}/thresholds`}    icon={<Gauge size={15} />}        label="Thresholds"    active={lastSegment === 'thresholds'} />
              <SidebarLink href={`/dashboard/sites/${activeSiteId}/notifications`} icon={<Bell size={15} />}         label="Notifications" active={lastSegment === 'notifications'} />
              <SidebarLink href={`/dashboard/sites/${activeSiteId}/contact`}       icon={<UserIcon size={15} />}     label="Contact Info"  active={lastSegment === 'contact'} />
            </ul>
          </>
        )}
      </div>

      <div style={{
        padding: '14px 14px', borderTop: '1px solid #E2E8F0',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
      }}>
        <div style={{
          width: 30, height: 30, background: '#2D5A8E', borderRadius: '50%',
          color: 'white', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700,
        }}>{userInitials}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{
            fontSize: 12.5, fontWeight: 600, color: '#334155',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{client?.client_name || user?.display_name || 'Client'}</span>
          <span style={{
            fontSize: 10, color: '#94A3B8', textTransform: 'uppercase',
            letterSpacing: '0.6px', fontWeight: 600,
          }}>{user?.role || 'Client'}</span>
        </div>
        <button onClick={handleLogout} title="Logout" style={{
          width: 28, height: 28, borderRadius: 6, border: '1px solid #E2E8F0',
          background: 'white', color: '#94A3B8', display: 'grid', placeItems: 'center', cursor: 'pointer',
        }}>
          <LogOut size={13} />
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active: boolean }) {
  return (
    <li>
      <Link href={href} style={{ ...navItemStyle, ...(active ? navItemActiveStyle : {}) }}>
        <span style={{ display: 'flex', alignItems: 'center', opacity: 0.85 }}>{icon}</span>
        {label}
      </Link>
    </li>
  );
}

const navLabelStyle: React.CSSProperties = {
  fontSize: 10, textTransform: 'uppercase', fontWeight: 700,
  letterSpacing: 0.8, color: '#94A3B8', padding: '0 10px 8px',
};

const navItemStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 6,
  color: '#475569', fontSize: 13, fontWeight: 500, textDecoration: 'none',
  cursor: 'pointer', marginBottom: 1, transition: 'background 0.12s, color 0.12s',
};

const navItemActiveStyle: React.CSSProperties = {
  background: '#EBF2FA', color: '#2D5A8E', fontWeight: 600,
};
