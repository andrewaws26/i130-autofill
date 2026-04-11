'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEMO_TIMELINE, type DemoEvent } from '@/lib/demo-engine';

// ─── Chat message accumulator ───────────────────────────────────────────────
interface ChatEntry {
  from: string;
  message: string;
  phaseIndex: number;
}

// ─── Status config ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  NonNullable<DemoEvent['dashboardState']>,
  { color: string; bg: string; label: string; pulse: boolean }
> = {
  normal: { color: '#2d6a4f', bg: 'rgba(45,106,79,0.12)', label: 'All Clear', pulse: false },
  warning: { color: '#92400e', bg: 'rgba(146,64,14,0.12)', label: 'Attention Needed', pulse: false },
  crisis: { color: '#9b2c2c', bg: 'rgba(155,44,44,0.15)', label: 'Critical Issue', pulse: true },
  resolved: { color: '#2d6a4f', bg: 'rgba(45,106,79,0.12)', label: 'Resolved', pulse: false },
};

// ─── Before/After paths ─────────────────────────────────────────────────────
const BEFORE_STEPS = [
  { text: 'Maria guesses', icon: '?' },
  { text: 'Files wrong form', icon: 'X' },
  { text: 'RFE 2 weeks later', icon: '!' },
  { text: 'Client upset', icon: '-' },
  { text: 'Maria quits', icon: 'X' },
];

const AFTER_STEPS = [
  { text: 'Maria hits a confusing step', icon: '?' },
  { text: 'System guides her', icon: '>' },
  { text: 'She asks a question', icon: '+' },
  { text: 'Attum answers in 30 seconds', icon: 'v' },
  { text: 'Case filed correctly', icon: 'v' },
  { text: 'Client happy. Maria stays.', icon: 'v' },
];

// ─── Workflow steps ─────────────────────────────────────────────────────────
const WORKFLOW_STEPS = [
  { label: 'Client Intake', done: true },
  { label: 'Document Collection', done: true },
  { label: 'I-130 Preparation', done: true },
  { label: 'Determine Concurrent Filing', done: false, active: true, hint: 'Why This Matters: If the beneficiary is in the US with a current priority date, filing I-485 concurrently saves 6-12 months. Missing this means a separate application, more fees, and longer wait.' },
  { label: 'Final Review', done: false },
  { label: 'File with USCIS', done: false },
];

// ─── Payoff stats ───────────────────────────────────────────────────────────
const PAYOFF_STATS = [
  { value: '0', label: 'RFEs this quarter', color: '#2d6a4f' },
  { value: '8 mo', label: 'Maria Lopez retained', color: '#b8860b' },
  { value: '80%', label: 'Immigration training complete', color: '#2563eb' },
  { value: '12', label: 'Insights captured', color: '#7c3aed' },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function InteractiveDemoPage() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [beforeAfterStage, setBeforeAfterStage] = useState<'before' | 'after'>('before');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPhase = DEMO_TIMELINE[phaseIndex];
  const totalPhases = DEMO_TIMELINE.length;

  // ── Accumulate chat messages ─────────────────────────────────────────────
  useEffect(() => {
    if (currentPhase?.chatMessage && currentPhase?.chatFrom) {
      setChatHistory((prev) => {
        const alreadyAdded = prev.some((c) => c.phaseIndex === phaseIndex);
        if (alreadyAdded) return prev;
        return [
          ...prev,
          {
            from: currentPhase.chatFrom!,
            message: currentPhase.chatMessage!,
            phaseIndex,
          },
        ];
      });
    }
  }, [phaseIndex, currentPhase]);

  // ── Before/After stage toggle ────────────────────────────────────────────
  useEffect(() => {
    if (currentPhase?.phase === 'before-after') {
      setBeforeAfterStage('before');
      const t = setTimeout(() => setBeforeAfterStage('after'), 3500);
      return () => clearTimeout(t);
    }
  }, [phaseIndex, currentPhase?.phase]);

  // ── Phase advance logic ──────────────────────────────────────────────────
  const advancePhase = useCallback(() => {
    if (phaseIndex >= totalPhases - 1) return;

    setFadeIn(false);
    setTimeout(() => {
      setPhaseIndex((prev) => {
        const next = prev + 1;
        const nextPhase = DEMO_TIMELINE[next];
        if (nextPhase?.interactive) {
          setWaitingForTap(true);
        }
        return next;
      });
      setFadeIn(true);
    }, 400);
  }, [phaseIndex, totalPhases]);

  // ── Auto-advance timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (waitingForTap) return;
    if (currentPhase?.interactive && phaseIndex === 0) {
      setWaitingForTap(true);
      return;
    }
    if (phaseIndex >= totalPhases - 1) return;

    const nextPhase = DEMO_TIMELINE[phaseIndex + 1];
    if (!nextPhase) return;

    const delay = nextPhase.time * 1000;
    if (delay <= 0) {
      // Next phase is interactive, advance immediately then pause
      timerRef.current = setTimeout(() => advancePhase(), 600);
    } else {
      timerRef.current = setTimeout(() => advancePhase(), delay);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phaseIndex, waitingForTap, advancePhase, currentPhase, totalPhases]);

  // ── Handle interactive tap ───────────────────────────────────────────────
  const handleTap = () => {
    if (!waitingForTap) return;
    setWaitingForTap(false);
    advancePhase();
  };

  // ── Restart ──────────────────────────────────────────────────────────────
  const handleRestart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setChatHistory([]);
    setPhaseIndex(0);
    setWaitingForTap(false);
    setFadeIn(true);
    setBeforeAfterStage('before');
    // First phase is interactive, so pause
    setTimeout(() => setWaitingForTap(true), 100);
  };

  // ── Progress ─────────────────────────────────────────────────────────────
  const progress = ((phaseIndex + 1) / totalPhases) * 100;

  // ── Status indicator ─────────────────────────────────────────────────────
  const status = STATUS_CONFIG[currentPhase?.dashboardState ?? 'normal'];

  // ── Visible chats (last 4) ───────────────────────────────────────────────
  const visibleChats = chatHistory.slice(-4);

  return (
    <div style={styles.wrapper}>
      {/* Progress bar */}
      <div style={styles.progressTrack}>
        <div
          style={{
            ...styles.progressBar,
            width: `${progress}%`,
          }}
        />
      </div>

      {/* Main content container */}
      <div style={styles.container}>
        {/* Phase title */}
        {currentPhase?.title && (
          <div
            style={{
              ...styles.phaseTitle,
              opacity: fadeIn ? 1 : 0,
              transform: fadeIn ? 'translateY(0)' : 'translateY(-8px)',
            }}
          >
            {currentPhase.title}
          </div>
        )}

        {/* Status indicator */}
        <div
          style={{
            ...styles.statusRow,
            opacity: fadeIn ? 1 : 0,
          }}
        >
          <div
            style={{
              ...styles.statusDot,
              backgroundColor: status.color,
              boxShadow: status.pulse
                ? `0 0 0 4px ${status.bg}, 0 0 12px ${status.color}`
                : 'none',
              animation: status.pulse ? 'statusPulse 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <span style={{ ...styles.statusLabel, color: status.color }}>
            {status.label}
          </span>
        </div>

        {/* Main content area */}
        <div
          style={{
            ...styles.contentArea,
            opacity: fadeIn ? 1 : 0,
            transform: fadeIn ? 'translateY(0)' : 'translateY(12px)',
          }}
        >
          {renderContent(currentPhase, beforeAfterStage, handleRestart)}
        </div>

        {/* Chat bubbles */}
        {visibleChats.length > 0 && (
          <div style={styles.chatStack}>
            {visibleChats.map((chat, i) => {
              const isLatest = i === visibleChats.length - 1;
              const isFading = i < visibleChats.length - 3;
              return (
                <div
                  key={`${chat.phaseIndex}-${chat.from}`}
                  style={{
                    ...styles.chatBubble,
                    opacity: isFading ? 0.4 : isLatest ? 1 : 0.7,
                    animation: isLatest ? 'slideInChat 0.4s ease-out' : 'none',
                  }}
                >
                  <div style={styles.chatAvatar}>
                    {chat.from.charAt(0).toUpperCase()}
                  </div>
                  <div style={styles.chatContent}>
                    <div style={styles.chatName}>{chat.from}</div>
                    <div style={styles.chatText}>{chat.message}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Narration bar */}
      {currentPhase?.narration && (
        <div
          style={{
            ...styles.narrationBar,
            opacity: fadeIn ? 1 : 0,
          }}
        >
          <p style={styles.narrationText}>{currentPhase.narration}</p>

          {/* Case status / highlight underneath narration when relevant */}
          {currentPhase.caseStatus && (
            <p style={styles.caseStatusText}>{currentPhase.caseStatus}</p>
          )}
          {currentPhase.highlightField && (
            <p style={styles.highlightText}>{currentPhase.highlightField}</p>
          )}
        </div>
      )}

      {/* Interactive overlay */}
      {waitingForTap && (
        <div style={styles.overlay} onClick={handleTap}>
          <button
            onClick={handleTap}
            style={styles.ctaButton}
          >
            {currentPhase?.interactivePrompt ?? 'Continue'}
          </button>
        </div>
      )}

      {/* Restart button (visible after phase 2) */}
      {phaseIndex > 1 && !waitingForTap && (
        <button onClick={handleRestart} style={styles.restartButton}>
          Restart
        </button>
      )}

      {/* Injected keyframes */}
      <style>{keyframes}</style>
    </div>
  );
}

// ─── Content renderer ───────────────────────────────────────────────────────
function renderContent(
  phase: DemoEvent | undefined,
  beforeAfterStage: 'before' | 'after',
  onRestart: () => void,
) {
  if (!phase) return null;

  // Calm dashboard
  if (phase.phase === 'calm') {
    return (
      <div style={styles.cardGrid}>
        <DashCard title="Active Cases" value="8" sub="3 immigration, 3 family, 2 criminal" />
        <DashCard title="Team Status" value="All on track" sub="Maria, James, Sarah assigned" />
        <DashCard title="Upcoming" value="2 deadlines" sub="This week" />
        <DashCard title="Client Satisfaction" value="4.8 / 5" sub="Last 30 days" />
      </div>
    );
  }

  // First sign - stuck step
  if (phase.phase === 'first-sign') {
    return (
      <div style={styles.singleCard}>
        <div style={styles.cardHeader}>
          <span style={styles.cardHeaderLabel}>Gutierrez - Asylum / I-130</span>
          <span style={{ ...styles.badge, backgroundColor: 'rgba(146,64,14,0.12)', color: '#92400e' }}>
            Stalled
          </span>
        </div>
        <div style={styles.stepsContainer}>
          {['Client Intake', 'Document Collection', 'I-130 Prep', 'Determine Concurrent Filing', 'Final Review', 'File'].map((step, i) => (
            <div key={step} style={styles.stepRow}>
              <div
                style={{
                  ...styles.stepDot,
                  backgroundColor: i < 3 ? '#2d6a4f' : i === 3 ? '#92400e' : '#d8d8d8',
                  boxShadow: i === 3 ? '0 0 0 3px rgba(146,64,14,0.2)' : 'none',
                }}
              />
              <span
                style={{
                  ...styles.stepLabel,
                  color: i === 3 ? '#92400e' : i < 3 ? '#2d6a4f' : '#9ca3af',
                  fontWeight: i === 3 ? 600 : 400,
                }}
              >
                {step}
              </span>
              {i === 3 && <span style={styles.stuckLabel}>No progress</span>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Escalation
  if (phase.phase === 'escalation') {
    return (
      <div style={styles.singleCard}>
        <div style={styles.cardHeader}>
          <span style={styles.cardHeaderLabel}>Gutierrez - Asylum / I-130</span>
          <span style={{ ...styles.badge, backgroundColor: 'rgba(146,64,14,0.12)', color: '#92400e' }}>
            Filed
          </span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ color: '#32373c', fontSize: '0.9375rem', margin: 0 }}>
            I-130 petition submitted to USCIS.
          </p>
          <p style={{ color: '#32373c', fontSize: '0.9375rem', marginTop: 8 }}>
            Concurrent I-485 filing: <span style={{ color: '#9b2c2c', fontWeight: 600 }}>Skipped</span>
          </p>
        </div>
      </div>
    );
  }

  // Crisis
  if (phase.phase === 'crisis') {
    return (
      <div style={{ ...styles.singleCard, borderColor: '#9b2c2c', borderWidth: 2 }}>
        <div style={{ ...styles.cardHeader, borderBottomColor: '#9b2c2c' }}>
          <span style={{ ...styles.cardHeaderLabel, color: '#9b2c2c' }}>
            USCIS Request for Evidence
          </span>
          <span style={{ ...styles.badge, backgroundColor: 'rgba(155,44,44,0.12)', color: '#9b2c2c' }}>
            Urgent
          </span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ color: '#9b2c2c', fontSize: '0.9375rem', fontWeight: 500, margin: 0 }}>
            Gutierrez asylum case: USCIS requesting evidence of concurrent filing eligibility.
          </p>
          <p style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: 12 }}>
            Response deadline: 30 days. Client notified.
          </p>
        </div>
      </div>
    );
  }

  // Before/After
  if (phase.phase === 'before-after') {
    return (
      <div style={styles.beforeAfterContainer}>
        {/* Before path */}
        <div
          style={{
            ...styles.pathCard,
            borderColor: beforeAfterStage === 'before' ? '#9b2c2c' : '#d8d8d8',
            opacity: beforeAfterStage === 'after' ? 0.4 : 1,
          }}
        >
          <div style={{ ...styles.pathHeader, color: '#9b2c2c' }}>Without Case Keeper</div>
          {BEFORE_STEPS.map((step, i) => (
            <div key={i} style={styles.pathStep}>
              <div style={{ ...styles.pathIcon, color: '#9b2c2c', borderColor: '#9b2c2c' }}>
                {step.icon}
              </div>
              <span style={styles.pathText}>{step.text}</span>
            </div>
          ))}
        </div>

        {/* After path */}
        <div
          style={{
            ...styles.pathCard,
            borderColor: beforeAfterStage === 'after' ? '#2d6a4f' : '#d8d8d8',
            opacity: beforeAfterStage === 'before' ? 0.4 : 1,
          }}
        >
          <div style={{ ...styles.pathHeader, color: '#2d6a4f' }}>With Case Keeper</div>
          {AFTER_STEPS.map((step, i) => (
            <div key={i} style={styles.pathStep}>
              <div style={{ ...styles.pathIcon, color: '#2d6a4f', borderColor: '#2d6a4f' }}>
                {step.icon}
              </div>
              <span style={styles.pathText}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Resolution - guided workflow
  if (phase.phase === 'resolution') {
    return (
      <div style={styles.singleCard}>
        <div style={styles.cardHeader}>
          <span style={styles.cardHeaderLabel}>Gutierrez - Guided Workflow</span>
          <span style={{ ...styles.badge, backgroundColor: 'rgba(45,106,79,0.12)', color: '#2d6a4f' }}>
            In Progress
          </span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          {WORKFLOW_STEPS.map((step, i) => (
            <div key={i}>
              <div style={styles.stepRow}>
                <div
                  style={{
                    ...styles.stepDot,
                    backgroundColor: step.done ? '#2d6a4f' : step.active ? '#b8860b' : '#d8d8d8',
                    boxShadow: step.active ? '0 0 0 3px rgba(184,134,11,0.2)' : 'none',
                  }}
                />
                <span
                  style={{
                    ...styles.stepLabel,
                    color: step.done ? '#2d6a4f' : step.active ? '#b8860b' : '#9ca3af',
                    fontWeight: step.active ? 600 : 400,
                  }}
                >
                  {step.label}
                </span>
              </div>
              {step.hint && (
                <div style={styles.hintBox}>
                  <div style={styles.hintLabel}>Why This Matters</div>
                  <p style={styles.hintText}>{step.hint}</p>
                </div>
              )}
            </div>
          ))}

          {/* Suggested response */}
          <div style={styles.suggestedResponse}>
            <div style={styles.suggestedLabel}>Suggested Response for Attorney Attum</div>
            <p style={styles.suggestedText}>
              &ldquo;Yes - asylum applicants with a pending case and current priority date are eligible for concurrent I-485 filing. Always file both together for these cases.&rdquo;
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Payoff
  if (phase.phase === 'payoff') {
    return (
      <div>
        {/* Stats grid */}
        <div style={styles.statsGrid}>
          {PAYOFF_STATS.map((stat, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Morning digest */}
        <div style={{ ...styles.singleCard, marginTop: 16 }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderLabel}>Morning Digest</span>
          </div>
          <div style={{ padding: '12px 20px' }}>
            <DigestRow label="Maria Lopez" detail="Completed Gutierrez filing, started Nguyen I-130" />
            <DigestRow label="James Park" detail="3 cases reviewed, 1 deadline tomorrow" />
            <DigestRow label="Training" detail="Maria: 80% immigration, James: 65% family" />
          </div>
        </div>
      </div>
    );
  }

  // Close - CTAs
  if (phase.phase === 'close') {
    return (
      <div style={styles.closeContainer}>
        <a href="/demo/platform" style={styles.ctaPrimary}>
          Explore the Platform
        </a>
        <a href="/demo" style={styles.ctaSecondary}>
          Try the I-130 AutoFill
        </a>
        <button onClick={onRestart} style={styles.ctaGhost}>
          Watch Again
        </button>
      </div>
    );
  }

  // Hook / pause phases - show nothing in content area
  if (phase.phase === 'hook' || phase.phase === 'pause-problem' || phase.phase === 'pause-solution') {
    return null;
  }

  return null;
}

// ─── Small components ───────────────────────────────────────────────────────
function DashCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div style={styles.dashCard}>
      <div style={styles.dashCardTitle}>{title}</div>
      <div style={styles.dashCardValue}>{value}</div>
      <div style={styles.dashCardSub}>{sub}</div>
    </div>
  );
}

function DigestRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div style={styles.digestRow}>
      <span style={styles.digestLabel}>{label}</span>
      <span style={styles.digestDetail}>{detail}</span>
    </div>
  );
}

// ─── Keyframes (injected via <style>) ───────────────────────────────────────
const keyframes = `
  @keyframes statusPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(155,44,44,0.4); }
    50% { box-shadow: 0 0 0 8px rgba(155,44,44,0); }
  }

  @keyframes slideInChat {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }

  @keyframes ctaPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(184,134,11,0.4); }
    50% { box-shadow: 0 0 0 12px rgba(184,134,11,0); }
  }

  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Styles ─────────────────────────────────────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    minHeight: '100vh',
    backgroundColor: '#1a1a2e',
    color: '#e2e8f0',
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    overflow: 'hidden',
  },

  // Progress bar
  progressTrack: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    zIndex: 50,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#b8860b',
    transition: 'width 0.6s ease',
  },

  // Container
  container: {
    maxWidth: 640,
    margin: '0 auto',
    padding: '48px 20px 180px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 24,
  },

  // Phase title
  phaseTitle: {
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
    fontSize: '1.75rem',
    fontWeight: 600,
    color: '#ffffff',
    textAlign: 'center' as const,
    transition: 'opacity 0.4s ease, transform 0.4s ease',
    lineHeight: 1.3,
  },

  // Status
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    transition: 'opacity 0.4s ease',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: '50%',
    transition: 'background-color 0.4s ease, box-shadow 0.4s ease',
    flexShrink: 0,
  },
  statusLabel: {
    fontSize: '0.875rem',
    fontWeight: 500,
    transition: 'color 0.4s ease',
  },

  // Content area
  contentArea: {
    width: '100%',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  },

  // Cards
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  dashCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 6,
    padding: '16px 18px',
    animation: 'fadeInUp 0.5s ease-out both',
  },
  dashCardTitle: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    marginBottom: 4,
  },
  dashCardValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#2c3e50',
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },
  dashCardSub: {
    fontSize: '0.8125rem',
    color: '#9ca3af',
    marginTop: 2,
  },

  singleCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 6,
    overflow: 'hidden',
    animation: 'fadeInUp 0.5s ease-out both',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 20px',
    borderBottom: '1px solid #e8e8e8',
  },
  cardHeaderLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#2c3e50',
  },
  badge: {
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 12,
    fontSize: '0.75rem',
    fontWeight: 600,
  },

  // Steps
  stepsContainer: {
    padding: '16px 20px',
  },
  stepRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '6px 0',
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    flexShrink: 0,
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
  },
  stepLabel: {
    fontSize: '0.875rem',
    transition: 'color 0.3s ease',
  },
  stuckLabel: {
    marginLeft: 'auto',
    fontSize: '0.75rem',
    color: '#92400e',
    fontWeight: 500,
    fontStyle: 'italic',
  },

  // Before/After
  beforeAfterContainer: {
    display: 'flex',
    gap: 12,
    width: '100%',
  },
  pathCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 6,
    border: '2px solid #d8d8d8',
    padding: '16px 14px',
    transition: 'border-color 0.5s ease, opacity 0.5s ease',
    minWidth: 0,
  },
  pathHeader: {
    fontSize: '0.8125rem',
    fontWeight: 700,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 12,
  },
  pathStep: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 0',
  },
  pathIcon: {
    width: 22,
    height: 22,
    borderRadius: '50%',
    border: '1.5px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.7rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  pathText: {
    fontSize: '0.8125rem',
    color: '#32373c',
    lineHeight: 1.3,
  },

  // Workflow hints
  hintBox: {
    marginLeft: 20,
    marginBottom: 8,
    padding: '10px 14px',
    backgroundColor: 'rgba(184,134,11,0.06)',
    border: '1px solid rgba(184,134,11,0.2)',
    borderRadius: 4,
    animation: 'fadeInUp 0.5s ease-out both',
  },
  hintLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#b8860b',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    marginBottom: 4,
  },
  hintText: {
    fontSize: '0.8125rem',
    color: '#32373c',
    lineHeight: 1.5,
    margin: 0,
  },

  // Suggested response
  suggestedResponse: {
    marginTop: 16,
    padding: '12px 14px',
    backgroundColor: 'rgba(45,106,79,0.06)',
    border: '1px solid rgba(45,106,79,0.2)',
    borderRadius: 4,
    animation: 'fadeInUp 0.5s ease-out 0.3s both',
  },
  suggestedLabel: {
    fontSize: '0.75rem',
    fontWeight: 700,
    color: '#2d6a4f',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    marginBottom: 4,
  },
  suggestedText: {
    fontSize: '0.875rem',
    color: '#32373c',
    lineHeight: 1.5,
    margin: 0,
    fontStyle: 'italic',
  },

  // Payoff stats
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 12,
  },
  statCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 6,
    padding: '18px 16px',
    textAlign: 'center' as const,
    animation: 'fadeInUp 0.5s ease-out both',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 700,
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },
  statLabel: {
    fontSize: '0.8125rem',
    color: '#6b7280',
    marginTop: 2,
  },

  // Digest
  digestRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    padding: '6px 0',
    borderBottom: '1px solid #f3f4f6',
    gap: 12,
  },
  digestLabel: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#2c3e50',
    flexShrink: 0,
  },
  digestDetail: {
    fontSize: '0.8125rem',
    color: '#6b7280',
    textAlign: 'right' as const,
  },

  // Chat
  chatStack: {
    position: 'fixed' as const,
    bottom: 120,
    right: 16,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxWidth: 280,
    zIndex: 30,
  },
  chatBubble: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    transition: 'opacity 0.3s ease',
  },
  chatAvatar: {
    width: 28,
    height: 28,
    borderRadius: '50%',
    backgroundColor: '#b8860b',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '0.75rem',
    fontWeight: 700,
    flexShrink: 0,
  },
  chatContent: {
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#2c3e50',
    marginBottom: 1,
  },
  chatText: {
    fontSize: '0.8125rem',
    color: '#32373c',
    lineHeight: 1.35,
  },

  // Narration bar
  narrationBar: {
    position: 'fixed' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(10,10,25,0.92)',
    backdropFilter: 'blur(8px)',
    padding: '20px 24px',
    zIndex: 40,
    transition: 'opacity 0.4s ease',
  },
  narrationText: {
    maxWidth: 560,
    margin: '0 auto',
    fontSize: '1.0625rem',
    fontWeight: 400,
    color: '#e2e8f0',
    textAlign: 'center' as const,
    lineHeight: 1.5,
  },
  caseStatusText: {
    maxWidth: 560,
    margin: '6px auto 0',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#92400e',
    textAlign: 'center' as const,
  },
  highlightText: {
    maxWidth: 560,
    margin: '6px auto 0',
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#9b2c2c',
    textAlign: 'center' as const,
  },

  // Interactive overlay
  overlay: {
    position: 'fixed' as const,
    inset: 0,
    backgroundColor: 'rgba(10,10,25,0.55)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60,
    cursor: 'pointer',
  },
  ctaButton: {
    padding: '16px 40px',
    fontSize: '1.125rem',
    fontWeight: 600,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    color: '#ffffff',
    backgroundColor: '#b8860b',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    animation: 'ctaPulse 2.5s ease-in-out infinite',
    transition: 'background-color 0.2s ease',
  },

  // Close CTAs
  closeContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 12,
    width: '100%',
    maxWidth: 360,
    margin: '0 auto',
  },
  ctaPrimary: {
    display: 'block',
    width: '100%',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    color: '#ffffff',
    backgroundColor: '#b8860b',
    border: 'none',
    borderRadius: 4,
    textAlign: 'center' as const,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.2s ease',
  },
  ctaSecondary: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    color: '#e2e8f0',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 4,
    textAlign: 'center' as const,
    textDecoration: 'none',
    cursor: 'pointer',
    transition: 'border-color 0.2s ease',
  },
  ctaGhost: {
    padding: '10px 24px',
    fontSize: '0.875rem',
    fontWeight: 500,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    color: '#9ca3af',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
    transition: 'color 0.2s ease',
  },

  // Restart
  restartButton: {
    position: 'fixed' as const,
    top: 14,
    right: 16,
    padding: '6px 14px',
    fontSize: '0.75rem',
    fontWeight: 500,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    color: '#9ca3af',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    cursor: 'pointer',
    zIndex: 45,
    transition: 'color 0.2s ease, border-color 0.2s ease',
  },
};
