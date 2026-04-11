'use client';

import { useState } from 'react';
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

const TYPE_COLORS: Record<string, string> = {
  immigration: '#2563eb',
  family: '#7c3aed',
  criminal: '#dc2626',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#16a34a',
  pending: '#d97706',
  closed: '#6b7280',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

type FilterTab = 'All' | 'Active' | 'Pending' | 'Closed';

export default function DemoCasesPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>('All');
  const { cases, clients, attorneys } = DEMO_PLATFORM_DATA;

  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getAttorney = (id: string) => attorneys.find((a) => a.id === id);

  const filteredCases =
    activeTab === 'All'
      ? cases
      : cases.filter((c) => c.status === activeTab.toLowerCase());

  const tabCounts: Record<FilterTab, number> = {
    All: cases.length,
    Active: cases.filter((c) => c.status === 'active').length,
    Pending: cases.filter((c) => c.status === 'pending').length,
    Closed: cases.filter((c) => c.status === 'closed').length,
  };

  const FILTER_TABS: FilterTab[] = ['All', 'Active', 'Pending', 'Closed'];

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
          Cases
        </h1>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium text-white cursor-default"
          style={{ background: 'var(--accent-gold)' }}
        >
          New Case
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-lg w-fit"
        style={{
          background: 'var(--background)',
          border: '1px solid var(--border-light)',
        }}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              background: tab === activeTab ? 'var(--card-bg)' : 'transparent',
              color: tab === activeTab ? 'var(--heading)' : 'var(--muted)',
              boxShadow: tab === activeTab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {tab} ({tabCounts[tab]})
          </button>
        ))}
      </div>

      {/* Table */}
      <div
        className="rounded-lg overflow-x-auto"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <table className="w-full text-sm" style={{ minWidth: 900 }}>
          <thead>
            <tr
              style={{
                borderBottom: '1px solid var(--border-light)',
                background: 'var(--background)',
              }}
            >
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Case #</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Client</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Type</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Subtype</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Status</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Attorney</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Next Date</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Priority</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((c) => {
              const client = getClient(c.client_id);
              const attorney = getAttorney(c.attorney_id);
              return (
                <tr
                  key={c.id}
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--heading)' }}>
                    {c.case_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                    {client ? `${client.first_name} ${client.last_name}` : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={c.type} color={TYPE_COLORS[c.type]} />
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {c.subtype}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={c.status} color={STATUS_COLORS[c.status]} />
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                    {attorney?.name || '--'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {c.next_date ? (
                      <span>
                        {formatDate(c.next_date)}
                        <br />
                        <span style={{ color: 'var(--muted-light)' }}>{c.next_date_type}</span>
                      </span>
                    ) : (
                      '--'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {c.priority === 'urgent' ? (
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          color: '#dc2626',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#dc2626',
                            display: 'inline-block',
                          }}
                        />
                        Urgent
                      </span>
                    ) : (
                      <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {c.priority}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
