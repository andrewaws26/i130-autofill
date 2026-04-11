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
  bgImage?: string; // Background illustration path
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
    bgImage: '/demo-images/02-empty-desks.jpg',
  },

  // Phase 2: CALM - establish the normal
  {
    time: 0,
    phase: 'calm',
    title: 'Rewind to Last Monday',
    narration: 'Your firm had 8 active cases. Your two associates were handling their caseloads. Everything looked normal.',
    chatMessage: 'Good morning! Starting on the Gutierrez asylum case today.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
    interactive: true,
    interactivePrompt: 'Then came Tuesday',
  },

  // Phase 3: FIRST SIGN - the invisible problem
  {
    time: 0,
    phase: 'first-sign',
    title: 'Tuesday - Maria Gets Stuck',
    narration: 'Maria was working the Gutierrez asylum case. She hit a step she didn\'t understand: "Determine Concurrent Filing." She didn\'t ask you for help.',
    innerThought: 'What does concurrent filing mean? I should know this. She\'ll think I\'m not qualified if I ask.',
    dashboardState: 'warning',
    bgImage: '/demo-images/03-maria-struggling.jpg',
    caseStatus: 'Maria has been on this step for 2 days. No questions asked.',
    interactive: true,
    interactivePrompt: 'What did she do?',
  },

  // Phase 4: ESCALATION - the wrong decision
  {
    time: 0,
    phase: 'escalation',
    title: 'Wednesday - Maria Guesses',
    narration: 'Maria couldn\'t find the answer online. She didn\'t want to look incompetent. So she made her best guess and filed the I-130 by itself. She should have also filed the I-485.',
    innerThought: 'I think it\'s just the I-130. I\'ll file it and figure out the rest later. Please let this be right.',
    bgImage: '/demo-images/04-submit-button.jpg',
    chatMessage: 'Filed the I-130 for Gutierrez. Moving to next case.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'warning',
    highlightField: 'She filed I-130 only. Should have filed I-485 concurrently.',
    interactive: true,
    interactivePrompt: 'Two weeks later',
  },

  // Phase 5: CRISIS - the consequence
  {
    time: 0,
    phase: 'crisis',
    title: 'Two Weeks Later - USCIS Responds',
    narration: 'USCIS sent a Request for Evidence. The Gutierrez family\'s petition is delayed by 6 months. The client is upset. This is the first time you\'re hearing about any of this.',
    innerThought: 'I knew I should have asked. But I didn\'t know what I didn\'t know. I can\'t keep doing this.',
    dashboardState: 'crisis',
    bgImage: '/demo-images/05-rfe-letter.jpg',
    chatMessage: 'Client called. Wants to know why USCIS is asking for more documents.',
    chatFrom: 'Front Desk',
    interactive: true,
    interactivePrompt: 'That night',
  },

  // Phase: ATTUM'S LATE NIGHT - the owner's reality
  {
    time: 0,
    phase: 'late-night',
    title: 'Three Weeks Later - 11:47 PM',
    narration: 'Three weeks later. You\'re alone, redoing the work. Covering 15 cases. Wondering why this keeps happening.',
    dashboardState: 'crisis',
    bgImage: '/demo-images/06-attum-late-night.jpg',
    innerThought: undefined,
    interactive: true,
    interactivePrompt: 'Here\'s what you didn\'t see',
  },

  // Phase: RECOGNITION - the gap revealed
  {
    time: 0,
    phase: 'recognition',
    title: 'The Invisible Gap',
    narration: 'Maria\'s experience and yours were completely different. Neither of you knew.',
    dashboardState: 'crisis',
    bgImage: '/demo-images/07-the-gap.jpg',
    interactive: true,
    interactivePrompt: 'There is a solution',
  },

  // Phase: BEFORE/AFTER - the comparison
  {
    time: 0,
    phase: 'before-after',
    title: 'What If There Was a System?',
    narration: 'Same situation. Same people. Different outcome.',
    showBefore: true,
    showAfter: true,
    interactive: true,
    interactivePrompt: 'See it work',
    dashboardState: 'warning',
  },

  // Phase: RESOLUTION - the fix in action
  {
    time: 0,
    phase: 'resolution',
    title: 'Tuesday Again - This Time with Case Keeper',
    narration: 'Maria hits the same step. But now the system explains WHY this step matters and gives her a button to ask you directly. You get a suggested response. You tap send. 30 seconds.',
    innerThought: 'I don\'t understand this step. But I can see WHY it matters and there\'s a button to ask. Let me just ask.',
    bgImage: '/demo-images/08-the-bridge.jpg',
    chatMessage: 'Quick question on concurrent filing - does asylum status qualify?',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
    showWorkflow: true,
    interactive: true,
    interactivePrompt: 'See the result',
  },

  // Phase: PAYOFF - the numbers
  {
    time: 0,
    phase: 'payoff',
    title: '6 Months Later - The Numbers',
    narration: 'Zero rejected filings. Both associates still here. Your expertise captured in the system. No training sessions needed.',
    showDigest: true,
    showTraining: true,
    dashboardState: 'resolved',
    interactive: true,
    interactivePrompt: 'One more thing',
  },

  // Phase: MARIA RETURNS - the emotional payoff
  {
    time: 0,
    phase: 'maria-returns',
    title: '',
    narration: '',
    dashboardState: 'resolved',
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
