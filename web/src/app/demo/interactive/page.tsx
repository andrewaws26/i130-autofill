'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DEMO_TIMELINE, type DemoEvent } from '@/lib/demo-engine';

// ─── Chat message accumulator ───────────────────────────────────────────────
interface ChatEntry {
  from: string;
  message: string;
  phaseIndex: number;
}

// ─── Before/After paths ─────────────────────────────────────────────────────
const BEFORE_STEPS = [
  { text: 'Gets stuck on something unfamiliar', icon: '?' },
  { text: 'Too afraid to ask — guesses instead', icon: 'X' },
  { text: 'Files the wrong thing', icon: '!' },
  { text: 'Government rejects it weeks later', icon: 'X' },
  { text: 'Client upset. Attorney quits.', icon: 'X' },
];

const AFTER_STEPS = [
  { text: 'Gets stuck on the same step', icon: '?' },
  { text: 'System explains why this step matters', icon: '>' },
  { text: 'Taps a button to ask you directly', icon: '+' },
  { text: 'You respond in 30 seconds', icon: 'v' },
  { text: 'Case filed correctly. Client happy.', icon: 'v' },
  { text: 'Attorney stays. Grows. Thrives.', icon: 'v' },
];

// ─── Payoff stats ───────────────────────────────────────────────────────────
const PAYOFF_STATS = [
  { value: '0', label: 'Rejected filings', color: '#2d6a4f' },
  { value: '2/2', label: 'Associates retained', color: '#b8860b' },
  { value: '80%', label: 'Training complete', color: '#2563eb' },
  { value: '12', label: 'Insights captured', color: '#7c3aed' },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export default function InteractiveDemoPage() {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [waitingForTap, setWaitingForTap] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatEntry[]>([]);
  const [costCounter, setCostCounter] = useState(0);
  const [roiAttorneys, setRoiAttorneys] = useState(3);
  const [roiHourlyRate, setRoiHourlyRate] = useState(250);
  const [trainingProgress, setTrainingProgress] = useState(0);
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
        return [...prev, {
          from: currentPhase.chatFrom!,
          message: currentPhase.chatMessage!,
          phaseIndex,
        }];
      });
    }
  }, [phaseIndex, currentPhase]);

  // ── Cost clock ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (costIntervalRef.current) clearInterval(costIntervalRef.current);
    const state = currentPhase?.dashboardState;
    if (state === 'warning' || state === 'crisis') {
      costIntervalRef.current = setInterval(() => {
        setCostCounter(prev => prev + 250);
      }, 1000);
    }
    return () => { if (costIntervalRef.current) clearInterval(costIntervalRef.current); };
  }, [currentPhase?.dashboardState]);

  // ── Training progress animation ─────────────────────────────────────────
  useEffect(() => {
    if (currentPhase?.phase !== 'the-result') {
      setTrainingProgress(0);
      return;
    }
    let current = 0;
    const interval = setInterval(() => {
      current += 2;
      if (current > 80) { clearInterval(interval); return; }
      setTrainingProgress(current);
    }, 50);
    return () => clearInterval(interval);
  }, [currentPhase?.phase]);

  // ── Auto-advance timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (currentPhase?.interactive) { setWaitingForTap(true); return; }
    if (phaseIndex >= totalPhases - 1) return;
    const nextPhase = DEMO_TIMELINE[phaseIndex + 1];
    if (!nextPhase) return;
    const delay = Math.max(nextPhase.time * 1000, 600);
    timerRef.current = setTimeout(() => {
      setFadeIn(false);
      setTimeout(() => { setPhaseIndex(phaseIndex + 1); setFadeIn(true); }, 400);
    }, delay);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phaseIndex]);

  // ── Handle interactive tap ───────────────────────────────────────────────
  const handleTap = () => {
    if (!waitingForTap) return;
    setWaitingForTap(false);
    setFadeIn(false);
    setTimeout(() => { setPhaseIndex((prev) => prev + 1); setFadeIn(true); }, 400);
  };

  // ── Restart ──────────────────────────────────────────────────────────────
  const handleRestart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setChatHistory([]);
    setPhaseIndex(0);
    setWaitingForTap(false);
    setFadeIn(true);
    setCostCounter(0);
    setTrainingProgress(0);
    setTimeout(() => setWaitingForTap(true), 100);
  };

  const progress = ((phaseIndex + 1) / totalPhases) * 100;

  const visibleChats = chatHistory
    .filter((c) => c.phaseIndex === phaseIndex)
    .slice(-2);

  const sectionLabel =
    phaseIndex <= 2 ? 'THE PROBLEM' :
    phaseIndex <= 7 ? 'WHAT HAPPENED' :
    'THE SOLUTION';

  const transitionStyle = {
    opacity: fadeIn ? 1 : 0,
    transform: fadeIn ? 'translateY(0)' : 'translateY(8px)',
    transition: 'opacity 0.4s ease, transform 0.4s ease',
  };

  return (
    <div style={styles.wrapper}>
      {/* Hide parent layout */}
      <style>{`
        header, div[style*="background:#2c3e50"], div[style*="background: rgb(44, 62, 80)"] { display: none !important; }
        main { padding-top: 0 !important; }
      `}</style>

      {/* Background illustration */}
      {currentPhase?.bgImage && (
        <div key={currentPhase.bgImage} style={{
          position: 'fixed', inset: 0, zIndex: 0,
          backgroundImage: `url(${currentPhase.bgImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.08, pointerEvents: 'none',
        }} />
      )}

      {/* ─── Fixed top bar ──────────────────────────────────────────── */}
      <div style={styles.topBar}>
        {/* Progress bar */}
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressBar, width: `${progress}%` }} />
        </div>

        {/* Top controls row */}
        <div style={styles.topControls}>
          {/* Left: Restart */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {phaseIndex > 0 && (
              <button onClick={handleRestart} style={styles.topButton}>Restart</button>
            )}
          </div>

          {/* Center: Screen counter */}
          <div style={styles.screenCounter}>
            Screen {phaseIndex + 1} of {totalPhases}
          </div>

          {/* Right: Cost clock */}
          <div style={{ minWidth: 120, textAlign: 'right' as const }}>
            {costCounter > 0 && currentPhase?.dashboardState !== 'normal' && phaseIndex > 1 && (
              <span style={{
                padding: '4px 12px', borderRadius: 6,
                fontSize: '0.8125rem', fontWeight: 600,
                ...(currentPhase?.dashboardState === 'resolved' ? {
                  backgroundColor: 'rgba(45,106,79,0.15)', color: '#2d6a4f',
                } : {
                  backgroundColor: 'rgba(155,44,44,0.15)', color: '#ef4444',
                }),
              }}>
                {currentPhase?.dashboardState === 'resolved'
                  ? '$54,000 saved/year'
                  : `-$${costCounter.toLocaleString()} lost`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ─── Scrollable content - RIGID TEMPLATE ────────────────────── */}
      <div className="demo-container" style={styles.container}>
        {/* 1. SECTION LABEL - always present */}
        <div style={styles.sectionLabel}>{sectionLabel}</div>

        {/* 2. TITLE - always present (may be empty) */}
        {currentPhase?.title && (
          <div style={{ ...styles.phaseTitle, ...transitionStyle }}>
            {currentPhase.title}
          </div>
        )}

        {/* 3. CONTEXT LABEL - always present, explains what you're about to see */}
        <div style={styles.contextLabel}>
          {currentPhase?.contextLabel}
        </div>

        {/* 4. CONTENT BLOCK - the main visual */}
        <div style={{ ...styles.contentArea, ...transitionStyle }}>
          {renderContent(phase(currentPhase), handleRestart, roiAttorneys, setRoiAttorneys, roiHourlyRate, setRoiHourlyRate, trainingProgress)}
        </div>

        {/* 5. THOUGHT BUBBLE - Maria's inner thought (inline) */}
        {currentPhase?.innerThought && (
          <div style={{
            ...styles.thoughtBubble,
            animation: 'fadeInUp 0.5s ease-out 0.3s both',
          }}>
            <div style={styles.thoughtLabel}>What Maria was thinking</div>
            <div style={styles.thoughtText}>
              &ldquo;{currentPhase.innerThought}&rdquo;
            </div>
          </div>
        )}

        {/* 6. CHAT BUBBLE - team message (inline) */}
        {visibleChats.length > 0 && (
          <div style={{ alignSelf: 'flex-end', maxWidth: 400 }}>
            {visibleChats.map((chat, i) => (
              <div key={`${chat.phaseIndex}-${chat.from}`} style={{
                ...styles.chatBubble,
                animation: 'slideInChat 0.4s ease-out',
              }}>
                <div style={styles.chatAvatar}>{chat.from.charAt(0).toUpperCase()}</div>
                <div style={styles.chatContent}>
                  <div style={styles.chatName}>{chat.from}</div>
                  <div style={styles.chatText}>{chat.message}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 7. NARRATION - key narrative text (inline) */}
        {currentPhase?.narration && (
          <div style={styles.narrationBlock}>
            <p style={styles.narrationText}>{currentPhase.narration}</p>
            {currentPhase.caseStatus && (
              <p style={styles.caseStatusText}>{currentPhase.caseStatus}</p>
            )}
          </div>
        )}

        {/* 8. CTA BUTTON - always at the bottom of content flow */}
        {waitingForTap && currentPhase?.interactive && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 32px' }}>
            <button onClick={handleTap} style={{
              ...styles.ctaButton,
              animation: 'ctaPulse 2.5s ease-in-out infinite',
            }}>
              {currentPhase?.interactivePrompt ?? 'Continue'}
            </button>
          </div>
        )}
      </div>

      {/* Keyframes */}
      <style>{keyframes}</style>
    </div>
  );
}

// Helper to pass phase safely
function phase(p: DemoEvent | undefined): DemoEvent | undefined { return p; }

// ─── Content renderer (one idea per screen) ─────────────────────────────────
function renderContent(
  phase: DemoEvent | undefined,
  onRestart: () => void,
  roiAttorneys: number,
  setRoiAttorneys: (v: number) => void,
  roiHourlyRate: number,
  setRoiHourlyRate: (v: number) => void,
  trainingProgress: number,
) {
  if (!phase) return null;

  // ── SETUP ─────────────────────────────────────────────────────────────
  if (phase.phase === 'setup') {
    return (
      <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
        <div style={{
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: '"Source Serif 4", serif',
          marginBottom: 24,
          lineHeight: 1.4,
          textAlign: 'center' as const,
          animation: 'fadeInUp 0.5s ease-out 0.2s both',
        }}>
          Imagine you own a small law firm.
        </div>

        <div style={{
          backgroundColor: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 12,
          padding: '24px 20px',
          textAlign: 'left' as const,
          animation: 'fadeInUp 0.5s ease-out 0.4s both',
        }}>
          <div style={{ fontSize: '1rem', color: '#e2e8f0', lineHeight: 1.8 }}>
            <div style={{ marginBottom: 16 }}>
              You handle immigration, family law, and criminal defense in Louisville, Kentucky.
            </div>
            <div style={{ marginBottom: 16 }}>
              You have <span style={{ color: '#b8860b', fontWeight: 600 }}>two associate attorneys</span>:
            </div>
            <div className="demo-attorney-cards" style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' as const }}>
              <div style={styles.attorneyCard}>
                <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>Maria Lopez</div>
                <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Associate Attorney &middot; 8 months</div>
              </div>
              <div style={styles.attorneyCard}>
                <div style={{ fontWeight: 600, color: '#ffffff', marginBottom: 4 }}>James Chen</div>
                <div style={{ fontSize: '0.8125rem', color: '#9ca3af' }}>Associate Attorney &middot; 14 months</div>
              </div>
            </div>
            <div style={{ color: '#9ca3af' }}>
              They handle cases while you manage the firm. You trained them yourself. Things seem to be going well.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── HOOK: text thread ─────────────────────────────────────────────────
  if (phase.textThread) {
    return (
      <div style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
        <div style={{
          fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
          fontWeight: 600,
          color: '#ffffff',
          fontFamily: '"Source Serif 4", serif',
          marginBottom: 16,
          textAlign: 'center' as const,
        }}>
          Tuesday morning. Your phone buzzes.
        </div>

        <div style={styles.phoneFrame}>
          <div style={styles.phoneStatusBar}>
            <span>9:41 AM</span><span>Tuesday</span>
          </div>
          <div style={styles.phoneContactHeader}>
            <div style={styles.phoneAvatar}>ML</div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#ffffff' }}>{phase.textThread.from}</div>
            <div style={{ fontSize: '0.75rem', color: '#8e8e93', marginTop: 2 }}>Associate Attorney</div>
          </div>
          <div style={styles.phoneMessages}>
            <div style={{
              alignSelf: 'flex-start', padding: '10px 16px',
              borderRadius: '18px 18px 18px 4px', backgroundColor: '#3a3a3c',
              animation: 'fadeInUp 0.3s ease-out 0.3s both, typingFadeOut 0.3s ease-out 0.7s forwards',
              display: 'flex', gap: 4, alignItems: 'center',
            }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  width: 7, height: 7, borderRadius: '50%', backgroundColor: '#8e8e93',
                  animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </div>
            {phase.textThread.messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: 'flex-start', maxWidth: '82%', padding: '10px 14px',
                borderRadius: '18px 18px 18px 4px', backgroundColor: '#3a3a3c',
                color: '#ffffff', fontSize: '0.9375rem', lineHeight: 1.4,
                animation: `fadeInUp 0.4s ease-out ${0.8 + i * 1.2}s both`,
              }}>
                {msg}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── COST SPLASH ───────────────────────────────────────────────────────
  if (phase.phase === 'cost-splash') {
    return (
      <div style={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' as const, marginBottom: 28 }}>
          <div style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, color: '#ef4444',
            fontFamily: '"Source Serif 4", serif',
            animation: 'fadeInUp 0.5s ease-out both',
          }}>
            $294,000
          </div>
          <div style={{
            fontSize: '0.9375rem', color: '#9ca3af', marginTop: 4,
            animation: 'fadeInUp 0.5s ease-out 0.2s both',
          }}>
            Cost to replace two associate attorneys
          </div>
        </div>

        <div style={{
          backgroundColor: 'rgba(155,44,44,0.08)', border: '1px solid rgba(155,44,44,0.2)',
          borderRadius: 10, padding: '20px',
          animation: 'fadeInUp 0.5s ease-out 0.4s both',
        }}>
          <div style={{
            fontSize: '0.8125rem', fontWeight: 600, color: '#ef4444', marginBottom: 12,
            textTransform: 'uppercase' as const, letterSpacing: '0.04em',
          }}>
            In a small firm, one person leaving is a crisis. Two is a collapse.
          </div>
          {[
            { text: '15 active cases — all need coverage now', urgent: true },
            { text: '5 court deadlines this month with no one assigned', urgent: true },
            { text: 'Clients need to be told their attorney left', urgent: false },
            { text: 'You are now the only attorney handling everything', urgent: true },
            { text: '14 months before replacements are productive', urgent: false },
            { text: 'If both were unhappy, who else is?', urgent: false },
          ].map((item, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0',
              borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.05)' : 'none',
              fontSize: '0.875rem',
              color: item.urgent ? '#ef4444' : '#e2e8f0',
              fontWeight: item.urgent ? 500 : 400,
              animation: `fadeInUp 0.4s ease-out ${0.6 + i * 0.12}s both`,
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                backgroundColor: item.urgent ? '#ef4444' : '#6b7280', flexShrink: 0,
              }} />
              {item.text}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── CALM: dashboard ───────────────────────────────────────────────────
  if (phase.phase === 'calm') {
    return (
      <div className="demo-card-grid" style={styles.cardGrid}>
        <DashCard title="Active Cases" value="8" sub="3 immigration, 3 family, 2 criminal" />
        <DashCard title="Team Status" value="All on track" sub="Maria and James assigned" />
        <DashCard title="Upcoming" value="2 deadlines" sub="This week" />
        <DashCard title="Client Satisfaction" value="4.8 / 5" sub="Last 30 days" />
      </div>
    );
  }

  // ── SILENT FAILURE ────────────────────────────────────────────────────
  if (phase.phase === 'silent-failure') {
    return (
      <div style={{ width: '100%' }}>
        <div style={styles.singleCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardHeaderLabel}>Gutierrez - Immigration Case</span>
            <span style={{ ...styles.badge, backgroundColor: 'rgba(155,44,44,0.12)', color: '#9b2c2c' }}>
              Filed Incorrectly
            </span>
          </div>
          <div style={styles.stepsContainer}>
            {[
              { label: 'Client Intake', status: 'done' },
              { label: 'Document Collection', status: 'done' },
              { label: 'Prepare Filing', status: 'done' },
              { label: 'Step she didn\'t understand', status: 'skipped' },
              { label: 'Final Review', status: 'skipped' },
              { label: 'File with USCIS', status: 'wrong' },
            ].map((step, i) => (
              <div key={i} style={styles.stepRow}>
                <div style={{
                  ...styles.stepDot,
                  backgroundColor: step.status === 'done' ? '#2d6a4f' : step.status === 'skipped' ? '#92400e' : '#9b2c2c',
                  boxShadow: step.status === 'skipped' ? '0 0 0 3px rgba(146,64,14,0.2)' : 'none',
                }} />
                <span style={{
                  ...styles.stepLabel,
                  color: step.status === 'done' ? '#2d6a4f' : step.status === 'skipped' ? '#92400e' : '#9b2c2c',
                  fontWeight: step.status !== 'done' ? 600 : 400,
                }}>
                  {step.label}
                </span>
                {step.status === 'skipped' && i === 3 && <span style={styles.stuckLabel}>Skipped — guessed instead</span>}
                {step.status === 'wrong' && <span style={{ ...styles.stuckLabel, color: '#9b2c2c' }}>Wrong forms filed</span>}
              </div>
            ))}
          </div>
        </div>

        {/* The BECAUSE connectors */}
        <div style={{
          textAlign: 'center' as const, marginTop: 16, padding: '14px 16px',
          borderRadius: 8, backgroundColor: 'rgba(155,44,44,0.06)',
          border: '1px solid rgba(155,44,44,0.15)',
          animation: 'fadeInUp 0.5s ease-out 0.5s both',
        }}>
          <div style={{ fontSize: '0.9375rem', color: '#e2e8f0', lineHeight: 1.7 }}>
            She didn&apos;t ask <strong style={{ color: '#ef4444' }}>because</strong> she was afraid to look incompetent.<br/>
            She guessed <strong style={{ color: '#ef4444' }}>because</strong> there was no safe way to ask.<br/>
            You didn&apos;t know <strong style={{ color: '#ef4444' }}>because</strong> nothing in your system showed her struggle.
          </div>
        </div>
      </div>
    );
  }

  // ── CONSEQUENCE ───────────────────────────────────────────────────────
  if (phase.phase === 'consequence') {
    return (
      <div style={{ width: '100%' }}>
        <div style={{ ...styles.singleCard, borderColor: '#9b2c2c', borderWidth: 2 }}>
          <div style={{ ...styles.cardHeader, backgroundColor: 'rgba(155,44,44,0.08)' }}>
            <span style={{ ...styles.cardHeaderLabel, color: '#9b2c2c' }}>Government Rejection Notice</span>
            <span style={{ ...styles.badge, backgroundColor: 'rgba(155,44,44,0.12)', color: '#9b2c2c' }}>URGENT</span>
          </div>
          <div style={{ padding: '16px 20px' }}>
            <div style={{ fontSize: '0.875rem', color: '#32373c', lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Re: Gutierrez, Rosa Maria</div>
              <div style={{ color: '#6b7280', marginBottom: 8 }}>The required forms were not filed correctly.</div>
              <div style={{
                padding: '12px 16px', backgroundColor: 'rgba(155,44,44,0.05)', borderRadius: 6,
                borderLeft: '3px solid #9b2c2c', fontSize: '0.8125rem', color: '#9b2c2c',
              }}>
                The client&apos;s case is now delayed by 6 months. Please respond within 87 days or the petition will be denied.
              </div>
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 16, padding: '16px 20px', borderRadius: 8,
          backgroundColor: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          animation: 'fadeInUp 0.5s ease-out 0.3s both',
        }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#ef4444', marginBottom: 8, textTransform: 'uppercase' as const }}>
            What happened next
          </div>
          <div style={{ fontSize: '0.875rem', color: '#e2e8f0', lineHeight: 1.7 }}>
            The client is upset. You&apos;re redoing the work alone at 11 PM.<br/>
            Covering 15 cases that belonged to two people.<br/>
            Three weeks later, Maria quits. James is looking too.<br/>
            <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>You keep asking yourself: &ldquo;What am I doing wrong?&rdquo;</span>
          </div>
        </div>
      </div>
    );
  }

  // ── COMPARISON: two columns only ──────────────────────────────────────
  if (phase.phase === 'comparison') {
    return (
      <div className="demo-recognition-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div style={{ backgroundColor: 'rgba(155,44,44,0.08)', border: '1px solid rgba(155,44,44,0.2)', borderRadius: 10, padding: '20px' }}>
          <div style={styles.columnHeader}>What Maria experienced</div>
          {[
            'Afraid to ask — didn\'t want to look incompetent',
            'Didn\'t know what she didn\'t know',
            'Googled answers alone at 11 PM',
            'Made decisions she wasn\'t ready for',
            'Felt like a failure every day',
          ].map((item, i) => <div key={i} style={styles.listItem}>{item}</div>)}
        </div>
        <div style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '20px' }}>
          <div style={{ ...styles.columnHeader, color: '#9ca3af' }}>What you saw</div>
          {[
            'Cases were assigned',
            'Work was getting done',
            'No complaints',
            'Forms filed on time',
            'Then she quit',
          ].map((item, i) => <div key={i} style={styles.listItem}>{item}</div>)}
        </div>
      </div>
    );
  }

  // ── THE INSIGHT: standalone, one idea, biggest text ────────────────────
  if (phase.phase === 'the-insight') {
    return (
      <div style={{
        textAlign: 'center' as const, padding: '40px 20px',
        maxWidth: 600, margin: '0 auto',
      }}>
        <div style={{
          fontSize: '1rem', color: '#d1d5db', lineHeight: 1.6, marginBottom: 32,
          fontStyle: 'italic',
        }}>
          It&apos;s not that she&apos;s a bad lawyer.<br/>
          It&apos;s not that you&apos;re a bad mentor.
        </div>
        <div style={{
          fontSize: 'clamp(1.375rem, 2.5vw, 1.875rem)',
          color: '#ffffff',
          fontWeight: 600,
          lineHeight: 1.5,
          fontFamily: '"Source Serif 4", serif',
          animation: 'fadeInUp 0.6s ease-out 0.3s both',
        }}>
          There is no system connecting<br/>
          what you know to the people<br/>
          who need it.
        </div>
        <div style={{
          marginTop: 32, fontSize: '0.9375rem', color: '#9ca3af', lineHeight: 1.6,
          animation: 'fadeInUp 0.6s ease-out 0.6s both',
        }}>
          You could answer her question in 30 seconds.<br/>
          She just needed a way to ask.
        </div>
      </div>
    );
  }

  // ── WHAT CHANGES: before/after ────────────────────────────────────────
  if (phase.phase === 'what-changes') {
    return (
      <div className="demo-before-after" style={styles.beforeAfterContainer}>
        <div style={{ ...styles.pathCard, borderColor: '#9b2c2c', opacity: 0.5 }}>
          <div style={{ ...styles.pathHeader, color: '#9b2c2c' }}>Without a system</div>
          {BEFORE_STEPS.map((step, i) => (
            <div key={i} style={styles.pathStep}>
              <div style={{ ...styles.pathIcon, color: '#9b2c2c', borderColor: '#9b2c2c' }}>{step.icon}</div>
              <span style={styles.pathText}>{step.text}</span>
            </div>
          ))}
        </div>
        <div style={{ ...styles.pathCard, borderColor: '#2d6a4f' }}>
          <div style={{ ...styles.pathHeader, color: '#2d6a4f' }}>With Case Keeper</div>
          {AFTER_STEPS.map((step, i) => (
            <div key={i} style={styles.pathStep}>
              <div style={{ ...styles.pathIcon, color: '#2d6a4f', borderColor: '#2d6a4f' }}>{step.icon}</div>
              <span style={styles.pathText}>{step.text}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── THE RESULT ────────────────────────────────────────────────────────
  if (phase.phase === 'the-result') {
    return (
      <div style={{ width: '100%' }}>
        <div className="demo-stats-grid" style={styles.statsGrid}>
          {PAYOFF_STATS.map((stat, i) => (
            <div key={i} style={styles.statCard}>
              <div style={{ ...styles.statValue, color: stat.color }}>{stat.value}</div>
              <div style={styles.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Training progress */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: 10, padding: '20px 24px',
          marginTop: 14, border: '1px solid #d8d8d8',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#2c3e50' }}>Maria Lopez - Training Progress</span>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#2d6a4f', fontFamily: '"Source Serif 4", serif' }}>{trainingProgress}%</span>
          </div>
          <div style={{ height: 8, backgroundColor: '#e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${trainingProgress}%`, backgroundColor: '#2d6a4f', borderRadius: 4, transition: 'width 0.1s linear' }} />
          </div>
        </div>

        {/* Maria returns */}
        <div style={{
          backgroundColor: '#ffffff', borderRadius: 12, padding: '20px',
          marginTop: 14, border: '1px solid #d8d8d8',
          animation: 'fadeInUp 0.5s ease-out 0.5s both',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={styles.mariaAvatar}>ML</div>
            <div>
              <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#2c3e50' }}>Maria Lopez</div>
              <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Former Associate Attorney</div>
            </div>
          </div>
          <div style={{ fontSize: '1rem', color: '#32373c', lineHeight: 1.6 }}>
            &ldquo;Hey — I heard about the new system. James and I have been talking... would you consider bringing us back?&rdquo;
          </div>
        </div>
      </div>
    );
  }

  // ── CLOSE: ROI + CTAs ─────────────────────────────────────────────────
  if (phase.phase === 'close') {
    const hoursPerCase = 0.75;
    const casesPerMonth = roiAttorneys * 8;
    const monthlySavings = Math.round(casesPerMonth * hoursPerCase * roiHourlyRate);
    const annualSavings = monthlySavings * 12;

    return (
      <div style={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
        <div style={{
          backgroundColor: '#ffffff', borderRadius: 10, padding: '28px 24px',
          marginBottom: 24, border: '1px solid #d8d8d8',
        }}>
          <div style={{
            fontFamily: '"Source Serif 4", serif', fontSize: '1.125rem', fontWeight: 600,
            color: '#2c3e50', marginBottom: 20, textAlign: 'center' as const,
          }}>
            Your firm&apos;s potential savings
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Attorneys</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>{roiAttorneys}</span>
            </div>
            <input type="range" min={1} max={20} value={roiAttorneys}
              onChange={(e) => setRoiAttorneys(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#b8860b' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>Avg hourly rate</span>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>${roiHourlyRate}/hr</span>
            </div>
            <input type="range" min={100} max={500} step={25} value={roiHourlyRate}
              onChange={(e) => setRoiHourlyRate(Number(e.target.value))}
              style={{ width: '100%', accentColor: '#b8860b' }} />
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            padding: '16px 0', borderTop: '1px solid #e8e8e8',
          }}>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#2d6a4f', fontFamily: '"Source Serif 4", serif' }}>
                ${monthlySavings.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>per month</div>
            </div>
            <div style={{ textAlign: 'center' as const }}>
              <div style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#b8860b', fontFamily: '"Source Serif 4", serif' }}>
                ${annualSavings.toLocaleString()}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>per year</div>
            </div>
          </div>
        </div>

        <div style={styles.closeContainer}>
          <a href="/demo/platform" style={styles.ctaPrimary}>Explore the Platform</a>
          <a href="/demo" style={styles.ctaSecondary}>Try the I-130 AutoFill</a>
          <div style={{ fontSize: '0.8125rem', color: '#9ca3af', textAlign: 'center' as const, marginTop: 4, marginBottom: 8 }}>
            See the AI read a handwritten intake form and fill the I-130 automatically
          </div>
          <button onClick={onRestart} style={styles.ctaGhost}>Watch Again</button>
        </div>
      </div>
    );
  }

  return null;
}

function DashCard({ title, value, sub }: { title: string; value: string; sub: string }) {
  return (
    <div style={styles.dashCard}>
      <div style={styles.dashCardTitle}>{title}</div>
      <div style={styles.dashCardValue}>{value}</div>
      <div style={styles.dashCardSub}>{sub}</div>
    </div>
  );
}

// ─── Keyframes ─────────────────────────────────────────────────────────────
const keyframes = `
  @keyframes slideInChat {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes ctaPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(184,134,11,0.4); }
    50% { box-shadow: 0 0 0 10px rgba(184,134,11,0); }
  }
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes typingDot {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-3px); }
  }
  @keyframes typingFadeOut {
    0% { opacity: 1; }
    100% { opacity: 0; height: 0; padding: 0; margin: 0; overflow: hidden; }
  }

  @media (max-width: 640px) {
    .demo-card-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .demo-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
    .demo-before-after { flex-direction: column !important; }
    .demo-container { padding: 60px 16px 40px !important; }
    .demo-recognition-grid { grid-template-columns: 1fr !important; }
    .demo-attorney-cards { flex-direction: column !important; }
  }
  @media (min-width: 1200px) {
    .demo-container { max-width: 900px !important; }
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
    overflowY: 'auto',
  },

  // ── Top bar (fixed) ──────────────────────────────────────────────────
  topBar: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#b8860b',
    transition: 'width 0.6s ease',
  },
  topControls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: 'rgba(26,26,46,0.85)',
    backdropFilter: 'blur(8px)',
  },
  topButton: {
    padding: '4px 12px',
    fontSize: '0.75rem',
    fontWeight: 500,
    fontFamily: '"DM Sans", sans-serif',
    color: '#9ca3af',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    cursor: 'pointer',
  },
  screenCounter: {
    fontSize: '0.75rem',
    fontWeight: 600,
    color: '#9ca3af',
    letterSpacing: '0.05em',
  },

  // ── Container ────────────────────────────────────────────────────────
  container: {
    maxWidth: 800,
    margin: '0 auto',
    padding: '60px 24px 60px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: 16,
    minHeight: '100vh',
    position: 'relative' as const,
    zIndex: 1,
  },

  // ── Rigid template elements ──────────────────────────────────────────
  sectionLabel: {
    fontSize: '0.7rem',
    fontWeight: 700,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.1em',
    textAlign: 'center' as const,
  },
  phaseTitle: {
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
    fontSize: 'clamp(1.5rem, 3vw, 2.25rem)',
    fontWeight: 600,
    color: '#ffffff',
    textAlign: 'center' as const,
    lineHeight: 1.3,
  },
  contextLabel: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: '#9ca3af',
    textAlign: 'center' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    maxWidth: 600,
    lineHeight: 1.5,
  },
  contentArea: {
    width: '100%',
  },

  // ── Thought bubble (inline) ──────────────────────────────────────────
  thoughtBubble: {
    maxWidth: 440,
    padding: '14px 18px',
    borderRadius: 12,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
    border: '1px solid rgba(255,255,255,0.1)',
    backdropFilter: 'blur(8px)',
    alignSelf: 'flex-start' as const,
  },
  thoughtLabel: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    marginBottom: 4,
    fontWeight: 500,
  },
  thoughtText: {
    fontSize: '0.875rem',
    color: '#e2e8f0',
    fontStyle: 'italic',
    lineHeight: 1.5,
  },

  // ── Narration (inline) ───────────────────────────────────────────────
  narrationBlock: {
    width: '100%',
    maxWidth: 700,
    textAlign: 'center' as const,
    padding: '12px 0',
  },
  narrationText: {
    fontSize: 'clamp(0.9375rem, 1.5vw, 1.125rem)',
    fontWeight: 500,
    color: '#e2e8f0',
    lineHeight: 1.6,
    margin: 0,
  },
  caseStatusText: {
    fontSize: '0.875rem',
    fontWeight: 500,
    color: '#92400e',
    margin: '8px 0 0',
  },

  // ── Attorney cards ───────────────────────────────────────────────────
  attorneyCard: {
    flex: 1,
    minWidth: 180,
    padding: '14px 16px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    border: '1px solid rgba(255,255,255,0.08)',
  },

  // ── Phone frame ──────────────────────────────────────────────────────
  phoneFrame: {
    backgroundColor: '#1c1c1e',
    borderRadius: 24,
    border: '2px solid #3a3a3c',
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
  },
  phoneStatusBar: {
    padding: '10px 20px 6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.75rem',
    color: '#8e8e93',
  },
  phoneContactHeader: {
    padding: '8px 20px 14px',
    borderBottom: '1px solid #2c2c2e',
    textAlign: 'center' as const,
  },
  phoneAvatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: '#b8860b',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 700,
    margin: '0 auto 6px',
  },
  phoneMessages: {
    padding: '16px 16px 20px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 8,
    minHeight: 200,
  },

  // ── Dashboard cards ──────────────────────────────────────────────────
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    width: '100%',
  },
  dashCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 8,
    padding: '16px 18px',
  },
  dashCardTitle: {
    fontSize: '0.7rem',
    fontWeight: 600,
    color: '#6b7280',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.03em',
    marginBottom: 4,
  },
  dashCardValue: {
    fontSize: 'clamp(1.125rem, 2vw, 1.5rem)',
    fontWeight: 700,
    color: '#2c3e50',
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },
  dashCardSub: {
    fontSize: '0.75rem',
    color: '#9ca3af',
    marginTop: 2,
  },

  // ── Single card ──────────────────────────────────────────────────────
  singleCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 6,
    overflow: 'hidden',
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
  stepsContainer: { padding: '16px 20px' },
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
  },
  stepLabel: { fontSize: '0.875rem' },
  stuckLabel: {
    marginLeft: 'auto',
    fontSize: '0.75rem',
    color: '#92400e',
    fontWeight: 500,
    fontStyle: 'italic',
  },

  // ── Comparison columns ───────────────────────────────────────────────
  columnHeader: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: '#ef4444',
    marginBottom: 14,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
  },
  listItem: {
    fontSize: '0.8125rem',
    color: '#e2e8f0',
    padding: '6px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    lineHeight: 1.4,
  },

  // ── Before/After ─────────────────────────────────────────────────────
  beforeAfterContainer: {
    display: 'flex',
    gap: 16,
    width: '100%',
  },
  pathCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    border: '2px solid #d8d8d8',
    padding: '20px 16px',
    minWidth: 0,
  },
  pathHeader: {
    fontSize: '0.875rem',
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

  // ── Stats ────────────────────────────────────────────────────────────
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 14,
    width: '100%',
  },
  statCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #d8d8d8',
    borderRadius: 8,
    padding: '20px 16px',
    textAlign: 'center' as const,
  },
  statValue: {
    fontSize: 'clamp(1.5rem, 3vw, 2rem)',
    fontWeight: 700,
    fontFamily: '"Source Serif 4", ui-serif, Georgia, serif',
  },
  statLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginTop: 2,
  },

  // ── Maria avatar ─────────────────────────────────────────────────────
  mariaAvatar: {
    width: 44,
    height: 44,
    borderRadius: '50%',
    backgroundColor: '#b8860b',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1rem',
    fontWeight: 700,
    flexShrink: 0,
  },

  // ── Chat bubble (inline) ─────────────────────────────────────────────
  chatBubble: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#ffffff',
    border: '1px solid #e8e8e8',
    borderRadius: 10,
    padding: '8px 12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
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
  chatContent: { flex: 1, minWidth: 0 },
  chatName: { fontSize: '0.7rem', fontWeight: 600, color: '#2c3e50', marginBottom: 1 },
  chatText: { fontSize: '0.8125rem', color: '#32373c', lineHeight: 1.35 },

  // ── CTA button ───────────────────────────────────────────────────────
  ctaButton: {
    padding: '16px 44px',
    fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
    fontWeight: 600,
    fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    color: '#ffffff',
    backgroundColor: '#b8860b',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
  },

  // ── Close CTAs ───────────────────────────────────────────────────────
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
    fontFamily: '"DM Sans", sans-serif',
    color: '#ffffff',
    backgroundColor: '#b8860b',
    border: 'none',
    borderRadius: 4,
    textAlign: 'center' as const,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  ctaSecondary: {
    display: 'block',
    width: '100%',
    padding: '12px 24px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    fontFamily: '"DM Sans", sans-serif',
    color: '#e2e8f0',
    backgroundColor: 'transparent',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: 4,
    textAlign: 'center' as const,
    textDecoration: 'none',
    cursor: 'pointer',
  },
  ctaGhost: {
    padding: '10px 24px',
    fontSize: '0.875rem',
    fontWeight: 500,
    fontFamily: '"DM Sans", sans-serif',
    color: '#9ca3af',
    backgroundColor: 'transparent',
    border: 'none',
    cursor: 'pointer',
  },

  restartButton: {
    position: 'fixed' as const,
    top: 14,
    left: 16,
    padding: '6px 14px',
    fontSize: '0.75rem',
    fontWeight: 500,
    fontFamily: '"DM Sans", sans-serif',
    color: '#9ca3af',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 4,
    cursor: 'pointer',
    zIndex: 45,
  },
};
