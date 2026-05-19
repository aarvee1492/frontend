'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClientSidebar from '@/components/ClientSidebar';
import { getUser } from '@/lib/api';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push('/'); setAuthed(false); }
    else setAuthed(true);
  }, [router]);

  if (authed === null) return null;
  if (!authed) return null;

  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '240px 1fr',
      height: '100vh', width: '100vw', overflow: 'hidden', background: '#F8FAFC',
    }}>
      <ClientSidebar />
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
}
