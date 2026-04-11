'use client';

import { useState } from 'react';

interface TrainingModule {
  title: string;
  duration: string;
  completed: boolean;
  current?: boolean;
  score?: number;
}

const IMMIGRATION_MODULES: TrainingModule[] = [
  { title: 'Understanding the I-130 Process', duration: '20 min', completed: true, score: 94 },
  { title: 'Evidence Requirements for Spousal Petitions', duration: '25 min', completed: true, score: 88 },
  { title: 'Reading and Filling USCIS Forms', duration: '30 min', completed: true, score: 91 },
  { title: 'Naturalization Basics (N-400)', duration: '20 min', completed: true, score: 96 },
  { title: 'Asylum Law Fundamentals', duration: '35 min', completed: true, score: 82 },
  { title: 'Responding to RFEs', duration: '25 min', completed: true, score: 90 },
  { title: 'USCIS Processing Times & Expedite Requests', duration: '15 min', completed: true, score: 87 },
  { title: 'Concurrent Filing Strategy (I-485)', duration: '15 min', completed: false, current: true },
  { title: 'Work Permits and Travel Documents', duration: '20 min', completed: false },
  { title: 'Immigration Consequences of Criminal Convictions', duration: '40 min', completed: false },
  { title: 'Removal Defense Basics', duration: '30 min', completed: false },
  { title: 'Consular Processing', duration: '25 min', completed: false },
  { title: 'Waivers of Inadmissibility', duration: '35 min', completed: false },
  { title: 'VAWA and U-Visa Petitions', duration: '30 min', completed: false },
  { title: 'Advanced Case Strategy', duration: '45 min', completed: false },
];

const PRACTICE_AREAS = [
  { label: 'Immigration', completed: 12, total: 15, color: '#16a34a' },
  { label: 'Family Law', completed: 8, total: 12, color: '#d97706' },
  { label: 'Criminal Defense', completed: 3, total: 10, color: '#dc2626' },
];

const SIMULATIONS = [
  {
    title: 'Simulated I-130 Spousal Petition',
    description: 'Work through a complete case from intake to filing. AI plays the role of the client, USCIS, and reviews your work.',
    badge: 'Completed - Score: 91/100',
    badgeColor: '#16a34a',
  },
  {
    title: 'Simulated Asylum Case',
    description: 'Handle an asylum application from initial interview through the hearing.',
    badge: 'In Progress - Step 3/8',
    badgeColor: '#d97706',
  },
  {
    title: 'Simulated RFE Response',
    description: 'You receive an RFE on a pending I-130. Draft the response.',
    badge: 'Not Started',
    badgeColor: '#6b7280',
  },
];

const ATTUM_INSIGHTS = [
  {
    text: 'Always ask about prior marriages for both parties. A missing divorce decree is the #1 reason I-130s get RFEs.',
    source: 'Case #IMM-2026-001',
  },
  {
    text: 'If the beneficiary entered without inspection, concurrent filing is NOT available unless they qualify under 245(i).',
    source: 'Case #IMM-2026-003',
  },
  {
    text: 'For asylum cases, the 1-year filing deadline is the first thing I check. If they missed it, we need an exception.',
    source: 'Case #IMM-2026-002',
  },
  {
    text: 'A thin evidence package invites scrutiny. More is always better for spousal petitions.',
    source: 'Case #IMM-2026-001',
  },
];

const overallPercent = 68;

function ProgressBar({ percent, color, height = 8 }: { percent: number; color: string; height?: number }) {
  return (
    <div
      style={{
        width: '100%',
        height,
        borderRadius: height / 2,
        background: 'var(--border-light)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: `${percent}%`,
          height: '100%',
          borderRadius: height / 2,
          background: color,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
}

export default function TrainingPage() {
  const [expandedModules, setExpandedModules] = useState(true);

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1
        className="text-2xl font-semibold mb-6"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Training
      </h1>

      {/* Progress Overview */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2
            className="text-lg font-semibold"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Your Training Progress
          </h2>
          <span className="text-lg font-bold" style={{ color: 'var(--accent-gold)' }}>
            {overallPercent}% Complete
          </span>
        </div>
        <ProgressBar percent={overallPercent} color="var(--accent-gold)" height={10} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
          {PRACTICE_AREAS.map((area) => {
            const pct = Math.round((area.completed / area.total) * 100);
            return (
              <div
                key={area.label}
                className="rounded-md p-4"
                style={{
                  background: 'var(--background)',
                  border: '1px solid var(--border-light)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                    {area.label}
                  </span>
                  <span className="text-xs font-semibold" style={{ color: area.color }}>
                    {area.completed}/{area.total}
                  </span>
                </div>
                <ProgressBar percent={pct} color={area.color} />
                <div className="text-xs mt-1" style={{ color: 'var(--muted-light)' }}>
                  {pct}% complete
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Lesson */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--accent-gold)',
          boxShadow: '0 0 0 1px var(--accent-gold-muted)',
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--accent-gold)' }}>
              Continue Where You Left Off
            </div>
            <h3
              className="text-base font-semibold mb-1"
              style={{
                fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                color: 'var(--heading)',
              }}
            >
              Concurrent Filing Strategy (I-485)
            </h3>
            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              Learn when to file I-485 concurrently with I-130, eligibility requirements, and common pitfalls.
            </p>
            <div className="flex items-center gap-3">
              <button
                className="px-5 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--accent-gold)', color: '#fff', cursor: 'default' }}
              >
                Continue Lesson
              </button>
              <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                Estimated: 15 minutes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Course Catalog */}
      <div
        className="rounded-lg mb-6"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <button
          onClick={() => setExpandedModules(!expandedModules)}
          className="w-full text-left p-5 flex items-center justify-between"
        >
          <h2
            className="text-lg font-semibold"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Immigration Track -- Course Catalog
          </h2>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              color: 'var(--muted-light)',
              transition: 'transform 0.2s',
              transform: expandedModules ? 'rotate(180deg)' : 'rotate(0deg)',
            }}
          >
            <polyline points="4 6 8 10 12 6" />
          </svg>
        </button>

        {expandedModules && (
          <div style={{ borderTop: '1px solid var(--border-light)' }}>
            {IMMIGRATION_MODULES.map((mod, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 px-5 py-3"
                style={{
                  borderBottom: idx < IMMIGRATION_MODULES.length - 1 ? '1px solid var(--border-light)' : 'none',
                  background: mod.current ? 'var(--accent-gold-muted)' : 'transparent',
                }}
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {mod.completed ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="9" fill="#16a34a" />
                      <path d="M6 10l3 3 5-5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : mod.current ? (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="9" fill="#b8860b" />
                      <polygon points="8,6 14,10 8,14" fill="#fff" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="9" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
                      <rect x="7" y="5.5" width="6" height="7" rx="1" fill="none" stroke="#d1d5db" strokeWidth="1.2" />
                      <path d="M8.5 5.5V4a1.5 1.5 0 013 0v1.5" fill="none" stroke="#d1d5db" strokeWidth="1.2" />
                    </svg>
                  )}
                </div>

                {/* Module info */}
                <div className="flex-1 min-w-0">
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: mod.completed || mod.current ? 'var(--heading)' : 'var(--muted)',
                    }}
                  >
                    {mod.title}
                  </span>
                </div>

                {/* Duration */}
                <span className="text-xs shrink-0" style={{ color: 'var(--muted-light)' }}>
                  {mod.duration}
                </span>

                {/* Score */}
                {mod.score !== undefined && (
                  <span
                    className="text-xs font-semibold shrink-0"
                    style={{
                      color: mod.score >= 90 ? '#16a34a' : mod.score >= 80 ? '#d97706' : '#dc2626',
                    }}
                  >
                    {mod.score}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Simulated Case Practice */}
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Practice Cases
      </h2>
      <div className="grid grid-cols-1 gap-4 mb-8">
        {SIMULATIONS.map((sim, idx) => (
          <div
            key={idx}
            className="rounded-lg p-5"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h3
                  className="text-base font-semibold mb-1"
                  style={{
                    fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                    color: 'var(--heading)',
                  }}
                >
                  {sim.title}
                </h3>
                <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
                  {sim.description}
                </p>
                <button
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{
                    background: 'var(--accent-gold)',
                    color: '#fff',
                    cursor: 'default',
                  }}
                >
                  Start Simulation
                </button>
              </div>
              <span
                style={{
                  display: 'inline-block',
                  padding: '3px 10px',
                  borderRadius: 10,
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  background: sim.badgeColor + '18',
                  color: sim.badgeColor,
                  whiteSpace: 'nowrap',
                }}
              >
                {sim.badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Institutional Knowledge */}
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Insights from Attorney Attum
      </h2>
      <div className="flex flex-col gap-3">
        {ATTUM_INSIGHTS.map((insight, idx) => (
          <div
            key={idx}
            className="rounded-md p-4"
            style={{
              background: '#fdf8f0',
              borderLeft: '3px solid #b8860b',
            }}
          >
            <p className="text-sm mb-1" style={{ color: '#5c4a1e', lineHeight: 1.5 }}>
              {insight.text}
            </p>
            <span className="text-xs" style={{ color: '#b8860b' }}>
              -- {insight.source}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
