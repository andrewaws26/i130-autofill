export default function DocumentsPage() {
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
          Documents
        </h1>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            border: '1px solid var(--border)',
            color: 'var(--foreground)',
          }}
        >
          Upload
        </button>
      </div>

      {/* Empty state */}
      <div
        className="rounded-lg p-12 text-center"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <p
          className="text-sm"
          style={{ color: 'var(--muted)' }}
        >
          No documents yet.
        </p>
      </div>
    </div>
  );
}
