'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  I130_SPOUSAL_SCENARIO,
  type PhaseDecision,
  type ChatMessage,
  calculateScore,
  getGradeColor,
  getGradeLabel,
} from '@/lib/simulation-data';

const SCENARIO = I130_SPOUSAL_SCENARIO;
const TOTAL_PHASES = SCENARIO.phases.length;
const DECISION_PHASES = SCENARIO.phases.filter(p => p.decision).length;

// chat = talking to client (input active)
// decision = answering the question (chat locked, decision cards visible)
type PhaseStatus = 'intro' | 'event' | 'chat' | 'decision' | 'feedback' | 'complete';

export default function SimulationPage() {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [phaseStatus, setPhaseStatus] = useState<PhaseStatus>('intro');
  const [decisions, setDecisions] = useState<PhaseDecision[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showGuidance, setShowGuidance] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const phase = SCENARIO.phases.find(p => p.number === currentPhase);
  const progress = (currentPhase / TOTAL_PHASES) * 100;
  const isComplete = currentPhase > TOTAL_PHASES || phaseStatus === 'complete';
  const phaseChatMessages = chatMessages.filter(m => m.phase === currentPhase);
  const chatIsLocked = phaseStatus !== 'chat';

  // Scroll to top on phase change
  useEffect(() => {
    topRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentPhase]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Add client opener when entering chat phase
  useEffect(() => {
    if (phaseStatus === 'chat' && phase?.clientChatOpener) {
      const already = chatMessages.some(m => m.phase === currentPhase && m.from === 'client');
      if (!already) {
        setChatMessages(prev => [...prev, {
          phase: currentPhase, from: 'client',
          text: phase.clientChatOpener!,
          emotion: currentPhase === 6 ? 'upset' : currentPhase === 8 ? 'grateful' : 'calm',
        }]);
      }
    }
  }, [phaseStatus, currentPhase, phase, chatMessages]);

  // ── Actions ─────────────────────────────────────────────────────────────

  const advanceFromEvent = () => {
    if (phase?.hasClientChat) {
      setPhaseStatus('chat');
    } else if (phase?.decision) {
      setPhaseStatus('decision');
    } else if (phase?.eventType === 'resolution') {
      setPhaseStatus('complete');
    }
  };

  const lockChatAndDecide = () => {
    if (phase?.decision) {
      setPhaseStatus('decision');
    } else {
      advanceToNextPhase();
    }
  };

  const sendChatMessage = async () => {
    const msg = chatInput.trim();
    if (!msg || isLoading || chatIsLocked) return;
    setChatInput('');

    setChatMessages(prev => [...prev, { phase: currentPhase, from: 'associate', text: msg }]);
    setIsLoading(true);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase: currentPhase, action: 'chat_message', chatMessage: msg }),
      });
      const data = await res.json();
      setChatMessages(prev => [...prev, {
        phase: currentPhase, from: 'client',
        text: data.clientResponse || 'I understand. Thank you.',
        emotion: data.emotion || 'calm',
      }]);
    } catch {
      setChatMessages(prev => [...prev, {
        phase: currentPhase, from: 'client', text: 'I understand. Thank you.', emotion: 'calm',
      }]);
    }
    setIsLoading(false);
  };

  const submitDecision = async () => {
    if (!selectedOption || !phase?.decision || isLoading) return;
    setIsLoading(true);

    const isCorrect = selectedOption === phase.decision.correctOptionId;
    let explanation = isCorrect ? phase.fallbackFeedback.correct : phase.fallbackFeedback.incorrect;
    let score = isCorrect ? 100 : 25;

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phase: currentPhase,
          action: 'evaluate_decision',
          decision: selectedOption,
          correctOptionId: phase.decision.correctOptionId,
          phaseTitle: phase.title,
          learningObjective: phase.learningObjective,
        }),
      });
      const data = await res.json();
      if (!data.fallback) {
        explanation = data.explanation || explanation;
        score = data.score ?? score;
      }
    } catch {
      // Use fallback feedback — already set above
    }

    const decision: PhaseDecision = {
      phase: currentPhase,
      selectedOptionId: selectedOption,
      correct: isCorrect,
      score,
      explanation,
      attumInsight: phase.guidance.attumNote,
    };

    setDecisions(prev => [...prev, decision]);
    setShowGuidance(true);
    setPhaseStatus('feedback');
    setIsLoading(false);
  };

  const advanceToNextPhase = () => {
    const next = currentPhase + 1;
    if (next > TOTAL_PHASES) {
      setPhaseStatus('complete');
    } else {
      setCurrentPhase(next);
      setPhaseStatus('event');
      setSelectedOption(null);
      setShowGuidance(false);
      setChatInput('');
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────

  if (!phase && !isComplete) return null;

  const currentDecision = decisions.find(d => d.phase === currentPhase);
  const scoreData = calculateScore(decisions);

  return (
    <div className="p-4 md:p-8 max-w-6xl" ref={topRef}>
      {/* ── Progress Bar ──────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <Link
            href="/demo/platform/training"
            className="text-sm font-medium"
            style={{ color: 'var(--accent-gold)' }}
          >
            &larr; Back to Training
          </Link>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            Phase {Math.min(currentPhase, TOTAL_PHASES)} of {TOTAL_PHASES}
          </span>
        </div>
        <div className="rounded-full overflow-hidden" style={{ height: 6, background: 'var(--border-light)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: 'var(--accent-gold)' }} />
        </div>
        {/* Phase circles */}
        <div className="flex gap-1.5 mt-3 justify-center">
          {SCENARIO.phases.map(p => {
            const decided = decisions.find(d => d.phase === p.number);
            const isCurrent = p.number === currentPhase;
            const isPast = p.number < currentPhase;
            return (
              <div
                key={p.number}
                className="rounded-full flex items-center justify-center text-xs font-bold"
                style={{
                  width: 28, height: 28,
                  backgroundColor: decided?.correct ? '#16a34a'
                    : decided && !decided.correct ? '#d97706'
                    : isCurrent ? 'var(--accent-gold)'
                    : isPast ? '#6b7280'
                    : 'var(--border-light)',
                  color: isCurrent || isPast || decided ? '#fff' : 'var(--muted)',
                  border: isCurrent ? '2px solid var(--accent-gold)' : 'none',
                }}
              >
                {decided ? (decided.correct ? '\u2713' : '!' ) : p.number}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Main Layout ───────────────────────────────────────────── */}
      {phaseStatus === 'intro' ? (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <h2
            className="text-2xl md:text-3xl font-semibold mb-3 text-center"
            style={{ fontFamily: "var(--font-source-serif), 'Source Serif 4', serif", color: 'var(--heading)' }}
          >
            Case Simulation: I-130 Spousal Petition
          </h2>
          <p className="text-sm text-center mb-6" style={{ color: 'var(--muted)' }}>
            Practice handling a real immigration case from start to finish.
          </p>

          <div className="rounded-lg p-6 mb-6" style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)' }}>
            <div className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--accent-gold)', letterSpacing: '0.04em' }}>
              How this works
            </div>
            <div className="flex flex-col gap-3 text-sm" style={{ color: 'var(--foreground)' }}>
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--accent-gold)', color: '#fff' }}>1</span>
                <span><strong>Read the scenario</strong> — each phase starts with something happening in the case.</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--accent-gold)', color: '#fff' }}>2</span>
                <span><strong>Talk to the client</strong> — some phases let you chat with the AI-powered client. Ask questions, gather information, exercise your judgment. When you have enough information, you will lock the chat and move on.</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--accent-gold)', color: '#fff' }}>3</span>
                <span><strong>Answer the question</strong> — the chat locks and you pick the best answer from the options. There is one correct answer per phase.</span>
              </div>
              <div className="flex gap-3 items-start">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: 'var(--accent-gold)', color: '#fff' }}>4</span>
                <span><strong>Get feedback</strong> — the AI evaluates your decision and Attorney Attum shares expert insight. Then you move to the next phase.</span>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-6 mb-6" style={{ background: '#f0f4f8', border: '1px solid #d3dce6' }}>
            <div className="text-xs font-bold uppercase mb-2" style={{ color: '#4a6785', letterSpacing: '0.04em' }}>
              The case
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#4a6785' }}>
              <strong>Kho Meh</strong> (US Citizen, born in Thailand) wants to petition for her husband <strong>Geovany Cardona Hernandez</strong> (Guatemala). He entered the US on asylum in 2019 and has pending removal proceedings. You will handle this case through <strong>{TOTAL_PHASES} phases</strong> and make <strong>{DECISION_PHASES} decisions</strong>. At the end, you will receive a score and detailed feedback.
            </p>
          </div>

          <div className="text-center">
            <button onClick={() => setPhaseStatus('event')} style={styles.goldButton}>
              Begin Simulation
            </button>
          </div>
        </div>
      ) : isComplete ? (
        <ReportCard decisions={decisions} scoreData={scoreData} />
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Main simulation flow */}
          <div className="flex-1 min-w-0">
            {/* Section label */}
            <div className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)', letterSpacing: '0.08em' }}>
              {phase!.contextLabel}
            </div>

            {/* Phase title */}
            <h2
              className="text-xl md:text-2xl font-semibold mb-2"
              style={{ fontFamily: "var(--font-source-serif), 'Source Serif 4', serif", color: 'var(--heading)' }}
            >
              Phase {phase!.number}: {phase!.title}
            </h2>

            {/* Current step indicator */}
            {phase!.decision && (() => {
              const steps = phase!.hasClientChat
                ? ['Read scenario', 'Talk to client', 'Answer question', 'Get feedback']
                : ['Read scenario', 'Answer question', 'Get feedback'];
              const statusMap: Record<PhaseStatus, number> = phase!.hasClientChat
                ? { intro: -1, event: 0, chat: 1, decision: 2, feedback: 3, complete: 99 }
                : { intro: -1, event: 0, chat: 0, decision: 1, feedback: 2, complete: 99 };
              const currentIdx = statusMap[phaseStatus];
              return (
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {steps.map((step, i) => {
                    const isActive = i === currentIdx;
                    const isDone = i < currentIdx;
                    return (
                      <div key={step} className="flex items-center gap-1.5">
                        {i > 0 && <div className="w-4 h-px" style={{ backgroundColor: isDone ? '#16a34a' : 'var(--border-light)' }} />}
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{
                          backgroundColor: isActive ? 'var(--accent-gold)' : isDone ? '#16a34a' : 'var(--background)',
                          color: isActive || isDone ? '#fff' : 'var(--muted)',
                          border: !isActive && !isDone ? '1px solid var(--border-light)' : 'none',
                        }}>
                          {isDone ? '\u2713 ' : ''}{step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Event card */}
            <div
              className="rounded-lg p-5 mb-4"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
            >
              <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--accent-gold)', letterSpacing: '0.04em' }}>
                What happened
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                {phase!.event}
              </p>
            </div>

            {phaseStatus === 'event' && (
              <button onClick={advanceFromEvent} style={styles.goldButton}>
                {phase!.hasClientChat ? 'Talk to the client' : phase!.decision ? 'Answer the question' : 'Continue'}
              </button>
            )}

            {/* Client conversation — active during chat, locked during decision/feedback */}
            {phaseChatMessages.length > 0 && (
              <div className="mb-4">
                <div className="rounded-lg overflow-hidden" style={{ border: `2px solid ${chatIsLocked ? 'var(--border-light)' : 'var(--accent-gold)'}` }}>
                  <div className="px-4 py-2.5 flex items-center justify-between" style={{
                    background: chatIsLocked ? 'var(--background)' : '#fdf8f0',
                    borderBottom: '1px solid var(--border-light)',
                  }}>
                    <span className="text-xs font-bold uppercase" style={{ color: chatIsLocked ? 'var(--muted)' : 'var(--accent-gold)', letterSpacing: '0.04em' }}>
                      Client conversation
                    </span>
                    {chatIsLocked && (
                      <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--border-light)', color: 'var(--muted)' }}>
                        Locked — decision time
                      </span>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-3" style={{ background: 'var(--card-bg)', maxHeight: 320, overflowY: 'auto' }}>
                    {phaseChatMessages.map((msg, i) => (
                      <div key={i} className={`flex gap-2.5 ${msg.from === 'associate' ? 'flex-row-reverse' : ''}`}>
                        {msg.from === 'client' && (
                          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: '#7c3aed', color: '#fff' }}>
                            {SCENARIO.client.initials}
                          </div>
                        )}
                        <div className="rounded-xl px-3.5 py-2.5 text-sm max-w-[80%]" style={{
                          background: msg.from === 'client' ? '#fffbeb' : '#f0fdf4',
                          border: `1px solid ${msg.from === 'client' ? '#fde68a' : '#bbf7d0'}`,
                          color: 'var(--foreground)',
                        }}>
                          {msg.from === 'client' && (
                            <div className="text-xs font-semibold mb-1" style={{ color: '#7c3aed' }}>
                              {SCENARIO.client.name}
                              {msg.emotion === 'upset' && <span style={{ color: '#dc2626' }}> (distressed)</span>}
                              {msg.emotion === 'grateful' && <span style={{ color: '#16a34a' }}> (grateful)</span>}
                            </div>
                          )}
                          {msg.from === 'associate' && (
                            <div className="text-xs font-semibold mb-1" style={{ color: '#16a34a' }}>You</div>
                          )}
                          <p className="leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {isLoading && phaseStatus === 'chat' && (
                      <div className="flex gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: '#7c3aed', color: '#fff' }}>{SCENARIO.client.initials}</div>
                        <div className="rounded-xl px-3.5 py-2.5" style={{ background: '#fffbeb', border: '1px solid #fde68a' }}>
                          <span className="text-sm" style={{ color: 'var(--muted)' }}>typing...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  {/* Chat input — only visible when chat is active */}
                  {phaseStatus === 'chat' && (
                    <div className="px-4 py-3 flex gap-2" style={{ borderTop: '1px solid var(--border-light)', background: '#fdf8f0' }}>
                      <input
                        type="text"
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                        placeholder="Ask the client a question or respond..."
                        className="flex-1 rounded-lg px-3 py-2 text-sm"
                        style={{ border: '1px solid var(--border-light)', background: 'var(--card-bg)', color: 'var(--foreground)' }}
                        disabled={isLoading}
                      />
                      <button
                        onClick={sendChatMessage}
                        disabled={isLoading || !chatInput.trim()}
                        className="rounded-lg px-4 py-2 text-sm font-medium text-white"
                        style={{ background: isLoading || !chatInput.trim() ? 'var(--muted)' : 'var(--accent-gold)' }}
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
                {/* Transition button — only after at least one exchange */}
                {phaseStatus === 'chat' && phaseChatMessages.filter(m => m.from === 'associate').length >= 1 && !isLoading && (
                  <button onClick={lockChatAndDecide} style={{ ...styles.goldButton, marginTop: 12 }}>
                    I have enough information — answer the question
                  </button>
                )}
              </div>
            )}

            {/* Decision cards */}
            {(phaseStatus === 'decision' || phaseStatus === 'feedback') && phase?.decision && (
              <div className="mb-4">
                <div className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--accent-gold)', letterSpacing: '0.04em' }}>
                  Your decision
                </div>
                <p className="text-sm font-medium mb-3" style={{ color: 'var(--heading)' }}>
                  {phase.decision.prompt}
                </p>
                <div className="flex flex-col gap-2.5">
                  {phase.decision.options.map(opt => {
                    const isSelected = selectedOption === opt.id;
                    const isSubmitted = phaseStatus === 'feedback';
                    const isCorrectOption = opt.id === phase.decision!.correctOptionId;
                    const wasChosen = currentDecision?.selectedOptionId === opt.id;

                    let borderColor = 'var(--border-light)';
                    let bgColor = 'var(--card-bg)';
                    let circleColor = 'var(--border-light)';
                    let circleText = 'var(--muted)';

                    if (isSubmitted && isCorrectOption) {
                      borderColor = '#16a34a'; bgColor = '#f0fdf4'; circleColor = '#16a34a'; circleText = '#fff';
                    } else if (isSubmitted && wasChosen && !isCorrectOption) {
                      borderColor = '#dc2626'; bgColor = '#fef2f2'; circleColor = '#dc2626'; circleText = '#fff';
                    } else if (isSelected && !isSubmitted) {
                      borderColor = 'var(--accent-gold)'; circleColor = 'var(--accent-gold)'; circleText = '#fff';
                    }

                    return (
                      <button
                        key={opt.id}
                        onClick={() => !isSubmitted && setSelectedOption(opt.id)}
                        disabled={isSubmitted}
                        className="flex items-start gap-3 rounded-lg p-4 text-left transition-colors"
                        style={{ border: `2px solid ${borderColor}`, background: bgColor, cursor: isSubmitted ? 'default' : 'pointer' }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: circleColor, color: circleText }}
                        >
                          {isSubmitted && isCorrectOption ? '\u2713' : isSubmitted && wasChosen && !isCorrectOption ? '\u2717' : opt.label}
                        </div>
                        <span className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
                {phaseStatus === 'decision' && (
                  <button
                    onClick={submitDecision}
                    disabled={!selectedOption || isLoading}
                    style={{
                      ...styles.goldButton,
                      marginTop: 12,
                      opacity: !selectedOption || isLoading ? 0.5 : 1,
                      cursor: !selectedOption || isLoading ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isLoading ? 'Evaluating...' : 'Submit Decision'}
                  </button>
                )}
              </div>
            )}

            {/* Feedback */}
            {phaseStatus === 'feedback' && currentDecision && (
              <div className="mb-4">
                {/* Result banner */}
                <div
                  className="rounded-lg p-4 mb-3"
                  style={{
                    background: currentDecision.correct ? '#f0fdf4' : '#fef2f2',
                    border: `1px solid ${currentDecision.correct ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  <div className="text-sm font-bold mb-1" style={{ color: currentDecision.correct ? '#16a34a' : '#dc2626' }}>
                    {currentDecision.correct ? 'Correct' : 'Not quite right'} — {currentDecision.score}/100 points
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>
                    {currentDecision.explanation}
                  </p>
                </div>

                {/* Attum insight */}
                {currentDecision.attumInsight && showGuidance && (
                  <div
                    className="rounded-lg p-4 mb-3"
                    style={{ background: '#fdf8f0', borderLeft: '3px solid var(--accent-gold)' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--accent-gold)', color: '#fff' }}>
                        SA
                      </div>
                      <span className="text-xs font-bold uppercase" style={{ color: '#5c4a1e', letterSpacing: '0.04em' }}>
                        From Attorney Attum
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#5c4a1e' }}>
                      {currentDecision.attumInsight}
                    </p>
                  </div>
                )}

                <button onClick={advanceToNextPhase} style={styles.goldButton}>
                  {currentPhase >= TOTAL_PHASES ? 'See your results' : 'Continue to next phase'}
                </button>
              </div>
            )}

            {/* Learning objective */}
            {phase?.learningObjective && phaseStatus === 'feedback' && (
              <div
                className="rounded-lg p-4 mt-2"
                style={{ background: 'rgba(37, 99, 235, 0.05)', border: '1px solid rgba(37, 99, 235, 0.15)' }}
              >
                <div className="text-xs font-medium mb-1" style={{ color: '#2563eb' }}>Learning objective</div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {phase.learningObjective}
                </p>
              </div>
            )}
          </div>

          {/* Right: Context panel */}
          <div className="lg:w-80 shrink-0">
            {/* Case facts */}
            <div
              className="rounded-lg p-4 mb-4"
              style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
            >
              <div className="text-xs font-bold uppercase mb-3" style={{ color: 'var(--heading)', letterSpacing: '0.04em' }}>
                Case Facts
              </div>
              <div className="flex flex-col gap-1.5">
                {SCENARIO.client.facts.map((fact, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 600 }}>&bull;</span>
                    {fact}
                  </div>
                ))}
              </div>
            </div>

            {/* Why it matters */}
            {phase?.guidance.whyItMatters && (phaseStatus === 'decision' || phaseStatus === 'feedback') && (
              <div
                className="rounded-lg p-4 mb-4"
                style={{ background: '#f0f4f8', border: '1px solid #d3dce6' }}
              >
                <div className="text-xs font-bold uppercase mb-2" style={{ color: '#4a6785', letterSpacing: '0.04em' }}>
                  Why this matters
                </div>
                <p className="text-xs leading-relaxed" style={{ color: '#4a6785' }}>
                  {phase.guidance.whyItMatters}
                </p>
              </div>
            )}

            {/* Score tracker */}
            {decisions.length > 0 && (
              <div
                className="rounded-lg p-4"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
              >
                <div className="text-xs font-bold uppercase mb-2" style={{ color: 'var(--heading)', letterSpacing: '0.04em' }}>
                  Running Score
                </div>
                <div className="text-2xl font-bold" style={{ color: getGradeColor(scoreData.percentage), fontFamily: "var(--font-source-serif), 'Source Serif 4', serif" }}>
                  {scoreData.percentage}%
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {scoreData.score}/{scoreData.maxScore} points ({decisions.length}/{DECISION_PHASES} decisions)
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Report Card ───────────────────────────────────────────────────────────
function ReportCard({ decisions, scoreData }: { decisions: PhaseDecision[]; scoreData: { score: number; maxScore: number; percentage: number } }) {
  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <div className="text-center mb-8">
        <h2
          className="text-2xl md:text-3xl font-semibold mb-2"
          style={{ fontFamily: "var(--font-source-serif), 'Source Serif 4', serif", color: 'var(--heading)' }}
        >
          Simulation Complete
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          I-130 Spousal Petition — {I130_SPOUSAL_SCENARIO.client.name} &amp; Geovany Cardona Hernandez
        </p>
      </div>

      {/* Score */}
      <div
        className="rounded-xl p-8 text-center mb-6"
        style={{ background: 'var(--card-bg)', border: '1px solid var(--border-light)' }}
      >
        <div
          className="text-5xl font-bold mb-2"
          style={{ color: getGradeColor(scoreData.percentage), fontFamily: "var(--font-source-serif), 'Source Serif 4', serif" }}
        >
          {scoreData.percentage}%
        </div>
        <div className="text-lg font-semibold mb-1" style={{ color: getGradeColor(scoreData.percentage) }}>
          {getGradeLabel(scoreData.percentage)}
        </div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          {scoreData.score} out of {scoreData.maxScore} points across {decisions.length} decisions
        </div>
      </div>

      {/* Per-phase breakdown */}
      <div
        className="rounded-lg overflow-hidden mb-6"
        style={{ border: '1px solid var(--border-light)' }}
      >
        <div className="px-5 py-3 text-xs font-bold uppercase" style={{ background: 'var(--background)', color: 'var(--heading)', letterSpacing: '0.04em', borderBottom: '1px solid var(--border-light)' }}>
          Decision Breakdown
        </div>
        {decisions.map((d, i) => {
          const p = SCENARIO.phases.find(ph => ph.number === d.phase);
          return (
            <div
              key={i}
              className="px-5 py-4 flex items-start gap-3"
              style={{ borderBottom: i < decisions.length - 1 ? '1px solid var(--border-light)' : 'none', background: 'var(--card-bg)' }}
            >
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5"
                style={{ backgroundColor: d.correct ? '#16a34a' : '#dc2626', color: '#fff' }}
              >
                {d.correct ? '\u2713' : '\u2717'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-sm font-semibold" style={{ color: 'var(--heading)' }}>
                    Phase {d.phase}: {p?.title}
                  </span>
                  <span className="text-xs font-bold" style={{ color: d.correct ? '#16a34a' : '#dc2626' }}>
                    {d.score}/100
                  </span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {d.explanation.slice(0, 200)}{d.explanation.length > 200 ? '...' : ''}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Key takeaways */}
      <div
        className="rounded-lg p-5 mb-6"
        style={{ background: '#fdf8f0', borderLeft: '3px solid var(--accent-gold)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--accent-gold)', color: '#fff' }}>SA</div>
          <span className="text-xs font-bold uppercase" style={{ color: '#5c4a1e', letterSpacing: '0.04em' }}>Key Takeaways from Attorney Attum</span>
        </div>
        <div className="flex flex-col gap-2">
          {decisions.filter(d => d.attumInsight).map((d, i) => (
            <p key={i} className="text-sm leading-relaxed" style={{ color: '#5c4a1e' }}>
              <strong>Phase {d.phase}:</strong> {d.attumInsight}
            </p>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          href="/demo/platform/training"
          className="rounded-lg px-6 py-3 text-sm font-semibold text-center"
          style={{ background: 'var(--accent-gold)', color: '#fff', textDecoration: 'none' }}
        >
          Return to Training
        </Link>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg px-6 py-3 text-sm font-semibold"
          style={{ border: '1px solid var(--border-light)', background: 'var(--card-bg)', color: 'var(--heading)', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    </div>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = {
  goldButton: {
    display: 'inline-block' as const,
    padding: '12px 28px',
    fontSize: '0.9375rem',
    fontWeight: 600,
    fontFamily: '"DM Sans", sans-serif',
    color: '#ffffff',
    backgroundColor: 'var(--accent-gold)',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer' as const,
  },
};
