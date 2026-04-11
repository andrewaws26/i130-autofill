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
  const [costCounter, setCostCounter] = useState(0);
  const [roiAttorneys, setRoiAttorneys] = useState(3);
  const [roiHourlyRate, setRoiHourlyRate] = useState(250);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const costIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // ── Cost clock ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (costIntervalRef.current) clearInterval(costIntervalRef.current);

    const state = currentPhase?.dashboardState;
    if (state === 'warning' || state === 'crisis') {
      costIntervalRef.current = setInterval(() => {
        setCostCounter(prev => prev + 47);
      }, 2000);
    }

    return () => {
      if (costIntervalRef.current) clearInterval(costIntervalRef.current);
    };
  }, [currentPhase?.dashboardState]);

  // ── Phase advance logic ──────────────────────────────────────────────────
  const advancePhase = useCallback(() => {
    if (phaseIndex >= totalPhases - 1) return;

    setFadeIn(false);
    setTimeout(() => {
      const next = phaseIndex + 1;
      const nextPhase = DEMO_TIMELINE[next];
      setPhaseIndex(next);
      setFadeIn(true);
      if (nextPhase?.interactive) {
        setTimeout(() => setWaitingForTap(true), 50);
      }
    }, 400);
  }, [phaseIndex, totalPhases]);

  // ── Auto-advance timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Interactive phases wait for tap - don't auto-advance
    if (currentPhase?.interactive) {
      setWaitingForTap(true);
      return;
    }

    // Last phase - nothing to advance to
    if (phaseIndex >= totalPhases - 1) return;

    // Non-interactive: auto-advance after the NEXT phase's time value
    const nextPhase = DEMO_TIMELINE[phaseIndex + 1];
    if (!nextPhase) return;

    const delay = Math.max(nextPhase.time * 1000, 600);
    timerRef.current = setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => {
        setPhaseIndex(phaseIndex + 1);
        setFadeIn(true);
      }, 400);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // Only re-run when phaseIndex changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex]);

  // ── Handle interactive tap ───────────────────────────────────────────────
  const handleTap = () => {
    if (!waitingForTap) return;
    setWaitingForTap(false);
    setFadeIn(false);
    setTimeout(() => {
      setPhaseIndex((prev) => prev + 1);
      setFadeIn(true);
    }, 400);
  };

  // ── Restart ──────────────────────────────────────────────────────────────
  const handleRestart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setChatHistory([]);
    setPhaseIndex(0);
    setWaitingForTap(false);
    setFadeIn(true);
    setBeforeAfterStage('before');
    setCostCounter(0);
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

      {/* Cost clock */}
      {costCounter > 0 && currentPhase?.dashboardState !== 'normal' && phaseIndex > 1 && (
        <div style={{
          position: 'fixed',
          top: 52,
          right: 20,
          padding: '8px 16px',
          borderRadius: 8,
          fontSize: '0.875rem',
          fontWeight: 600,
          fontFamily: '"DM Sans", sans-serif',
          zIndex: 35,
          transition: 'all 0.4s ease',
          ...(currentPhase?.dashboardState === 'resolved' ? {
            backgroundColor: 'rgba(45,106,79,0.15)',
            color: '#2d6a4f',
          } : {
            backgroundColor: 'rgba(155,44,44,0.15)',
            color: '#ef4444',
          }),
        }}>
          {currentPhase?.dashboardState === 'resolved'
            ? `$${(costCounter * 3).toLocaleString()} saved/year`
            : `-$${costCounter.toLocaleString()} lost`
          }
        </div>
      )}

      {/* Main content container */}
      <div className="demo-container" style={styles.container}>
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
          {renderContent(currentPhase, beforeAfterStage, handleRestart, roiAttorneys, setRoiAttorneys, roiHourlyRate, setRoiHourlyRate)}
        </div>

        {/* Chat bubbles */}
        {visibleChats.length > 0 && (
          <div className="demo-chat-stack" style={styles.chatStack}>
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
          className="demo-narration-bar"
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
      {waitingForTap && currentPhase?.interactive && (
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
  roiAttorneys: number,
  setRoiAttorneys: (v: number) => void,
  roiHourlyRate: number,
  setRoiHourlyRate: (v: number) => void,
) {
  if (!phase) return null;

  // Text thread (resignation messages) - hook phase
  if (phase.textThread) {
    return (
      <div style={{
        width: '100%',
        maxWidth: 400,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 8,
      }}>
        <div style={{
          textAlign: 'center' as const,
          fontSize: '0.8125rem',
          color: '#9ca3af',
          marginBottom: 8,
        }}>
          {phase.textThread.from}
        </div>
        {phase.textThread.messages.map((msg, i) => (
          <div
            key={i}
            style={{
              alignSelf: 'flex-start',
              maxWidth: '80%',
              padding: '10px 16px',
              borderRadius: '18px 18px 18px 4px',
              backgroundColor: '#e5e7eb',
              color: '#1f2937',
              fontSize: '0.9375rem',
              lineHeight: 1.4,
              animation: `fadeInUp 0.4s ease-out ${0.8 + i * 1.2}s both`,
            }}
          >
            {msg}
          </div>
        ))}
        <div style={{
          textAlign: 'center' as const,
          fontSize: '0.8125rem',
          color: '#9b2c2c',
          marginTop: 12,
          fontWeight: 500,
          animation: `fadeInUp 0.4s ease-out ${0.8 + phase.textThread.messages.length * 1.2 + 0.5}s both`,
        }}>
          Third one this year.
        </div>
      </div>
    );
  }

  // Maria returns - emotional closer
  if (phase.phase === 'maria-returns') {
    return (
      <div style={{
        textAlign: 'center' as const,
        padding: '40px 20px',
      }}>
        <div style={{
          fontSize: 'clamp(1.25rem, 2vw, 1.5rem)',
          color: '#9ca3af',
          fontStyle: 'italic',
          maxWidth: 400,
          margin: '0 auto',
          lineHeight: 1.5,
        }}>
          6 months later...
        </div>
      </div>
    );
  }

  // Calm dashboard
  if (phase.phase === 'calm') {
    return (
      <div className="demo-card-grid" style={styles.cardGrid}>
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
      <div style={{
        ...styles.singleCard,
        borderColor: '#9b2c2c',
        borderWidth: 2,
      }}>
        <div style={{
          ...styles.cardHeader,
          backgroundColor: 'rgba(155,44,44,0.08)',
        }}>
          <span style={{ ...styles.cardHeaderLabel, color: '#9b2c2c' }}>
            USCIS Request for Evidence
          </span>
          <span style={{ ...styles.badge, backgroundColor: 'rgba(155,44,44,0.12)', color: '#9b2c2c' }}>
            URGENT
          </span>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '0.875rem', color: '#32373c', lineHeight: 1.6 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Re: Gutierrez, Rosa Maria - I-130</div>
            <div style={{ color: '#6b7280', marginBottom: 8 }}>
              The following evidence is required to continue processing this petition:
            </div>
            <div style={{
              padding: '12px 16px',
              backgroundColor: 'rgba(155,44,44,0.05)',
              borderRadius: 6,
              borderLeft: '3px solid #9b2c2c',
              fontSize: '0.8125rem',
              color: '#9b2c2c',
            }}>
              Form I-485 (Adjustment of Status) was not filed concurrently as required for beneficiaries currently present in the United States. Please submit within 87 days or the petition will be denied.
            </div>
            <div style={{ marginTop: 12, fontSize: '0.8125rem', color: '#9ca3af' }}>
              Response deadline: 87 days
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Before/After
  if (phase.phase === 'before-after') {
    return (
      <div className="demo-before-after" style={styles.beforeAfterContainer}>
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
        <div className="demo-stats-grid" style={styles.statsGrid}>
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

  // Close - ROI Calculator + CTAs
  if (phase.phase === 'close') {
    const hoursPerCase = 0.75;
    const casesPerMonth = roiAttorneys * 8;
    const monthlySavings = Math.round(casesPerMonth * hoursPerCase * roiHourlyRate);
    const annualSavings = monthlySavings * 12;

    return (
      <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
        {/* ROI Calculator */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: 10,
          padding: '28px 24px',
          marginBottom: 24,
          border: '1px solid #d8d8d8',
        }}>
          <div style={{
            fontFamily: '"Source Serif 4", serif',
            fontSize: '1.125rem',
            fontWeight: 600,
            color: '#2c3e50',
            marginBottom: 20,
            textAlign: 'center' as const,
          }}>
            Your firm&apos;s potential savings
          </div>

          {/* Attorneys slider */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Attorneys</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>{roiAttorneys}</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={roiAttorneys}
              onChange={(e) => setRoiAttorneys(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#b8860b' }}
            />
          </div>

          {/* Hourly rate slider */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Avg hourly rate</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>${roiHourlyRate}/hr</span>
            </div>
            <input
              type="range"
              min={100}
              max={500}
              step={25}
              value={roiHourlyRate}
              onChange={(e) => setRoiHourlyRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#b8860b' }}
            />
          </div>

          {/* Results */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
            padding: '16px 0',
            borderTop: '1px solid #e8e8e8',
          }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#2d6a4f',
                fontFamily: '"Source Serif 4", serif',
              }}>
                ${monthlySavings.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>per month</div>
            </div>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{
                fontSize: 'clamp(1.5rem, 3vw, 2rem)',
                fontWeight: 700,
                color: '#b8860b',
                fontFamily: '"Source Serif 4", serif',
              }}>
                ${annualSavings.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>per year</div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div style={styles.closeContainer}>
          <a href="/demo/platform" style={styles.ctaPrimary}>Explore the Platform</a>
          <a href="/demo" style={styles.ctaSecondary}>Try the I-130 AutoFill</a>
          <button onClick={onRestart} style={styles.ctaGhost}>Watch Again</button>
        </div>
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

  /* Responsive: mobile gets 2-col grids, desktop gets 4 */
  @media (max-width: 640px) {
    .demo-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .demo-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .demo-before-after { flex-direction: column !important; }
    .demo-chat-stack { right: 12px !important; max-width: 260px !important; bottom: 110px !important; }
    .demo-container { padding: 36px 16px 160px !important; }
    .demo-narration-bar { padding: 16px 16px !important; }
  }

  @media (min-width: 1200px) {
    .demo-container { max-width: 1000px !important; }
    .demo-chat-stack { right: 48px !important; max-width: 380px !important; }
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
    maxWidth: 900,
    margin: '0 auto',
    padding: '48px 24px 180px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 28,
  },

  // Phase title
  phaseTitle: {
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
    fontSize: 'clamp(1.75rem, 3vw, 2.5rem)',
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
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
  },
  dashCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 8,
    padding: '20px 22px',
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
    fontSize: 'clamp(1.25rem, 2vw, 1.75rem)',
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
    gap: 20,
    width: '100%',
  },
  pathCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '2px solid #d8d8d8',
    padding: '24px 20px',
    transition: 'border-color 0.5s ease, opacity 0.5s ease',
    minWidth: 0,
  },
  pathHeader: {
    fontSize: '0.9375rem',
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
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
  },
  statCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 8,
    padding: '24px 20px',
    textAlign: 'center' as const,
    animation: 'fadeInUp 0.5s ease-out both',
  },
  statValue: {
    fontSize: 'clamp(1.75rem, 3vw, 2.25rem)',
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
    right: 32,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    maxWidth: 340,
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
    maxWidth: 700,
    margin: '0 auto',
    fontSize: 'clamp(1.0625rem, 1.5vw, 1.25rem)',
    fontWeight: 400,
    color: '#e2e8f0',
    textAlign: 'center' as const,
    lineHeight: 1.5,
  },
  caseStatusText: {
    maxWidth: 700,
    margin: '6px auto 0',
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#92400e',
    textAlign: 'center' as const,
  },
  highlightText: {
    maxWidth: 700,
    margin: '6px auto 0',
    fontSize: '0.875rem',
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
    padding: '18px 48px',
    fontSize: 'clamp(1.125rem, 1.5vw, 1.375rem)',
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
    gap: 14,
    width: '100%',
    maxWidth: 420,
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
