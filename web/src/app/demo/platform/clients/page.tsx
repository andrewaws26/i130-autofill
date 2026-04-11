'use client';

import { DEMO_PLATFORM_DATA } from '@/lib/demo-platform-data';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: '0.75rem',
        fontWeight: 600,
        background: color + '18',
        color: color,
        textTransform: 'capitalize',
      }}
    >
      {label}
    </span>
  );
}

const LANGUAGE_COLORS: Record<string, string> = {
  English: '#6b7280',
  Spanish: '#d97706',
  Karen: '#7c3aed',
  Burmese: '#0891b2',
};

export default function DemoClientsPage() {
  const { clients, cases } = DEMO_PLATFORM_DATA;

  const getCaseCount = (clientId: string) =>
    cases.filter((c) => c.client_id === clientId).length;

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-2xl font-semibold"
          style={{
            fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
            color: 'var(--heading)',
          }}
        >
          Clients
        </h1>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium text-white cursor-default"
          style={{ background: 'var(--accent-gold)' }}
        >
          Add Client
        </button>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search clients..."
          className="form-input"
          style={{ maxWidth: 360 }}
          readOnly
        />
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden flex flex-col gap-3">
        {clients.map((client) => (
          <div
            key={client.id}
            className="rounded-lg p-4"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div className="font-medium text-sm mb-1" style={{ color: 'var(--accent-gold)' }}>
              {client.first_name} {client.last_name}
            </div>
            <div className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
              {client.phone}
            </div>
            <div className="flex items-center gap-3 mb-2">
              <Badge
                label={client.preferred_language}
                color={LANGUAGE_COLORS[client.preferred_language] || '#6b7280'}
              />
              <span className="text-xs" style={{ color: 'var(--heading)' }}>
                {getCaseCount(client.id)} case{getCaseCount(client.id) !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              {client.country_of_birth}
            </div>
          </div>
        ))}
      </div>

      {/* Table (desktop) */}
      <div
        className="hidden md:block rounded-lg overflow-x-auto"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <table className="w-full text-sm">
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--background)',
              }}
            >
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Name</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Phone</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Email</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Language</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Cases</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Country of Birth</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr
                key={client.id}
                style={{ borderBottom: '1px solid var(--border-light)' }}
              >
                <td className="px-4 py-3">
                  <span
                    className="font-medium"
                    style={{ color: 'var(--accent-gold)', cursor: 'pointer' }}
                  >
                    {client.first_name} {client.last_name}
                  </span>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                  {client.phone}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                  {client.email}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    label={client.preferred_language}
                    color={LANGUAGE_COLORS[client.preferred_language] || '#6b7280'}
                  />
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--heading)' }}>
                  {getCaseCount(client.id)}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                  {client.country_of_birth}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
