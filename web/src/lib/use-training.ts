'use client';

import { useState, useEffect, useCallback } from 'react';
import type {
  TrainingModule,
  TrainingModuleStep,
  TrainingQuizQuestion,
  UserModuleProgress,
  QuizSubmitResponse,
} from './training-types';

// ===========================================================================
// useIsAuthenticated
// ===========================================================================

export function useIsAuthenticated(): {
  isAuthenticated: boolean;
  isLoading: boolean;
} {
  // Check if user is authenticated by testing a protected endpoint
  // Returns false immediately if no Clerk key is configured (demo mode)
  const [state, setState] = useState({ isAuthenticated: false, isLoading: false });
  useEffect(() => {
    // If no Clerk key, skip the check entirely (no console errors)
    const clerkKey = typeof window !== 'undefined' &&
      document.querySelector('script[data-clerk-publishable-key]');
    if (!clerkKey) {
      setState({ isAuthenticated: false, isLoading: false });
      return;
    }
    setState(prev => ({ ...prev, isLoading: true }));
    fetch('/api/training/progress', { method: 'GET' }).then(res => {
      setState({ isAuthenticated: res.ok, isLoading: false });
    }).catch(() => {
      setState({ isAuthenticated: false, isLoading: false });
    });
  }, []);
  return state;
}

// ===========================================================================
// useModules
// ===========================================================================

export function useModules(): {
  modules: TrainingModule[];
  isLoading: boolean;
} {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/training/modules');
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setModules(data.modules ?? []);
        }
      } catch (err) {
        console.error('[useModules] Failed to fetch modules:', err);
        if (!cancelled) setModules([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { modules, isLoading };
}

// ===========================================================================
// useModuleDetail
// ===========================================================================

export function useModuleDetail(slug: string): {
  module: TrainingModule | null;
  steps: TrainingModuleStep[];
  questions: TrainingQuizQuestion[];
  progress: UserModuleProgress | null;
  isLoading: boolean;
} {
  const [module, setModule] = useState<TrainingModule | null>(null);
  const [steps, setSteps] = useState<TrainingModuleStep[]>([]);
  const [questions, setQuestions] = useState<TrainingQuizQuestion[]>([]);
  const [progress, setProgress] = useState<UserModuleProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!slug) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(`/api/training/modules/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setModule(data.module ?? null);
          setSteps(data.steps ?? []);
          setQuestions(data.questions ?? []);
          setProgress(data.progress ?? null);
        }
      } catch (err) {
        console.error('[useModuleDetail] Failed to fetch module:', err);
        if (!cancelled) {
          setModule(null);
          setSteps([]);
          setQuestions([]);
          setProgress(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [slug]);

  return { module, steps, questions, progress, isLoading };
}

// ===========================================================================
// useProgress
// ===========================================================================

export function useProgress(): {
  progress: UserModuleProgress[];
  isLoading: boolean;
  updateProgress: (data: Partial<UserModuleProgress> & { moduleId: string }) => Promise<void>;
} {
  const { isAuthenticated } = useIsAuthenticated();
  const [progress, setProgress] = useState<UserModuleProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const res = await fetch('/api/training/progress');
        if (!res.ok) throw new Error(`${res.status}`);
        const data = await res.json();
        if (!cancelled) {
          setProgress(data.progress ?? []);
        }
      } catch (err) {
        console.error('[useProgress] Failed to fetch progress:', err);
        if (!cancelled) setProgress([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const updateProgress = useCallback(
    async (data: Partial<UserModuleProgress> & { moduleId: string }) => {
      if (!isAuthenticated) return;
      try {
        const res = await fetch('/api/training/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const updated = await res.json();
        // Update local state with the response
        setProgress((prev) => {
          const idx = prev.findIndex((p) => p.moduleId === data.moduleId);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = updated.progress ?? next[idx];
            return next;
          }
          return updated.progress ? [...prev, updated.progress] : prev;
        });
      } catch (err) {
        console.error('[useProgress] Failed to update progress:', err);
      }
    },
    [isAuthenticated],
  );

  return { progress, isLoading, updateProgress };
}

// ===========================================================================
// useQuizSubmit
// ===========================================================================

export function useQuizSubmit(): {
  submit: (questionId: string, selectedKey: string) => Promise<QuizSubmitResponse | null>;
  isLoading: boolean;
} {
  const [isLoading, setIsLoading] = useState(false);

  const submit = useCallback(
    async (questionId: string, selectedKey: string): Promise<QuizSubmitResponse | null> => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/training/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ questionId, selectedKey }),
        });
        if (!res.ok) throw new Error(`${res.status}`);
        const data: QuizSubmitResponse = await res.json();
        return data;
      } catch (err) {
        console.error('[useQuizSubmit] Failed to submit quiz:', err);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return { submit, isLoading };
}
