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

const STATUS_COLORS: Record<string, string> = {
  paid: '#16a34a',
  sent: '#2563eb',
  draft: '#6b7280',
  overdue: '#dc2626',
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatCurrency(amount: number): string {
  return '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 0 });
}

export default function DemoBillingPage() {
  const { invoices, clients, cases } = DEMO_PLATFORM_DATA;

  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getCase = (id: string) => cases.find((c) => c.id === id);

  const totalBilled = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const collected = invoices
    .filter((inv) => inv.status === 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const outstanding = invoices
    .filter((inv) => inv.status !== 'paid')
    .reduce((sum, inv) => sum + inv.total, 0);
  const overdue = invoices
    .filter((inv) => inv.status === 'overdue')
    .reduce((sum, inv) => sum + inv.total, 0);

  const BILLING_STATS = [
    { label: 'Total Billed', value: totalBilled, color: 'var(--heading)' },
    { label: 'Collected', value: collected, color: 'var(--success)' },
    { label: 'Outstanding', value: outstanding, color: 'var(--warning)' },
    { label: 'Overdue', value: overdue, color: 'var(--error)' },
  ];

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
          Billing
        </h1>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium text-white cursor-default"
          style={{ background: 'var(--accent-gold)' }}
        >
          New Invoice
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {BILLING_STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg p-5"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
              borderLeft: `4px solid ${stat.color}`,
            }}
          >
            <div className="text-sm mb-1" style={{ color: 'var(--muted)' }}>
              {stat.label}
            </div>
            <div
              className="text-2xl font-bold"
              style={{ color: stat.color }}
            >
              {formatCurrency(stat.value)}
            </div>
          </div>
        ))}
      </div>

      {/* Invoices Table */}
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
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Invoice #</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Client</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Case</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Amount</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Gov Fees</th>
              <th className="text-right px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Total</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Status</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Due Date</th>
              <th className="text-left px-4 py-3 font-medium" style={{ color: 'var(--muted)' }}>Paid Date</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => {
              const client = getClient(inv.client_id);
              const caseData = getCase(inv.case_id);
              return (
                <tr
                  key={inv.id}
                  style={{ borderBottom: '1px solid var(--border-light)' }}
                >
                  <td className="px-4 py-3 font-medium" style={{ color: 'var(--heading)' }}>
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3" style={{ color: 'var(--foreground)' }}>
                    {client ? `${client.first_name} ${client.last_name}` : '--'}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {caseData?.case_number || '--'}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: 'var(--foreground)' }}>
                    {formatCurrency(inv.amount)}
                  </td>
                  <td className="px-4 py-3 text-right" style={{ color: inv.gov_fees > 0 ? 'var(--foreground)' : 'var(--muted-light)' }}>
                    {inv.gov_fees > 0 ? formatCurrency(inv.gov_fees) : '--'}
                  </td>
                  <td className="px-4 py-3 text-right font-medium" style={{ color: 'var(--heading)' }}>
                    {formatCurrency(inv.total)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge label={inv.status} color={STATUS_COLORS[inv.status]} />
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: 'var(--muted)' }}>
                    {formatDate(inv.due_date)}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: inv.paid_date ? 'var(--success)' : 'var(--muted-light)' }}>
                    {formatDate(inv.paid_date)}
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
