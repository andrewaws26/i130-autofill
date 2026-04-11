'use client';

import { useState } from 'react';

interface QuestionThread {
  id: string;
  from: string;
  fromInitials: string;
  fromColor: string;
  caseLabel: string;
  caseNumber: string;
  step: string;
  question: string;
  answer?: string;
  answeredAt?: string;
  postedAgo: string;
}

const QUESTION_THREADS: QuestionThread[] = [
  {
    id: 'q1',
    from: 'Maria Lopez',
    fromInitials: 'ML',
    fromColor: '#7c3aed',
    caseLabel: 'Gutierrez Asylum',
    caseNumber: 'Case #IMM-2026-002',
    step: 'Prepare Asylum Application',
    question:
      'The client says she was threatened by gang members but didn\'t file a police report. Does she still have a viable claim?',
    answer:
      'Yes. Many asylum seekers don\'t file reports because they don\'t trust local police - that\'s actually part of the claim. Document why she didn\'t report, get a detailed declaration of the threats, and look for country conditions reports showing police corruption in her region.',
    answeredAt: 'Yesterday',
    postedAgo: 'Yesterday',
  },
  {
    id: 'q2',
    from: 'Maria Lopez',
    fromInitials: 'ML',
    fromColor: '#7c3aed',
    caseLabel: 'Mitchell Divorce',
    caseNumber: 'Case #FAM-2026-001',
    step: 'Financial Disclosure',
    question:
      'Mr. Mitchell says his wife is hiding assets in her mother\'s name. How do I investigate this without formal discovery?',
    postedAgo: '2 hours ago',
  },
  {
    id: 'q3',
    from: 'James Chen',
    fromInitials: 'JC',
    fromColor: '#2563eb',
    caseLabel: 'Washington DUI',
    caseNumber: 'Case #CR-2026-001',
    step: 'Arraignment Prep',
    question:
      'The police report says the breathalyzer was administered 2 hours after the stop. Is that grounds for suppression?',
    postedAgo: '45 minutes ago',
  },
];

const REVIEW_REQUESTS = [
  {
    id: 'r1',
    from: 'Maria Lopez',
    fromInitials: 'ML',
    caseLabel: 'Meh/Cardona I-130',
    caseNumber: 'Case #IMM-2026-001',
    step: 'Step 5: Senior Review',
    message:
      'Package is ready for review. I included extra photos from the wedding and a joint car insurance policy as additional evidence.',
    submittedAt: 'Today, 9:15 AM',
  },
  {
    id: 'r2',
    from: 'Maria Lopez',
    fromInitials: 'ML',
    caseLabel: 'Htoo Paw I-485',
    caseNumber: 'Case #IMM-2026-003',
    step: 'Step 3: Medical Exam Review',
    message:
      'I-693 received from Dr. Patel. Everything looks complete. Client\'s TB test was positive but chest X-ray was clear.',
    submittedAt: 'Yesterday',
  },
];

const unansweredCount = QUESTION_THREADS.filter((q) => !q.answer).length;
const answeredCount = QUESTION_THREADS.filter((q) => q.answer).length;

export default function CollaborationPage() {
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <h1
        className="text-2xl font-semibold mb-6"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Collaboration Hub
      </h1>

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div
          className="rounded-lg p-4 text-center"
          style={{
            background: '#fffbeb',
            border: '1px solid #fde68a',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: '#92400e' }}>
            {unansweredCount + answeredCount}
          </div>
          <div className="text-sm" style={{ color: '#92400e' }}>
            questions waiting
          </div>
        </div>
        <div
          className="rounded-lg p-4 text-center"
          style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: '#1d4ed8' }}>
            {REVIEW_REQUESTS.length}
          </div>
          <div className="text-sm" style={{ color: '#1d4ed8' }}>
            cases ready for review
          </div>
        </div>
        <div
          className="rounded-lg p-4 text-center"
          style={{
            background: '#fdf8f0',
            border: '1px solid #d4a843',
          }}
        >
          <div className="text-2xl font-bold" style={{ color: '#b8860b' }}>
            1
          </div>
          <div className="text-sm" style={{ color: '#b8860b' }}>
            meeting request
          </div>
        </div>
      </div>

      {/* Questions Section */}
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Questions from Team
      </h2>
      <div className="flex flex-col gap-4 mb-8">
        {QUESTION_THREADS.map((thread) => (
          <div
            key={thread.id}
            className="rounded-lg overflow-hidden"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            {/* Thread header */}
            <div
              className="px-4 py-3 flex items-center gap-3"
              style={{ borderBottom: '1px solid var(--border-light)' }}
            >
              <span
                className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
                style={{
                  width: 28,
                  height: 28,
                  background: thread.fromColor,
                  color: '#fff',
                }}
              >
                {thread.fromInitials}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                    {thread.from}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                    on
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                    {thread.caseLabel}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                    ({thread.caseNumber})
                  </span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--muted-light)' }}>
                  Step: {thread.step}
                </div>
              </div>
              <span className="text-xs shrink-0" style={{ color: 'var(--muted-light)' }}>
                {thread.postedAgo}
              </span>
            </div>

            {/* Question */}
            <div
              className="px-4 py-3"
              style={{ background: '#fffbeb' }}
            >
              <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
                {thread.question}
              </p>
            </div>

            {/* Answer or answer box */}
            {thread.answer ? (
              <div
                className="px-4 py-3"
                style={{
                  background: '#f0fdf4',
                  borderTop: '1px solid #bbf7d0',
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        width: 22,
                        height: 22,
                        background: '#b8860b',
                        color: '#fff',
                      }}
                    >
                      SA
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                      Attorney Attum
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                    {thread.answeredAt}
                  </span>
                </div>
                <p className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
                  {thread.answer}
                </p>

                {/* Jargon detection - only on asylum answer (q1) */}
                {thread.id === 'q1' && (
                  <div className="mt-3">
                    <div
                      className="rounded-md p-3 mb-2"
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span
                          className="text-xs font-semibold uppercase tracking-wide"
                          style={{ color: '#92400e' }}
                        >
                          Clarity Note
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: '#78350f', lineHeight: 1.5 }}>
                        Your answer mentions &quot;245(i) adjustment&quot; and &quot;motion to continue.&quot; Maria may not be familiar with these terms.
                      </p>
                      <div className="flex gap-2 mt-2">
                        <button
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{ background: 'var(--accent-gold)', color: '#fff', cursor: 'default' }}
                        >
                          Auto-add explanations
                        </button>
                        <button
                          className="px-3 py-1 rounded text-xs font-medium"
                          style={{
                            background: 'transparent',
                            color: 'var(--muted)',
                            border: '1px solid var(--border-light)',
                            cursor: 'default',
                          }}
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>

                    {/* Auto-expanded definitions */}
                    <div
                      className="rounded-md p-3"
                      style={{
                        background: '#f8f8f6',
                        border: '1px solid var(--border-light)',
                      }}
                    >
                      <div
                        className="text-xs font-semibold uppercase tracking-wide mb-2"
                        style={{ color: 'var(--muted)' }}
                      >
                        Term Definitions (auto-added)
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <p className="text-xs" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                          <span className="font-semibold">245(i):</span>{' '}
                          <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
                            A provision allowing certain undocumented individuals to adjust status if a visa petition was filed before April 30, 2001.
                          </span>
                        </p>
                        <p className="text-xs" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                          <span className="font-semibold">Motion to continue:</span>{' '}
                          <span style={{ fontStyle: 'italic', color: 'var(--muted)' }}>
                            A request to the immigration judge to postpone the removal hearing.
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div
                className="px-4 py-3"
                style={{
                  borderTop: '1px solid var(--border-light)',
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="flex items-center justify-center rounded-full text-xs font-bold"
                    style={{
                      width: 22,
                      height: 22,
                      background: '#b8860b',
                      color: '#fff',
                    }}
                  >
                    SA
                  </span>
                  <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                    Waiting for response...
                  </span>
                </div>
                <textarea
                  className="w-full rounded-md p-2.5 text-sm"
                  rows={2}
                  placeholder="Type your response..."
                  value={answerDrafts[thread.id] || ''}
                  onChange={(e) =>
                    setAnswerDrafts((prev) => ({ ...prev, [thread.id]: e.target.value }))
                  }
                  style={{
                    border: '1px solid var(--border-light)',
                    background: 'var(--background)',
                    color: 'var(--foreground)',
                    resize: 'vertical',
                  }}
                />
                <div className="flex justify-end mt-2">
                  <button
                    className="px-3 py-1.5 rounded-md text-xs font-medium"
                    style={{ background: 'var(--accent-gold)', color: '#fff', cursor: 'default' }}
                  >
                    Send Answer
                  </button>
                </div>

                {/* AI-Suggested Response for unanswered questions */}
                {thread.id === 'q2' && (
                  <div
                    className="rounded-md p-3 mt-3"
                    style={{
                      background: '#f5f5f5',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: '#e5e7eb', color: '#6b7280' }}
                      >
                        AI
                      </span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                        Suggested Response (based on your past answers)
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
                      &quot;Start with informal discovery first -- request bank statements for the last 3 years from both parties. Look for large transfers to family members around the time of separation. If you find evidence of hidden assets, we can file a motion for formal discovery. Don&apos;t tip off opposing counsel yet.&quot;
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{ background: 'var(--accent-gold)', color: '#fff', cursor: 'default' }}
                      >
                        Use This Response
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{
                          background: 'transparent',
                          color: 'var(--heading)',
                          border: '1px solid var(--border-light)',
                          cursor: 'default',
                        }}
                      >
                        Edit First
                      </button>
                    </div>
                  </div>
                )}

                {thread.id === 'q3' && (
                  <div
                    className="rounded-md p-3 mt-3"
                    style={{
                      background: '#f5f5f5',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-xs font-bold px-1.5 py-0.5 rounded"
                        style={{ background: '#e5e7eb', color: '#6b7280' }}
                      >
                        AI
                      </span>
                      <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                        Suggested Response
                      </span>
                    </div>
                    <p className="text-sm mb-3" style={{ color: 'var(--foreground)', lineHeight: 1.6 }}>
                      &quot;A 2-hour delay between the stop and the breathalyzer test is significant. File a motion to suppress under KRS 189A.103 -- the test must be administered within a reasonable time. Pull the officer&apos;s body cam to verify the exact timeline. This could be our strongest defense angle.&quot;
                    </p>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{ background: 'var(--accent-gold)', color: '#fff', cursor: 'default' }}
                      >
                        Use This Response
                      </button>
                      <button
                        className="px-3 py-1.5 rounded-md text-xs font-medium"
                        style={{
                          background: 'transparent',
                          color: 'var(--heading)',
                          border: '1px solid var(--border-light)',
                          cursor: 'default',
                        }}
                      >
                        Edit First
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Review Requests Section */}
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Cases Ready for Review
      </h2>
      <div className="flex flex-col gap-4 mb-8">
        {REVIEW_REQUESTS.map((req) => (
          <div
            key={req.id}
            className="rounded-lg p-5"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <span
                  className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    background: '#7c3aed',
                    color: '#fff',
                  }}
                >
                  {req.fromInitials}
                </span>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                      {req.from}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                      --
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                      {req.caseLabel}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                      ({req.caseNumber})
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--muted-light)' }}>
                    {req.step}
                  </div>
                </div>
              </div>
              <span className="text-xs shrink-0" style={{ color: 'var(--muted-light)' }}>
                {req.submittedAt}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
              {req.message}
            </p>
            <div className="flex gap-2">
              <button
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: 'var(--card-bg)', color: 'var(--heading)', border: '1px solid var(--border-light)', cursor: 'default' }}
              >
                View Case
              </button>
              <button
                className="px-4 py-2 rounded-md text-sm font-medium"
                style={{ background: '#16a34a', color: '#fff', cursor: 'default' }}
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
        ))}
      </div>

      {/* Meeting Requests Section */}
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Meeting Requests
      </h2>
      <div
        className="rounded-lg p-5 mb-8"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <div className="flex items-start gap-3 mb-3">
          <span
            className="flex items-center justify-center rounded-full text-xs font-bold shrink-0"
            style={{
              width: 28,
              height: 28,
              background: '#7c3aed',
              color: '#fff',
            }}
          >
            ML
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                Maria Lopez
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                requests 15 minutes
              </span>
            </div>
            <div className="text-sm mb-1" style={{ color: 'var(--foreground)' }}>
              <span className="font-medium">Topic:</span> Ramirez case - immigration consequences of criminal charge
            </div>
            <div className="text-xs mb-1" style={{ color: 'var(--muted)' }}>
              Case: #CR-2026-002 + #IMM-2026-004
            </div>
            <div className="text-xs" style={{ color: 'var(--muted)' }}>
              Preferred times: Tomorrow 2pm, Thursday 10am
            </div>
          </div>
        </div>
        <div className="flex gap-2 ml-10">
          <button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{ background: 'var(--accent-gold)', color: '#fff', cursor: 'default' }}
          >
            Accept
          </button>
          <button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              background: 'transparent',
              color: 'var(--heading)',
              border: '1px solid var(--border-light)',
              cursor: 'default',
            }}
          >
            Suggest Different Time
          </button>
          <button
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              background: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--border-light)',
              cursor: 'default',
            }}
          >
            Decline
          </button>
        </div>
      </div>

      {/* Anonymous Team Feedback */}
      <div
        className="rounded-lg p-5 mb-8"
        style={{
          background: '#f8f8f6',
          border: '1px solid var(--border-light)',
        }}
      >
        <h2
          className="text-lg font-semibold mb-2"
          style={{
            fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
            color: 'var(--heading)',
          }}
        >
          Anonymous Team Feedback
        </h2>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Team members can flag steps where they need more guidance. You won&apos;t see who submitted these.
        </p>

        <div className="flex flex-col gap-3 mb-4">
          <div
            className="rounded-md p-4"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
              Step &quot;Determine Concurrent Filing&quot; has been flagged as confusing by a team member.
            </p>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--accent-gold)', cursor: 'pointer' }}
            >
              Add More Guidance to This Step &rarr;
            </span>
          </div>

          <div
            className="rounded-md p-4"
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--border-light)',
            }}
          >
            <p className="text-sm mb-2" style={{ color: 'var(--foreground)' }}>
              &quot;Financial disclosure process&quot; was flagged as unclear.
            </p>
            <span
              className="text-sm font-medium"
              style={{ color: 'var(--accent-gold)', cursor: 'pointer' }}
            >
              Add More Guidance &rarr;
            </span>
          </div>
        </div>

        <p className="text-xs" style={{ color: 'var(--muted-light)' }}>
          No names. No judgment. Just better documentation.
        </p>
      </div>

      {/* Knowledge Capture Section */}
      <div
        className="rounded-lg p-5"
        style={{
          background: '#fdf8f0',
          border: '1px solid #d4a843',
        }}
      >
        <h2
          className="text-lg font-semibold mb-3"
          style={{
            fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
            color: 'var(--heading)',
          }}
        >
          Your Answers That Helped Others
        </h2>
        <div className="flex items-center gap-3 mb-3">
          <span className="text-2xl font-bold" style={{ color: 'var(--accent-gold)' }}>
            12
          </span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            answers saved as institutional knowledge
          </span>
        </div>
        <div
          className="rounded-md p-3 mb-3"
          style={{
            background: '#fff',
            borderLeft: '3px solid #b8860b',
          }}
        >
          <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#b8860b' }}>
            Most Referenced Insight
          </div>
          <p className="text-sm" style={{ color: '#5c4a1e', lineHeight: 1.5 }}>
            Always ask about prior marriages for both parties. A missing divorce decree is the #1 reason I-130s get RFEs.
          </p>
          <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
            Referenced 8 times across training and cases
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--muted)' }}>
          Your expertise is being preserved to help future team members.
        </p>
      </div>
    </div>
  );
}
