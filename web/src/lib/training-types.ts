// ============================================================================
// Training System Types
// Matches database schema in supabase/migrations/003_training.sql
// DB uses snake_case; TS uses camelCase — API routes handle conversion
// ============================================================================

// ---------------------------------------------------------------------------
// Content section types for the StepRenderer
// ---------------------------------------------------------------------------

export type ContentSection =
  | { type: 'text'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'scenario'; client: { name: string; country: string; facts: string[] }; task: string }
  | { type: 'form_list'; items: { form: string; title: string; desc: string }[] }
  | { type: 'callout'; variant: 'info' | 'warning' | 'attum_quote'; title?: string; text: string; source?: string }
  | { type: 'bullet_list'; title?: string; items: string[]; variant?: 'red_dot' | 'numbered' | 'default' };

export interface StepContentJson {
  sections?: ContentSection[];
  preamble?: string;       // for quiz steps
  takeaways?: string[];    // for summary steps
  nextModuleSlug?: string; // for summary steps
}

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  practiceArea: string;
  durationMinutes: number;
  sortOrder: number;
  prerequisiteId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingModuleStep {
  id: string;
  moduleId: string;
  stepNumber: number;
  stepType: string;
  title: string;
  contentJson: StepContentJson;
  createdAt: string;
}

export interface TrainingQuizQuestion {
  id: string;
  stepId: string;
  questionNumber: number;
  questionText: string;
  options: { key: string; text: string }[];
  correctKey: string;
  explanations: Record<string, string>;
  createdAt: string;
}

export interface UserModuleProgress {
  id: string;
  clerkUserId: string;
  moduleId: string;
  currentStep: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserQuizAttempt {
  id: string;
  clerkUserId: string;
  questionId: string;
  selectedKey: string;
  isCorrect: boolean;
  attemptNumber: number;
  aiExplanation: string | null;
  createdAt: string;
}

export interface SimulationSession {
  id: string;
  clerkUserId: string;
  scenarioId: string;
  currentPhase: number;
  status: 'in_progress' | 'completed';
  decisions: unknown[];
  chatMessages: unknown[];
  score: number | null;
  maxScore: number | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// API response types
// ---------------------------------------------------------------------------

export interface ModuleListResponse {
  modules: TrainingModule[];
}

export interface ModuleDetailResponse {
  module: TrainingModule;
  steps: TrainingModuleStep[];
  questions: TrainingQuizQuestion[];
  progress: UserModuleProgress | null;
}

export interface ProgressResponse {
  progress: UserModuleProgress[];
}

export interface QuizSubmitResponse {
  correct: boolean;
  explanation: string;
  aiExplanation?: string;
}

export interface SupervisorResponse {
  users: {
    clerkUserId: string;
    name: string;
    role: string;
    modules: (UserModuleProgress & { moduleTitle: string })[];
  }[];
}
