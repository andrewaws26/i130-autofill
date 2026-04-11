const FILTER_TABS = ['All', 'Active', 'Pending', 'Closed'];

export default function CasesPage() {
  const hasCases = false;
  const activeTab = 'All';

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
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--accent-gold)' }}
        >
          New Case
        </button>
      </div>

      {/* Filter tabs */}
      <div
        className="flex gap-1 mb-6 p-1 rounded-lg w-fit"
        style={{ background: 'var(--background)', border: '1px solid var(--border-light)' }}
      >
        {FILTER_TABS.map((tab) => (
          <button
            key={tab}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
            style={{
              background: tab === activeTab ? 'var(--card-bg)' : 'transparent',
              color: tab === activeTab ? 'var(--heading)' : 'var(--muted)',
              boxShadow: tab === activeTab ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {hasCases ? (
        /* Table */
        <div
          className="rounded-lg overflow-hidden"
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Case #</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Client</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Type</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Status</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Attorney</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Next Date</th>
              </tr>
            </thead>
            <tbody>
              {/* Rows will be populated from Supabase */}
            </tbody>
          </table>
        </div>
      ) : (
        /* Empty state */
        <div
          className="rounded-lg p-12 text-center"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--muted)' }}
          >
            No cases yet. Create a new case to get started.
          </p>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--accent-gold)' }}
          >
            New Case
          </button>
        </div>
      )}
    </div>
  );
}
