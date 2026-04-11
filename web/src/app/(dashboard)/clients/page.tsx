export default function ClientsPage() {
  const hasClients = false;

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
          className="rounded-lg px-4 py-2 text-sm font-medium text-white"
          style={{ background: 'var(--accent-gold)' }}
        >
          Add Client
        </button>
      </div>

      {hasClients ? (
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
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Name</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Phone</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Email</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Cases</th>
                <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Status</th>
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
            No clients yet. Add your first client to get started.
          </p>
          <button
            className="rounded-lg px-4 py-2 text-sm font-medium text-white"
            style={{ background: 'var(--accent-gold)' }}
          >
            Add Client
          </button>
        </div>
      )}
    </div>
  );
}
