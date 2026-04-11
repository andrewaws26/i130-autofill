'use client';

import { useState } from 'react';
import Link from 'next/link';

const TOTAL_STEPS = 6;

type QuizAnswer = 'A' | 'B' | 'C' | 'D' | null;

const WRONG_EXPLANATIONS_STEP3: Record<string, string> = {
  A: 'Asylum seekers CAN adjust status. Lawful entry on asylum qualifies for I-485 adjustment under INA 245(a).',
  C: 'The asylum case does not need to be decided first. The I-130/I-485 is a separate immigration pathway.',
  D: 'There is no 5-year waiting requirement for spouse-of-citizen concurrent filing.',
};

const WRONG_EXPLANATIONS_STEP5: Record<string, string> = {
  A: 'Not quite. Pending removal proceedings are common for asylum seekers. The I-485 concurrent filing is still appropriate. The immigration court case will be administratively closed or terminated once USCIS adjudicates the I-485.',
};

export default function TrainingModulePage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [quiz1Answer, setQuiz1Answer] = useState<QuizAnswer>(null);
  const [quiz1Submitted, setQuiz1Submitted] = useState(false);
  const [quiz2Answer, setQuiz2Answer] = useState<'A' | 'B' | null>(null);
  const [quiz2Submitted, setQuiz2Submitted] = useState(false);

  const quiz1Correct = quiz1Answer === 'B';
  const quiz2Correct = quiz2Answer === 'B';

  const score =
    (quiz1Submitted && quiz1Correct ? 1 : 0) +
    (quiz2Submitted && quiz2Correct ? 1 : 0);

  const progressPercent = Math.round(((currentStep + 1) / TOTAL_STEPS) * 100);

  const canAdvance = () => {
    if (currentStep === 2) return quiz1Submitted;
    if (currentStep === 4) return quiz2Submitted;
    return true;
  };

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1 && canAdvance()) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleQuiz1Select = (answer: QuizAnswer) => {
    if (quiz1Submitted) return;
    setQuiz1Answer(answer);
    setQuiz1Submitted(true);
  };

  const handleQuiz2Select = (answer: 'A' | 'B') => {
    if (quiz2Submitted) return;
    setQuiz2Answer(answer);
    setQuiz2Submitted(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      {/* Module Title */}
      <h1
        className="text-2xl font-semibold mb-6"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Concurrent Filing Strategy (I-485)
      </h1>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
            Step {currentStep + 1} of {TOTAL_STEPS}
          </span>
          <span className="text-sm" style={{ color: 'var(--muted)' }}>
            {progressPercent}%
          </span>
        </div>
        <div
          style={{
            width: '100%',
            height: 4,
            borderRadius: 2,
            background: 'var(--border-light)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: '100%',
              borderRadius: 2,
              background: 'var(--accent-gold)',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div
        className="rounded-lg"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
          minHeight: 360,
        }}
      >
        {/* Step 1: The Setup */}
        {currentStep === 0 && (
          <div className="p-6 md:p-8">
            <h2
              className="text-xs font-semibold uppercase tracking-wide mb-4"
              style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
            >
              Client Scenario
            </h2>
            <div
              className="rounded-md p-5 mb-5"
              style={{
                background: 'var(--background)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div className="mb-4">
                <div
                  className="text-lg font-semibold mb-1"
                  style={{
                    fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                    color: 'var(--heading)',
                  }}
                >
                  Rosa Maria Gutierrez, 34
                </div>
                <div className="text-sm" style={{ color: 'var(--muted)' }}>
                  Country of origin: Guatemala
                </div>
              </div>

              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                  <span style={{ color: 'var(--muted-light)', marginTop: 1 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="7" cy="7" r="6" />
                      <path d="M5 7h4" />
                      <path d="M7 5v4" />
                    </svg>
                  </span>
                  Currently in the US on asylum status (admitted May 2019)
                </div>
                <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                  <span style={{ color: 'var(--muted-light)', marginTop: 1 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="7" cy="7" r="6" />
                      <path d="M5 7h4" />
                      <path d="M7 5v4" />
                    </svg>
                  </span>
                  Married to US Citizen, Kho Meh
                </div>
                <div className="flex items-start gap-2 text-sm" style={{ color: 'var(--foreground)' }}>
                  <span style={{ color: 'var(--muted-light)', marginTop: 1 }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="7" cy="7" r="6" />
                      <path d="M5 7h4" />
                      <path d="M7 5v4" />
                    </svg>
                  </span>
                  Petitioner filing: I-130 (Spousal Petition)
                </div>
              </div>

              <div
                className="mt-5 pt-4 text-sm font-medium"
                style={{
                  borderTop: '1px solid var(--border-light)',
                  color: 'var(--heading)',
                }}
              >
                Your task: Determine whether to file additional forms concurrently with the I-130.
              </div>
            </div>

            <p className="text-sm" style={{ color: 'var(--muted)', fontStyle: 'italic' }}>
              This is based on a real case type your firm handles regularly.
            </p>
          </div>
        )}

        {/* Step 2: The Core Concept */}
        {currentStep === 1 && (
          <div className="p-6 md:p-8">
            <h2
              className="text-xs font-semibold uppercase tracking-wide mb-4"
              style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
            >
              What Is Concurrent Filing?
            </h2>

            <p className="text-sm mb-5" style={{ color: 'var(--foreground)', lineHeight: 1.7 }}>
              When a beneficiary is <strong>already in the United States</strong>, certain forms
              can be filed at the same time as the I-130:
            </p>

            <div className="flex flex-col gap-3 mb-6">
              {[
                {
                  form: 'I-485',
                  title: 'Adjustment of Status',
                  desc: 'Changes status to permanent resident',
                },
                {
                  form: 'I-765',
                  title: 'Employment Authorization Document',
                  desc: 'Allows them to work while waiting',
                },
                {
                  form: 'I-131',
                  title: 'Advance Parole',
                  desc: 'Allows them to travel while waiting',
                },
              ].map((item) => (
                <div
                  key={item.form}
                  className="flex items-start gap-3 rounded-md p-3"
                  style={{
                    background: 'var(--background)',
                    border: '1px solid var(--border-light)',
                  }}
                >
                  <span
                    className="text-xs font-bold px-2 py-1 rounded shrink-0"
                    style={{
                      background: 'var(--accent-gold-muted)',
                      color: 'var(--accent-gold)',
                      marginTop: 1,
                    }}
                  >
                    {item.form}
                  </span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: 'var(--heading)' }}>
                      {item.title}
                    </div>
                    <div className="text-sm" style={{ color: 'var(--muted)' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div
              className="rounded-md p-4"
              style={{
                background: '#f0f4f8',
              }}
            >
              <h3
                className="text-xs font-semibold uppercase tracking-wide mb-2"
                style={{ color: '#4a6785' }}
              >
                Why It Matters
              </h3>
              <p className="text-sm" style={{ color: '#2c3e50', lineHeight: 1.6 }}>
                Filing concurrently saves 6-12 months of processing time. Missing it means the
                client waits unnecessarily -- and pays for a separate filing later.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: The Quiz (Multiple Choice) */}
        {currentStep === 2 && (
          <div className="p-6 md:p-8">
            <h2
              className="text-xs font-semibold uppercase tracking-wide mb-4"
              style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
            >
              Knowledge Check
            </h2>

            <p
              className="text-base font-medium mb-5"
              style={{ color: 'var(--heading)', lineHeight: 1.5 }}
            >
              Based on Rosa&apos;s case, should you file I-485 concurrently with the I-130?
            </p>

            <div className="flex flex-col gap-3">
              {(
                [
                  { key: 'A' as const, text: 'No -- asylum seekers cannot adjust status' },
                  { key: 'B' as const, text: 'Yes -- she is in the US and her spouse is a US citizen' },
                  { key: 'C' as const, text: 'Only if her asylum case has been decided' },
                  { key: 'D' as const, text: 'Only if she has been in the US for more than 5 years' },
                ]
              ).map((option) => {
                const isSelected = quiz1Answer === option.key;
                const isCorrectAnswer = option.key === 'B';
                const showCorrect = quiz1Submitted && isCorrectAnswer;
                const showWrong = quiz1Submitted && isSelected && !isCorrectAnswer;

                let borderColor = 'var(--border-light)';
                let bgColor = 'var(--card-bg)';

                if (showCorrect) {
                  borderColor = '#16a34a';
                  bgColor = '#f0fdf4';
                } else if (showWrong) {
                  borderColor = '#dc2626';
                  bgColor = '#fef2f2';
                } else if (isSelected && !quiz1Submitted) {
                  borderColor = 'var(--accent-gold)';
                  bgColor = 'var(--accent-gold-muted)';
                }

                return (
                  <button
                    key={option.key}
                    onClick={() => handleQuiz1Select(option.key)}
                    disabled={quiz1Submitted}
                    className="w-full text-left rounded-md p-4 flex items-start gap-3"
                    style={{
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      cursor: quiz1Submitted ? 'default' : 'pointer',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0 rounded-full text-xs font-bold"
                      style={{
                        width: 28,
                        height: 28,
                        background: showCorrect
                          ? '#16a34a'
                          : showWrong
                            ? '#dc2626'
                            : 'var(--background)',
                        color: showCorrect || showWrong ? '#fff' : 'var(--heading)',
                        border: !showCorrect && !showWrong ? '1px solid var(--border-light)' : 'none',
                      }}
                    >
                      {showCorrect ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : showWrong ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M4 4l6 6M10 4l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        option.key
                      )}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {quiz1Submitted && (
              <div
                className="rounded-md p-4 mt-5"
                style={{
                  background: quiz1Correct ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${quiz1Correct ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: quiz1Correct ? '#166534' : '#991b1b' }}
                  >
                    {quiz1Correct ? 'Correct.' : 'Incorrect.'}
                  </span>
                </div>
                <p
                  className="text-sm"
                  style={{
                    color: quiz1Correct ? '#166534' : '#991b1b',
                    lineHeight: 1.6,
                  }}
                >
                  {quiz1Correct
                    ? 'Rosa entered legally on asylum status, and her petitioner spouse is a US citizen. She is eligible for concurrent filing.'
                    : WRONG_EXPLANATIONS_STEP3[quiz1Answer!]}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Real-World Application */}
        {currentStep === 3 && (
          <div className="p-6 md:p-8">
            <h2
              className="text-xs font-semibold uppercase tracking-wide mb-4"
              style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
            >
              From the Firm&apos;s Experience
            </h2>

            {/* Attum Quote - gold left border */}
            <div
              className="rounded-md p-4 mb-6"
              style={{
                background: '#fdf8f0',
                borderLeft: '3px solid #b8860b',
              }}
            >
              <div className="flex items-center gap-2 mb-3">
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
                  Attorney Attum on concurrent filing
                </span>
              </div>
              <p
                className="text-sm"
                style={{ color: '#5c4a1e', lineHeight: 1.7, fontStyle: 'italic' }}
              >
                &ldquo;This is the step where I see the most mistakes from new attorneys. The
                instinct is to just file the I-130 and figure out the rest later. But if the
                beneficiary is in the US with legal status, concurrent filing should be your
                DEFAULT assumption. Only skip it if there&apos;s a specific disqualifying
                factor.&rdquo;
              </p>
            </div>

            <div>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--heading)' }}
              >
                Common Disqualifying Factors
              </h3>
              <div className="flex flex-col gap-2">
                {[
                  'Entered without inspection (no legal entry)',
                  'Certain criminal convictions',
                  'Prior immigration fraud',
                  'Visa overstay beyond 180 days (complex)',
                ].map((factor, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2.5 text-sm"
                    style={{ color: 'var(--foreground)' }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background: '#dc2626',
                        flexShrink: 0,
                        marginTop: 7,
                      }}
                    />
                    {factor}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Practice Application */}
        {currentStep === 4 && (
          <div className="p-6 md:p-8">
            <h2
              className="text-xs font-semibold uppercase tracking-wide mb-4"
              style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
            >
              Apply It
            </h2>

            <div
              className="rounded-md p-4 mb-5"
              style={{
                background: '#fffbeb',
                border: '1px solid #fde68a',
              }}
            >
              <p className="text-sm" style={{ color: '#78350f', lineHeight: 1.6 }}>
                Rosa&apos;s case has one complication: she was placed in removal proceedings in
                2020 (EOIR case pending).
              </p>
            </div>

            <p
              className="text-base font-medium mb-5"
              style={{ color: 'var(--heading)', lineHeight: 1.5 }}
            >
              Does this change your concurrent filing decision?
            </p>

            <div className="flex flex-col gap-3">
              {(
                [
                  { key: 'A' as const, text: 'Yes -- removal proceedings disqualify concurrent filing' },
                  { key: 'B' as const, text: 'No -- file the I-485 and request termination of proceedings' },
                ]
              ).map((option) => {
                const isSelected = quiz2Answer === option.key;
                const isCorrectAnswer = option.key === 'B';
                const showCorrect = quiz2Submitted && isCorrectAnswer;
                const showWrong = quiz2Submitted && isSelected && !isCorrectAnswer;

                let borderColor = 'var(--border-light)';
                let bgColor = 'var(--card-bg)';

                if (showCorrect) {
                  borderColor = '#16a34a';
                  bgColor = '#f0fdf4';
                } else if (showWrong) {
                  borderColor = '#dc2626';
                  bgColor = '#fef2f2';
                } else if (isSelected && !quiz2Submitted) {
                  borderColor = 'var(--accent-gold)';
                  bgColor = 'var(--accent-gold-muted)';
                }

                return (
                  <button
                    key={option.key}
                    onClick={() => handleQuiz2Select(option.key)}
                    disabled={quiz2Submitted}
                    className="w-full text-left rounded-md p-4 flex items-start gap-3"
                    style={{
                      background: bgColor,
                      border: `2px solid ${borderColor}`,
                      cursor: quiz2Submitted ? 'default' : 'pointer',
                      transition: 'border-color 0.2s, background 0.2s',
                    }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0 rounded-full text-xs font-bold"
                      style={{
                        width: 28,
                        height: 28,
                        background: showCorrect
                          ? '#16a34a'
                          : showWrong
                            ? '#dc2626'
                            : 'var(--background)',
                        color: showCorrect || showWrong ? '#fff' : 'var(--heading)',
                        border: !showCorrect && !showWrong ? '1px solid var(--border-light)' : 'none',
                      }}
                    >
                      {showCorrect ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M3 7l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : showWrong ? (
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M4 4l6 6M10 4l-6 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      ) : (
                        option.key
                      )}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--foreground)', lineHeight: 1.5 }}>
                      {option.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Feedback */}
            {quiz2Submitted && (
              <div
                className="rounded-md p-4 mt-5"
                style={{
                  background: quiz2Correct ? '#f0fdf4' : '#fef2f2',
                  border: `1px solid ${quiz2Correct ? '#bbf7d0' : '#fecaca'}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: quiz2Correct ? '#166534' : '#991b1b' }}
                  >
                    {quiz2Correct ? 'Correct.' : 'Incorrect.'}
                  </span>
                </div>
                <p
                  className="text-sm"
                  style={{
                    color: quiz2Correct ? '#166534' : '#991b1b',
                    lineHeight: 1.6,
                  }}
                >
                  {quiz2Correct
                    ? 'Pending removal proceedings do NOT disqualify concurrent filing. File the I-485 and submit a motion to terminate removal proceedings. Once the I-130 is approved and I-485 adjudicated, the removal case is typically terminated.'
                    : WRONG_EXPLANATIONS_STEP5.A}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 6: Summary + Score */}
        {currentStep === 5 && (
          <div className="p-6 md:p-8">
            <h2
              className="text-xs font-semibold uppercase tracking-wide mb-1"
              style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
            >
              Module Complete
            </h2>
            <h3
              className="text-lg font-semibold mb-4"
              style={{
                fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                color: 'var(--heading)',
              }}
            >
              Concurrent Filing Strategy (I-485)
            </h3>

            {/* Score */}
            <div
              className="rounded-md p-5 mb-6 text-center"
              style={{
                background: score === 2 ? '#f0fdf4' : score === 1 ? '#fffbeb' : '#fef2f2',
                border: `1px solid ${score === 2 ? '#bbf7d0' : score === 1 ? '#fde68a' : '#fecaca'}`,
              }}
            >
              <div
                className="text-3xl font-bold mb-1"
                style={{
                  color: score === 2 ? '#166534' : score === 1 ? '#92400e' : '#991b1b',
                }}
              >
                {score}/2
              </div>
              <div
                className="text-sm"
                style={{
                  color: score === 2 ? '#166534' : score === 1 ? '#92400e' : '#991b1b',
                }}
              >
                {score === 2
                  ? 'Excellent work.'
                  : score === 1
                    ? 'Good effort. Review the material on the question you missed.'
                    : 'Review the material and try again.'}
              </div>
            </div>

            {/* Key Takeaways */}
            <div>
              <h3
                className="text-sm font-semibold mb-3"
                style={{ color: 'var(--heading)' }}
              >
                Key Takeaways
              </h3>
              <div className="flex flex-col gap-3">
                {[
                  'When the beneficiary is in the US with legal status and the petitioner is a US citizen, concurrent filing should be your default.',
                  'File I-485 + I-765 + I-131 together with the I-130.',
                  'Removal proceedings do NOT disqualify concurrent filing.',
                  'When in doubt, check the guided workflow or ask Attorney Attum through the system.',
                ].map((takeaway, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-sm"
                    style={{ color: 'var(--foreground)', lineHeight: 1.6 }}
                  >
                    <span
                      className="flex items-center justify-center shrink-0 rounded-full text-xs font-bold"
                      style={{
                        width: 22,
                        height: 22,
                        background: 'var(--accent-gold-muted)',
                        color: 'var(--accent-gold)',
                        marginTop: 1,
                      }}
                    >
                      {idx + 1}
                    </span>
                    {takeaway}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {currentStep > 0 && currentStep < 5 && (
            <button
              onClick={handleBack}
              className="px-5 py-2.5 rounded-md text-sm font-medium"
              style={{
                background: 'transparent',
                color: 'var(--heading)',
                border: '1px solid var(--border-light)',
                cursor: 'pointer',
              }}
            >
              Back
            </button>
          )}
          {currentStep === 5 && (
            <Link
              href="/demo/platform/training"
              className="inline-flex px-5 py-2.5 rounded-md text-sm font-medium"
              style={{
                background: 'transparent',
                color: 'var(--heading)',
                border: '1px solid var(--border-light)',
                textDecoration: 'none',
              }}
            >
              Back to Training
            </Link>
          )}
        </div>
        <div>
          {currentStep < 5 && (
            <button
              onClick={handleNext}
              disabled={!canAdvance()}
              className="px-5 py-2.5 rounded-md text-sm font-medium"
              style={{
                background: canAdvance() ? 'var(--accent-gold)' : 'var(--border-light)',
                color: canAdvance() ? '#fff' : 'var(--muted-light)',
                cursor: canAdvance() ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              Next
            </button>
          )}
          {currentStep === 5 && (
            <button
              className="px-5 py-2.5 rounded-md text-sm font-medium"
              style={{
                background: 'var(--accent-gold)',
                color: '#fff',
                cursor: 'default',
                border: 'none',
              }}
            >
              Next Module: Work Permits
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
