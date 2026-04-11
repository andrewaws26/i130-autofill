'use client';

import { useState, useEffect, useCallback, useRef, Component, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import type { IntakeData } from '@/lib/types';
import { createEmptyIntakeData } from '@/lib/types';

/* Error boundary to catch render crashes */
class ReviewErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: Error) {
    console.error('Review page render error:', error);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ maxWidth: 500, margin: '80px auto', textAlign: 'center', padding: '0 20px' }}>
          <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--heading)', marginBottom: 12 }}>
            Something went wrong loading the review page
          </p>
          <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: '0.9375rem' }}>
            The extracted data may have an unexpected format. Please try uploading the intake form again.
          </p>
          <button
            onClick={() => { sessionStorage.removeItem('intakeData'); window.location.href = '/'; }}
            style={{
              background: 'var(--accent-gold)', color: '#fff', border: 'none',
              borderRadius: 8, padding: '12px 28px', fontSize: '1rem', fontWeight: 600, cursor: 'pointer',
            }}
          >
            Start Over
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ================================================================
   Encryption helpers for localStorage drafts
   ================================================================ */

async function encryptData(data: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptData(encryptedBase64: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  return new TextDecoder().decode(decrypted);
}

async function getEncryptionKey(): Promise<CryptoKey> {
  // Derive a key from a fixed seed + origin. Not Fort Knox, but encrypts at rest.
  const seed = new TextEncoder().encode('i130-autofill-draft-key-' + window.location.origin);
  const keyMaterial = await crypto.subtle.importKey('raw', seed, 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: new TextEncoder().encode('i130salt'), iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/* ================================================================
   Formatting helpers
   ================================================================ */

function formatSSN(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`;
}

function formatDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
}

function maskSSN(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (digits.length <= 4) return value;
  return `***-**-${digits.slice(-4)}`;
}

function validateSSN(value: string): string | null {
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  if (digits.length > 0 && digits.length !== 9) return 'SSN must be exactly 9 digits (XXX-XX-XXXX)';
  return null;
}

function validateDate(value: string): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match && value.replace(/\D/g, '').length > 0) return 'Date must be MM/DD/YYYY';
  return null;
}

function validateState(value: string): string | null {
  if (!value) return null;
  if (value.length > 0 && !/^[A-Z]{2}$/.test(value)) return 'State must be exactly 2 uppercase letters';
  return null;
}

/* ================================================================
   Shared helpers
   ================================================================ */

function StepIndicator({ active }: { active: number }) {
  const steps = ['Upload', 'Review', 'Download'];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === active;
        const isCompleted = stepNum < active;
        return (
          <div key={label} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`step-circle ${
                  isActive
                    ? 'step-circle-active'
                    : isCompleted
                    ? 'step-circle-completed'
                    : ''
                }`}
              >
                {isCompleted ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M2.5 7L5.5 10L11.5 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`step-label ${
                  isActive
                    ? 'step-label-active'
                    : isCompleted
                    ? 'step-label-completed'
                    : ''
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`step-line mx-2 ${
                  isCompleted ? 'step-line-completed' : ''
                }`}
                style={{ marginBottom: '1.125rem' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------------
   Field component
   ---------------------------------------------------------------- */

function Field({
  label,
  value,
  onChange,
  type = 'text',
  className = '',
  error,
  format,
  masked,
  onToggleMask,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  className?: string;
  error?: string | null;
  format?: 'ssn' | 'date' | 'phone';
  masked?: boolean;
  onToggleMask?: () => void;
}) {
  const safeValue = value ?? '';
  const filled = safeValue.trim() !== '';

  const handleChange = (raw: string) => {
    if (format === 'ssn') onChange(formatSSN(raw));
    else if (format === 'date') onChange(formatDate(raw));
    else if (format === 'phone') onChange(formatPhone(raw));
    else onChange(raw);
  };

  const displayValue = masked ? maskSSN(safeValue) : safeValue;

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}
        </label>
        {onToggleMask !== undefined && (
          <button
            type="button"
            onClick={onToggleMask}
            className="text-xs px-1.5 py-0.5 rounded"
            style={{ color: 'var(--accent-gold)', border: '1px solid var(--border)', background: 'var(--card-bg)' }}
          >
            {masked ? 'Show' : 'Hide'}
          </button>
        )}
      </div>
      <input
        type={type}
        value={displayValue}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={onToggleMask && masked ? onToggleMask : undefined}
        className={`w-full px-3 py-2 border rounded transition-colors focus:outline-none bg-white`}
        style={{
          borderLeft: error ? '4px solid var(--error)' : filled ? '4px solid var(--success)' : '4px solid var(--accent-gold-light)',
          borderTop: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--foreground)',
          backgroundColor: 'var(--card-bg)',
        }}
      />
      {error && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{error}</p>}
    </div>
  );
}

/* ----------------------------------------------------------------
   Select component
   ---------------------------------------------------------------- */

function SelectField({
  label,
  value,
  onChange,
  options,
  className = '',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const safeValue = value ?? '';
  const filled = safeValue.trim() !== '';
  return (
    <div className={className}>
      <label className="block text-xs font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      <select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className="form-select w-full"
        style={{
          borderLeft: filled ? '4px solid var(--success)' : '4px solid var(--accent-gold-light)',
        }}
      >
        <option value="">--</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ----------------------------------------------------------------
   Section wrapper
   ---------------------------------------------------------------- */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 mb-6 animate-section">
      <h2
        className="text-lg font-semibold pb-2 mb-5"
        style={{
          fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
          color: 'var(--heading)',
          borderBottom: '1px solid var(--border-light)',
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function SubHeading({ text }: { text: string }) {
  return (
    <h3
      className="text-sm font-semibold uppercase tracking-wide mt-6 mb-3"
      style={{ color: 'var(--heading)' }}
    >
      {text}
    </h3>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">{children}</div>;
}

function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">{children}</div>;
}

/* ----------------------------------------------------------------
   Option lists
   ---------------------------------------------------------------- */

const SEX_OPTIONS = [
  { value: 'M', label: 'Male' },
  { value: 'F', label: 'Female' },
];

const YES_NO = [
  { value: 'Yes', label: 'Yes' },
  { value: 'No', label: 'No' },
];

const APT_OPTIONS = [
  { value: 'Apt', label: 'Apt.' },
  { value: 'Ste', label: 'Ste.' },
  { value: 'Flr', label: 'Flr.' },
];

const MARITAL_OPTIONS = [
  { value: 'Single', label: 'Single' },
  { value: 'Married', label: 'Married' },
  { value: 'Divorced', label: 'Divorced' },
  { value: 'Widowed', label: 'Widowed' },
  { value: 'Separated', label: 'Separated' },
  { value: 'Annulled', label: 'Annulled' },
];

const ETHNICITY_OPTIONS = [
  { value: 'Hispanic or Latino', label: 'Hispanic or Latino' },
  { value: 'Not Hispanic or Latino', label: 'Not Hispanic or Latino' },
];

const RACE_OPTIONS = [
  { value: 'Asian', label: 'Asian' },
  { value: 'White', label: 'White' },
  { value: 'Black or African American', label: 'Black or African American' },
  { value: 'American Indian or Alaska Native', label: 'American Indian or Alaska Native' },
  { value: 'Native Hawaiian or Other Pacific Islander', label: 'Native Hawaiian or Other Pacific Islander' },
];

const HEIGHT_FEET = Array.from({ length: 7 }, (_, i) => ({
  value: String(i + 2),
  label: String(i + 2),
}));

const HEIGHT_INCHES = Array.from({ length: 12 }, (_, i) => ({
  value: String(i),
  label: String(i),
}));

const EYE_COLORS = [
  'Black', 'Blue', 'Brown', 'Gray', 'Green', 'Hazel', 'Maroon', 'Pink',
].map((c) => ({ value: c, label: c }));

const HAIR_COLORS = [
  'Bald', 'Black', 'Blond', 'Brown', 'Gray', 'Red', 'Sandy', 'White',
].map((c) => ({ value: c, label: c }));

const IMMIGRATION_STATUS = [
  { value: 'US Citizen', label: 'U.S. Citizen' },
  { value: 'Lawful Permanent Resident', label: 'Lawful Permanent Resident' },
];

const PROCEEDINGS_TYPES = [
  { value: 'Removal', label: 'Removal' },
  { value: 'Exclusion/Deportation', label: 'Exclusion/Deportation' },
  { value: 'Rescission', label: 'Rescission' },
  { value: 'Other Judicial', label: 'Other Judicial' },
];

const RELATIONSHIP_OPTIONS = [
  { value: 'Spouse', label: 'Spouse' },
  { value: 'Parent', label: 'Parent' },
  { value: 'Brother/Sister', label: 'Brother/Sister' },
  { value: 'Child', label: 'Child' },
];

/* ================================================================
   Review Page
   ================================================================ */

export default function ReviewPageWrapper() {
  return (
    <ReviewErrorBoundary>
      <ReviewPageInner />
    </ReviewErrorBoundary>
  );
}

function ReviewPageInner() {
  const router = useRouter();
  const downloadRef = useRef<HTMLAnchorElement>(null);

  const [data, setData] = useState<IntakeData>(createEmptyIntakeData());
  const [loaded, setLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [genError, setGenError] = useState('');
  const [step, setStep] = useState(2);
  const [petitionerSSNMasked, setPetitionerSSNMasked] = useState(true);
  const [beneficiarySSNMasked, setBeneficiarySSNMasked] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [draftBanner, setDraftBanner] = useState<string | null>(null);

  /* Clear sessionStorage on tab close */
  useEffect(() => {
    const handleBeforeUnload = () => {
      sessionStorage.removeItem('intakeData');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  /* Merge helper - deep-merges extracted data with empty template so every property exists */
  const mergeWithTemplate = useCallback((parsed: Partial<IntakeData>): IntakeData => {
    const base = createEmptyIntakeData();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safePet: any = parsed?.petitioner || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeBen: any = parsed?.beneficiary || {};
    return {
      relationship: parsed?.relationship || base.relationship,
      petitioner: {
        ...base.petitioner,
        ...safePet,
        mailing_address: { ...base.petitioner.mailing_address, ...(safePet.mailing_address || {}) },
        address_history: Array.isArray(safePet.address_history) && safePet.address_history.length > 0
          ? safePet.address_history
          : base.petitioner.address_history,
      },
      beneficiary: {
        ...base.beneficiary,
        ...safeBen,
        current_address: { ...base.beneficiary.current_address, ...(safeBen.current_address || {}) },
        last_address_outside_us: { ...base.beneficiary.last_address_outside_us, ...(safeBen.last_address_outside_us || {}) },
        address_history: Array.isArray(safeBen.address_history) && safeBen.address_history.length > 0
          ? safeBen.address_history
          : base.beneficiary.address_history,
      },
    };
  }, []);

  /* Load from sessionStorage, or detect saved draft */
  useEffect(() => {
    const raw = sessionStorage.getItem('intakeData');
    if (raw) {
      try {
        const parsed: IntakeData = JSON.parse(raw);
        setData(mergeWithTemplate(parsed));
        setLoaded(true);
      } catch {
        router.push('/');
      }
      return;
    }

    // No session data -- check for a localStorage draft (encrypted first, then legacy)
    const loadDraft = async () => {
      const encryptedDraft = localStorage.getItem('i130_draft_encrypted');
      if (encryptedDraft) {
        try {
          const json = await decryptData(encryptedDraft);
          const parsed: IntakeData = JSON.parse(json);
          const dateStr = localStorage.getItem('i130_draft_encrypted_date') || 'unknown';
          setDraftBanner(dateStr);
          setData(mergeWithTemplate(parsed));
          setLoaded(true);
          return;
        } catch {
          // Encrypted draft corrupt, fall through to legacy
        }
      }

      // Legacy unencrypted drafts (backwards compatibility)
      const draftKeys = Object.keys(localStorage).filter((k) => k.startsWith('i130_draft_') && k !== 'i130_draft_encrypted' && k !== 'i130_draft_encrypted_date');
      if (draftKeys.length > 0) {
        draftKeys.sort().reverse();
        const latestKey = draftKeys[0];
        const dateStr = latestKey.replace('i130_draft_', '');
        setDraftBanner(dateStr);
        try {
          const parsed: IntakeData = JSON.parse(localStorage.getItem(latestKey) || '');
          setData(mergeWithTemplate(parsed));
          setLoaded(true);
          // Re-save as encrypted and clean up old key
          const encrypted = await encryptData(JSON.stringify(parsed));
          localStorage.setItem('i130_draft_encrypted', encrypted);
          localStorage.setItem('i130_draft_encrypted_date', dateStr);
          localStorage.removeItem(latestKey);
          return;
        } catch {
          router.push('/');
          return;
        }
      }

      router.push('/');
    };
    loadDraft();
  }, [router, mergeWithTemplate]);

  /* State updaters */
  const updatePetitioner = useCallback((field: string, value: string | boolean) => {
    setData((prev) => ({ ...prev, petitioner: { ...prev.petitioner, [field]: value } }));
  }, []);

  const updateBeneficiary = useCallback((field: string, value: string) => {
    setData((prev) => ({ ...prev, beneficiary: { ...prev.beneficiary, [field]: value } }));
  }, []);

  const updatePetitionerAddress = useCallback((field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      petitioner: {
        ...prev.petitioner,
        mailing_address: { ...prev.petitioner.mailing_address, [field]: value },
      },
    }));
  }, []);

  const updateBeneficiaryAddress = useCallback((field: string, value: string) => {
    setData((prev) => ({
      ...prev,
      beneficiary: {
        ...prev.beneficiary,
        current_address: { ...prev.beneficiary.current_address, [field]: value },
      },
    }));
  }, []);

  /* Save Draft to localStorage (encrypted) */
  const saveDraft = useCallback(async () => {
    try {
      const dateKey = new Date().toISOString().slice(0, 10);
      const encrypted = await encryptData(JSON.stringify(data));
      localStorage.setItem('i130_draft_encrypted', encrypted);
      localStorage.setItem('i130_draft_encrypted_date', dateKey);
      // Clean up any old unencrypted drafts
      Object.keys(localStorage).filter(k => k.startsWith('i130_draft_') && k !== 'i130_draft_encrypted' && k !== 'i130_draft_encrypted_date').forEach(k => localStorage.removeItem(k));
      setToast({ message: `Draft saved (${dateKey})`, type: 'success' });
    } catch {
      setToast({ message: 'Failed to save draft', type: 'error' });
    }
  }, [data]);

  /* Dismiss draft banner */
  const dismissDraftBanner = useCallback(() => {
    setDraftBanner(null);
  }, []);

  /* Auto-dismiss toast after 3s */
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* Generate PDF */
  const generate = useCallback(async () => {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(body || `Server returned ${res.status}`);
      }
      const blob = await res.blob();
      setPdfBlob(blob);
      setStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed.';
      setGenError(message);
    } finally {
      setGenerating(false);
    }
  }, [data]);

  /* Download */
  const download = useCallback(() => {
    if (!pdfBlob || !downloadRef.current) return;
    const url = URL.createObjectURL(pdfBlob);
    downloadRef.current.href = url;
    downloadRef.current.download = 'I-130.pdf';
    downloadRef.current.click();
    // Auto-clear sensitive data after download
    setTimeout(() => {
      sessionStorage.removeItem('intakeData');
      URL.revokeObjectURL(url);
    }, 3000);
  }, [pdfBlob]);

  /* Start new */
  const startNew = useCallback(() => {
    sessionStorage.removeItem('intakeData');
    router.push('/');
  }, [router]);

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-32" style={{ color: 'var(--muted)' }}>
        Loading...
      </div>
    );
  }

  const petitionerName = [data.petitioner.given_name, data.petitioner.family_name].filter(Boolean).join(' ') || 'Petitioner';
  const beneficiaryName = [data.beneficiary.given_name, data.beneficiary.family_name].filter(Boolean).join(' ') || 'Beneficiary';

  /* Clear all data handler */
  const clearAllData = useCallback(() => {
    sessionStorage.removeItem('intakeData');
    router.push('/');
  }, [router]);

  /* Count completed fields */
  const countFields = (obj: Record<string, unknown>, prefix = ''): { total: number; filled: number } => {
    let total = 0;
    let filled = 0;
    for (const [key, val] of Object.entries(obj)) {
      if (key === 'physical_same_as_mailing') continue; // checkbox, not a text field
      if (typeof val === 'string') {
        total++;
        if (val.trim() !== '') filled++;
      } else if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const sub = countFields(val as Record<string, unknown>, `${prefix}${key}.`);
        total += sub.total;
        filled += sub.filled;
      }
    }
    return { total, filled };
  };

  const relCount = data.relationship ? 1 : 0;
  const pCount = countFields(data.petitioner as unknown as Record<string, unknown>);
  const bCount = countFields(data.beneficiary as unknown as Record<string, unknown>);
  const totalFields = 1 + pCount.total + bCount.total;
  const filledFields = relCount + pCount.filled + bCount.filled;
  const progressPct = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  return (
    <div className="w-full px-4 py-10" style={{ maxWidth: '900px', margin: '0 auto' }}>
      <StepIndicator active={step} />

      {/* Draft banner */}
      {draftBanner && (
        <div
          className="rounded px-4 py-3 mb-4 text-sm flex items-center justify-between"
          style={{ backgroundColor: 'var(--accent-gold-muted)', color: 'var(--heading)', border: '1px solid var(--accent-gold)' }}
        >
          <span>A saved draft was found from {draftBanner}. It has been loaded.</span>
          <button
            className="btn btn-ghost text-xs ml-4"
            onClick={dismissDraftBanner}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Warning banner */}
      <div
        className="rounded px-4 py-3 mb-4 text-sm"
        style={{ backgroundColor: '#fef3cd', color: '#856404', border: '1px solid #ffeaa7' }}
      >
        AI-extracted data may contain errors from handwriting interpretation. Please verify all fields before generating the PDF.
      </div>

      {/* Progress counter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {filledFields} of {totalFields} fields completed
          </span>
          <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            {progressPct}%
          </span>
        </div>
        <div className="w-full rounded-full" style={{ height: '6px', backgroundColor: 'var(--border-light)' }}>
          <div
            className="rounded-full transition-all"
            style={{ width: `${progressPct}%`, height: '6px', backgroundColor: 'var(--accent-gold)' }}
          />
        </div>
      </div>

      {/* Summary banner - sticky */}
      <div
        className="card p-4 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sticky top-0 z-10"
        style={{ borderLeft: '4px solid var(--accent-gold)' }}
      >
        <div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Petitioner</p>
          <p className="font-semibold" style={{ color: 'var(--heading)' }}>{petitionerName}</p>
        </div>
        <div className="hidden sm:block" style={{ color: 'var(--muted-light)', fontSize: '1.25rem' }}>
          &rarr;
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Beneficiary</p>
          <p className="font-semibold" style={{ color: 'var(--heading)' }}>{beneficiaryName}</p>
        </div>
        <div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Relationship</p>
          <p className="font-semibold" style={{ color: 'var(--heading)' }}>{data.relationship || '--'}</p>
        </div>
      </div>

      {/* Success state */}
      {pdfBlob && (
        <div
          className="card p-6 mb-8 text-center"
          style={{ borderLeft: '4px solid var(--success)' }}
        >
          <h2
            className="text-xl font-semibold mb-2"
            style={{
              fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
              color: 'var(--success)',
            }}
          >
            I-130 Generated Successfully
          </h2>
          <div className="flex items-center justify-center gap-4 mt-4">
            <button className="btn btn-primary text-base px-6 py-3" onClick={download}>
              Download PDF
            </button>
            <button className="btn btn-secondary" onClick={startNew}>
              Start New
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: 'var(--muted-light)' }}>
            Session data will be cleared after download for security.
          </p>
          {/* Hidden download anchor */}
          <a ref={downloadRef} className="hidden" />
        </div>
      )}

      {/* ============================================================
          Section 1: Relationship
          ============================================================ */}
      <Section title="1. Relationship">
        <div className="flex flex-wrap gap-4">
          {RELATIONSHIP_OPTIONS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="relationship"
                value={opt.value}
                checked={data.relationship === opt.value}
                onChange={() => setData((prev) => ({ ...prev, relationship: opt.value }))}
                className="accent-[var(--accent-gold)]"
              />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{opt.label}</span>
            </label>
          ))}
        </div>
      </Section>

      {/* ============================================================
          Section 2: Petitioner Information
          ============================================================ */}
      <Section title="2. Petitioner Information">
        <SubHeading text="Information About You (Petitioner)" />
        <Row>
          <Field label="Family Name" value={data.petitioner.family_name} onChange={(v) => updatePetitioner('family_name', v)} />
          <Field label="Given Name" value={data.petitioner.given_name} onChange={(v) => updatePetitioner('given_name', v)} />
          <Field label="Middle Name" value={data.petitioner.middle_name} onChange={(v) => updatePetitioner('middle_name', v)} />
        </Row>
        <Row>
          <Field label="SSN" value={data.petitioner.ssn} onChange={(v) => updatePetitioner('ssn', v)} format="ssn" masked={petitionerSSNMasked} onToggleMask={() => setPetitionerSSNMasked((p) => !p)} error={validateSSN(data.petitioner.ssn)} />
          <Field label="Date of Birth" value={data.petitioner.date_of_birth} onChange={(v) => updatePetitioner('date_of_birth', v)} format="date" error={validateDate(data.petitioner.date_of_birth)} />
          <SelectField label="Sex" value={data.petitioner.sex} onChange={(v) => updatePetitioner('sex', v)} options={SEX_OPTIONS} />
        </Row>
        <Row2>
          <Field label="City of Birth" value={data.petitioner.city_of_birth} onChange={(v) => updatePetitioner('city_of_birth', v)} />
          <Field label="Country of Birth" value={data.petitioner.country_of_birth} onChange={(v) => updatePetitioner('country_of_birth', v)} />
        </Row2>

        <SubHeading text="Mailing Address" />
        <Row>
          <Field label="Street" value={data.petitioner.mailing_address.street} onChange={(v) => updatePetitionerAddress('street', v)} className="sm:col-span-2" />
          <SelectField label="Apt/Ste/Flr" value={data.petitioner.mailing_address.apt_ste_flr} onChange={(v) => updatePetitionerAddress('apt_ste_flr', v)} options={APT_OPTIONS} />
        </Row>
        <Row>
          <Field label="Unit Number" value={data.petitioner.mailing_address.unit_number} onChange={(v) => updatePetitionerAddress('unit_number', v)} />
          <Field label="City" value={data.petitioner.mailing_address.city} onChange={(v) => updatePetitionerAddress('city', v)} />
          <Field label="State" value={data.petitioner.mailing_address.state} onChange={(v) => updatePetitionerAddress('state', v)} error={validateState(data.petitioner.mailing_address.state)} />
        </Row>
        <Row>
          <Field label="ZIP Code" value={data.petitioner.mailing_address.zip} onChange={(v) => updatePetitionerAddress('zip', v)} />
          <Field label="Country" value={data.petitioner.mailing_address.country} onChange={(v) => updatePetitionerAddress('country', v)} />
        </Row>
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={data.petitioner.physical_same_as_mailing}
              onChange={(e) => updatePetitioner('physical_same_as_mailing', e.target.checked)}
              className="accent-[var(--accent-gold)]"
            />
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>Physical address same as mailing</span>
          </label>
        </div>

        <SubHeading text="Marital Information" />
        <Row>
          <Field label="Times Married" value={data.petitioner.times_married} onChange={(v) => updatePetitioner('times_married', v)} />
          <SelectField label="Marital Status" value={data.petitioner.marital_status} onChange={(v) => updatePetitioner('marital_status', v)} options={MARITAL_OPTIONS} />
          <Field label="Date of Marriage" value={data.petitioner.date_of_marriage} onChange={(v) => updatePetitioner('date_of_marriage', v)} format="date" error={validateDate(data.petitioner.date_of_marriage)} />
        </Row>
        <Row>
          <Field label="Marriage City" value={data.petitioner.marriage_city} onChange={(v) => updatePetitioner('marriage_city', v)} />
          <Field label="Marriage State" value={data.petitioner.marriage_state} onChange={(v) => updatePetitioner('marriage_state', v)} error={validateState(data.petitioner.marriage_state)} />
          <Field label="Marriage Country" value={data.petitioner.marriage_country} onChange={(v) => updatePetitioner('marriage_country', v)} />
        </Row>

        <SubHeading text="Spouse" />
        <Row>
          <Field label="Spouse Family Name" value={data.petitioner.spouse_family_name} onChange={(v) => updatePetitioner('spouse_family_name', v)} />
          <Field label="Given Name" value={data.petitioner.spouse_given_name} onChange={(v) => updatePetitioner('spouse_given_name', v)} />
          <Field label="Middle Name" value={data.petitioner.spouse_middle_name} onChange={(v) => updatePetitioner('spouse_middle_name', v)} />
        </Row>

        <SubHeading text="Parent 1 (Father)" />
        <Row>
          <Field label="Family Name" value={data.petitioner.parent1_family_name} onChange={(v) => updatePetitioner('parent1_family_name', v)} />
          <Field label="Given Name" value={data.petitioner.parent1_given_name} onChange={(v) => updatePetitioner('parent1_given_name', v)} />
          <SelectField label="Sex" value={data.petitioner.parent1_sex || 'M'} onChange={(v) => updatePetitioner('parent1_sex', v)} options={SEX_OPTIONS} />
        </Row>
        <Row2>
          <Field label="Country of Birth" value={data.petitioner.parent1_country_of_birth} onChange={(v) => updatePetitioner('parent1_country_of_birth', v)} />
          <Field label="Country of Residence" value={data.petitioner.parent1_country_of_residence} onChange={(v) => updatePetitioner('parent1_country_of_residence', v)} />
        </Row2>

        <SubHeading text="Parent 2 (Mother)" />
        <Row>
          <Field label="Family Name" value={data.petitioner.parent2_family_name} onChange={(v) => updatePetitioner('parent2_family_name', v)} />
          <Field label="Given Name" value={data.petitioner.parent2_given_name} onChange={(v) => updatePetitioner('parent2_given_name', v)} />
          <SelectField label="Sex" value={data.petitioner.parent2_sex || 'F'} onChange={(v) => updatePetitioner('parent2_sex', v)} options={SEX_OPTIONS} />
        </Row>
        <Row2>
          <Field label="Country of Birth" value={data.petitioner.parent2_country_of_birth} onChange={(v) => updatePetitioner('parent2_country_of_birth', v)} />
          <Field label="Country of Residence" value={data.petitioner.parent2_country_of_residence} onChange={(v) => updatePetitioner('parent2_country_of_residence', v)} />
        </Row2>

        <SubHeading text="Immigration Status" />
        <div className="flex flex-wrap gap-4 mb-4">
          {IMMIGRATION_STATUS.map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="immigration_status"
                value={opt.value}
                checked={data.petitioner.immigration_status === opt.value}
                onChange={() => updatePetitioner('immigration_status', opt.value)}
                className="accent-[var(--accent-gold)]"
              />
              <span className="text-sm" style={{ color: 'var(--foreground)' }}>{opt.label}</span>
            </label>
          ))}
        </div>

        <SubHeading text="Employment" />
        <Row2>
          <Field label="Employer Name" value={data.petitioner.employer_name} onChange={(v) => updatePetitioner('employer_name', v)} />
          <Field label="Street" value={data.petitioner.employer_street} onChange={(v) => updatePetitioner('employer_street', v)} />
        </Row2>
        <Row>
          <Field label="City" value={data.petitioner.employer_city} onChange={(v) => updatePetitioner('employer_city', v)} />
          <Field label="State" value={data.petitioner.employer_state} onChange={(v) => updatePetitioner('employer_state', v)} error={validateState(data.petitioner.employer_state)} />
          <Field label="ZIP" value={data.petitioner.employer_zip} onChange={(v) => updatePetitioner('employer_zip', v)} />
        </Row>
        <Row>
          <Field label="Country" value={data.petitioner.employer_country} onChange={(v) => updatePetitioner('employer_country', v)} />
          <Field label="Occupation" value={data.petitioner.occupation} onChange={(v) => updatePetitioner('occupation', v)} />
          <Field label="Date From" value={data.petitioner.employment_date_from} onChange={(v) => updatePetitioner('employment_date_from', v)} format="date" error={validateDate(data.petitioner.employment_date_from)} />
        </Row>
      </Section>

      {/* ============================================================
          Section 3: Biographic Information
          ============================================================ */}
      <Section title="3. Biographic Information">
        <Row2>
          <SelectField label="Ethnicity" value={data.petitioner.ethnicity} onChange={(v) => updatePetitioner('ethnicity', v)} options={ETHNICITY_OPTIONS} />
          <SelectField label="Race" value={data.petitioner.race} onChange={(v) => updatePetitioner('race', v)} options={RACE_OPTIONS} />
        </Row2>
        <Row>
          <SelectField label="Height (Feet)" value={data.petitioner.height_feet} onChange={(v) => updatePetitioner('height_feet', v)} options={HEIGHT_FEET} />
          <SelectField label="Height (Inches)" value={data.petitioner.height_inches} onChange={(v) => updatePetitioner('height_inches', v)} options={HEIGHT_INCHES} />
          <Field label="Weight (lbs)" value={data.petitioner.weight_lbs} onChange={(v) => updatePetitioner('weight_lbs', v)} />
        </Row>
        <Row2>
          <SelectField label="Eye Color" value={data.petitioner.eye_color} onChange={(v) => updatePetitioner('eye_color', v)} options={EYE_COLORS} />
          <SelectField label="Hair Color" value={data.petitioner.hair_color} onChange={(v) => updatePetitioner('hair_color', v)} options={HAIR_COLORS} />
        </Row2>
      </Section>

      {/* ============================================================
          Section 4: Beneficiary Information
          ============================================================ */}
      <Section title="4. Beneficiary Information">
        <SubHeading text="Information About Beneficiary" />
        <Row>
          <Field label="Family Name" value={data.beneficiary.family_name} onChange={(v) => updateBeneficiary('family_name', v)} />
          <Field label="Given Name" value={data.beneficiary.given_name} onChange={(v) => updateBeneficiary('given_name', v)} />
          <Field label="Middle Name" value={data.beneficiary.middle_name} onChange={(v) => updateBeneficiary('middle_name', v)} />
        </Row>
        <Row>
          <Field label="SSN" value={data.beneficiary.ssn} onChange={(v) => updateBeneficiary('ssn', v)} format="ssn" masked={beneficiarySSNMasked} onToggleMask={() => setBeneficiarySSNMasked((p) => !p)} error={validateSSN(data.beneficiary.ssn)} />
          <Field label="Date of Birth" value={data.beneficiary.date_of_birth} onChange={(v) => updateBeneficiary('date_of_birth', v)} format="date" error={validateDate(data.beneficiary.date_of_birth)} />
          <SelectField label="Sex" value={data.beneficiary.sex} onChange={(v) => updateBeneficiary('sex', v)} options={SEX_OPTIONS} />
        </Row>
        <Row2>
          <Field label="City of Birth" value={data.beneficiary.city_of_birth} onChange={(v) => updateBeneficiary('city_of_birth', v)} />
          <Field label="Country of Birth" value={data.beneficiary.country_of_birth} onChange={(v) => updateBeneficiary('country_of_birth', v)} />
        </Row2>

        <SubHeading text="Current Address" />
        <Row>
          <Field label="Street" value={data.beneficiary.current_address.street} onChange={(v) => updateBeneficiaryAddress('street', v)} className="sm:col-span-2" />
          <SelectField label="Apt/Ste/Flr" value={data.beneficiary.current_address.apt_ste_flr} onChange={(v) => updateBeneficiaryAddress('apt_ste_flr', v)} options={APT_OPTIONS} />
        </Row>
        <Row>
          <Field label="Unit Number" value={data.beneficiary.current_address.unit_number} onChange={(v) => updateBeneficiaryAddress('unit_number', v)} />
          <Field label="City" value={data.beneficiary.current_address.city} onChange={(v) => updateBeneficiaryAddress('city', v)} />
          <Field label="State" value={data.beneficiary.current_address.state} onChange={(v) => updateBeneficiaryAddress('state', v)} error={validateState(data.beneficiary.current_address.state)} />
        </Row>
        <Row>
          <Field label="ZIP Code" value={data.beneficiary.current_address.zip} onChange={(v) => updateBeneficiaryAddress('zip', v)} />
          <Field label="Country" value={data.beneficiary.current_address.country} onChange={(v) => updateBeneficiaryAddress('country', v)} />
          <Field label="Phone" value={data.beneficiary.phone} onChange={(v) => updateBeneficiary('phone', v)} format="phone" />
        </Row>

        <SubHeading text="Marital Information" />
        <Row>
          <Field label="Times Married" value={data.beneficiary.times_married} onChange={(v) => updateBeneficiary('times_married', v)} />
          <SelectField label="Marital Status" value={data.beneficiary.marital_status} onChange={(v) => updateBeneficiary('marital_status', v)} options={MARITAL_OPTIONS} />
          <Field label="Date of Marriage" value={data.beneficiary.date_of_marriage} onChange={(v) => updateBeneficiary('date_of_marriage', v)} format="date" error={validateDate(data.beneficiary.date_of_marriage)} />
        </Row>
        <Row>
          <Field label="Marriage City" value={data.beneficiary.marriage_city} onChange={(v) => updateBeneficiary('marriage_city', v)} />
          <Field label="Marriage State" value={data.beneficiary.marriage_state} onChange={(v) => updateBeneficiary('marriage_state', v)} error={validateState(data.beneficiary.marriage_state)} />
          <Field label="Marriage Country" value={data.beneficiary.marriage_country} onChange={(v) => updateBeneficiary('marriage_country', v)} />
        </Row>

        <SubHeading text="Entry Information" />
        <Row>
          <SelectField label="Ever in U.S." value={data.beneficiary.ever_in_us} onChange={(v) => updateBeneficiary('ever_in_us', v)} options={YES_NO} />
          <Field label="Class of Admission" value={data.beneficiary.class_of_admission} onChange={(v) => updateBeneficiary('class_of_admission', v)} />
          <Field label="Date of Arrival" value={data.beneficiary.date_of_arrival} onChange={(v) => updateBeneficiary('date_of_arrival', v)} format="date" error={validateDate(data.beneficiary.date_of_arrival)} />
        </Row>

        <SubHeading text="Employment" />
        <Row2>
          <Field label="Employer Name" value={data.beneficiary.employer_name} onChange={(v) => updateBeneficiary('employer_name', v)} />
          <Field label="Street" value={data.beneficiary.employer_street} onChange={(v) => updateBeneficiary('employer_street', v)} />
        </Row2>
        <Row>
          <Field label="City" value={data.beneficiary.employer_city} onChange={(v) => updateBeneficiary('employer_city', v)} />
          <Field label="State" value={data.beneficiary.employer_state} onChange={(v) => updateBeneficiary('employer_state', v)} error={validateState(data.beneficiary.employer_state)} />
          <Field label="ZIP" value={data.beneficiary.employer_zip} onChange={(v) => updateBeneficiary('employer_zip', v)} />
        </Row>
        <Row2>
          <Field label="Country" value={data.beneficiary.employer_country} onChange={(v) => updateBeneficiary('employer_country', v)} />
          <Field label="Date Employment Began" value={data.beneficiary.employment_date_from} onChange={(v) => updateBeneficiary('employment_date_from', v)} format="date" error={validateDate(data.beneficiary.employment_date_from)} />
        </Row2>

        <SubHeading text="Immigration Proceedings" />
        <Row>
          <SelectField label="In Proceedings" value={data.beneficiary.in_immigration_proceedings} onChange={(v) => updateBeneficiary('in_immigration_proceedings', v)} options={YES_NO} />
          <SelectField label="Type" value={data.beneficiary.proceedings_type} onChange={(v) => updateBeneficiary('proceedings_type', v)} options={PROCEEDINGS_TYPES} />
          <Field label="City" value={data.beneficiary.proceedings_city} onChange={(v) => updateBeneficiary('proceedings_city', v)} />
        </Row>
        <Row2>
          <Field label="State" value={data.beneficiary.proceedings_state} onChange={(v) => updateBeneficiary('proceedings_state', v)} error={validateState(data.beneficiary.proceedings_state)} />
          <Field label="Date" value={data.beneficiary.proceedings_date} onChange={(v) => updateBeneficiary('proceedings_date', v)} format="date" error={validateDate(data.beneficiary.proceedings_date)} />
        </Row2>
      </Section>

      {/* ============================================================
          Generate / Download
          ============================================================ */}
      {!pdfBlob && (
        <div className="text-center mb-10">
          {genError && (
            <div
              className="rounded px-4 py-3 mb-4 text-sm text-center"
              style={{ backgroundColor: 'rgba(155, 44, 44, 0.08)', color: 'var(--error)', border: '1px solid var(--error)' }}
            >
              <p className="mb-2">{genError}</p>
              <button
                className="btn btn-secondary text-sm"
                onClick={generate}
                disabled={generating}
              >
                Retry
              </button>
            </div>
          )}
          <div className="flex items-center justify-center gap-4">
            <button
              className="btn btn-primary btn-generate text-lg px-8 py-3"
              style={{
                fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                fontSize: '1.0625rem',
              }}
              disabled={generating}
              onClick={generate}
            >
              {generating ? 'Generating...' : 'Generate I-130 PDF'}
            </button>
            <button
              className="btn btn-secondary"
              onClick={saveDraft}
              disabled={generating}
            >
              Save Draft
            </button>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={clearAllData}
              className="text-xs underline"
              style={{ color: 'var(--muted)' }}
            >
              Clear All Data &amp; Start Over
            </button>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* Hidden anchor for download */}
      <a ref={downloadRef} className="hidden" />
    </div>
  );
}
