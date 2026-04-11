'use client';

import { useState } from 'react';

type StepStatus = 'completed' | 'current' | 'review' | 'locked';

interface QuestionThread {
  from: string;
  text: string;
  answer: string;
  answeredBy: string;
  answeredAt: string;
}

interface ReviewRequest {
  from: string;
  message: string;
  submittedAt: string;
}

interface WorkflowStep {
  number: number;
  title: string;
  description: string;
  status: StepStatus;
  details: string[];
  whyItMatters: string;
  attumNote: string | null;
  question?: QuestionThread;
  reviewRequest?: ReviewRequest;
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    number: 1,
    title: 'Initial Client Intake',
    description: 'Collect client information and verify eligibility',
    status: 'completed',
    details: [
      'Verify petitioner is US Citizen or LPR',
      'Confirm marriage is legally valid',
      'Check for prior immigration violations',
      'Complete intake questionnaire',
    ],
    whyItMatters:
      'USCIS will reject the petition if basic eligibility is not met. Catching issues here saves months of wasted time.',
    attumNote:
      'Always ask about prior marriages for both parties. A missing divorce decree is the #1 reason I see I-130s get RFEs.',
  },
  {
    number: 2,
    title: 'Gather Evidence Package',
    description: 'Collect all supporting documents',
    status: 'completed',
    details: [
      'Marriage certificate (translated if foreign)',
      'Photographs showing bona fide relationship',
      'Joint financial documents (bank statements, lease, insurance)',
      'Support letters from family and friends',
      'Both parties\' identification documents',
    ],
    whyItMatters:
      'The evidence package proves the marriage is real, not fraudulent. USCIS interviews will focus on these documents.',
    attumNote:
      'I always tell clients: more evidence is better. A thin evidence package invites scrutiny.',
  },
  {
    number: 3,
    title: 'Complete I-130 Petition',
    description: 'Fill out Form I-130 using intake data',
    status: 'completed',
    details: [
      'Auto-fill I-130 from intake form',
      'Verify all fields for accuracy',
      'Cross-check dates and names across documents',
    ],
    whyItMatters:
      'Inconsistencies between the I-130 and supporting documents trigger RFEs or denials.',
    attumNote: null,
  },
  {
    number: 4,
    title: 'Determine Concurrent Filing',
    description: 'Decide if I-485, I-765, I-131 should be filed simultaneously',
    status: 'current',
    details: [
      'Check if beneficiary is in the US',
      'Verify immigration status allows adjustment',
      'Prepare I-485 if concurrent',
      'Prepare I-765 (work permit) and I-131 (travel document)',
    ],
    whyItMatters:
      'Concurrent filing saves 6-12 months. The beneficiary gets work authorization while waiting.',
    attumNote:
      'If the beneficiary entered without inspection, concurrent filing is NOT available unless they qualify under 245(i). This is a common junior mistake.',
    question: {
      from: 'Maria Lopez',
      text: 'The beneficiary entered on asylum status (AS). Does that qualify for concurrent filing even though they have removal proceedings?',
      answer:
        'Yes - asylees who entered legally can file I-485 concurrently. The pending removal proceedings actually get terminated once the I-130 is approved and I-485 is adjudicated. File a motion to continue the removal case while the petition is pending.',
      answeredBy: 'Attorney Attum',
      answeredAt: '2 days ago',
    },
  },
  {
    number: 5,
    title: 'Senior Review',
    description: 'Attorney Attum reviews the complete filing package',
    status: 'review',
    details: [
      'Review all forms for accuracy',
      'Verify evidence package is complete',
      'Check for potential red flags',
      'Approve for filing',
    ],
    whyItMatters:
      'Senior review catches issues that could result in an RFE or denial. This step prevents costly mistakes.',
    attumNote: null,
    reviewRequest: {
      from: 'Maria Lopez',
      message:
        'Package is ready for review. I included extra photos from the wedding and a joint car insurance policy as additional evidence. The concurrent filing forms are attached.',
      submittedAt: 'Today, 9:15 AM',
    },
  },
  {
    number: 6,
    title: 'File with USCIS',
    description: 'Submit the petition and all supporting documents',
    status: 'locked',
    details: [
      'Assemble filing package',
      'Calculate and include filing fees',
      'Send via certified mail or file online',
      'Calendar follow-up dates',
    ],
    whyItMatters:
      'Proper filing prevents rejection. Wrong fee, wrong service center, or missing G-28 means starting over.',
    attumNote: null,
  },
  {
    number: 7,
    title: 'Post-Filing Follow-Up',
    description: 'Track case and respond to USCIS communications',
    status: 'locked',
    details: [
      'Receive and record receipt notice',
      'Schedule biometrics appointment',
      'Respond to any RFEs within deadline',
      'Prepare client for interview',
    ],
    whyItMatters:
      'Missing an RFE deadline means automatic denial. The system tracks all deadlines automatically.',
    attumNote: null,
  },
];

const completedCount = WORKFLOW_STEPS.filter((s) => s.status === 'completed').length;
const totalCount = WORKFLOW_STEPS.length;
const progressPercent = Math.round((completedCount / totalCount) * 100);

function StatusIcon({ status }: { status: StepStatus }) {
  if (status === 'completed') {
    return (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M4 8l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === 'locked') {
    return (
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="6" width="8" height="6" rx="1" />
        <path d="M5 6V4.5a2 2 0 014 0V6" />
      </svg>
    );
  }
  return null;
}

function statusColor(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return '#16a34a';
    case 'current':
      return '#b8860b';
    case 'review':
      return '#2563eb';
    case 'locked':
      return '#d1d5db';
  }
}

function statusLabel(status: StepStatus): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'current':
      return 'In Progress';
    case 'review':
      return 'Awaiting Review';
    case 'locked':
      return 'Locked';
  }
}

export default function WorkflowPage() {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set([4]));
  const [showAskQuestion, setShowAskQuestion] = useState(false);

  const toggleStep = (num: number) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(num)) {
        next.delete(num);
      } else {
        next.add(num);
      }
      return next;
    });
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      {/* Case Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1
            className="text-2xl font-semibold"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--heading)',
            }}
          >
            Meh / Cardona Hernandez - I-130 Spousal Petition
          </h1>
          <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            Case #IMM-2026-001 -- Assigned to Maria Lopez
          </div>
        </div>
        <span
          style={{
            display: 'inline-block',
            padding: '4px 14px',
            borderRadius: 12,
            fontSize: '0.8rem',
            fontWeight: 600,
            background: '#b8860b18',
            color: '#b8860b',
            whiteSpace: 'nowrap',
          }}
        >
          Active
        </span>
      </div>

      {/* Progress Bar */}
      <div
        className="rounded-lg p-5 mb-8"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
            Case Progress
          </span>
          <span className="text-sm font-semibold" style={{ color: 'var(--accent-gold)' }}>
            {completedCount}/{totalCount} steps complete
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 8,
            borderRadius: 4,
            background: 'var(--border-light)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: 4,
              background: 'var(--accent-gold)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Workflow Timeline */}
      <div className="relative">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isExpanded = expandedSteps.has(step.number);
          const isLast = idx === WORKFLOW_STEPS.length - 1;
          const color = statusColor(step.status);
          const isLocked = step.status === 'locked';

          return (
            <div
              key={step.number}
              className="relative flex gap-4 md:gap-6"
              style={{ opacity: isLocked ? 0.55 : 1 }}
            >
              {/* Timeline column */}
              <div className="flex flex-col items-center shrink-0" style={{ width: 40 }}>
                {/* Step circle */}
                <div
                  className="flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    background: color,
                    border: step.status === 'locked' ? '2px solid #d1d5db' : 'none',
                  }}
                  title={isLocked ? 'Complete previous steps first' : statusLabel(step.status)}
                >
                  {step.status === 'completed' ? (
                    <StatusIcon status="completed" />
                  ) : step.status === 'locked' ? (
                    <StatusIcon status="locked" />
                  ) : (
                    <span
                      style={{
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {step.number}
                    </span>
                  )}
                </div>
                {/* Connecting line */}
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 20,
                      background:
                        step.status === 'completed' ? '#16a34a' : 'var(--border-light)',
                    }}
                  />
                )}
              </div>

              {/* Step card */}
              <div className="flex-1 pb-6" style={{ minWidth: 0 }}>
                <div
                  className="rounded-lg"
                  style={{
                    background: 'var(--card-bg)',
                    border: `1px solid ${step.status === 'current' ? 'var(--accent-gold)' : step.status === 'review' ? '#2563eb40' : 'var(--border-light)'}`,
                    boxShadow: step.status === 'current' ? '0 0 0 1px var(--accent-gold-muted)' : 'none',
                  }}
                >
                  {/* Card header - clickable */}
                  <button
                    onClick={() => !isLocked && toggleStep(step.number)}
                    disabled={isLocked}
                    className="w-full text-left p-4 md:p-5"
                    style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className="text-base font-semibold"
                            style={{
                              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                              color: 'var(--heading)',
                            }}
                          >
                            {step.title}
                          </h3>
                          <span
                            style={{
                              display: 'inline-block',
                              padding: '1px 8px',
                              borderRadius: 10,
                              fontSize: '0.7rem',
                              fontWeight: 600,
                              background: color + '18',
                              color: color,
                            }}
                          >
                            {statusLabel(step.status)}
                          </span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                          {step.description}
                        </p>
                      </div>
                      {!isLocked && (
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
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            flexShrink: 0,
                            marginTop: 4,
                          }}
                        >
                          <polyline points="4 6 8 10 12 6" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && !isLocked && (
                    <div
                      style={{
                        borderTop: '1px solid var(--border-light)',
                        padding: '16px 20px 20px',
                      }}
                    >
                      {/* Task details */}
                      <div className="mb-4">
                        <h4
                          className="text-xs font-semibold uppercase tracking-wide mb-2"
                          style={{ color: 'var(--muted)' }}
                        >
                          Tasks
                        </h4>
                        <ul className="flex flex-col gap-1.5">
                          {step.details.map((detail, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                              {step.status === 'completed' ? (
                                <svg
                                  width="16"
                                  height="16"
                                  viewBox="0 0 16 16"
                                  fill="none"
                                  style={{ flexShrink: 0, marginTop: 2 }}
                                >
                                  <path d="M4 8l3 3 5-5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                <span
                                  style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: 3,
                                    border: '1.5px solid var(--border-light)',
                                    flexShrink: 0,
                                    marginTop: 2,
                                    display: 'block',
                                  }}
                                />
                              )}
                              {detail}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Why it matters */}
                      <div
                        className="rounded-md p-3 mb-4"
                        style={{ background: '#f0f4f8' }}
                      >
                        <h4
                          className="text-xs font-semibold uppercase tracking-wide mb-1"
                          style={{ color: '#4a6785' }}
                        >
                          Why This Matters
                        </h4>
                        <p className="text-sm" style={{ color: '#2c3e50' }}>
                          {step.whyItMatters}
                        </p>
                      </div>

                      {/* Attorney Attum note */}
                      {step.attumNote && (
                        <div
                          className="rounded-md p-3 mb-4"
                          style={{
                            background: '#fdf8f0',
                            borderLeft: '3px solid #b8860b',
                          }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className="flex items-center justify-center rounded-full text-xs font-bold"
                              style={{
                                width: 24,
                                height: 24,
                                background: '#b8860b',
                                color: '#fff',
                              }}
                            >
                              SA
                            </span>
                            <span
                              className="text-xs font-semibold"
                              style={{ color: '#b8860b' }}
                            >
                              From Attorney Attum
                            </span>
                          </div>
                          <p
                            className="text-sm"
                            style={{ color: '#5c4a1e', lineHeight: 1.5 }}
                          >
                            {step.attumNote}
                          </p>
                        </div>
                      )}

                      {/* Question thread (for current step) */}
                      {step.question && (
                        <div className="mb-4">
                          <h4
                            className="text-xs font-semibold uppercase tracking-wide mb-3"
                            style={{ color: 'var(--muted)' }}
                          >
                            Discussion
                          </h4>
                          {/* Question */}
                          <div
                            className="rounded-md p-3 mb-2"
                            style={{ background: '#fffbeb', border: '1px solid #fde68a' }}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span
                                className="flex items-center justify-center rounded-full text-xs font-bold"
                                style={{
                                  width: 24,
                                  height: 24,
                                  background: '#7c3aed',
                                  color: '#fff',
                                }}
                              >
                                ML
                              </span>
                              <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                                {step.question.from}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                              {step.question.text}
                            </p>
                          </div>
                          {/* Answer */}
                          <div
                            className="rounded-md p-3"
                            style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="flex items-center justify-center rounded-full text-xs font-bold"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    background: '#b8860b',
                                    color: '#fff',
                                  }}
                                >
                                  SA
                                </span>
                                <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                                  {step.question.answeredBy}
                                </span>
                              </div>
                              <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                                {step.question.answeredAt}
                              </span>
                            </div>
                            <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                              {step.question.answer}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Review request (for review step) */}
                      {step.reviewRequest && (
                        <div className="mb-4">
                          <h4
                            className="text-xs font-semibold uppercase tracking-wide mb-3"
                            style={{ color: 'var(--muted)' }}
                          >
                            Review Request
                          </h4>
                          <div
                            className="rounded-md p-3"
                            style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className="flex items-center justify-center rounded-full text-xs font-bold"
                                  style={{
                                    width: 24,
                                    height: 24,
                                    background: '#7c3aed',
                                    color: '#fff',
                                  }}
                                >
                                  ML
                                </span>
                                <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                                  {step.reviewRequest.from}
                                </span>
                              </div>
                              <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                                {step.reviewRequest.submittedAt}
                              </span>
                            </div>
                            <p className="text-sm mb-3" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                              {step.reviewRequest.message}
                            </p>
                            <div className="flex gap-2">
                              <button
                                className="px-4 py-2 rounded-md text-sm font-medium"
                                style={{
                                  background: '#16a34a',
                                  color: '#fff',
                                  cursor: 'default',
                                }}
                              >
                                Approve
                              </button>
                              <button
                                className="px-4 py-2 rounded-md text-sm font-medium"
                                style={{
                                  background: 'transparent',
                                  color: '#dc2626',
                                  border: '1px solid #fca5a5',
                                  cursor: 'default',
                                }}
                              >
                                Request Changes
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom actions */}
      <div
        className="flex flex-col sm:flex-row gap-3 mt-4 pt-6"
        style={{ borderTop: '1px solid var(--border-light)' }}
      >
        <button
          onClick={() => setShowAskQuestion(!showAskQuestion)}
          className="px-5 py-2.5 rounded-md text-sm font-medium"
          style={{
            background: 'var(--accent-gold)',
            color: '#fff',
          }}
        >
          Ask a Question
        </button>
        <button
          className="px-5 py-2.5 rounded-md text-sm font-medium"
          style={{
            background: 'transparent',
            color: 'var(--heading)',
            border: '1px solid var(--border-light)',
            cursor: 'default',
          }}
        >
          Request Meeting
        </button>
      </div>

      {/* Ask question textarea */}
      {showAskQuestion && (
        <div
          className="rounded-lg p-4 mt-4"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-light)',
          }}
        >
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: 'var(--heading)' }}
          >
            Your Question
          </label>
          <textarea
            className="w-full rounded-md p-3 text-sm"
            rows={3}
            placeholder="Type your question about this case step..."
            style={{
              border: '1px solid var(--border-light)',
              background: 'var(--background)',
              color: 'var(--foreground)',
              resize: 'vertical',
            }}
          />
          <div className="flex justify-end mt-2">
            <button
              className="px-4 py-2 rounded-md text-sm font-medium"
              style={{
                background: 'var(--accent-gold)',
                color: '#fff',
                cursor: 'default',
              }}
            >
              Submit Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
