'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-r-lg transition-colors"
      style={{
        color: isActive ? 'var(--accent-gold)' : 'var(--foreground)',
        background: isActive ? 'var(--accent-gold-muted)' : 'transparent',
        borderLeft: isActive ? '3px solid var(--accent-gold)' : '3px solid transparent',
      }}
    >
      <span style={{ color: isActive ? 'var(--accent-gold)' : 'var(--muted)' }}>
        {icon}
      </span>
      {label}
    </Link>
  );
}
