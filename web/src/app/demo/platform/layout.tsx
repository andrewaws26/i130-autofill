'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const ICONS = {
  grid: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
    </svg>
  ),
  workflow: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="5" height="4" rx="1" />
      <rect x="7.5" y="8" width="5" height="4" rx="1" />
      <rect x="13" y="14" width="5" height="4" rx="1" />
      <path d="M7 4h2.5a1 1 0 011 1v3" />
      <path d="M12.5 10h2a1 1 0 011 1v3" />
    </svg>
  ),
  graduationCap: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 2L1 7l9 5 9-5-9-5z" />
      <path d="M4 9v5c0 1.5 2.7 3 6 3s6-1.5 6-3V9" />
      <line x1="17" y1="7" x2="17" y2="13" />
    </svg>
  ),
  chat: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1h-4l-3 3-3-3H3a1 1 0 01-1-1V5a1 1 0 011-1z" />
      <line x1="6" y1="8" x2="14" y2="8" />
      <line x1="6" y1="11" x2="11" y2="11" />
    </svg>
  ),
  users: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7" cy="6" r="3" />
      <path d="M1 17c0-3 2.5-5 6-5s6 2 6 5" />
      <circle cx="15" cy="6" r="2" />
      <path d="M15 11c2 0 4 1.5 4 4" />
    </svg>
  ),
  briefcase: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="16" height="11" rx="2" />
      <path d="M7 6V4a2 2 0 012-2h2a2 2 0 012 2v2" />
      <line x1="2" y1="11" x2="18" y2="11" />
    </svg>
  ),
  file: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 2h7l5 5v10a2 2 0 01-2 2H5a2 2 0 01-2-2V4a2 2 0 012-2z" />
      <polyline points="12 2 12 7 17 7" />
    </svg>
  ),
  calendar: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="14" rx="2" />
      <line x1="6" y1="2" x2="6" y2="6" />
      <line x1="14" y1="2" x2="14" y2="6" />
      <line x1="2" y1="9" x2="18" y2="9" />
    </svg>
  ),
  dollar: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 5v10" />
      <path d="M7.5 7.5c0-1 1-1.5 2.5-1.5s2.5.5 2.5 1.5-1 1.5-2.5 2-2.5 1-2.5 2 1 1.5 2.5 1.5 2.5-.5 2.5-1.5" />
    </svg>
  ),
  mail: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="12" rx="2" />
      <polyline points="2 4 10 11 18 4" />
    </svg>
  ),
  edit: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 2.5l4 4L6 18H2v-4L13.5 2.5z" />
      <line x1="11" y1="5" x2="15" y2="9" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { href: '/demo/platform', label: 'Dashboard', icon: ICONS.grid },
  { href: '/demo/platform/clients', label: 'Clients', icon: ICONS.users },
  { href: '/demo/platform/cases', label: 'Cases', icon: ICONS.briefcase },
  { href: '/demo/platform/documents', label: 'Documents', icon: ICONS.file },
  { href: '/demo/platform/calendar', label: 'Calendar', icon: ICONS.calendar },
  { href: '/demo/platform/billing', label: 'Billing', icon: ICONS.dollar },
  { href: '/demo/platform/workflow', label: 'Case Workflow', icon: ICONS.workflow },
  { href: '/demo/platform/training', label: 'Training', icon: ICONS.graduationCap },
  { href: '/demo/platform/collaboration', label: 'Collaboration', icon: ICONS.chat },
  { href: '/demo/platform/email', label: 'Email Drafts', icon: ICONS.mail },
  { href: '/demo', label: 'Form AutoFill', icon: ICONS.edit },
];

function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive =
    href === '/demo/platform'
      ? pathname === '/demo/platform'
      : pathname.startsWith(href) && href !== '/demo/platform';

  // Special case: /demo should only match exactly
  const isActiveFinal = href === '/demo' ? pathname === '/demo' : isActive;

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-r-lg transition-colors"
      style={{
        color: isActiveFinal ? 'var(--accent-gold)' : 'var(--foreground)',
        background: isActiveFinal ? 'var(--accent-gold-muted)' : 'transparent',
        borderLeft: isActiveFinal ? '3px solid var(--accent-gold)' : '3px solid transparent',
      }}
    >
      <span style={{ color: isActiveFinal ? 'var(--accent-gold)' : 'var(--muted)' }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

export default function DemoPlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('a')) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [sidebarOpen]);

  // Close sidebar on escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [sidebarOpen]);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col"
      style={{ background: 'var(--background)' }}
    >
      {/* DEMO MODE banner */}
      <div
        style={{
          background: '#2c3e50',
          color: '#fff',
          textAlign: 'center',
          padding: '6px 16px',
          fontSize: '0.75rem',
          fontWeight: 600,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          flexShrink: 0,
        }}
      >
        DEMO MODE -- Sample data only
      </div>

      <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
        {/* Mobile top bar */}
        <div
          className="flex items-center justify-between px-4 py-3 md:hidden"
          style={{
            background: 'var(--card-bg)',
            borderBottom: '1px solid var(--border-light)',
          }}
        >
          <div
            className="text-lg font-semibold"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Case Keeper
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-lg"
            style={{ color: 'var(--foreground)' }}
          >
            {sidebarOpen ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Backdrop overlay on mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`
            fixed top-0 left-0 bottom-0 z-50 w-[240px]
            transition-transform duration-200 ease-in-out
            md:translate-x-0 md:static md:z-auto
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <aside
            className="flex flex-col h-full w-[240px] shrink-0"
            style={{
              background: 'var(--card-bg)',
              borderRight: '1px solid var(--border-light)',
            }}
          >
            {/* Branding */}
            <div className="px-5 pt-6 pb-4">
              <div
                className="text-xl font-semibold tracking-tight"
                style={{
                  fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                  color: 'var(--heading)',
                }}
              >
                Case Keeper
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--muted)' }}
              >
                Attum Law Office
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 flex flex-col gap-0.5 px-2 py-2">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.href}
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                />
              ))}
            </nav>

            {/* Footer */}
            <div
              className="px-5 py-4 text-xs"
              style={{
                color: 'var(--muted-light)',
                borderTop: '1px solid var(--border-light)',
              }}
            >
              Case Keeper 2.0
            </div>
          </aside>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
