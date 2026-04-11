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

const EVENT_TYPE_COLORS: Record<string, string> = {
  hearing: '#dc2626',
  deadline: '#d97706',
  appointment: '#2563eb',
  milestone: '#16a34a',
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '--';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getWeekGroup(dateStr: string): string {
  const now = new Date('2026-04-11T00:00:00');
  const eventDate = new Date(dateStr + 'T00:00:00');

  // Past events
  if (eventDate < now) {
    return 'Past';
  }

  // Calculate week boundaries
  const dayOfWeek = now.getDay();
  const endOfThisWeek = new Date(now);
  endOfThisWeek.setDate(now.getDate() + (7 - dayOfWeek));

  const endOfNextWeek = new Date(endOfThisWeek);
  endOfNextWeek.setDate(endOfThisWeek.getDate() + 7);

  if (eventDate <= endOfThisWeek) {
    return 'This Week';
  } else if (eventDate <= endOfNextWeek) {
    return 'Next Week';
  } else {
    return 'Later This Month';
  }
}

export default function DemoCalendarPage() {
  const { events, cases } = DEMO_PLATFORM_DATA;

  const getCase = (caseId: string) => cases.find((c) => c.id === caseId);

  // Sort events by date
  const sortedEvents = [...events].sort((a, b) => a.date.localeCompare(b.date));

  // Group by week
  const groups: Record<string, typeof events> = {};
  const groupOrder = ['Past', 'This Week', 'Next Week', 'Later This Month'];

  for (const evt of sortedEvents) {
    const group = getWeekGroup(evt.date);
    if (!groups[group]) groups[group] = [];
    groups[group].push(evt);
  }

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
          Calendar
        </h1>
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium text-white cursor-default"
          style={{ background: 'var(--accent-gold)' }}
        >
          Add Event
        </button>
      </div>

      {/* Timeline / Agenda View */}
      <div className="flex flex-col gap-8">
        {groupOrder.map((groupName) => {
          const groupEvents = groups[groupName];
          if (!groupEvents || groupEvents.length === 0) return null;

          return (
            <div key={groupName}>
              <h2
                className="text-base font-semibold mb-3"
                style={{
                  fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                  color: groupName === 'Past' ? 'var(--muted)' : 'var(--heading)',
                }}
              >
                {groupName}
              </h2>

              <div className="flex flex-col gap-2">
                {groupEvents.map((evt) => {
                  const caseData = getCase(evt.case_id);
                  const isOverdue =
                    !evt.completed &&
                    new Date(evt.date + 'T00:00:00') < new Date('2026-04-11T00:00:00');
                  const isUrgent =
                    caseData?.priority === 'urgent' && !evt.completed;

                  return (
                    <div
                      key={evt.id}
                      className="rounded-lg p-4 flex items-start gap-4"
                      style={{
                        background: isOverdue
                          ? '#dc262608'
                          : 'var(--card-bg)',
                        border: isOverdue
                          ? '1px solid #dc262630'
                          : '1px solid var(--border-light)',
                      }}
                    >
                      {/* Completed checkbox (visual) */}
                      <div
                        className="mt-0.5"
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: evt.completed
                            ? '2px solid #16a34a'
                            : '2px solid var(--border)',
                          background: evt.completed ? '#16a34a' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {evt.completed && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                            stroke="#fff"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="2 6 5 9 10 3" />
                          </svg>
                        )}
                      </div>

                      {/* Event details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className="text-sm font-medium"
                            style={{
                              color: evt.completed
                                ? 'var(--muted-light)'
                                : 'var(--heading)',
                              textDecoration: evt.completed
                                ? 'line-through'
                                : 'none',
                            }}
                          >
                            {evt.title}
                          </span>
                          <Badge
                            label={evt.type}
                            color={EVENT_TYPE_COLORS[evt.type]}
                          />
                          {isUrgent && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                color: '#dc2626',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}
                            >
                              <span
                                style={{
                                  width: 5,
                                  height: 5,
                                  borderRadius: '50%',
                                  background: '#dc2626',
                                }}
                              />
                              URGENT
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span
                            className="text-xs"
                            style={{
                              color: isOverdue ? '#dc2626' : 'var(--muted)',
                              fontWeight: isOverdue ? 600 : 400,
                            }}
                          >
                            {formatDate(evt.date)}
                            {isOverdue && ' (overdue)'}
                          </span>
                          <span
                            className="text-xs"
                            style={{ color: 'var(--muted-light)' }}
                          >
                            {caseData?.case_number}
                          </span>
                        </div>
                        {evt.description && (
                          <p
                            className="text-xs mt-1"
                            style={{ color: 'var(--muted-light)' }}
                          >
                            {evt.description}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
