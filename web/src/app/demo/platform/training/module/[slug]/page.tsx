'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
  StepRenderer,
  QuizCard,
  ModuleStepNav,
  ScoreCard,
} from '@/lib/training-components';
import {
  useModuleDetail,
  useIsAuthenticated,
  useProgress,
  useQuizSubmit,
} from '@/lib/use-training';
import type { TrainingQuizQuestion } from '@/lib/training-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuizResult {
  correct: boolean;
  explanation: string;
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function DynamicModulePage() {
  const params = useParams();
  const slug = typeof params.slug === 'string' ? params.slug : '';

  // Data fetching
  const {
    module: mod,
    steps,
    questions,
    progress: initialProgress,
    isLoading: moduleLoading,
  } = useModuleDetail(slug);

  const { isAuthenticated, isLoading: authLoading } = useIsAuthenticated();
  const { updateProgress } = useProgress();
  const { submit: submitQuiz } = useQuizSubmit();

  // Local state
  const [currentStep, setCurrentStep] = useState(0);
  const [quizResults, setQuizResults] = useState<Map<string, QuizResult>>(
    new Map(),
  );
  const [hasResumed, setHasResumed] = useState(false);

  // Resume from saved progress once data arrives
  useEffect(() => {
    if (hasResumed) return;
    if (moduleLoading || authLoading) return;

    if (isAuthenticated && initialProgress && initialProgress.currentStep > 0) {
      // Steps are 1-indexed in the DB, 0-indexed locally
      const resumeIdx = Math.min(
        initialProgress.currentStep - 1,
        (steps.length || 1) - 1,
      );
      setCurrentStep(Math.max(0, resumeIdx));
    }
    setHasResumed(true);
  }, [
    hasResumed,
    moduleLoading,
    authLoading,
    isAuthenticated,
    initialProgress,
    steps.length,
  ]);

  // Derive the current step data
  const step = steps[currentStep] ?? null;
  const totalSteps = steps.length;

  // Map questions by stepId for fast lookup
  const questionsByStep = useMemo(() => {
    const map = new Map<string, TrainingQuizQuestion[]>();
    for (const q of questions) {
      const arr = map.get(q.stepId) ?? [];
      arr.push(q);
      map.set(q.stepId, arr);
    }
    // Sort each group by questionNumber
    for (const arr of map.values()) {
      arr.sort((a, b) => a.questionNumber - b.questionNumber);
    }
    return map;
  }, [questions]);

  const currentQuestions = step ? (questionsByStep.get(step.id) ?? []) : [];

  // Check if all questions on the current quiz step are answered
  const allQuizAnswered =
    currentQuestions.length > 0 &&
    currentQuestions.every((q) => quizResults.has(q.id));

  // Can advance to next step?
  const canAdvance = (() => {
    if (!step) return false;
    if (step.stepType === 'quiz') return allQuizAnswered;
    return true;
  })();

  // Calculate score from all quiz results
  const { score, maxScore } = useMemo(() => {
    let s = 0;
    let m = 0;
    for (const result of quizResults.values()) {
      m += 1;
      if (result.correct) s += 1;
    }
    return { score: s, maxScore: m };
  }, [quizResults]);

  // Persist progress to the API
  const persistProgress = useCallback(
    async (stepNum: number, status?: 'in_progress' | 'completed', finalScore?: number) => {
      if (!isAuthenticated || !mod) return;
      try {
        await updateProgress({
          moduleId: mod.id,
          currentStep: stepNum,
          status: status ?? 'in_progress',
          ...(finalScore !== undefined ? { score: finalScore } : {}),
        });
      } catch (err) {
        console.error('[ModulePage] Failed to persist progress:', err);
      }
    },
    [isAuthenticated, mod, updateProgress],
  );

  // Handlers
  const handleNext = useCallback(async () => {
    if (!canAdvance || currentStep >= totalSteps - 1) return;

    const nextStep = currentStep + 1;
    setCurrentStep(nextStep);

    // If moving to the last step (summary), mark completed
    if (nextStep === totalSteps - 1) {
      await persistProgress(nextStep + 1, 'completed', score);
    } else {
      await persistProgress(nextStep + 1, 'in_progress');
    }
  }, [canAdvance, currentStep, totalSteps, persistProgress, score]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const handleQuizSubmit = useCallback(
    async (questionId: string, selectedKey: string) => {
      if (quizResults.has(questionId)) return; // already answered

      // Try API first (works when authenticated)
      let result = await submitQuiz(questionId, selectedKey);

      // Fallback: evaluate locally when API fails (demo mode)
      if (!result) {
        const question = questions.find((q) => q.id === questionId);
        if (question) {
          const isCorrect = selectedKey === question.correctKey;
          const explanations = question.explanations as Record<string, string>;
          result = {
            correct: isCorrect,
            explanation: isCorrect
              ? (explanations[question.correctKey] || explanations['correct'] || 'Correct!')
              : (explanations[selectedKey] || 'Incorrect. Please review the material.'),
          };
        }
      }

      if (result) {
        setQuizResults((prev) => {
          const next = new Map(prev);
          next.set(questionId, {
            correct: result!.correct,
            explanation: result!.explanation,
          });
          return next;
        });
      }
    },
    [quizResults, submitQuiz, questions],
  );

  // -------------------------------------------------------------------------
  // Loading state
  // -------------------------------------------------------------------------

  if (moduleLoading || authLoading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <div className="flex items-center gap-3" style={{ color: 'var(--muted)' }}>
          <svg
            className="animate-spin"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
          <span className="text-sm">Loading module...</span>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Not found state
  // -------------------------------------------------------------------------

  if (!mod || totalSteps === 0) {
    return (
      <div className="p-6 md:p-8 max-w-3xl">
        <h1
          className="text-2xl font-semibold mb-4"
          style={{
            fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
            color: 'var(--heading)',
          }}
        >
          Module not found
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--muted)' }}>
          The training module &ldquo;{slug}&rdquo; could not be loaded. It may
          have been removed or the link may be incorrect.
        </p>
        <a
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
        </a>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // Determine if the current step is the summary / final step
  // -------------------------------------------------------------------------

  const isSummaryStep = step?.stepType === 'summary';
  const isQuizStep = step?.stepType === 'quiz';

  // Extract summary-specific data from step content
  const takeaways = step?.contentJson?.takeaways;
  const nextModuleSlug = step?.contentJson?.nextModuleSlug;

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <div className="p-6 md:p-8 max-w-3xl">
      {/* Navigation header + progress bar */}
      <ModuleStepNav
        currentStep={currentStep}
        totalSteps={totalSteps}
        onBack={handleBack}
        onNext={handleNext}
        canAdvance={canAdvance}
        moduleName={mod.title}
      />

      {/* Step content card */}
      <div
        className="rounded-lg mt-6"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
          minHeight: 360,
        }}
      >
        {/* Summary / ScoreCard step */}
        {isSummaryStep && (
          <ScoreCard
            score={score}
            maxScore={maxScore}
            takeaways={takeaways}
            nextModuleSlug={nextModuleSlug}
          />
        )}

        {/* Content or scenario steps */}
        {!isSummaryStep && !isQuizStep && step && (
          <StepRenderer
            contentJson={step.contentJson}
            stepType={step.stepType}
          />
        )}

        {/* Quiz steps: questions only (no duplicate preamble) */}
        {isQuizStep && step && (
          <>
            {/* Quiz questions */}
            {currentQuestions.map((q) => (
              <QuizCard
                key={q.id}
                question={q}
                onSubmit={(selectedKey) => handleQuizSubmit(q.id, selectedKey)}
                result={quizResults.get(q.id)}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
