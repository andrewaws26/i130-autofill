// ---------------------------------------------------------------------------
// Training Module Seed Data
// ---------------------------------------------------------------------------
// Contains fully interactive content for 2 modules plus placeholder metadata
// for 13 more. This data is structured to be inserted into the database or
// consumed directly by the training module renderer.
// ---------------------------------------------------------------------------

// ---- Content block types ---------------------------------------------------

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface HeadingBlock {
  type: 'heading';
  text: string;
}

export interface ScenarioBlock {
  type: 'scenario';
  client: {
    name: string;
    country: string;
    facts: string[];
  };
  task: string;
}

export interface FormListBlock {
  type: 'form_list';
  items: { form: string; title: string; desc: string }[];
}

export interface CalloutBlock {
  type: 'callout';
  variant: 'info' | 'warning' | 'attum_quote';
  title?: string;
  text: string;
  source?: string;
}

export interface BulletListBlock {
  type: 'bullet_list';
  title?: string;
  items: string[];
  variant?: 'red_dot' | 'numbered' | 'default';
}

export type ContentBlock =
  | TextBlock
  | HeadingBlock
  | ScenarioBlock
  | FormListBlock
  | CalloutBlock
  | BulletListBlock;

// ---- Quiz types ------------------------------------------------------------

export interface QuizOption {
  key: string;
  text: string;
}

export interface SeedQuestion {
  moduleSlug: string;
  stepNumber: number;
  questionNumber: number;
  questionText: string;
  options: QuizOption[];
  correctKey: string;
  explanations: Record<string, string>;
}

// ---- Step types ------------------------------------------------------------

export type StepType =
  | 'scenario'
  | 'concept'
  | 'quiz'
  | 'application'
  | 'summary';

export interface QuizContentJson {
  preamble?: string;
}

export interface SummaryContentJson {
  takeaways: string[];
  nextModuleSlug?: string;
}

export type StepContentJson = ContentBlock[] | QuizContentJson | SummaryContentJson;

export interface SeedStep {
  moduleSlug: string;
  stepNumber: number;
  stepType: StepType;
  title: string;
  contentJson: StepContentJson;
}

// ---- Module types ----------------------------------------------------------

export interface SeedModule {
  slug: string;
  title: string;
  description: string;
  duration: string;
  order: number;
  is_active: boolean;
  total_steps: number;
  total_quiz_questions: number;
}

// ===========================================================================
// SEED_MODULES
// ===========================================================================

export const SEED_MODULES: SeedModule[] = [
  // --- Module 1: Concurrent Filing Strategy (I-485) — ACTIVE ---------------
  {
    slug: 'concurrent-filing',
    title: 'Concurrent Filing Strategy (I-485)',
    description:
      'Learn when to file I-485 concurrently with I-130, eligibility requirements, and common pitfalls.',
    duration: '15 min',
    order: 1,
    is_active: true,
    total_steps: 6,
    total_quiz_questions: 2,
  },

  // --- Module 2: Understanding the I-130 Process — ACTIVE ------------------
  {
    slug: 'i130-process',
    title: 'Understanding the I-130 Process',
    description:
      'Master the fundamentals of the I-130 Petition for Alien Relative, including who can file, eligibility categories, and key requirements.',
    duration: '20 min',
    order: 2,
    is_active: true,
    total_steps: 6,
    total_quiz_questions: 3,
  },

  // --- Modules 3-15: Placeholder (inactive) --------------------------------
  {
    slug: 'evidence-spousal',
    title: 'Evidence Requirements for Spousal Petitions',
    description:
      'Understand the evidence needed to demonstrate a bona fide marriage, including financial, testimonial, and documentary proof.',
    duration: '25 min',
    order: 3,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'reading-filling-forms',
    title: 'Reading and Filling USCIS Forms',
    description:
      'Learn to navigate USCIS form instructions, avoid common filling errors, and ensure accuracy across multi-part applications.',
    duration: '30 min',
    order: 4,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'naturalization-n400',
    title: 'Naturalization Basics (N-400)',
    description:
      'Cover the N-400 application process including residency requirements, good moral character, and the civics/English test.',
    duration: '20 min',
    order: 5,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'asylum-fundamentals',
    title: 'Asylum Law Fundamentals',
    description:
      'Understand the legal framework for asylum claims, protected grounds, the one-year filing deadline, and credible/reasonable fear standards.',
    duration: '35 min',
    order: 6,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'responding-to-rfes',
    title: 'Responding to RFEs',
    description:
      'Learn how to analyze Requests for Evidence, organize responsive submissions, and avoid common mistakes that lead to denials.',
    duration: '25 min',
    order: 7,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'processing-times-expedites',
    title: 'USCIS Processing Times & Expedite Requests',
    description:
      'Navigate USCIS processing timelines, understand when and how to file expedite requests, and manage client expectations.',
    duration: '15 min',
    order: 8,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'work-permits-travel-docs',
    title: 'Work Permits and Travel Documents',
    description:
      'Cover I-765 EAD applications, I-131 Advance Parole, combo cards, and maintaining lawful status while applications are pending.',
    duration: '20 min',
    order: 9,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'criminal-immigration',
    title: 'Immigration Consequences of Criminal Convictions',
    description:
      'Understand how criminal convictions impact immigration status, deportability grounds, aggravated felony definitions, and waivers.',
    duration: '40 min',
    order: 10,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'removal-defense',
    title: 'Removal Defense Basics',
    description:
      'Learn removal proceeding mechanics, forms of relief (cancellation, asylum, voluntary departure), and EOIR practice fundamentals.',
    duration: '30 min',
    order: 11,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'consular-processing',
    title: 'Consular Processing',
    description:
      'Cover the National Visa Center, DS-260 processing, consular interview preparation, and overcoming inadmissibility findings abroad.',
    duration: '25 min',
    order: 12,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'waivers-inadmissibility',
    title: 'Waivers of Inadmissibility',
    description:
      'Understand grounds of inadmissibility under INA 212(a), the I-601 and I-601A waiver processes, and extreme hardship standards.',
    duration: '35 min',
    order: 13,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'vawa-u-visa',
    title: 'VAWA and U-Visa Petitions',
    description:
      'Learn VAWA self-petition requirements, U-visa certification, and protections for victims of domestic violence and qualifying crimes.',
    duration: '30 min',
    order: 14,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
  {
    slug: 'advanced-case-strategy',
    title: 'Advanced Case Strategy',
    description:
      'Synthesize knowledge across practice areas for complex multi-issue cases involving overlapping immigration remedies.',
    duration: '45 min',
    order: 15,
    is_active: false,
    total_steps: 6,
    total_quiz_questions: 2,
  },
];

// ===========================================================================
// SEED_STEPS
// ===========================================================================

export const SEED_STEPS: SeedStep[] = [
  // =========================================================================
  // MODULE 1: Concurrent Filing Strategy (I-485)
  // =========================================================================

  // -- Step 1: Client Scenario ----------------------------------------------
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 1,
    stepType: 'scenario',
    title: 'Client Scenario',
    contentJson: [
      {
        type: 'scenario',
        client: {
          name: 'Rosa Maria Gutierrez, 34',
          country: 'Guatemala',
          facts: [
            'Currently in the US on asylum status (admitted May 2019)',
            'Married to US Citizen, Kho Meh',
            'Petitioner filing: I-130 (Spousal Petition)',
          ],
        },
        task: 'Determine whether to file additional forms concurrently with the I-130.',
      },
      {
        type: 'text',
        text: 'This is based on a real case type your firm handles regularly.',
      },
    ],
  },

  // -- Step 2: Core Concept -------------------------------------------------
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 2,
    stepType: 'concept',
    title: 'What Is Concurrent Filing?',
    contentJson: [
      {
        type: 'text',
        text: 'When a beneficiary is already in the United States, certain forms can be filed at the same time as the I-130:',
      },
      {
        type: 'form_list',
        items: [
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
        ],
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Why It Matters',
        text: 'Filing concurrently saves 6-12 months of processing time. Missing it means the client waits unnecessarily -- and pays for a separate filing later.',
      },
    ],
  },

  // -- Step 3: Quiz (2 questions) -------------------------------------------
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 3,
    stepType: 'quiz',
    title: 'Knowledge Check',
    contentJson: {
      preamble:
        "Based on Rosa's case, should you file I-485 concurrently with the I-130?",
    },
  },

  // -- Step 4: Real-World Application ---------------------------------------
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 4,
    stepType: 'application',
    title: "From the Firm's Experience",
    contentJson: [
      {
        type: 'callout',
        variant: 'attum_quote',
        text: '"This is the step where I see the most mistakes from new attorneys. The instinct is to just file the I-130 and figure out the rest later. But if the beneficiary is in the US with legal status, concurrent filing should be your DEFAULT assumption. Only skip it if there\'s a specific disqualifying factor."',
        source: 'Attorney Attum on concurrent filing',
      },
      {
        type: 'heading',
        text: 'Common Disqualifying Factors',
      },
      {
        type: 'bullet_list',
        items: [
          'Entered without inspection (no legal entry)',
          'Certain criminal convictions',
          'Prior immigration fraud',
          'Visa overstay beyond 180 days (complex)',
        ],
        variant: 'red_dot',
      },
    ],
  },

  // -- Step 5: Quiz (1 question — apply it) ---------------------------------
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 5,
    stepType: 'quiz',
    title: 'Apply It',
    contentJson: {
      preamble:
        "Rosa's case has one complication: she was placed in removal proceedings in 2020 (EOIR case pending). Does this change your concurrent filing decision?",
    },
  },

  // -- Step 6: Summary ------------------------------------------------------
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 6,
    stepType: 'summary',
    title: 'Module Complete',
    contentJson: {
      takeaways: [
        'When the beneficiary is in the US with legal status and the petitioner is a US citizen, concurrent filing should be your default.',
        'File I-485 + I-765 + I-131 together with the I-130.',
        'Removal proceedings do NOT disqualify concurrent filing.',
        'When in doubt, check the guided workflow or ask Attorney Attum through the system.',
      ],
      nextModuleSlug: 'work-permits-travel-docs',
    },
  },

  // =========================================================================
  // MODULE 2: Understanding the I-130 Process
  // =========================================================================

  // -- Step 1: Client Scenario ----------------------------------------------
  {
    moduleSlug: 'i130-process',
    stepNumber: 1,
    stepType: 'scenario',
    title: 'Client Scenario',
    contentJson: [
      {
        type: 'scenario',
        client: {
          name: 'Carlos Enrique Morales, 41',
          country: 'Guatemala',
          facts: [
            'US citizen (naturalized in 2018)',
            'Married to Lucia Fernanda Morales de Paz, 38, currently living in Guatemala City',
            'Marriage took place in Guatemala on March 15, 2023',
            'Carlos wants to bring Lucia to the United States as a permanent resident',
          ],
        },
        task: 'Determine the correct petition to file and advise Carlos on the I-130 process for his spouse.',
      },
      {
        type: 'text',
        text: 'Spousal petitions by US citizens are the most common case type at the firm. Understanding the I-130 inside and out is foundational to every other module.',
      },
    ],
  },

  // -- Step 2: What is the I-130 --------------------------------------------
  {
    moduleSlug: 'i130-process',
    stepNumber: 2,
    stepType: 'concept',
    title: 'What Is the I-130?',
    contentJson: [
      {
        type: 'text',
        text: 'Form I-130, Petition for Alien Relative, is the first step in helping a family member immigrate to the United States. It establishes the qualifying relationship between the petitioner (the US citizen or lawful permanent resident) and the beneficiary (the foreign national relative).',
      },
      {
        type: 'heading',
        text: 'Who Can File an I-130?',
      },
      {
        type: 'bullet_list',
        title: 'Eligible Petitioners',
        items: [
          'US citizens filing for a spouse, child, parent, or sibling',
          'Lawful Permanent Residents (LPRs) filing for a spouse or unmarried child',
        ],
        variant: 'default',
      },
      {
        type: 'heading',
        text: 'Immediate Relative vs. Preference Categories',
      },
      {
        type: 'text',
        text: 'When a US citizen files for a spouse, the beneficiary is classified as an "Immediate Relative" under INA 201(b)(2)(A)(i). This is critically important because Immediate Relatives are not subject to annual visa number caps -- there is no waiting line. This contrasts sharply with preference categories (such as siblings of US citizens, F4) where backlogs can stretch 15-20 years.',
      },
      {
        type: 'callout',
        variant: 'info',
        title: 'Key Distinction',
        text: 'When an LPR (green card holder) files an I-130 for a spouse, the beneficiary falls under the F2A preference category, which IS subject to visa number limits and may involve a multi-year wait. If the LPR naturalizes while the petition is pending, the case automatically upgrades to Immediate Relative status.',
      },
      {
        type: 'heading',
        text: 'Core Eligibility Requirements',
      },
      {
        type: 'bullet_list',
        items: [
          'The petitioner must be a US citizen or lawful permanent resident',
          'The petitioner must be able to prove the claimed relationship with documentary evidence',
          'For spousal petitions: the marriage must be legally valid where it took place',
          'Both parties must have been free to marry (all prior marriages must have been legally terminated)',
          'The marriage must be bona fide -- entered into in good faith, not solely for immigration benefit',
        ],
        variant: 'numbered',
      },
      {
        type: 'heading',
        text: 'What the I-130 Does NOT Do',
      },
      {
        type: 'text',
        text: 'The I-130 by itself does not grant the beneficiary any immigration status. It only establishes the qualifying family relationship. After USCIS approves the I-130, the beneficiary must still obtain their green card through either adjustment of status (I-485, if in the US) or consular processing (DS-260, if abroad). Think of the I-130 as unlocking the door -- the beneficiary still has to walk through it.',
      },
    ],
  },

  // -- Step 3: Quiz (2 questions) -------------------------------------------
  {
    moduleSlug: 'i130-process',
    stepNumber: 3,
    stepType: 'quiz',
    title: 'Knowledge Check',
    contentJson: {
      preamble:
        'Test your understanding of I-130 eligibility and filing requirements.',
    },
  },

  // -- Step 4: Common Mistakes & Attorney Attum Tips ------------------------
  {
    moduleSlug: 'i130-process',
    stepNumber: 4,
    stepType: 'application',
    title: 'Common Mistakes & Real-World Tips',
    contentJson: [
      {
        type: 'callout',
        variant: 'attum_quote',
        text: '"The number one mistake I see on I-130s is failing to check prior marriage history for BOTH parties. If the petitioner was married before and the divorce decree isn\'t attached, you\'re getting an RFE -- guaranteed. I always ask three times: \'Have you or your spouse ever been married to anyone else?\' People forget. They don\'t count religious ceremonies, or they assume an annulment handled it. Get the paperwork."',
        source: 'Attorney Attum on I-130 common errors',
      },
      {
        type: 'heading',
        text: 'Top Filing Mistakes',
      },
      {
        type: 'bullet_list',
        items: [
          'Missing or incorrect filing fee (currently $535 as of 2024; check USCIS fee schedule before every filing as fees change)',
          'Failing to include proof of petitioner\'s US citizenship or LPR status (birth certificate, naturalization certificate, or green card copy)',
          'Incomplete evidence of bona fide marriage -- a marriage certificate alone is usually insufficient',
          'Using an outdated form edition (USCIS rejects prior editions once a new one is published)',
          'Not disclosing prior marriages for either party, even if they ended decades ago',
          'Sending the petition to the wrong USCIS lockbox (filing addresses differ based on the beneficiary\'s location)',
        ],
        variant: 'red_dot',
      },
      {
        type: 'heading',
        text: 'Bona Fide Marriage Evidence Checklist',
      },
      {
        type: 'text',
        text: 'USCIS will scrutinize the marriage to ensure it was not entered into solely for immigration purposes. The stronger your initial evidence package, the less likely you are to receive an RFE or be called for a Stokes interview.',
      },
      {
        type: 'bullet_list',
        title: 'Strong evidence includes:',
        items: [
          'Joint bank account statements',
          'Joint lease or mortgage documents',
          'Joint utility bills or insurance policies',
          'Birth certificates of children born to the marriage',
          'Photographs together at different times and places',
          'Affidavits from friends and family attesting to the relationship',
          'Travel records showing visits (especially for couples who lived apart before filing)',
          'Communication records (call logs, messages) if the couple was in a long-distance relationship',
        ],
        variant: 'default',
      },
      {
        type: 'callout',
        variant: 'warning',
        title: 'Special Note on Marriages Less Than 2 Years Old',
        text: 'If the marriage is less than 2 years old at the time the beneficiary is admitted as a permanent resident, they receive conditional residence (a 2-year green card). The couple must then file Form I-751 to remove conditions within 90 days of the card\'s expiration. Always advise clients about this upfront so they are not surprised.',
      },
    ],
  },

  // -- Step 5: Quiz (1 question — scenario application) ---------------------
  {
    moduleSlug: 'i130-process',
    stepNumber: 5,
    stepType: 'quiz',
    title: 'Apply It',
    contentJson: {
      preamble:
        "Let's return to Carlos and Lucia's case. Carlos is a US citizen and Lucia is in Guatemala. Apply what you've learned.",
    },
  },

  // -- Step 6: Summary ------------------------------------------------------
  {
    moduleSlug: 'i130-process',
    stepNumber: 6,
    stepType: 'summary',
    title: 'Module Complete',
    contentJson: {
      takeaways: [
        'The I-130 establishes the qualifying family relationship -- it does not by itself grant immigration status.',
        'US citizens filing for spouses create an Immediate Relative petition with no visa number cap or waiting line.',
        'LPR petitioners create F2A preference category cases that are subject to visa backlogs; naturalization upgrades the petition automatically.',
        'Always verify prior marriage history for BOTH the petitioner and beneficiary, and obtain termination documents.',
        'Build a strong bona fide marriage evidence package from the start to minimize RFEs and Stokes interview risk.',
        'Marriages under 2 years old at admission result in conditional residence -- advise the client about the I-751 requirement.',
      ],
      nextModuleSlug: 'evidence-spousal',
    },
  },
];

// ===========================================================================
// SEED_QUESTIONS
// ===========================================================================

export const SEED_QUESTIONS: SeedQuestion[] = [
  // =========================================================================
  // MODULE 1: Concurrent Filing Strategy — Step 3 (question 1)
  // =========================================================================
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 3,
    questionNumber: 1,
    questionText:
      "Based on Rosa's case, should you file I-485 concurrently with the I-130?",
    options: [
      { key: 'A', text: 'No -- asylum seekers cannot adjust status' },
      {
        key: 'B',
        text: 'Yes -- she is in the US and her spouse is a US citizen',
      },
      {
        key: 'C',
        text: 'Only if her asylum case has been decided',
      },
      {
        key: 'D',
        text: 'Only if she has been in the US for more than 5 years',
      },
    ],
    correctKey: 'B',
    explanations: {
      A: 'Asylum seekers CAN adjust status. Lawful entry on asylum qualifies for I-485 adjustment under INA 245(a).',
      B: 'Rosa entered legally on asylum status, and her petitioner spouse is a US citizen. She is eligible for concurrent filing.',
      C: 'The asylum case does not need to be decided first. The I-130/I-485 is a separate immigration pathway.',
      D: 'There is no 5-year waiting requirement for spouse-of-citizen concurrent filing.',
    },
  },

  // =========================================================================
  // MODULE 1: Concurrent Filing Strategy — Step 5 (question 1)
  // =========================================================================
  {
    moduleSlug: 'concurrent-filing',
    stepNumber: 5,
    questionNumber: 1,
    questionText:
      'Does the pending removal proceeding change your concurrent filing decision?',
    options: [
      {
        key: 'A',
        text: 'Yes -- removal proceedings disqualify concurrent filing',
      },
      {
        key: 'B',
        text: 'No -- file the I-485 and request termination of proceedings',
      },
    ],
    correctKey: 'B',
    explanations: {
      A: 'Not quite. Pending removal proceedings are common for asylum seekers. The I-485 concurrent filing is still appropriate. The immigration court case will be administratively closed or terminated once USCIS adjudicates the I-485.',
      B: 'Pending removal proceedings do NOT disqualify concurrent filing. File the I-485 and submit a motion to terminate removal proceedings. Once the I-130 is approved and I-485 adjudicated, the removal case is typically terminated.',
    },
  },

  // =========================================================================
  // MODULE 2: Understanding the I-130 Process — Step 3 (question 1)
  // =========================================================================
  {
    moduleSlug: 'i130-process',
    stepNumber: 3,
    questionNumber: 1,
    questionText:
      'Carlos is a US citizen petitioning for his spouse Lucia who lives in Guatemala. What preference category does Lucia fall under?',
    options: [
      {
        key: 'A',
        text: 'F2A -- Spouse of a Lawful Permanent Resident',
      },
      {
        key: 'B',
        text: 'Immediate Relative -- no visa number cap applies',
      },
      {
        key: 'C',
        text: 'F1 -- Unmarried adult child of a US citizen',
      },
      {
        key: 'D',
        text: 'She must wait for a visa number to become available before filing',
      },
    ],
    correctKey: 'B',
    explanations: {
      A: 'F2A applies when the petitioner is a Lawful Permanent Resident, not a US citizen. Carlos is a naturalized US citizen, so his spouse qualifies as an Immediate Relative.',
      B: 'Correct. Spouses of US citizens are classified as Immediate Relatives under INA 201(b)(2)(A)(i). There is no visa number cap and no preference category waiting line.',
      C: 'F1 is for unmarried adult sons and daughters of US citizens. Lucia is Carlos\'s spouse, not his child.',
      D: 'Immediate Relatives are not subject to visa number limits. Carlos can file the I-130 immediately and Lucia will not face a backlog wait.',
    },
  },

  // =========================================================================
  // MODULE 2: Understanding the I-130 Process — Step 3 (question 2)
  // =========================================================================
  {
    moduleSlug: 'i130-process',
    stepNumber: 3,
    questionNumber: 2,
    questionText:
      'Which of the following is required to demonstrate eligibility for an I-130 spousal petition?',
    options: [
      {
        key: 'A',
        text: 'The couple must have been married for at least 2 years',
      },
      {
        key: 'B',
        text: 'The beneficiary must have visited the United States at least once',
      },
      {
        key: 'C',
        text: 'The marriage must be legally valid and all prior marriages for both parties must have been legally terminated',
      },
      {
        key: 'D',
        text: 'The petitioner must earn above 125% of the federal poverty guidelines at the time of filing the I-130',
      },
    ],
    correctKey: 'C',
    explanations: {
      A: 'There is no minimum marriage duration for filing an I-130. However, if the marriage is less than 2 years old at the time of admission, the beneficiary will receive conditional permanent residence.',
      B: 'The beneficiary does not need to have previously visited the US. Many spousal petitions are filed for beneficiaries who have never entered the United States.',
      C: 'Correct. The marriage must be legally valid in the jurisdiction where it was performed, and both parties must have been legally free to marry. Prior marriages must be terminated by divorce, annulment, or death of the former spouse, with documentation.',
      D: 'The 125% poverty guideline requirement applies to the I-864 Affidavit of Support, which is a later step in the immigration process -- not a requirement at the I-130 filing stage.',
    },
  },

  // =========================================================================
  // MODULE 2: Understanding the I-130 Process — Step 5 (question 1)
  // =========================================================================
  {
    moduleSlug: 'i130-process',
    stepNumber: 5,
    questionNumber: 1,
    questionText:
      "Carlos mentions during intake that Lucia was previously married in Guatemala but \"it was annulled by the church.\" Carlos himself was divorced in 2016. What should you do before filing the I-130?",
    options: [
      {
        key: 'A',
        text: "Accept the church annulment as sufficient and file the I-130 with Carlos's divorce decree only",
      },
      {
        key: 'B',
        text: 'Obtain Carlos\'s divorce decree AND verify whether Lucia\'s prior marriage was legally terminated under Guatemalan civil law -- a religious annulment alone is not sufficient',
      },
      {
        key: 'C',
        text: 'File the I-130 immediately and gather the prior marriage documents later if USCIS requests them',
      },
      {
        key: 'D',
        text: 'Advise Carlos that Lucia cannot file because she was previously married',
      },
    ],
    correctKey: 'B',
    explanations: {
      A: 'A religious annulment does not constitute a legal termination of marriage for immigration purposes. USCIS requires civil documentation. Filing without verifying Lucia\'s prior marriage termination will almost certainly result in an RFE or denial.',
      B: 'Correct. USCIS requires proof that ALL prior marriages for BOTH parties were legally terminated under civil law. A church annulment is not recognized as a legal dissolution. You must obtain either a civil divorce decree or a civil annulment decree from Guatemala. You also need Carlos\'s US divorce decree. Filing without these documents is the most common I-130 error.',
      C: 'This is a risky approach. Filing without prior marriage termination documents frequently results in RFEs that delay the case by months. Best practice is to gather all documentation before filing.',
      D: 'Having a prior marriage does not disqualify Lucia. She simply needs to demonstrate that the prior marriage was legally terminated before her marriage to Carlos.',
    },
  },
];
