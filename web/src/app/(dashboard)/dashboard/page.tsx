const STAT_CARDS = [
  { label: 'Active Cases', value: 0, color: 'var(--accent-gold)' },
  { label: 'Clients', value: 0, color: 'var(--heading)' },
  { label: 'Pending Documents', value: 0, color: 'var(--success)' },
  { label: 'Upcoming Deadlines', value: 0, color: 'var(--error)' },
];

export default function DashboardPage() {
  return (
    <div className="p-6 md:p-8 max-w-6xl">
      <h1
        className="text-2xl font-semibold mb-6"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Welcome to Case Keeper
      </h1>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <div
              className="text-sm"
              style={{ color: 'var(--muted)' }}
            >
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
            Recent Activity
          </h2>
          <p
            className="text-sm py-8 text-center"
            style={{ color: 'var(--muted)' }}
          >
            No recent activity
          </p>
        </div>

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
            Upcoming
          </h2>
          <p
            className="text-sm py-8 text-center"
            style={{ color: 'var(--muted)' }}
          >
            No upcoming events
          </p>
        </div>
      </div>
    </div>
  );
}
