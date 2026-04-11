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

const EVENT_TYPE_COLORS: Record<string, string> = {
  hearing: '#dc2626',
  deadline: '#d97706',
  appointment: '#2563eb',
  milestone: '#16a34a',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DemoPlatformDashboard() {
  const { cases, clients, events, attorneys, stats } = DEMO_PLATFORM_DATA;

  const upcomingEvents = events
    .filter((e) => !e.completed)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 7);

  const recentCases = [...cases]
    .sort((a, b) => b.opened_date.localeCompare(a.opened_date))
    .slice(0, 5);

  const immigrationCount = cases.filter((c) => c.type === 'immigration').length;
  const familyCount = cases.filter((c) => c.type === 'family').length;
  const criminalCount = cases.filter((c) => c.type === 'criminal').length;

  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getAttorney = (id: string) => attorneys.find((a) => a.id === id);
  const getCaseForEvent = (caseId: string) => cases.find((c) => c.id === caseId);

  const STAT_CARDS = [
    { label: 'Active Cases', value: stats.active_cases, color: 'var(--accent-gold)' },
    { label: 'Clients', value: stats.total_clients, color: 'var(--heading)' },
    { label: 'Pending Documents', value: stats.pending_documents, color: 'var(--success)' },
    { label: 'Upcoming Deadlines', value: stats.upcoming_deadlines, color: 'var(--error)' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1
        className="text-2xl font-semibold mb-6"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Dashboard
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {STAT_CARDS.map((card) => (
          <div
            key={card.label}
            className="rounded-lg p-5"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              borderLeft: `4px solid ${card.color}`,
            }}
          >
            <div
              className="text-3xl font-bold mb-1"
              style={{ color: 'var(--heading)' }}
            >
              {card.value}
            </div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Revenue Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
            Revenue This Month
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: 'var(--success)' }}
          >
            ${stats.revenue_this_month.toLocaleString()}
          </div>
        </div>
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
            Outstanding Balance
          </div>
          <div
            className="text-2xl font-bold"
            style={{ color: 'var(--warning)' }}
          >
            ${stats.outstanding_balance.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Two-column layout: Events + Recent Cases */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Upcoming Events */}
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Upcoming Events
          </h2>
          <div className="flex flex-col gap-3">
            {upcomingEvents.map((evt) => {
              const caseData = getCaseForEvent(evt.case_id);
              return (
                <div
                  key={evt.id}
                  className="flex items-start gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: EVENT_TYPE_COLORS[evt.type] || '#6b7280',
                      marginTop: 6,
                      flexShrink: 0,
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-sm font-medium truncate"
                      style={{ color: 'var(--heading)' }}
                    >
                      {evt.title}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span
                        className="text-xs"
                        style={{ color: 'var(--muted)' }}
                      >
                        {caseData?.case_number}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {formatDate(evt.date)}
                      </span>
                    </div>
                  </div>
                  <Badge label={evt.type} color={EVENT_TYPE_COLORS[evt.type] || '#6b7280'} />
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Cases */}
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Recent Cases
          </h2>
          <div className="flex flex-col gap-3">
            {recentCases.map((c) => {
              const client = getClient(c.client_id);
              const attorney = getAttorney(c.attorney_id);
              return (
                <div
                  key={c.id}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium"
                        style={{ color: 'var(--heading)' }}
                      >
                        {c.case_number}
                      </span>
                      <Badge label={c.type} color={TYPE_COLORS[c.type]} />
                      <Badge label={c.status} color={STATUS_COLORS[c.status]} />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: 'var(--muted)' }}>
                        {client ? `${client.first_name} ${client.last_name}` : '--'}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {attorney?.name}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Practice Area Breakdown */}
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Practice Area Breakdown
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Immigration', count: immigrationCount, color: TYPE_COLORS.immigration },
          { label: 'Family', count: familyCount, color: TYPE_COLORS.family },
          { label: 'Criminal', count: criminalCount, color: TYPE_COLORS.criminal },
        ].map((area) => (
          <div
            key={area.label}
            className="rounded-lg p-5 text-center"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              borderTop: `3px solid ${area.color}`,
            }}
          >
            <div
              className="text-2xl font-bold mb-1"
              style={{ color: area.color }}
            >
              {area.count}
            </div>
            <div className="text-sm" style={{ color: 'var(--muted)' }}>
              {area.label} cases
            </div>
          </div>
        ))}
      </div>

      {/* Team Activity + Training Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Team Activity */}
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Team Activity
          </h2>
          <div className="flex flex-col gap-3">
            {[
              { text: 'Maria asked a question on Gutierrez Asylum', time: '2 hours ago', color: '#7c3aed' },
              { text: 'Attorney Attum approved Htoo Paw I-485 review', time: 'Yesterday', color: '#16a34a' },
              { text: 'Maria completed training: Responding to RFEs (Score: 90%)', time: '2 days ago', color: '#2563eb' },
              { text: 'Attorney Attum answered question on Meh/Cardona case', time: '2 days ago', color: '#b8860b' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 py-1.5"
                style={{ borderBottom: idx < 3 ? '1px solid var(--border-light)' : 'none' }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: item.color,
                    marginTop: 6,
                    flexShrink: 0,
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm" style={{ color: 'var(--foreground)' }}>
                    {item.text}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-light)' }}>
                    {item.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training Progress */}
        <div
          className="rounded-lg p-5"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Training Progress
          </h2>
          <div className="flex items-center gap-3 mb-3">
            <span
              className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
              style={{ width: 32, height: 32, background: '#7c3aed', color: '#fff' }}
            >
              ML
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                Maria Lopez
              </div>
              <div className="text-xs" style={{ color: 'var(--muted-light)' }}>
                68% overall
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2.5">
            {[
              { label: 'Immigration', completed: 12, total: 15, color: '#16a34a' },
              { label: 'Family Law', completed: 8, total: 12, color: '#d97706' },
              { label: 'Criminal Defense', completed: 3, total: 10, color: '#dc2626' },
            ].map((area) => {
              const pct = Math.round((area.completed / area.total) * 100);
              return (
                <div key={area.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {area.label}
                    </span>
                    <span className="text-xs font-medium" style={{ color: area.color }}>
                      {area.completed}/{area.total}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: 6,
                      borderRadius: 3,
                      background: 'var(--border-light)',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        borderRadius: 3,
                        background: area.color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
