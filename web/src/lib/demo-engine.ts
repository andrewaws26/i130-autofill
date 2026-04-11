// Demo Engine for Case Keeper 2.0 Interactive Product Demo
// Timeline-driven narrative for autistic business owners.
//
// Design principles:
// 1. Rigid template: every screen follows the same skeleton
// 2. Explicit framing: context label before every visual
// 3. One idea per screen: no parallel processing required
// 4. Declarative CTAs: every button says what clicking will show
// 5. BECAUSE connectors: causation is never implied, always stated
// 6. 11 screens: ACT 1 (problem) → ACT 2 (what happened) → ACT 3 (solution)

export interface DemoEvent {
  time: number;
  phase: string;
  title: string;
  contextLabel: string;       // REQUIRED: what you're about to see (gray caps)
  narration: string;          // The key narrative text
  innerThought?: string;
  chatMessage?: string;
  chatFrom?: string;
  interactive?: boolean;
  interactivePrompt?: string;
  dashboardState?: 'normal' | 'warning' | 'crisis' | 'resolved';
  caseStatus?: string;
  highlightField?: string;
  textThread?: { from: string; messages: string[]; };
  recruitCost?: boolean;
  bgImage?: string;
}

export const DEMO_TIMELINE: DemoEvent[] = [
  // ═══════════════════════════════════════════════════════════════
  // ACT 1: THE PROBLEM (3 screens)
  // ═══════════════════════════════════════════════════════════════

  // Screen 1: SETUP
  {
    time: 0,
    phase: 'setup',
    title: 'This Is Your Law Firm',
    contextLabel: 'Before we begin',
    narration: 'Then one Tuesday morning, your phone buzzes.',
    interactive: true,
    interactivePrompt: 'See what happened',
    dashboardState: 'normal',
  },

  // Screen 2: HOOK
  {
    time: 0,
    phase: 'hook',
    title: 'Tuesday Morning',
    contextLabel: 'This is a text message from your employee',
    narration: 'Third one this year.',
    interactive: true,
    interactivePrompt: 'See what it costs',
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

  // Screen 3: COST
  {
    time: 0,
    phase: 'cost-splash',
    title: 'The Cost of Losing Them',
    contextLabel: 'This is what replacing two attorneys costs your firm',
    narration: 'People don\'t quit jobs they can\'t afford to lose — unless something is really wrong.',
    dashboardState: 'crisis',
    recruitCost: true,
    interactive: true,
    interactivePrompt: 'See how this happened',
    bgImage: '/demo-images/02-empty-desks.jpg',
  },

  // ═══════════════════════════════════════════════════════════════
  // ACT 2: WHAT HAPPENED (4 screens)
  // ═══════════════════════════════════════════════════════════════

  // Screen 4: CALM
  {
    time: 0,
    phase: 'calm',
    title: 'Rewind to Last Monday',
    contextLabel: 'This is what your firm dashboard looked like one week before she quit',
    narration: 'No red flags. No complaints. No way to know what was coming.',
    chatMessage: 'Good morning! Starting on the Gutierrez case today.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
    interactive: true,
    interactivePrompt: 'See what happened Tuesday',
  },

  // Screen 5: SILENT FAILURE
  {
    time: 0,
    phase: 'silent-failure',
    title: 'What You Didn\'t See',
    contextLabel: 'This is what happened inside your firm that you couldn\'t see',
    narration: '',
    innerThought: 'I should know this. She\'ll think I\'m not qualified if I ask. I\'ll just figure it out myself.',
    bgImage: '/demo-images/03-maria-struggling.jpg',
    chatMessage: 'Filed the paperwork for Gutierrez. Moving to next case.',
    chatFrom: 'Maria Lopez',
    dashboardState: 'warning',
    caseStatus: 'She was stuck for 2 days. She never asked a single question.',
    interactive: true,
    interactivePrompt: 'See what happened next',
  },

  // Screen 6: CONSEQUENCE
  {
    time: 0,
    phase: 'consequence',
    title: 'The Cascade',
    contextLabel: 'This is the result of that invisible failure',
    narration: 'The answer is: nothing. There is just no system.',
    bgImage: '/demo-images/05-rfe-letter.jpg',
    dashboardState: 'crisis',
    interactive: true,
    interactivePrompt: 'See what you missed',
  },

  // Screen 7: THE COMPARISON
  {
    time: 0,
    phase: 'comparison',
    title: 'The Invisible Gap',
    contextLabel: 'These two lists show the same time period from two perspectives',
    narration: 'You could have answered her question in 30 seconds. She never got those 30 seconds.',
    dashboardState: 'crisis',
    bgImage: '/demo-images/07-the-gap.jpg',
    interactive: true,
    interactivePrompt: 'See why this keeps happening',
  },

  // Screen 8: THE KEY INSIGHT (standalone - one idea only)
  {
    time: 0,
    phase: 'the-insight',
    title: '',
    contextLabel: 'This is why it keeps happening',
    narration: '',
    dashboardState: 'crisis',
    interactive: true,
    interactivePrompt: 'See the solution',
  },

  // ═══════════════════════════════════════════════════════════════
  // ACT 3: THE SOLUTION (3 screens)
  // ═══════════════════════════════════════════════════════════════

  // Screen 9: WHAT CHANGES
  {
    time: 0,
    phase: 'what-changes',
    title: 'Same Week. Same People. One Difference.',
    contextLabel: 'This is what changes when there is a system',
    narration: 'Maria asked. You answered in 30 seconds. Case filed correctly. Client happy.',
    innerThought: 'I don\'t understand this step. But I can see why it matters, and there\'s a button to ask. Let me just ask.',
    bgImage: '/demo-images/08-the-bridge.jpg',
    chatMessage: 'Quick question on this step — does asylum status apply here?',
    chatFrom: 'Maria Lopez',
    dashboardState: 'normal',
    interactive: true,
    interactivePrompt: 'See the results',
  },

  // Screen 10: THE RESULT
  {
    time: 0,
    phase: 'the-result',
    title: '6 Months Later',
    contextLabel: 'These are the results after six months with a system',
    narration: 'They left because there was no system. Now there is.',
    dashboardState: 'resolved',
    interactive: true,
    interactivePrompt: 'See your savings',
  },

  // Screen 11: CLOSE
  {
    time: 0,
    phase: 'close',
    title: '',
    contextLabel: 'This is how much your firm could save',
    narration: 'Your expertise. In the system. For everyone.',
    dashboardState: 'resolved',
    interactive: false,
  },
];

export function getTotalAutoDuration(): number {
  return DEMO_TIMELINE.reduce((sum, e) => sum + e.time, 0);
}

export function getPhaseIndex(phase: string): number {
  return DEMO_TIMELINE.findIndex((e) => e.phase === phase);
}
