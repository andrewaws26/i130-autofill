// AI-Powered Case Simulation Data
// Defines the I-130 spousal petition simulation scenario with 8 phases.
// Decision options are hardcoded for reliability; AI generates chat + evaluation.

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface DecisionOption {
  id: string;
  label: string;
  text: string;
}

export interface SimulationPhase {
  number: number;
  title: string;
  contextLabel: string;
  event: string;
  eventType: 'intake' | 'document' | 'decision' | 'complication' | 'client_call' | 'review' | 'resolution';
  hasClientChat: boolean;
  clientChatOpener?: string;
  decision?: {
    prompt: string;
    options: DecisionOption[];
    correctOptionId: string;
  };
  guidance: {
    whyItMatters: string;
    attumNote?: string;
  };
  learningObjective: string;
  fallbackFeedback: {
    correct: string;
    incorrect: string;
  };
}

export interface SimulationScenario {
  id: string;
  title: string;
  caseType: string;
  client: {
    name: string;
    initials: string;
    country: string;
    language: string;
    facts: string[];
  };
  phases: SimulationPhase[];
}

export interface PhaseDecision {
  phase: number;
  selectedOptionId: string;
  correct: boolean;
  score: number;
  explanation: string;
  attumInsight?: string;
}

export interface ChatMessage {
  phase: number;
  from: 'client' | 'associate' | 'system';
  text: string;
  emotion?: 'calm' | 'worried' | 'upset' | 'grateful';
}

export interface SimulationState {
  currentPhase: number;
  phaseStatus: 'event' | 'chat' | 'decision' | 'feedback' | 'complete';
  decisions: PhaseDecision[];
  chatMessages: ChatMessage[];
  score: number;
  maxScore: number;
  isLoading: boolean;
}

// ─── I-130 Spousal Petition Scenario ────────────────────────────────────────

export const I130_SPOUSAL_SCENARIO: SimulationScenario = {
  id: 'i130-spousal',
  title: 'I-130 Spousal Petition',
  caseType: 'immigration',
  client: {
    name: 'Kho Meh',
    initials: 'KM',
    country: 'Thailand',
    language: 'Karen',
    facts: [
      'Petitioner: Kho Meh (US Citizen, born in Thailand)',
      'Beneficiary: Geovany Estuardo Cardona Hernandez (Guatemala)',
      'Marriage date: September 20, 2025 in Beaver Dam, KY',
      'Beneficiary entered US on asylum (May 2019)',
      'Beneficiary has pending removal proceedings',
      'Both work at Tracco Total Packaging in Owensboro, KY',
      'First marriage for both parties',
      'Beneficiary has no children',
    ],
  },
  phases: [
    // ── Phase 1: Client Intake ──────────────────────────────────────────
    {
      number: 1,
      title: 'Client Intake',
      contextLabel: 'A new client walks into your office',
      event: 'Kho Meh arrives at your office. She recently married Geovany Cardona Hernandez and wants to petition for him to get a green card. She speaks Karen and limited English. Her husband came to the US seeking asylum from Guatemala.',
      eventType: 'intake',
      hasClientChat: true,
      clientChatOpener: 'Hello, I want help for my husband. We got married and I want him to stay here with me. What do I need to do?',
      decision: {
        prompt: 'What is the most important information to collect first during this intake?',
        options: [
          { id: 'a', label: 'A', text: 'Start filling out the I-130 form immediately with the information she gives you' },
          { id: 'b', label: 'B', text: 'Ask about prior marriages, immigration history, and any pending proceedings for both parties' },
          { id: 'c', label: 'C', text: 'Ask for photos of the couple together to prove the marriage is real' },
          { id: 'd', label: 'D', text: 'Check if she can afford the filing fees before doing anything else' },
        ],
        correctOptionId: 'b',
      },
      guidance: {
        whyItMatters: 'Missing critical information at intake — like prior marriages, immigration violations, or pending proceedings — causes the most preventable delays. An incomplete intake means you are building the case on incomplete facts.',
        attumNote: 'A missing divorce decree is the #1 reason I-130s get RFEs in my practice. Always ask about prior marriages for both parties before anything else.',
      },
      learningObjective: 'Collect complete immigration and marital history before beginning any form preparation.',
      fallbackFeedback: {
        correct: 'Correct. Gathering complete immigration and marital history first prevents downstream problems. Prior marriages, immigration status, and pending proceedings all affect eligibility and filing strategy.',
        incorrect: 'Not quite. While that is part of the process, the most critical first step is gathering complete immigration and marital history — prior marriages, immigration status, and any pending proceedings. Missing any of these can derail the entire case later.',
      },
    },

    // ── Phase 2: Eligibility Check ──────────────────────────────────────
    {
      number: 2,
      title: 'Eligibility Check',
      contextLabel: 'Review the case facts for eligibility',
      event: 'You have collected the intake information. The system presents the key facts: Kho Meh is a US citizen. Geovany entered on asylum in 2019. They married in September 2025. He has pending removal proceedings. First marriage for both. No children.',
      eventType: 'decision',
      hasClientChat: false,
      decision: {
        prompt: 'Based on these facts, is this couple eligible for an I-130 spousal petition? What issues do you see?',
        options: [
          { id: 'a', label: 'A', text: 'Not eligible — the beneficiary has pending removal proceedings, so you cannot file' },
          { id: 'b', label: 'B', text: 'Eligible — US citizen petitioner, valid marriage. But flag the removal proceedings as a complication that affects filing strategy' },
          { id: 'c', label: 'C', text: 'Eligible — no issues at all, proceed with standard I-130 filing' },
          { id: 'd', label: 'D', text: 'Need more information — cannot determine eligibility without seeing the marriage certificate first' },
        ],
        correctOptionId: 'b',
      },
      guidance: {
        whyItMatters: 'Pending removal proceedings do not automatically bar an I-130, but they significantly affect filing strategy. An immigration judge may need to adjudicate the case instead of USCIS, or you may need to file a motion to reopen.',
        attumNote: 'I see attorneys panic when they hear "removal proceedings" and tell clients they are ineligible. That is wrong. A US citizen can always file an I-130 for their spouse. The proceedings affect WHERE and HOW you file, not WHETHER you can.',
      },
      learningObjective: 'Correctly identify eligibility while flagging complications that affect strategy.',
      fallbackFeedback: {
        correct: 'Correct. A US citizen can always petition for their spouse. The removal proceedings are a complication — they affect your filing strategy — but they do not bar the petition.',
        incorrect: 'Not quite. Pending removal proceedings complicate the strategy but do not prevent filing. A US citizen can always file an I-130 for a spouse. The key is recognizing both the eligibility AND the complication.',
      },
    },

    // ── Phase 3: Evidence Gathering ──────────────────────────────────────
    {
      number: 3,
      title: 'Evidence Gathering',
      contextLabel: 'Your client calls with a question about evidence',
      event: 'One week later. You have started preparing the petition. Kho Meh calls you back with a concern about the evidence you asked her to collect.',
      eventType: 'client_call',
      hasClientChat: true,
      clientChatOpener: 'Hi, you asked me for photos with Geovany. We do not have many photos together. We are both working a lot. Is that going to be a problem?',
      decision: {
        prompt: 'What evidence package do you recommend?',
        options: [
          { id: 'a', label: 'A', text: 'Just the marriage certificate and a few photos — keep it simple' },
          { id: 'b', label: 'B', text: 'Full package: joint bank statements, joint lease/utilities, insurance, photos, support letters from friends and family, phone records' },
          { id: 'c', label: 'C', text: 'Wait until USCIS asks for specific evidence — submit only what they require' },
          { id: 'd', label: 'D', text: 'Hire a private investigator to document the relationship' },
        ],
        correctOptionId: 'b',
      },
      guidance: {
        whyItMatters: 'USCIS evaluates the totality of evidence. A thin package invites scrutiny and increases the chance of an RFE or interview. A comprehensive package from the start shows good faith and reduces processing time.',
        attumNote: 'A thin evidence package invites scrutiny. I always tell my clients: more evidence is better. Joint bank accounts, shared bills, insurance — these prove daily life together, not just photos from one day.',
      },
      learningObjective: 'Build comprehensive evidence packages proactively rather than reactively.',
      fallbackFeedback: {
        correct: 'Correct. A comprehensive evidence package demonstrates the bona fide nature of the marriage from multiple angles. Joint financial documents, photos over time, and third-party affidavits create a complete picture.',
        incorrect: 'Not the best approach. USCIS evaluates the totality of evidence. A comprehensive package — joint finances, shared bills, photos, support letters — reduces the chance of an RFE and demonstrates good faith.',
      },
    },

    // ── Phase 4: Concurrent Filing (THE PIVOT) ──────────────────────────
    {
      number: 4,
      title: 'The Filing Decision',
      contextLabel: 'This is the step where most associates get stuck',
      event: 'The I-130 petition is prepared. Now you need to decide your filing strategy. The beneficiary is physically present in the US. He entered on asylum and has a pending removal case. His priority date would be immediately current because the petitioner is a US citizen.',
      eventType: 'decision',
      hasClientChat: false,
      decision: {
        prompt: 'What is the correct filing strategy?',
        options: [
          { id: 'a', label: 'A', text: 'File the I-130 by itself and wait for USCIS to process it before taking any other action' },
          { id: 'b', label: 'B', text: 'File I-130 concurrently with I-485 (Adjustment of Status), I-765 (Work Permit), and I-131 (Travel Document)' },
          { id: 'c', label: 'C', text: 'File the I-130 and also file a motion to terminate removal proceedings' },
          { id: 'd', label: 'D', text: 'Wait for the removal proceedings to conclude before filing anything' },
        ],
        correctOptionId: 'b',
      },
      guidance: {
        whyItMatters: 'When a US citizen petitions for a spouse who is physically present in the US with an immediately current priority date, concurrent filing of I-130 + I-485 + I-765 + I-131 saves 6-12 months and gives the beneficiary work authorization and travel documents while the case is pending. Filing the I-130 alone means a separate I-485 application later — more fees, more time, and the beneficiary has no work permit or travel document in the meantime.',
        attumNote: 'This is the exact step that trips up new associates. If the beneficiary is in the US with a current priority date, ALWAYS file concurrently. Missing this costs the client 6-12 months and thousands in additional fees. This is why Case Keeper flags this step automatically.',
      },
      learningObjective: 'Identify when concurrent filing is appropriate and understand the consequences of filing I-130 alone.',
      fallbackFeedback: {
        correct: 'Excellent. Concurrent filing (I-130 + I-485 + I-765 + I-131) is the correct strategy here. The beneficiary is in the US, the petitioner is a US citizen (immediately current priority date), and concurrent filing saves 6-12 months while providing work authorization and travel documents.',
        incorrect: 'This is the most common mistake new attorneys make. When a US citizen petitions for a spouse who is in the US with a current priority date, you should file I-130 concurrently with I-485, I-765, and I-131. Filing the I-130 alone costs the client 6-12 months and thousands in extra fees.',
      },
    },

    // ── Phase 5: The RFE ────────────────────────────────────────────────
    {
      number: 5,
      title: 'Request for Evidence',
      contextLabel: 'A complication arrives from USCIS',
      event: 'Six weeks after filing. USCIS has sent a Request for Evidence (RFE). They want additional proof that the marriage is bona fide. They specifically ask for: joint financial documents, evidence of cohabitation, and affidavits from people who know the couple.',
      eventType: 'complication',
      hasClientChat: false,
      decision: {
        prompt: 'How do you respond to this RFE?',
        options: [
          { id: 'a', label: 'A', text: 'Gather only what USCIS specifically asked for — joint bank statements, lease, and two affidavits' },
          { id: 'b', label: 'B', text: 'Submit everything USCIS asked for PLUS additional evidence they did not request — utility bills, joint insurance, more photos, phone records, and additional affidavits' },
          { id: 'c', label: 'C', text: 'Call USCIS to ask for more time and explain the couple works a lot and does not have much evidence' },
          { id: 'd', label: 'D', text: 'File a complaint that the RFE is unnecessary since you already submitted a marriage certificate' },
        ],
        correctOptionId: 'b',
      },
      guidance: {
        whyItMatters: 'An RFE response is your best chance to strengthen the case. Submitting only the minimum leaves the door open for a denial. Exceeding the request demonstrates thoroughness and good faith. The 87-day deadline is strict — missing it means automatic denial.',
        attumNote: 'When you get an RFE, treat it as an opportunity, not a threat. Submit everything they asked for and more. I always include 3-5 pieces of evidence beyond what was requested. It shows USCIS that the marriage is real and the attorney is thorough.',
      },
      learningObjective: 'Respond to RFEs comprehensively, exceeding the minimum requirements.',
      fallbackFeedback: {
        correct: 'Correct. Always exceed the RFE requirements. Submit everything they asked for plus additional supporting evidence. This demonstrates thoroughness and leaves no room for doubt.',
        incorrect: 'Not the best strategy. When responding to an RFE, you should exceed the minimum. Submit everything USCIS asked for plus additional evidence — utility bills, joint insurance, more photos, phone records. Going beyond the request demonstrates the marriage is genuine.',
      },
    },

    // ── Phase 6: Client Crisis ──────────────────────────────────────────
    {
      number: 6,
      title: 'Client Communication',
      contextLabel: 'Your client is panicking',
      event: 'Kho Meh received a copy of the RFE in the mail. She does not understand what it means. She calls your office in distress.',
      eventType: 'client_call',
      hasClientChat: true,
      clientChatOpener: 'I got a letter from the government! It says they need more things. Does this mean they are going to send Geovany away? I am very scared. What is happening?',
      decision: {
        prompt: 'How do you handle this call?',
        options: [
          { id: 'a', label: 'A', text: 'Tell her not to worry and that you will handle it — keep it brief to save time' },
          { id: 'b', label: 'B', text: 'Explain in plain language what an RFE is, that it is normal, that it does not mean denial, and outline the specific next steps you will take together' },
          { id: 'c', label: 'C', text: 'Ask her to come into the office so you can explain in person — do not discuss on the phone' },
          { id: 'd', label: 'D', text: 'Send her an email with a detailed legal explanation of the RFE process and relevant INA sections' },
        ],
        correctOptionId: 'b',
      },
      guidance: {
        whyItMatters: 'Client communication is not just a courtesy — it is a retention tool. Clients who feel confused and abandoned are the ones who file bar complaints, leave negative reviews, and switch attorneys. Clear, empathetic communication builds trust and keeps clients engaged.',
        attumNote: 'When a client is scared, they do not need legal citations. They need three things: what happened, what it means, and what you are going to do about it. In that order. Every time.',
      },
      learningObjective: 'Communicate with clients clearly, empathetically, and with concrete next steps.',
      fallbackFeedback: {
        correct: 'Correct. Explain what the RFE is in plain language, reassure the client that it is a normal part of the process, and give concrete next steps. Clients who understand what is happening are clients who trust you.',
        incorrect: 'Not the best approach. When a client is panicking, they need clear, empathetic communication: what happened (an RFE), what it means (the government wants more information, not a denial), and what you will do about it (specific next steps). Dismissing their fear or adding complexity makes it worse.',
      },
    },

    // ── Phase 7: Senior Review ──────────────────────────────────────────
    {
      number: 7,
      title: 'Senior Review',
      contextLabel: 'Submit your work for review before filing',
      event: 'Your RFE response package is ready. Before submitting it to USCIS, the system runs an automated review checklist. It flags one issue: the joint bank statement you included only covers 2 months. USCIS typically expects 3-12 months of financial history.',
      eventType: 'review',
      hasClientChat: false,
      decision: {
        prompt: 'The system flagged the bank statement as insufficient. What do you do?',
        options: [
          { id: 'a', label: 'A', text: 'Submit the package as-is — two months is probably fine' },
          { id: 'b', label: 'B', text: 'Go back to the client and request bank statements covering at least 6 months of joint account history' },
          { id: 'c', label: 'C', text: 'Remove the bank statement entirely since it might raise more questions' },
          { id: 'd', label: 'D', text: 'Write a cover letter explaining why you only have 2 months of records' },
        ],
        correctOptionId: 'b',
      },
      guidance: {
        whyItMatters: 'The senior review step exists to catch exactly this kind of issue. A 2-month bank statement might satisfy the letter of the RFE, but it does not demonstrate an ongoing financial relationship. USCIS reviewers notice thin financial evidence.',
        attumNote: 'This is what the review step is for. I have seen cases denied because an attorney submitted a 1-month bank statement when USCIS expected a year. The system caught this — without it, you would have submitted and hoped for the best.',
      },
      learningObjective: 'Use systematic review processes to catch issues before submission.',
      fallbackFeedback: {
        correct: 'Correct. Go back and get comprehensive bank records. The automated review caught an issue that could have weakened your response. This is the value of systematic review — catching problems before they reach USCIS.',
        incorrect: 'Not the best choice. The system flagged this for a reason — 2 months of bank records is thin. Going back to the client for 6+ months of records strengthens the response significantly. This is exactly what the review process is designed to catch.',
      },
    },

    // ── Phase 8: Resolution ─────────────────────────────────────────────
    {
      number: 8,
      title: 'Case Resolved',
      contextLabel: 'The case has been decided',
      event: 'Three months after submitting the RFE response. USCIS has approved the I-130 and I-485. Geovany received his green card. Kho Meh calls to thank you.',
      eventType: 'resolution',
      hasClientChat: true,
      clientChatOpener: 'Thank you so much! Geovany got his card today. We are so happy. You helped us so much. Thank you, thank you!',
      learningObjective: 'Complete a case successfully by applying systematic processes at every step.',
      guidance: {
        whyItMatters: 'Every successful case teaches something. The insights from this case — the importance of concurrent filing, comprehensive evidence, and systematic review — become institutional knowledge that helps every future case.',
      },
      fallbackFeedback: {
        correct: '',
        incorrect: '',
      },
    },
  ],
};

// ─── Helper Functions ───────────────────────────────────────────────────────

export function getPhase(scenario: SimulationScenario, phaseNumber: number): SimulationPhase | undefined {
  return scenario.phases.find(p => p.number === phaseNumber);
}

export function calculateScore(decisions: PhaseDecision[]): { score: number; maxScore: number; percentage: number } {
  const maxScore = decisions.length * 100;
  const score = decisions.reduce((sum, d) => sum + d.score, 0);
  return { score, maxScore, percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0 };
}

export function getGradeColor(percentage: number): string {
  if (percentage >= 80) return '#16a34a';
  if (percentage >= 60) return '#d97706';
  return '#dc2626';
}

export function getGradeLabel(percentage: number): string {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Good';
  if (percentage >= 60) return 'Needs Improvement';
  return 'Review Required';
}
