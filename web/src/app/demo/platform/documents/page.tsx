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

const DOC_TYPE_COLORS: Record<string, string> = {
  form: '#2563eb',
  evidence: '#d97706',
  identity: '#7c3aed',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function DemoDocumentsPage() {
  const { documents, cases, clients, checklists } = DEMO_PLATFORM_DATA;

  const getCase = (id: string) => cases.find((c) => c.id === id);
  const getClient = (id: string) => clients.find((c) => c.id === id);

  // Group documents by case
  const caseIds = Array.from(new Set(documents.map((d) => d.case_id)));
  const groupedDocs = caseIds.map((caseId) => ({
    caseData: getCase(caseId),
    docs: documents.filter((d) => d.case_id === caseId),
    checklist: checklists.filter((ch) => ch.case_id === caseId),
  }));

  // Immigration case IDs for checklist display
  const immigrationCaseIds = cases
    .filter((c) => c.type === 'immigration')
    .map((c) => c.id);

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
          className="rounded-lg px-4 py-2 text-sm font-medium text-white cursor-default"
          style={{ background: 'var(--accent-gold)' }}
        >
          Upload
        </button>
      </div>

      {/* Document groups by case */}
      <div className="flex flex-col gap-6">
        {groupedDocs.map(({ caseData, docs, checklist }) => {
          if (!caseData) return null;
          const client = getClient(caseData.client_id);
          const isImmigration = immigrationCaseIds.includes(caseData.id);

          return (
            <div
              key={caseData.id}
              className="rounded-lg overflow-hidden"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
              }}
            >
              {/* Case header */}
              <div
                className="px-5 py-3 flex items-center gap-3"
                style={{
                  background: 'var(--background)',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <h3
                  className="text-sm font-semibold"
                  style={{ color: 'var(--heading)' }}
                >
                  {caseData.case_number}
                </h3>
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {client ? `${client.first_name} ${client.last_name}` : '--'} -- {caseData.subtype}
                </span>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden flex flex-col gap-2 p-3">
                {docs.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-lg p-3"
                    style={{
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        style={{ color: 'var(--muted-light)', flexShrink: 0 }}
                      >
                        <path d="M4 1h5.5L13 4.5V13a2 2 0 01-2 2H4a2 2 0 01-2-2V3a2 2 0 012-2z" />
                        <polyline points="9.5 1 9.5 5 13 5" />
                      </svg>
                      <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                        {doc.file_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        label={doc.type}
                        color={DOC_TYPE_COLORS[doc.type] || '#6b7280'}
                      />
                      <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                        {formatDate(doc.uploaded_at)}
                      </span>
                    </div>
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      {doc.description}
                    </div>
                  </div>
                ))}
              </div>

              {/* Documents table (desktop) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: 'var(--muted)' }}>File</th>
                      <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: 'var(--muted)' }}>Type</th>
                      <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: 'var(--muted)' }}>Description</th>
                      <th className="text-left px-5 py-2 font-medium text-xs" style={{ color: 'var(--muted)' }}>Uploaded</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docs.map((doc) => (
                      <tr
                        key={doc.id}
                        style={{ borderBottom: '1px solid var(--border-light)' }}
                      >
                        <td className="px-5 py-2.5">
                          <div className="flex items-center gap-2">
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 16 16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.5"
                              style={{ color: 'var(--muted-light)', flexShrink: 0 }}
                            >
                              <path d="M4 1h5.5L13 4.5V13a2 2 0 01-2 2H4a2 2 0 01-2-2V3a2 2 0 012-2z" />
                              <polyline points="9.5 1 9.5 5 13 5" />
                            </svg>
                            <span
                              className="text-sm font-medium"
                              style={{ color: 'var(--heading)' }}
                            >
                              {doc.file_name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-2.5">
                          <Badge
                            label={doc.type}
                            color={DOC_TYPE_COLORS[doc.type] || '#6b7280'}
                          />
                        </td>
                        <td className="px-5 py-2.5 text-xs" style={{ color: 'var(--muted)' }}>
                          {doc.description}
                        </td>
                        <td className="px-5 py-2.5 text-xs" style={{ color: 'var(--muted-light)' }}>
                          {formatDate(doc.uploaded_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Evidence checklist for immigration cases */}
              {isImmigration && checklist.length > 0 && (
                <div
                  className="px-5 py-3"
                  style={{
                    borderTop: '1px solid var(--border-light)',
                    background: 'var(--background)',
                  }}
                >
                  <div
                    className="text-xs font-semibold mb-2 uppercase"
                    style={{ color: 'var(--muted)', letterSpacing: '0.5px' }}
                  >
                    Evidence Checklist
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-1.5 text-xs px-2 py-1 rounded"
                        style={{
                          background:
                            item.status === 'complete'
                              ? '#16a34a12'
                              : item.status === 'missing'
                                ? '#d9770612'
                                : '#6b728012',
                          color:
                            item.status === 'complete'
                              ? '#16a34a'
                              : item.status === 'missing'
                                ? '#d97706'
                                : '#6b7280',
                        }}
                      >
                        {item.status === 'complete' ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        ) : item.status === 'missing' ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="4" />
                            <line x1="6" y1="4" x2="6" y2="6" />
                            <line x1="6" y1="7.5" x2="6" y2="7.5" />
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="6" cy="6" r="4" />
                          </svg>
                        )}
                        <span className="font-medium">{item.label}</span>
                        {item.status === 'missing' && (
                          <span className="font-semibold uppercase" style={{ fontSize: '0.625rem' }}>
                            Missing
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
