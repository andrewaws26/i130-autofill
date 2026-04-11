// Demo Engine for Case Keeper 2.0 Interactive Product Demo
// Timeline-driven narrative that walks a law firm owner through
// the cost of trapped expertise and how Case Keeper solves it.

export interface DemoEvent {
  time: number;           // seconds from start (0 = wait for interactive tap)
  phase: string;          // phase identifier
  title: string;          // short, punchy phase title
  narration: string;      // 1-2 sentences max
  innerThought?: string;  // Maria's private thought - what the owner never heard
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
  textThread?: { from: string; messages: string[]; }; // iMessage-style thread
  recruitCost?: boolean; // Show the recruitment cost splash
}

export const DEMO_TIMELINE: DemoEvent[] = [
  // Phase 1: HOOK
  {
    time: 0,
    phase: 'hook',
    title: '',
    narration: '',
    interactive: true,
    interactivePrompt: 'See what went wrong',
    dashboardState: 'normal',
    textThread: {
      from: 'Maria Lopez',
      messages: [
        "Hi, I've been thinking about this for a while...",
        "I don't think this is the right fit for me.",
        "Today is my last day. I'm sorry.",
        "Also... James asked me not to say anything, but he's looking too.",
      ],
    },
  },

  // Phase 1b: THE COST
  {
    time: 0,
    phase: 'cost-splash',
    title: '',
    narration: '',
    dashboardState: 'crisis',
    recruitCost: true,
    interactive: true,
    interactivePrompt: 'Rewind to last Monday',
  },

  // Phase 2: CALM
  {
    time: 0,
    phase: 'calm',
    title: 'Last Monday',
    narration: 'Last Monday morning. Cases assigned. Everyone seemed fine.',
    chatMessage: 'Good morning! Starting on the Gutierrez asylum case today.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
    interactive: true,
    interactivePrompt: 'Next',
  },

  // Phase 3: FIRST SIGN
  {
    time: 0,
    phase: 'first-sign',
    title: 'Tuesday',
    narration: 'Maria opened the Gutierrez case. Step 4: Determine Concurrent Filing.',
    innerThought: 'What does concurrent filing mean? I should know this. She\'ll think I\'m not qualified if I ask.',
    dashboardState: 'warning',
    caseStatus: 'Maria has been on this step for 2 days. No questions asked.',
    interactive: true,
    interactivePrompt: 'What happened next',
  },

  // Phase 4: ESCALATION
  {
    time: 0,
    phase: 'escalation',
    title: 'Wednesday',
    narration: 'She couldn\'t find the answer. She made her best guess.',
    innerThought: 'I think it\'s just the I-130. I\'ll file it and figure out the rest later. Please let this be right.',
    chatMessage: 'Filed the I-130 for Gutierrez. Moving to next case.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'warning',
    highlightField: 'She filed I-130 only. Should have filed I-485 concurrently.',
    interactive: true,
    interactivePrompt: 'Next',
  },

  // Phase 5: CRISIS
  {
    time: 0,
    phase: 'crisis',
    title: 'Two Weeks Later',
    narration: 'USCIS rejected the approach. The client is calling. You\'re finding out for the first time.',
    innerThought: 'I knew I should have asked. But I didn\'t know what I didn\'t know. I can\'t keep doing this.',
    dashboardState: 'crisis',
    chatMessage: 'Client called. Wants to know why USCIS is asking for more documents.',
    chatFrom: 'Front Desk',
    interactive: true,
    interactivePrompt: 'Next',
  },

  // Phase: ATTUM'S LATE NIGHT
  {
    time: 0,
    phase: 'late-night',
    title: '11:47 PM',
    narration: '',
    dashboardState: 'crisis',
    innerThought: undefined,
    interactive: true,
    interactivePrompt: 'Next',
  },

  // Phase 5b: RECOGNITION - the gap between two perspectives
  {
    time: 0,
    phase: 'recognition',
    title: '',
    narration: '',
    dashboardState: 'crisis',
    interactive: true,
    interactivePrompt: 'See how Case Keeper prevents this',
  },

  // Phase 6: BEFORE/AFTER
  {
    time: 0,
    phase: 'before-after',
    title: 'Same scenario. Two outcomes.',
    narration: '',
    showBefore: true,
    showAfter: true,
    interactive: true,
    interactivePrompt: 'See it in action',
    dashboardState: 'warning',
  },

  // Phase 7: RESOLUTION
  {
    time: 0,
    phase: 'resolution',
    title: 'Tuesday, with Case Keeper',
    narration: 'Same Tuesday. Same confusing step. But this time, Maria isn\'t alone.',
    innerThought: 'I don\'t understand this step. But I can see WHY it matters and there\'s a button to ask. Let me just ask.',
    chatMessage: 'Quick question on concurrent filing - does asylum status qualify?',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
    showWorkflow: true,
    interactive: true,
    interactivePrompt: 'See the result',
  },

  // Phase 8: PAYOFF
  {
    time: 0,
    phase: 'payoff',
    title: 'The Result',
    narration: 'Your expertise captured. Your team guided. Without a single training session.',
    showDigest: true,
    showTraining: true,
    dashboardState: 'resolved',
    interactive: true,
    interactivePrompt: 'Finish',
  },

  // Phase: MARIA RETURNS
  {
    time: 0,
    phase: 'maria-returns',
    title: '',
    narration: '',
    dashboardState: 'resolved',
    chatMessage: "Hey - I heard about the new system. James and I have been talking... would you consider bringing us back?",
    chatFrom: 'Maria Lopez',
    interactive: true,
    interactivePrompt: "Don't lose another one",
  },

  // Phase: CLOSE
  {
    time: 0,
    phase: 'close',
    title: '',
    narration: 'Your expertise. In the system. For everyone.',
    dashboardState: 'resolved',
    interactive: false,
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
