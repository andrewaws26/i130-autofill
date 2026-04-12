'use client';

import { useState } from 'react';
import Link from 'next/link';
import type {
  StepContentJson,
  ContentSection,
  TrainingQuizQuestion,
} from './training-types';

// ---------------------------------------------------------------------------
// SVG Helpers
// ---------------------------------------------------------------------------

function PlusCircleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="6" />
      <path d="M5 7h4" />
      <path d="M7 5v4" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M3 7l3 3 5-5"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path
        d="M4 4l6 6M10 4l-6 6"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Section Renderers
// ---------------------------------------------------------------------------

function TextSection({ text }: { text: string }) {
  return (
    <p
      style={{
        color: 'var(--foreground)',
        fontSize: '0.9375rem',
        lineHeight: 1.7,
      }}
    >
      {text}
    </p>
  );
}

function HeadingSection({ text }: { text: string }) {
  return (
    <h3
      className="font-semibold"
      style={{
        fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
        color: 'var(--heading)',
      }}
    >
      {text}
    </h3>
  );
}

function ScenarioSection({
  client,
  task,
}: {
  client: { name: string; country: string; facts: string[] };
  task: string;
}) {
  return (
    <div
      className="rounded-md p-5"
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
          {client.name}
        </div>
        <div className="text-sm" style={{ color: 'var(--muted)' }}>
          Country of origin: {client.country}
        </div>
      </div>

      <div className="flex flex-col gap-2.5">
        {client.facts.map((fact, idx) => (
          <div
            key={idx}
            className="flex items-start gap-2 text-sm"
            style={{ color: 'var(--foreground)' }}
          >
            <span style={{ color: 'var(--muted-light)', marginTop: 1 }}>
              <PlusCircleIcon />
            </span>
            {fact}
          </div>
        ))}
      </div>

      <div
        className="mt-5 pt-4 text-sm font-medium"
        style={{
          borderTop: '1px solid var(--border-light)',
          color: 'var(--heading)',
        }}
      >
        {task}
      </div>
    </div>
  );
}

function FormListSection({
  items,
}: {
  items: { form: string; title: string; desc: string }[];
}) {
  return (
    <div className="flex flex-col gap-3">
      {items.map((item) => (
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
  );
}

function CalloutSection({
  variant,
  title,
  text,
  source,
}: {
  variant: 'info' | 'warning' | 'attum_quote';
  title?: string;
  text: string;
  source?: string;
}) {
  if (variant === 'attum_quote') {
    return (
      <div
        className="rounded-md p-4"
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
          <span className="text-xs font-semibold" style={{ color: '#b8860b' }}>
            {source || 'From Attorney Attum'}
          </span>
        </div>
        <p
          className="text-sm"
          style={{ color: '#5c4a1e', lineHeight: 1.7, fontStyle: 'italic' }}
        >
          &ldquo;{text}&rdquo;
        </p>
      </div>
    );
  }

  if (variant === 'warning') {
    return (
      <div
        className="rounded-md p-4"
        style={{
          background: '#fffbeb',
          border: '1px solid #fde68a',
        }}
      >
        {title && (
          <h3
            className="text-xs font-semibold uppercase tracking-wide mb-2"
            style={{ color: '#92400e' }}
          >
            {title}
          </h3>
        )}
        <p className="text-sm" style={{ color: '#78350f', lineHeight: 1.6 }}>
          {text}
        </p>
      </div>
    );
  }

  // info
  return (
    <div className="rounded-md p-4" style={{ background: '#f0f4f8' }}>
      {title && (
        <h3
          className="text-xs font-semibold uppercase tracking-wide mb-2"
          style={{ color: '#4a6785' }}
        >
          {title}
        </h3>
      )}
      <p className="text-sm" style={{ color: '#2c3e50', lineHeight: 1.6 }}>
        {text}
      </p>
    </div>
  );
}

function BulletListSection({
  title,
  items,
  variant = 'default',
}: {
  title?: string;
  items: string[];
  variant?: 'red_dot' | 'numbered' | 'default';
}) {
  return (
    <div>
      {title && (
        <h3
          className="text-sm font-semibold mb-3"
          style={{ color: 'var(--heading)' }}
        >
          {title}
        </h3>
      )}
      <div className="flex flex-col gap-2">
        {items.map((item, idx) => {
          if (variant === 'numbered') {
            return (
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
                {item}
              </div>
            );
          }

          if (variant === 'red_dot') {
            return (
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
                {item}
              </div>
            );
          }

          // default
          return (
            <div
              key={idx}
              className="flex items-start gap-2.5 text-sm"
              style={{ color: 'var(--foreground)' }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--muted-light)',
                  flexShrink: 0,
                  marginTop: 7,
                }}
              />
              {item}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Render a single ContentSection
// ---------------------------------------------------------------------------

function RenderSection({ section }: { section: ContentSection }) {
  switch (section.type) {
    case 'text':
      return <TextSection text={section.text} />;
    case 'heading':
      return <HeadingSection text={section.text} />;
    case 'scenario':
      return <ScenarioSection client={section.client} task={section.task} />;
    case 'form_list':
      return <FormListSection items={section.items} />;
    case 'callout':
      return (
        <CalloutSection
          variant={section.variant}
          title={section.title}
          text={section.text}
          source={section.source}
        />
      );
    case 'bullet_list':
      return (
        <BulletListSection
          title={section.title}
          items={section.items}
          variant={section.variant}
        />
      );
    default:
      return null;
  }
}

// ===========================================================================
// StepRenderer
// ===========================================================================

export function StepRenderer({
  contentJson,
  stepType,
}: {
  contentJson: StepContentJson;
  stepType: string;
}) {
  // Handle both formats: { sections: [...] } and raw array [...]
  const sections: ContentSection[] = Array.isArray(contentJson)
    ? contentJson as unknown as ContentSection[]
    : (contentJson.sections ?? []);

  return (
    <div className="p-6 md:p-8">
      {stepType && (
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-4"
          style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
        >
          {stepType.replace(/_/g, ' ')}
        </h2>
      )}

      {!Array.isArray(contentJson) && contentJson.preamble && (
        <p
          className="text-base font-medium mb-5"
          style={{ color: 'var(--heading)', lineHeight: 1.5 }}
        >
          {contentJson.preamble}
        </p>
      )}

      <div className="flex flex-col gap-5">
        {sections.map((section, idx) => (
          <RenderSection key={idx} section={section} />
        ))}
      </div>
    </div>
  );
}

// ===========================================================================
// QuizCard
// ===========================================================================

export function QuizCard({
  question,
  onSubmit,
  result,
  disabled,
}: {
  question: TrainingQuizQuestion;
  onSubmit: (selectedKey: string) => void;
  result?: { correct: boolean; explanation: string };
  disabled?: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const submitted = !!result;

  const handleSelect = (key: string) => {
    if (submitted || disabled) return;
    setSelected(key);
    onSubmit(key);
  };

  return (
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
        {question.questionText}
      </p>

      <div className="flex flex-col gap-3">
        {question.options.map((option) => {
          const isSelected = selected === option.key;
          const isCorrectAnswer = option.key === question.correctKey;
          const showCorrect = submitted && isCorrectAnswer;
          const showWrong = submitted && isSelected && !isCorrectAnswer;

          let borderColor = 'var(--border-light)';
          let bgColor = 'var(--card-bg)';

          if (showCorrect) {
            borderColor = '#16a34a';
            bgColor = '#f0fdf4';
          } else if (showWrong) {
            borderColor = '#dc2626';
            bgColor = '#fef2f2';
          } else if (isSelected && !submitted) {
            borderColor = 'var(--accent-gold)';
            bgColor = 'var(--accent-gold-muted)';
          }

          return (
            <button
              key={option.key}
              onClick={() => handleSelect(option.key)}
              disabled={submitted || disabled}
              className="w-full text-left rounded-md p-4 flex items-start gap-3"
              style={{
                background: bgColor,
                border: `2px solid ${borderColor}`,
                cursor: submitted || disabled ? 'default' : 'pointer',
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
                  border:
                    !showCorrect && !showWrong
                      ? '1px solid var(--border-light)'
                      : 'none',
                }}
              >
                {showCorrect ? <CheckIcon /> : showWrong ? <XIcon /> : option.key}
              </span>
              <span
                className="text-sm"
                style={{ color: 'var(--foreground)', lineHeight: 1.5 }}
              >
                {option.text}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback */}
      {submitted && result && (
        <div
          className="rounded-md p-4 mt-5"
          style={{
            background: result.correct ? '#f0fdf4' : '#fef2f2',
            border: `1px solid ${result.correct ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-sm font-semibold"
              style={{ color: result.correct ? '#166534' : '#991b1b' }}
            >
              {result.correct ? 'Correct.' : 'Incorrect.'}
            </span>
          </div>
          <p
            className="text-sm"
            style={{
              color: result.correct ? '#166534' : '#991b1b',
              lineHeight: 1.6,
            }}
          >
            {result.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// ModuleStepNav
// ===========================================================================

export function ModuleStepNav({
  currentStep,
  totalSteps,
  onBack,
  onNext,
  canAdvance,
  moduleName,
  trainingHref = '/demo/platform/training',
}: {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  onNext: () => void;
  canAdvance: boolean;
  moduleName: string;
  trainingHref?: string;
}) {
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <>
      {/* Module Title */}
      <h1
        className="text-2xl font-semibold mb-6"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        {moduleName}
      </h1>

      {/* Progress Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span
            className="text-sm font-medium"
            style={{ color: 'var(--heading)' }}
          >
            Step {currentStep + 1} of {totalSteps}
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

      {/* Navigation Buttons (rendered after step content via portal or by the consuming page) */}
      {/* This renders the bottom nav bar */}
      <div className="flex items-center justify-between mt-6">
        <div>
          {currentStep > 0 && !isLastStep && (
            <button
              onClick={onBack}
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
          {isLastStep && (
            <Link
              href={trainingHref}
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
          {!isLastStep && (
            <button
              onClick={onNext}
              disabled={!canAdvance}
              className="px-5 py-2.5 rounded-md text-sm font-medium"
              style={{
                background: canAdvance
                  ? 'var(--accent-gold)'
                  : 'var(--border-light)',
                color: canAdvance ? '#fff' : 'var(--muted-light)',
                cursor: canAdvance ? 'pointer' : 'not-allowed',
                border: 'none',
              }}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ===========================================================================
// ScoreCard
// ===========================================================================

export function ScoreCard({
  score,
  maxScore,
  takeaways,
  nextModuleSlug,
  trainingHref = '/demo/platform/training',
}: {
  score: number;
  maxScore: number;
  takeaways?: string[];
  nextModuleSlug?: string;
  trainingHref?: string;
}) {
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;

  let bgColor: string;
  let borderColor: string;
  let textColor: string;
  let label: string;

  if (pct >= 80) {
    bgColor = '#f0fdf4';
    borderColor = '#bbf7d0';
    textColor = '#166534';
    label = 'Excellent work.';
  } else if (pct >= 50) {
    bgColor = '#fffbeb';
    borderColor = '#fde68a';
    textColor = '#92400e';
    label = 'Good effort. Review the material on the questions you missed.';
  } else {
    bgColor = '#fef2f2';
    borderColor = '#fecaca';
    textColor = '#991b1b';
    label = 'Review the material and try again.';
  }

  return (
    <div className="p-6 md:p-8">
      <h2
        className="text-xs font-semibold uppercase tracking-wide mb-1"
        style={{ color: 'var(--accent-gold)', letterSpacing: '1px' }}
      >
        Module Complete
      </h2>

      {/* Score */}
      <div
        className="rounded-md p-5 mb-6 text-center"
        style={{
          background: bgColor,
          border: `1px solid ${borderColor}`,
        }}
      >
        <div
          className="text-3xl font-bold mb-1"
          style={{ color: textColor }}
        >
          {score}/{maxScore}
        </div>
        <div className="text-sm" style={{ color: textColor }}>
          {label}
        </div>
      </div>

      {/* Key Takeaways */}
      {takeaways && takeaways.length > 0 && (
        <div className="mb-6">
          <h3
            className="text-sm font-semibold mb-3"
            style={{ color: 'var(--heading)' }}
          >
            Key Takeaways
          </h3>
          <div className="flex flex-col gap-3">
            {takeaways.map((takeaway, idx) => (
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
      )}

      {/* Navigation links */}
      <div className="flex items-center justify-between">
        <Link
          href={trainingHref}
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
        {nextModuleSlug && (
          <Link
            href={`${trainingHref}/${nextModuleSlug}`}
            className="inline-flex px-5 py-2.5 rounded-md text-sm font-medium"
            style={{
              background: 'var(--accent-gold)',
              color: '#fff',
              border: 'none',
              textDecoration: 'none',
            }}
          >
            Next Module
          </Link>
        )}
      </div>
    </div>
  );
}
