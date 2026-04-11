// Demo data for Case Keeper 2.0 platform demonstration
// All data is fictional and used for demonstration purposes only

export interface Attorney {
  id: string;
  name: string;
  bar_number: string;
  email: string;
}

export interface Client {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  preferred_language: string;
  country_of_birth: string;
  date_of_birth: string;
  address: string;
  created_at: string;
}

export interface Case {
  id: string;
  case_number: string;
  client_id: string;
  attorney_id: string;
  type: 'immigration' | 'family' | 'criminal';
  subtype: string;
  status: 'active' | 'pending' | 'closed';
  priority: 'normal' | 'urgent' | 'low';
  opened_date: string;
  next_date: string;
  next_date_type: string;
  notes: string;
}

export interface CalendarEvent {
  id: string;
  case_id: string;
  title: string;
  date: string;
  type: 'hearing' | 'deadline' | 'appointment' | 'milestone';
  completed: boolean;
  description: string;
}

export interface Document {
  id: string;
  case_id: string;
  file_name: string;
  type: string;
  description: string;
  uploaded_at: string;
}

export interface ChecklistItem {
  id: string;
  case_id: string;
  label: string;
  status: 'complete' | 'missing' | 'pending';
}

export interface Invoice {
  id: string;
  invoice_number: string;
  client_id: string;
  case_id: string;
  amount: number;
  gov_fees: number;
  total: number;
  status: 'paid' | 'sent' | 'draft' | 'overdue';
  issued_date: string;
  due_date: string;
  paid_date: string | null;
}

export interface Note {
  id: string;
  case_id: string;
  author: string;
  content: string;
  created_at: string;
}

export interface Email {
  id: string;
  case_id: string;
  client_id: string;
  recipient_name: string;
  recipient_email: string;
  subject: string;
  body: string;
  language: string;
  status: 'draft' | 'sent';
  created_at: string;
}

export interface DemoStats {
  active_cases: number;
  total_clients: number;
  pending_documents: number;
  upcoming_deadlines: number;
  revenue_this_month: number;
  outstanding_balance: number;
}

export interface DemoPlatformData {
  attorneys: Attorney[];
  clients: Client[];
  cases: Case[];
  events: CalendarEvent[];
  documents: Document[];
  checklists: ChecklistItem[];
  invoices: Invoice[];
  notes: Note[];
  emails: Email[];
  stats: DemoStats;
}

export const DEMO_PLATFORM_DATA: DemoPlatformData = {
  attorneys: [
    {
      id: 'att-1',
      name: 'Dominic Attum',
      bar_number: 'KY-98234',
      email: 'dominic@attumlaw.com',
    },
    {
      id: 'att-2',
      name: 'Sarah Chen',
      bar_number: 'KY-10542',
      email: 'sarah@attumlaw.com',
    },
  ],

  clients: [
    {
      id: 'cli-1',
      first_name: 'Kho',
      last_name: 'Meh',
      phone: '502-555-0147',
      email: 'kho.meh@email.com',
      preferred_language: 'Karen',
      country_of_birth: 'Thailand',
      date_of_birth: '1988-03-15',
      address: '1423 Bardstown Rd, Louisville, KY 40204',
      created_at: '2025-09-12',
    },
    {
      id: 'cli-2',
      first_name: 'Rosa',
      last_name: 'Gutierrez',
      phone: '502-555-0238',
      email: 'rosa.gutierrez@email.com',
      preferred_language: 'Spanish',
      country_of_birth: 'Guatemala',
      date_of_birth: '1975-07-22',
      address: '890 S 4th St, Louisville, KY 40203',
      created_at: '2025-10-03',
    },
    {
      id: 'cli-3',
      first_name: 'Darnell',
      last_name: 'Washington',
      phone: '502-555-0391',
      email: 'darnell.w@email.com',
      preferred_language: 'English',
      country_of_birth: 'United States',
      date_of_birth: '1990-11-08',
      address: '2100 W Broadway, Louisville, KY 40211',
      created_at: '2025-11-15',
    },
    {
      id: 'cli-4',
      first_name: 'Htoo',
      last_name: 'Paw',
      phone: '502-555-0462',
      email: 'htoo.paw@email.com',
      preferred_language: 'Burmese',
      country_of_birth: 'Myanmar',
      date_of_birth: '1992-01-30',
      address: '3200 Taylor Blvd, Louisville, KY 40215',
      created_at: '2025-12-01',
    },
    {
      id: 'cli-5',
      first_name: 'Maria',
      last_name: 'Santos',
      phone: '502-555-0519',
      email: 'maria.santos@email.com',
      preferred_language: 'Spanish',
      country_of_birth: 'El Salvador',
      date_of_birth: '1985-05-14',
      address: '455 E Market St, Louisville, KY 40202',
      created_at: '2026-01-10',
    },
    {
      id: 'cli-6',
      first_name: 'James',
      last_name: 'Mitchell',
      phone: '502-555-0678',
      email: 'james.mitchell@email.com',
      preferred_language: 'English',
      country_of_birth: 'United States',
      date_of_birth: '1982-09-03',
      address: '1800 Frankfort Ave, Louisville, KY 40206',
      created_at: '2026-02-05',
    },
    {
      id: 'cli-7',
      first_name: 'Naw',
      last_name: 'Eh Htoo',
      phone: '502-555-0734',
      email: 'naw.ehhtoo@email.com',
      preferred_language: 'Karen',
      country_of_birth: 'Thailand',
      date_of_birth: '1995-12-19',
      address: '500 S Preston St, Louisville, KY 40202',
      created_at: '2026-02-20',
    },
    {
      id: 'cli-8',
      first_name: 'Carlos',
      last_name: 'Mendoza',
      phone: '502-555-0856',
      email: 'carlos.mendoza@email.com',
      preferred_language: 'Spanish',
      country_of_birth: 'Mexico',
      date_of_birth: '1979-04-27',
      address: '720 E Broadway, Louisville, KY 40202',
      created_at: '2026-03-01',
    },
  ],

  cases: [
    {
      id: 'case-1',
      case_number: 'IMM-2025-001',
      client_id: 'cli-1',
      attorney_id: 'att-1',
      type: 'immigration',
      subtype: 'I-130 Spousal Petition',
      status: 'active',
      priority: 'normal',
      opened_date: '2025-09-15',
      next_date: '2026-04-22',
      next_date_type: 'USCIS Interview',
      notes: 'Spousal petition for Geovany Cardona. All evidence compiled.',
    },
    {
      id: 'case-2',
      case_number: 'IMM-2025-002',
      client_id: 'cli-2',
      attorney_id: 'att-1',
      type: 'immigration',
      subtype: 'Asylum Application',
      status: 'active',
      priority: 'urgent',
      opened_date: '2025-10-05',
      next_date: '2026-04-15',
      next_date_type: 'Asylum Interview',
      notes: 'Asylum based on persecution. Interpreter needed (Spanish).',
    },
    {
      id: 'case-3',
      case_number: 'FAM-2025-003',
      client_id: 'cli-3',
      attorney_id: 'att-2',
      type: 'family',
      subtype: 'Custody Modification',
      status: 'active',
      priority: 'normal',
      opened_date: '2025-11-20',
      next_date: '2026-04-28',
      next_date_type: 'Hearing',
      notes: 'Father seeking modification of custody agreement. Mediation completed.',
    },
    {
      id: 'case-4',
      case_number: 'IMM-2026-004',
      client_id: 'cli-4',
      attorney_id: 'att-1',
      type: 'immigration',
      subtype: 'I-130 Family Petition',
      status: 'pending',
      priority: 'normal',
      opened_date: '2025-12-05',
      next_date: '2026-05-10',
      next_date_type: 'Document Deadline',
      notes: 'Family-based petition. Waiting on birth certificate translation.',
    },
    {
      id: 'case-5',
      case_number: 'FAM-2026-005',
      client_id: 'cli-5',
      attorney_id: 'att-2',
      type: 'family',
      subtype: 'Divorce',
      status: 'active',
      priority: 'normal',
      opened_date: '2026-01-12',
      next_date: '2026-04-18',
      next_date_type: 'Mediation',
      notes: 'Uncontested divorce. Property settlement in progress.',
    },
    {
      id: 'case-6',
      case_number: 'CRM-2026-006',
      client_id: 'cli-6',
      attorney_id: 'att-2',
      type: 'criminal',
      subtype: 'DUI Defense',
      status: 'active',
      priority: 'urgent',
      opened_date: '2026-02-08',
      next_date: '2026-04-14',
      next_date_type: 'Arraignment',
      notes: 'First offense DUI. BAC 0.09. Dash cam footage requested.',
    },
    {
      id: 'case-7',
      case_number: 'IMM-2026-007',
      client_id: 'cli-7',
      attorney_id: 'att-1',
      type: 'immigration',
      subtype: 'U-Visa Application',
      status: 'active',
      priority: 'urgent',
      opened_date: '2026-02-22',
      next_date: '2026-04-20',
      next_date_type: 'Evidence Deadline',
      notes: 'Crime victim visa. Law enforcement certification obtained.',
    },
    {
      id: 'case-8',
      case_number: 'CRM-2026-008',
      client_id: 'cli-8',
      attorney_id: 'att-2',
      type: 'criminal',
      subtype: 'Expungement',
      status: 'closed',
      priority: 'low',
      opened_date: '2025-08-15',
      next_date: '',
      next_date_type: '',
      notes: 'Expungement granted. Record cleared.',
    },
    {
      id: 'case-9',
      case_number: 'FAM-2025-009',
      client_id: 'cli-3',
      attorney_id: 'att-2',
      type: 'family',
      subtype: 'Child Support',
      status: 'closed',
      priority: 'low',
      opened_date: '2025-06-01',
      next_date: '',
      next_date_type: '',
      notes: 'Child support order finalized.',
    },
    {
      id: 'case-10',
      case_number: 'CRM-2026-010',
      client_id: 'cli-6',
      attorney_id: 'att-2',
      type: 'criminal',
      subtype: 'Misdemeanor Defense',
      status: 'pending',
      priority: 'normal',
      opened_date: '2026-03-10',
      next_date: '2026-05-05',
      next_date_type: 'Pre-trial Conference',
      notes: 'Trespassing charge. Awaiting discovery.',
    },
  ],

  events: [
    {
      id: 'evt-1',
      case_id: 'case-6',
      title: 'Arraignment - Mitchell DUI',
      date: '2026-04-14',
      type: 'hearing',
      completed: false,
      description: 'Jefferson County District Court, Room 204',
    },
    {
      id: 'evt-2',
      case_id: 'case-2',
      title: 'Asylum Interview - Gutierrez',
      date: '2026-04-15',
      type: 'hearing',
      completed: false,
      description: 'USCIS Louisville Field Office. Spanish interpreter confirmed.',
    },
    {
      id: 'evt-3',
      case_id: 'case-5',
      title: 'Mediation Session - Santos Divorce',
      date: '2026-04-18',
      type: 'appointment',
      completed: false,
      description: 'Louisville Mediation Center, 10:00 AM',
    },
    {
      id: 'evt-4',
      case_id: 'case-7',
      title: 'Evidence Submission Deadline - Eh Htoo U-Visa',
      date: '2026-04-20',
      type: 'deadline',
      completed: false,
      description: 'All supporting evidence must be filed with USCIS.',
    },
    {
      id: 'evt-5',
      case_id: 'case-1',
      title: 'USCIS Interview - Meh I-130',
      date: '2026-04-22',
      type: 'hearing',
      completed: false,
      description: 'USCIS Louisville. Bring original marriage certificate.',
    },
    {
      id: 'evt-6',
      case_id: 'case-3',
      title: 'Custody Hearing - Washington',
      date: '2026-04-28',
      type: 'hearing',
      completed: false,
      description: 'Family Court, Judge Anderson presiding.',
    },
    {
      id: 'evt-7',
      case_id: 'case-4',
      title: 'Document Collection Deadline - Paw I-130',
      date: '2026-05-10',
      type: 'deadline',
      completed: false,
      description: 'Birth certificate translation due from certified translator.',
    },
    {
      id: 'evt-8',
      case_id: 'case-10',
      title: 'Pre-trial Conference - Mitchell Trespass',
      date: '2026-05-05',
      type: 'hearing',
      completed: false,
      description: 'Jefferson County, courtroom TBD.',
    },
    {
      id: 'evt-9',
      case_id: 'case-1',
      title: 'I-130 Petition Filed',
      date: '2025-10-01',
      type: 'milestone',
      completed: true,
      description: 'Petition accepted by USCIS. Receipt number received.',
    },
    {
      id: 'evt-10',
      case_id: 'case-2',
      title: 'Asylum Application Filed',
      date: '2025-10-20',
      type: 'milestone',
      completed: true,
      description: 'Application submitted within 1-year deadline.',
    },
    {
      id: 'evt-11',
      case_id: 'case-7',
      title: 'Law Enforcement Certification Received',
      date: '2026-03-15',
      type: 'milestone',
      completed: true,
      description: 'LMPD signed certification form.',
    },
    {
      id: 'evt-12',
      case_id: 'case-5',
      title: 'Property Appraisal Due',
      date: '2026-04-25',
      type: 'deadline',
      completed: false,
      description: 'Independent appraisal of marital property.',
    },
    {
      id: 'evt-13',
      case_id: 'case-2',
      title: 'Prepare Asylum Interview Packet',
      date: '2026-04-13',
      type: 'deadline',
      completed: false,
      description: 'Finalize country conditions evidence and witness declarations.',
    },
  ],

  documents: [
    {
      id: 'doc-1',
      case_id: 'case-1',
      file_name: 'I-130_petition_signed.pdf',
      type: 'form',
      description: 'Signed I-130 petition form',
      uploaded_at: '2025-09-20',
    },
    {
      id: 'doc-2',
      case_id: 'case-1',
      file_name: 'marriage_certificate.pdf',
      type: 'evidence',
      description: 'Marriage certificate - Jefferson County',
      uploaded_at: '2025-09-20',
    },
    {
      id: 'doc-3',
      case_id: 'case-1',
      file_name: 'passport_kho_meh.pdf',
      type: 'identity',
      description: 'Petitioner passport copy',
      uploaded_at: '2025-09-22',
    },
    {
      id: 'doc-4',
      case_id: 'case-2',
      file_name: 'I-589_asylum_application.pdf',
      type: 'form',
      description: 'Asylum application form',
      uploaded_at: '2025-10-10',
    },
    {
      id: 'doc-5',
      case_id: 'case-2',
      file_name: 'country_conditions_report.pdf',
      type: 'evidence',
      description: 'Guatemala country conditions report',
      uploaded_at: '2025-10-12',
    },
    {
      id: 'doc-6',
      case_id: 'case-2',
      file_name: 'declaration_rosa_gutierrez.pdf',
      type: 'evidence',
      description: 'Personal declaration (Spanish + English)',
      uploaded_at: '2025-10-15',
    },
    {
      id: 'doc-7',
      case_id: 'case-3',
      file_name: 'custody_modification_petition.pdf',
      type: 'form',
      description: 'Motion to modify custody',
      uploaded_at: '2025-11-22',
    },
    {
      id: 'doc-8',
      case_id: 'case-3',
      file_name: 'mediation_agreement.pdf',
      type: 'evidence',
      description: 'Completed mediation agreement',
      uploaded_at: '2026-01-15',
    },
    {
      id: 'doc-9',
      case_id: 'case-4',
      file_name: 'I-130_petition_draft.pdf',
      type: 'form',
      description: 'Draft I-130 petition (unsigned)',
      uploaded_at: '2025-12-10',
    },
    {
      id: 'doc-10',
      case_id: 'case-5',
      file_name: 'divorce_petition.pdf',
      type: 'form',
      description: 'Divorce petition filed',
      uploaded_at: '2026-01-14',
    },
    {
      id: 'doc-11',
      case_id: 'case-6',
      file_name: 'police_report_dui.pdf',
      type: 'evidence',
      description: 'Arresting officer police report',
      uploaded_at: '2026-02-10',
    },
    {
      id: 'doc-12',
      case_id: 'case-6',
      file_name: 'dash_cam_request.pdf',
      type: 'form',
      description: 'Discovery request for dash cam footage',
      uploaded_at: '2026-02-15',
    },
    {
      id: 'doc-13',
      case_id: 'case-7',
      file_name: 'U-visa_petition.pdf',
      type: 'form',
      description: 'I-918 U-Visa petition',
      uploaded_at: '2026-02-25',
    },
    {
      id: 'doc-14',
      case_id: 'case-7',
      file_name: 'law_enforcement_cert.pdf',
      type: 'evidence',
      description: 'LMPD certification form I-918B',
      uploaded_at: '2026-03-15',
    },
    {
      id: 'doc-15',
      case_id: 'case-1',
      file_name: 'joint_bank_statements.pdf',
      type: 'evidence',
      description: 'Joint bank statements (6 months)',
      uploaded_at: '2026-01-05',
    },
  ],

  checklists: [
    { id: 'chk-1', case_id: 'case-1', label: 'I-130 Petition Form', status: 'complete' },
    { id: 'chk-2', case_id: 'case-1', label: 'Marriage Certificate', status: 'complete' },
    { id: 'chk-3', case_id: 'case-1', label: 'Petitioner Passport', status: 'complete' },
    { id: 'chk-4', case_id: 'case-1', label: 'Beneficiary Passport', status: 'missing' },
    { id: 'chk-5', case_id: 'case-1', label: 'Joint Financial Evidence', status: 'complete' },
    { id: 'chk-6', case_id: 'case-1', label: 'Photos Together', status: 'missing' },
    { id: 'chk-7', case_id: 'case-1', label: 'Proof of US Citizenship', status: 'complete' },
    { id: 'chk-8', case_id: 'case-4', label: 'I-130 Petition Form', status: 'pending' },
    { id: 'chk-9', case_id: 'case-4', label: 'Birth Certificate', status: 'missing' },
    { id: 'chk-10', case_id: 'case-4', label: 'Birth Certificate Translation', status: 'missing' },
    { id: 'chk-11', case_id: 'case-4', label: 'Petitioner ID', status: 'complete' },
    { id: 'chk-12', case_id: 'case-7', label: 'I-918 Petition', status: 'complete' },
    { id: 'chk-13', case_id: 'case-7', label: 'Law Enforcement Certification', status: 'complete' },
    { id: 'chk-14', case_id: 'case-7', label: 'Personal Statement', status: 'missing' },
    { id: 'chk-15', case_id: 'case-7', label: 'Medical Records', status: 'missing' },
  ],

  invoices: [
    {
      id: 'inv-1',
      invoice_number: 'INV-2025-001',
      client_id: 'cli-1',
      case_id: 'case-1',
      amount: 1500,
      gov_fees: 535,
      total: 2035,
      status: 'paid',
      issued_date: '2025-09-15',
      due_date: '2025-10-15',
      paid_date: '2025-10-02',
    },
    {
      id: 'inv-2',
      invoice_number: 'INV-2025-002',
      client_id: 'cli-2',
      case_id: 'case-2',
      amount: 2500,
      gov_fees: 0,
      total: 2500,
      status: 'paid',
      issued_date: '2025-10-05',
      due_date: '2025-11-05',
      paid_date: '2025-10-28',
    },
    {
      id: 'inv-3',
      invoice_number: 'INV-2025-003',
      client_id: 'cli-3',
      case_id: 'case-3',
      amount: 1200,
      gov_fees: 0,
      total: 1200,
      status: 'paid',
      issued_date: '2025-11-20',
      due_date: '2025-12-20',
      paid_date: '2025-12-15',
    },
    {
      id: 'inv-4',
      invoice_number: 'INV-2026-004',
      client_id: 'cli-4',
      case_id: 'case-4',
      amount: 1200,
      gov_fees: 535,
      total: 1735,
      status: 'sent',
      issued_date: '2025-12-05',
      due_date: '2026-01-05',
      paid_date: null,
    },
    {
      id: 'inv-5',
      invoice_number: 'INV-2026-005',
      client_id: 'cli-5',
      case_id: 'case-5',
      amount: 800,
      gov_fees: 0,
      total: 800,
      status: 'overdue',
      issued_date: '2026-01-12',
      due_date: '2026-02-12',
      paid_date: null,
    },
    {
      id: 'inv-6',
      invoice_number: 'INV-2026-006',
      client_id: 'cli-6',
      case_id: 'case-6',
      amount: 2000,
      gov_fees: 0,
      total: 2000,
      status: 'sent',
      issued_date: '2026-02-08',
      due_date: '2026-03-08',
      paid_date: null,
    },
    {
      id: 'inv-7',
      invoice_number: 'INV-2026-007',
      client_id: 'cli-7',
      case_id: 'case-7',
      amount: 1500,
      gov_fees: 0,
      total: 1500,
      status: 'overdue',
      issued_date: '2026-02-22',
      due_date: '2026-03-22',
      paid_date: null,
    },
    {
      id: 'inv-8',
      invoice_number: 'INV-2026-008',
      client_id: 'cli-8',
      case_id: 'case-8',
      amount: 465,
      gov_fees: 0,
      total: 465,
      status: 'paid',
      issued_date: '2025-08-15',
      due_date: '2025-09-15',
      paid_date: '2025-09-10',
    },
    {
      id: 'inv-9',
      invoice_number: 'INV-2026-009',
      client_id: 'cli-6',
      case_id: 'case-10',
      amount: 1000,
      gov_fees: 0,
      total: 1000,
      status: 'draft',
      issued_date: '2026-03-10',
      due_date: '2026-04-10',
      paid_date: null,
    },
  ],

  notes: [
    {
      id: 'note-1',
      case_id: 'case-1',
      author: 'Dominic Attum',
      content: 'Client brought in original marriage certificate. All bona fide marriage evidence looks strong.',
      created_at: '2025-09-25',
    },
    {
      id: 'note-2',
      case_id: 'case-2',
      author: 'Dominic Attum',
      content: 'Rosa described threats from gang members. Need to gather corroborating evidence from family in Guatemala.',
      created_at: '2025-10-08',
    },
    {
      id: 'note-3',
      case_id: 'case-6',
      author: 'Sarah Chen',
      content: 'Client has clean record prior to this. Good candidate for diversion program.',
      created_at: '2026-02-12',
    },
    {
      id: 'note-4',
      case_id: 'case-7',
      author: 'Dominic Attum',
      content: 'LMPD certification received. Need personal statement and medical records to complete filing.',
      created_at: '2026-03-16',
    },
  ],

  emails: [
    {
      id: 'email-1',
      case_id: 'case-1',
      client_id: 'cli-1',
      recipient_name: 'Kho Meh',
      recipient_email: 'kho.meh@email.com',
      subject: 'Documents Needed for I-130 Interview',
      body: 'Dear Kho Meh,\n\nYour USCIS interview for the I-130 spousal petition is scheduled for April 22, 2026. Please bring the following original documents:\n\n- Marriage certificate\n- Both passports\n- Joint bank statements (last 6 months)\n- Photos of you and your spouse together\n- Proof of shared residence (lease, utility bills)\n\nPlease contact our office if you have any questions.\n\nBest regards,\nAttum Law Office',
      language: 'English',
      status: 'sent',
      created_at: '2026-04-01',
    },
    {
      id: 'email-2',
      case_id: 'case-2',
      client_id: 'cli-2',
      recipient_name: 'Rosa Gutierrez',
      recipient_email: 'rosa.gutierrez@email.com',
      subject: 'Actualizacion de su Caso de Asilo',
      body: 'Estimada Rosa Gutierrez,\n\nLe escribo para informarle sobre el estado de su caso de asilo. Su entrevista esta programada para el 15 de abril de 2026 en la oficina de USCIS en Louisville.\n\nHemos confirmado un interprete de espanol para la entrevista. Por favor llegue 30 minutos antes de la hora programada.\n\nDocumentos que debe traer:\n- Su pasaporte o documento de identidad\n- Copia de la solicitud de asilo\n- Cualquier evidencia nueva de las condiciones en Guatemala\n\nSi tiene preguntas, no dude en llamarnos.\n\nAtentamente,\nOficina Legal Attum',
      language: 'Spanish',
      status: 'sent',
      created_at: '2026-04-02',
    },
    {
      id: 'email-3',
      case_id: 'case-6',
      client_id: 'cli-6',
      recipient_name: 'James Mitchell',
      recipient_email: 'james.mitchell@email.com',
      subject: 'Court Date Reminder - April 14',
      body: 'Dear James Mitchell,\n\nThis is a reminder that your arraignment hearing is scheduled for April 14, 2026 at the Jefferson County District Court, Room 204.\n\nPlease arrive by 8:30 AM. Dress professionally (business casual minimum). Do not bring any prohibited items.\n\nI will meet you in the lobby at 8:15 AM to review what to expect.\n\nPlease confirm receipt of this email.\n\nBest regards,\nSarah Chen\nAttum Law Office',
      language: 'English',
      status: 'sent',
      created_at: '2026-04-05',
    },
    {
      id: 'email-4',
      case_id: 'case-4',
      client_id: 'cli-4',
      recipient_name: 'Htoo Paw',
      recipient_email: 'htoo.paw@email.com',
      subject: 'Documents Needed - I-130 Petition',
      body: 'Dear Htoo Paw,\n\nWe are preparing your I-130 family petition. To proceed, we still need the following documents:\n\n1. Original birth certificate from Myanmar\n2. Certified English translation of the birth certificate\n3. Your current passport (copy)\n4. Proof of US lawful permanent resident status\n\nThe translation must be done by a certified translator. We can recommend one if needed.\n\nPlease provide these documents by May 10, 2026.\n\n[This message would be translated to Karen for the client]\n\nBest regards,\nAttum Law Office',
      language: 'Karen',
      status: 'draft',
      created_at: '2026-04-08',
    },
    {
      id: 'email-5',
      case_id: 'case-5',
      client_id: 'cli-5',
      recipient_name: 'Maria Santos',
      recipient_email: 'maria.santos@email.com',
      subject: 'Recordatorio de Pago - Factura Pendiente',
      body: 'Estimada Maria Santos,\n\nLe recordamos que la factura INV-2026-005 por $800.00 relacionada con su caso de divorcio esta pendiente desde el 12 de febrero de 2026.\n\nPor favor realice el pago lo antes posible para evitar interrupciones en la representacion legal.\n\nMetodos de pago aceptados:\n- Cheque a nombre de Attum Law Office\n- Transferencia bancaria\n- Pago en persona en nuestra oficina\n\nSi tiene dificultades financieras, por favor contactenos para discutir opciones de pago.\n\nAtentamente,\nOficina Legal Attum',
      language: 'Spanish',
      status: 'draft',
      created_at: '2026-04-09',
    },
  ],

  stats: {
    active_cases: 8,
    total_clients: 8,
    pending_documents: 7,
    upcoming_deadlines: 5,
    revenue_this_month: 8535,
    outstanding_balance: 4800,
  },
};
