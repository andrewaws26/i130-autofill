'use client';

import { useState } from 'react';
import { DEMO_PLATFORM_DATA } from '@/lib/demo-platform-data';

function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 12,
        fontSize: '0.75rem',
        fontWeight: 600,
        background: color + '18',
        color: color,
        textTransform: 'capitalize',
      }}
    >
      {label}
    </span>
  );
}

const LANGUAGE_COLORS: Record<string, string> = {
  English: '#6b7280',
  Spanish: '#d97706',
  Karen: '#7c3aed',
  Burmese: '#0891b2',
};

const STATUS_COLORS: Record<string, string> = {
  draft: '#6b7280',
  sent: '#16a34a',
};

const EMAIL_TYPES = [
  'Documents Needed',
  'Status Update',
  'Payment Reminder',
  'Court Reminder',
];

const LANGUAGES = ['English', 'Spanish', 'Karen', 'Burmese'];

// Pre-written emails for specific combinations
const GENERATED_EMAILS: Record<string, string> = {
  'case-1|Documents Needed|English':
    'Dear Kho Meh,\n\nAs we prepare for your upcoming USCIS interview on April 22, 2026, we need to ensure all required documents are in order.\n\nPlease gather the following items and bring them to our office by April 18:\n\n1. Original marriage certificate\n2. Both passports (yours and your spouse\'s)\n3. Joint bank statements from the last 6 months\n4. Recent photos of you and your spouse together\n5. Proof of shared residence (lease agreement, utility bills)\n6. Any additional evidence of bona fide marriage\n\nIf you have difficulty obtaining any of these documents, please contact our office immediately so we can discuss alternatives.\n\nBest regards,\nAttum Law Office\n(502) 555-0100',

  'case-2|Status Update|Spanish':
    'Estimada Rosa Gutierrez,\n\nLe escribimos para actualizarle sobre el progreso de su caso de asilo (IMM-2025-002).\n\nEstado actual: Su entrevista de asilo esta confirmada para el 15 de abril de 2026 en la oficina de USCIS en Louisville.\n\nActualizaciones importantes:\n- Hemos preparado toda la evidencia de condiciones del pais\n- El interprete de espanol esta confirmado\n- Su declaracion personal ha sido traducida y certificada\n\nProximos pasos:\n- Reunion de preparacion para la entrevista: contactaremos para programar\n- Llegue 30 minutos antes de la hora de la entrevista\n- Traiga su identificacion y todos los documentos originales\n\nSi tiene alguna pregunta o preocupacion, no dude en comunicarse con nosotros.\n\nAtentamente,\nOficina Legal Attum',

  'case-6|Court Reminder|English':
    'Dear James Mitchell,\n\nThis is an important reminder about your upcoming court appearance.\n\nCase: CRM-2026-006 (DUI Defense)\nDate: April 14, 2026\nTime: 9:00 AM\nLocation: Jefferson County District Court, Room 204\n\nImportant instructions:\n- Arrive by 8:30 AM at the latest\n- Dress in business attire (suit or business casual)\n- Do not bring any electronic devices into the courtroom\n- Do not discuss your case with anyone in the hallway\n- Attorney Sarah Chen will meet you in the courthouse lobby at 8:15 AM\n\nWhat to expect:\n- This is your arraignment hearing\n- You will enter a plea\n- The judge may set conditions for bail or release\n- The entire process typically takes 15-30 minutes\n\nPlease reply to confirm you have received this message.\n\nBest regards,\nSarah Chen\nAttum Law Office',

  'case-4|Documents Needed|Karen':
    'Dear Htoo Paw,\n\n[The following would be translated to S\'gaw Karen script]\n\nWe are writing regarding your I-130 family petition (Case IMM-2026-004).\n\nTo continue processing your petition, we urgently need the following documents:\n\n1. Original birth certificate from Myanmar\n   - Must be the official government-issued document\n   - If unavailable, a secondary evidence affidavit may be substituted\n\n2. Certified English translation of the birth certificate\n   - We can recommend a certified translator if needed\n   - The translation must include a certification statement\n\n3. Copy of your current passport\n\n4. Proof of US lawful permanent resident status\n   - Green card (front and back)\n\nDeadline: May 10, 2026\n\nIf you need assistance or an interpreter, please call our office and request Karen language support.\n\nBest regards,\nAttum Law Office\n(502) 555-0100',
};

export default function DemoEmailPage() {
  const { emails, cases, clients } = DEMO_PLATFORM_DATA;
  const [selectedCase, setSelectedCase] = useState('');
  const [emailType, setEmailType] = useState('');
  const [language, setLanguage] = useState('');
  const [generatedEmail, setGeneratedEmail] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showGenerated, setShowGenerated] = useState(false);

  const activeCases = cases.filter((c) => c.status !== 'closed');
  const getClient = (id: string) => clients.find((c) => c.id === id);
  const getCase = (id: string) => cases.find((c) => c.id === id);

  const handleDraft = () => {
    if (!selectedCase || !emailType || !language) return;

    setIsGenerating(true);
    setShowGenerated(false);
    setGeneratedEmail('');

    // Simulate generation delay
    setTimeout(() => {
      const key = `${selectedCase}|${emailType}|${language}`;
      const email = GENERATED_EMAILS[key];

      if (email) {
        setGeneratedEmail(email);
      } else {
        // Generate a generic fallback
        const caseData = getCase(selectedCase);
        const client = caseData ? getClient(caseData.client_id) : null;
        const clientName = client
          ? `${client.first_name} ${client.last_name}`
          : 'Client';

        const genericEmails: Record<string, string> = {
          'Documents Needed': `Dear ${clientName},\n\nWe are writing regarding your case ${caseData?.case_number || ''}. To proceed with your matter, we need additional documentation.\n\nPlease contact our office at your earliest convenience to discuss the required documents.\n\n${language !== 'English' ? `[This message would be professionally translated to ${language}]\n\n` : ''}Best regards,\nAttum Law Office`,
          'Status Update': `Dear ${clientName},\n\nWe are writing to provide an update on your case ${caseData?.case_number || ''} (${caseData?.subtype || ''}).\n\nYour case is currently ${caseData?.status || 'active'} and progressing as expected.${caseData?.next_date ? ` Your next important date is ${caseData.next_date} (${caseData.next_date_type}).` : ''}\n\nPlease do not hesitate to contact us with any questions.\n\n${language !== 'English' ? `[This message would be professionally translated to ${language}]\n\n` : ''}Best regards,\nAttum Law Office`,
          'Payment Reminder': `Dear ${clientName},\n\nThis is a friendly reminder regarding your outstanding balance for case ${caseData?.case_number || ''}.\n\nPlease contact our office to arrange payment or discuss payment plan options.\n\n${language !== 'English' ? `[This message would be professionally translated to ${language}]\n\n` : ''}Best regards,\nAttum Law Office`,
          'Court Reminder': `Dear ${clientName},\n\nThis is an important reminder about your upcoming court date for case ${caseData?.case_number || ''}.${caseData?.next_date ? `\n\nDate: ${caseData.next_date}\nType: ${caseData.next_date_type}` : ''}\n\nPlease arrive at least 30 minutes early and dress professionally.\n\n${language !== 'English' ? `[This message would be professionally translated to ${language}]\n\n` : ''}Best regards,\nAttum Law Office`,
        };

        setGeneratedEmail(genericEmails[emailType] || 'Email draft generated.');
      }

      setIsGenerating(false);
      setShowGenerated(true);
    }, 1500);
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl">
      {/* Header */}
      <h1
        className="text-2xl font-semibold mb-6"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Smart Email Drafts
      </h1>

      {/* Compose Section */}
      <div
        className="rounded-lg p-6 mb-8"
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border-light)',
        }}
      >
        <h2
          className="text-base font-semibold mb-4"
          style={{
            fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
            color: 'var(--heading)',
          }}
        >
          Compose New Email
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {/* Case selector */}
          <div>
            <label className="form-label">Case</label>
            <select
              className="form-select"
              value={selectedCase}
              onChange={(e) => {
                setSelectedCase(e.target.value);
                setShowGenerated(false);
              }}
            >
              <option value="">Select a case...</option>
              {activeCases.map((c) => {
                const client = getClient(c.client_id);
                return (
                  <option key={c.id} value={c.id}>
                    {c.case_number} - {client ? `${client.first_name} ${client.last_name}` : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Email type */}
          <div>
            <label className="form-label">Email Type</label>
            <select
              className="form-select"
              value={emailType}
              onChange={(e) => {
                setEmailType(e.target.value);
                setShowGenerated(false);
              }}
            >
              <option value="">Select type...</option>
              {EMAIL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="form-label">Language</label>
            <select
              className="form-select"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setShowGenerated(false);
              }}
            >
              <option value="">Select language...</option>
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleDraft}
          disabled={!selectedCase || !emailType || !language || isGenerating}
          className="rounded-lg px-5 py-2.5 text-sm font-medium text-white"
          style={{
            background:
              !selectedCase || !emailType || !language
                ? 'var(--muted-light)'
                : 'var(--accent-gold)',
            cursor:
              !selectedCase || !emailType || !language
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {isGenerating ? 'Drafting...' : 'Draft Email'}
        </button>

        {/* Generated email output */}
        {isGenerating && (
          <div className="mt-4 flex items-center gap-2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              style={{ color: 'var(--accent-gold)' }}
            >
              <circle cx="10" cy="10" r="8" stroke="var(--border)" strokeWidth="2" fill="none" />
              <path
                d="M10 2a8 8 0 0 1 8 8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0 10 10"
                  to="360 10 10"
                  dur="1s"
                  repeatCount="indefinite"
                />
              </path>
            </svg>
            <span className="text-sm" style={{ color: 'var(--muted)' }}>
              AI drafting email...
            </span>
          </div>
        )}

        {showGenerated && generatedEmail && (
          <div
            className="mt-4 rounded-lg p-4"
            style={{
              background: 'var(--background)',
              border: '1px solid var(--border-light)',
              animation: 'fadeInUp 0.3s ease-out',
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-xs font-semibold uppercase"
                style={{ color: 'var(--muted)', letterSpacing: '0.5px' }}
              >
                Generated Draft
              </span>
              <div className="flex items-center gap-2">
                <Badge label={language} color={LANGUAGE_COLORS[language] || '#6b7280'} />
                <Badge label={emailType} color="#2563eb" />
              </div>
            </div>
            <pre
              className="text-sm whitespace-pre-wrap"
              style={{
                color: 'var(--foreground)',
                fontFamily: 'var(--font-sans)',
                lineHeight: 1.6,
              }}
            >
              {generatedEmail}
            </pre>
            <div className="flex gap-2 mt-3">
              <button
                className="rounded-lg px-4 py-1.5 text-xs font-medium text-white cursor-default"
                style={{ background: 'var(--accent-gold)' }}
              >
                Send Email
              </button>
              <button
                className="rounded-lg px-4 py-1.5 text-xs font-medium cursor-default"
                style={{
                  background: 'var(--card-bg)',
                  border: '1px solid var(--border)',
                  color: 'var(--foreground)',
                }}
              >
                Save as Draft
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Email History */}
      <h2
        className="text-lg font-semibold mb-4"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
        }}
      >
        Email History
      </h2>

      <div className="flex flex-col gap-3">
        {emails.map((email) => {
          const caseData = getCase(email.case_id);
          return (
            <div
              key={email.id}
              className="rounded-lg p-4"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-light)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="text-sm font-medium"
                      style={{ color: 'var(--heading)' }}
                    >
                      {email.recipient_name}
                    </span>
                    <Badge label={email.language} color={LANGUAGE_COLORS[email.language] || '#6b7280'} />
                    <Badge label={email.status} color={STATUS_COLORS[email.status]} />
                    <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
                      {caseData?.case_number}
                    </span>
                  </div>
                  <div
                    className="text-sm font-medium mb-1"
                    style={{ color: 'var(--foreground)' }}
                  >
                    {email.subject}
                  </div>
                  <p
                    className="text-xs"
                    style={{
                      color: 'var(--muted)',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {email.body.split('\n')[0]}
                  </p>
                </div>
                <span className="text-xs shrink-0" style={{ color: 'var(--muted-light)' }}>
                  {email.created_at}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
