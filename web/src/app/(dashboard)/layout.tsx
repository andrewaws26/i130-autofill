import { SidebarToggle } from './sidebar-toggle';
import { NavLink } from './nav-link';

const ICONS = {
  grid: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="7" height="7" rx="1" />
      <rect x="11" y="2" width="7" height="7" rx="1" />
      <rect x="2" y="11" width="7" height="7" rx="1" />
      <rect x="11" y="11" width="7" height="7" rx="1" />
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
  edit: (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 2.5l4 4L6 18H2v-4L13.5 2.5z" />
      <line x1="11" y1="5" x2="15" y2="9" />
    </svg>
  ),
};

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: ICONS.grid },
  { href: '/clients', label: 'Clients', icon: ICONS.users },
  { href: '/cases', label: 'Cases', icon: ICONS.briefcase },
  { href: '/documents', label: 'Documents', icon: ICONS.file },
  { href: '/calendar', label: 'Calendar', icon: ICONS.calendar },
  { href: '/billing', label: 'Billing', icon: ICONS.dollar },
  { href: '/', label: 'Form AutoFill', icon: ICONS.edit },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col md:flex-row"
      style={{ background: 'var(--background)' }}
    >
      <SidebarToggle>
        {/* Sidebar */}
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
      </SidebarToggle>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pt-[53px] md:pt-0">
        {children}
      </main>
    </div>
  );
}
