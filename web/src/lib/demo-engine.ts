// Demo Engine for Case Keeper 2.0 Interactive Product Demo
// Timeline-driven narrative that walks a law firm owner through
// the cost of trapped expertise and how Case Keeper solves it.

export interface DemoEvent {
  time: number;           // seconds from start (0 = wait for interactive tap)
  phase: string;          // phase identifier
  title: string;          // short, punchy phase title
  narration: string;      // 1-2 sentences max
  chatMessage?: string;   // team chat message that slides in
  chatFrom?: string;      // who sent it
  interactive?: boolean;  // if true, pause until viewer taps
  interactivePrompt?: string; // CTA text for the tap button
  dashboardState?: 'normal' | 'warning' | 'crisis' | 'resolved';
  caseStatus?: string;
  showBefore?: boolean;
  showAfter?: boolean;
  showDigest?: boolean;
  showWorkflow?: boolean;
  showTraining?: boolean;
  highlightField?: string;
}

export const DEMO_TIMELINE: DemoEvent[] = [
  // Phase 1: HOOK
  {
    time: 0,
    phase: 'hook',
    title: '',
    narration: 'Your new associate just quit. No warning. Third one this year.',
    interactive: true,
    interactivePrompt: 'See what went wrong',
    dashboardState: 'normal',
  },

  // Phase 2: CALM
  {
    time: 8,
    phase: 'calm',
    title: 'Last Monday',
    narration: 'Everything looked fine. Cases were assigned. Work was getting done.',
    chatMessage: 'Good morning! Starting on the Gutierrez asylum case today.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
  },

  // Phase 3: FIRST SIGN - linger so they read the "No progress" detail
  {
    time: 8,
    phase: 'first-sign',
    title: 'Tuesday',
    narration: "Maria hit something she didn't understand. She didn't ask.",
    dashboardState: 'warning',
    caseStatus: 'Maria has been on Step 4 for 2 days',
  },

  // Phase 4: ESCALATION - let the red highlight sink in
  {
    time: 8,
    phase: 'escalation',
    title: 'Wednesday',
    narration: 'She guessed. She got it wrong. Nobody noticed.',
    chatMessage: 'Filed the I-130 for Gutierrez. Moving to next case.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'warning',
    highlightField: 'She filed I-130 only. Should have filed I-485 concurrently.',
  },

  // Phase 5: CRISIS - gut punch, let it sit
  {
    time: 7,
    phase: 'crisis',
    title: 'Two Weeks Later',
    narration: 'USCIS sent a Request for Evidence. The client is upset. You find out now.',
    dashboardState: 'crisis',
    chatMessage: 'Client called. Wants to know why USCIS is asking for more documents.',
    chatFrom: 'Front Desk',
  },

  // Phase 6: INTERACTIVE PAUSE
  {
    time: 0,
    phase: 'pause-problem',
    title: '',
    narration: "This happens because expertise is trapped in one person's head.",
    interactive: true,
    interactivePrompt: 'See how Case Keeper prevents this',
    dashboardState: 'crisis',
  },

  // Phase 7: BEFORE/AFTER - interactive so they can study both paths
  {
    time: 0,
    phase: 'before-after',
    title: 'Same scenario. Two outcomes.',
    narration: 'Without Case Keeper, expertise stays trapped. With it, everyone has access.',
    showBefore: true,
    showAfter: true,
    interactive: true,
    interactivePrompt: 'See it in action',
    dashboardState: 'warning',
  },

  // Phase 8: RESOLUTION
  {
    time: 10,
    phase: 'resolution',
    title: 'Tuesday, with Case Keeper',
    narration: 'Maria hits the same confusing step. This time, the system is there.',
    chatMessage: 'Quick question on concurrent filing - does asylum status qualify?',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
    showWorkflow: true,
  },

  // Phase 9: INTERACTIVE PAUSE
  {
    time: 0,
    phase: 'pause-solution',
    title: '',
    narration: 'Attorney Attum answers in 30 seconds. That answer is saved forever.',
    interactive: true,
    interactivePrompt: 'See the full picture',
    dashboardState: 'normal',
  },

  // Phase 10: PAYOFF - the money shot, give it room to breathe
  {
    time: 14,
    phase: 'payoff',
    title: 'The Result',
    narration: 'Everything documented. Team guided. No manual training needed.',
    showDigest: true,
    showTraining: true,
    dashboardState: 'resolved',
  },

  // Phase 11: CLOSE
  {
    time: 8,
    phase: 'close',
    title: '',
    narration: 'Your expertise. In the system. For everyone.',
    dashboardState: 'resolved',
  },
];

// Helper: total demo duration in seconds (excluding interactive pauses)
export function getTotalAutoDuration(): number {
  return DEMO_TIMELINE.reduce((sum, e) => sum + e.time, 0);
}

// Helper: get phase index by phase name
export function getPhaseIndex(phase: string): number {
  return DEMO_TIMELINE.findIndex((e) => e.phase === phase);
}
