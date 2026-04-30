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
   Safe coercion helper
   ================================================================ */

/** Coerce any value to a string. Handles null, undefined, numbers, booleans. */
const safeString = (v: unknown): string => {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  return String(v);
};

/* ================================================================
   Formatting helpers
   ================================================================ */

function formatSSN(value: string): string {
  const digits = safeString(value).replace(/\D/g, '').slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 5) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,5)}-${digits.slice(5)}`;
}

function formatDate(value: string): string {
  const digits = safeString(value).replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0,2)}/${digits.slice(2)}`;
  return `${digits.slice(0,2)}/${digits.slice(2,4)}/${digits.slice(4)}`;
}

function formatPhone(value: string): string {
  const digits = safeString(value).replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0,3)}-${digits.slice(3)}`;
  return `${digits.slice(0,3)}-${digits.slice(3,6)}-${digits.slice(6)}`;
}

function maskSSN(value: string): string {
  const s = safeString(value);
  const digits = s.replace(/\D/g, '');
  if (digits.length <= 4) return s;
  return `***-**-${digits.slice(-4)}`;
}

function validateSSN(value: string): string | null {
  const v = safeString(value);
  if (!v) return null;
  const digits = v.replace(/\D/g, '');
  if (digits.length > 0 && digits.length !== 9) return 'SSN must be exactly 9 digits (XXX-XX-XXXX)';
  return null;
}

function validateDate(value: string): string | null {
  const v = safeString(value);
  if (!v) return null;
  const match = v.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match && v.replace(/\D/g, '').length > 0) return 'Date must be MM/DD/YYYY';
  return null;
}

function validateState(value: string): string | null {
  const v = safeString(value);
  if (!v) return null;
  if (v.length > 0 && !/^[A-Z]{2}$/.test(v)) return 'State must be exactly 2 uppercase letters';
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
  confidence,
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
  confidence?: 'high' | 'medium' | 'low';
}) {
  const safeValue = safeString(value);
  const filled = safeValue.trim() !== '';
  const isLowConf = confidence === 'low';
  const isMedConf = confidence === 'medium';

  const handleChange = (raw: string) => {
    if (format === 'ssn') onChange(formatSSN(raw));
    else if (format === 'date') onChange(formatDate(raw));
    else if (format === 'phone') onChange(formatPhone(raw));
    else onChange(raw);
  };

  const displayValue = masked ? maskSSN(safeValue) : safeValue;

  let borderColor = filled ? 'var(--success)' : 'var(--accent-gold-light)';
  if (error) borderColor = 'var(--error)';
  else if (isLowConf && filled) borderColor = '#dc2626';
  else if (isMedConf && filled) borderColor = '#d97706';

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}
        </label>
        {isLowConf && filled && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            Verify
          </span>
        )}
        {isMedConf && filled && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
            Check
          </span>
        )}
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
          borderLeft: `4px solid ${borderColor}`,
          borderTop: '1px solid var(--border)',
          borderRight: '1px solid var(--border)',
          borderBottom: '1px solid var(--border)',
          color: 'var(--foreground)',
          backgroundColor: isLowConf && filled ? '#fef2f2' : isMedConf && filled ? '#fffbeb' : 'var(--card-bg)',
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
  confidence,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  confidence?: 'high' | 'medium' | 'low';
}) {
  const safeValue = safeString(value);
  const filled = safeValue.trim() !== '';
  const isLowConf = confidence === 'low';
  const isMedConf = confidence === 'medium';

  let borderColor = filled ? 'var(--success)' : 'var(--accent-gold-light)';
  if (isLowConf && filled) borderColor = '#dc2626';
  else if (isMedConf && filled) borderColor = '#d97706';

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-1">
        <label className="block text-xs font-medium uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
          {label}
        </label>
        {isLowConf && filled && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
            Verify
          </span>
        )}
        {isMedConf && filled && (
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#fffbeb', color: '#d97706', border: '1px solid #fde68a' }}>
            Check
          </span>
        )}
      </div>
      <select
        value={safeValue}
        onChange={(e) => onChange(e.target.value)}
        className="form-select w-full"
        style={{
          borderLeft: `4px solid ${borderColor}`,
          backgroundColor: isLowConf && filled ? '#fef2f2' : isMedConf && filled ? '#fffbeb' : undefined,
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
  const [confidenceMap, setConfidenceMap] = useState<Record<string, 'high' | 'medium' | 'low'>>({});
  const [loaded, setLoaded] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const [pdfBlob485, setPdfBlob485] = useState<Blob | null>(null);
  const [genError, setGenError] = useState('');
  const [selectedForms, setSelectedForms] = useState<Set<string>>(new Set(['i130']));
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

  /* Merge helper - deep-merges extracted data with empty template so every property exists.
     Coerces all leaf values to strings (except booleans and arrays) to prevent
     crashes when the API returns numbers, null, or undefined. */
  const mergeWithTemplate = useCallback((parsed: Partial<IntakeData>): IntakeData => {
    const base = createEmptyIntakeData();

    /** Deep-coerce an object's leaf values to strings, using `template` for defaults.
        Preserves booleans and skips arrays (handled separately). */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const coerceObj = (template: Record<string, any>, source: Record<string, any>): Record<string, any> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result: Record<string, any> = {};
      for (const key of Object.keys(template)) {
        const tVal = template[key];
        const sVal = source?.[key];
        if (typeof tVal === 'boolean') {
          result[key] = typeof sVal === 'boolean' ? sVal : tVal;
        } else if (Array.isArray(tVal)) {
          // Arrays (address_history) handled by caller
          result[key] = tVal;
        } else if (typeof tVal === 'object' && tVal !== null) {
          result[key] = coerceObj(tVal, typeof sVal === 'object' && sVal !== null ? sVal : {});
        } else {
          // String leaf: coerce whatever the API sent
          result[key] = sVal != null ? safeString(sVal) : safeString(tVal);
        }
      }
      return result;
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safePet: any = parsed?.petitioner || {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const safeBen: any = parsed?.beneficiary || {};

    const mergedPet = coerceObj(base.petitioner, safePet);
    mergedPet.address_history = Array.isArray(safePet.address_history) && safePet.address_history.length > 0
      ? safePet.address_history
      : base.petitioner.address_history;

    const mergedBen = coerceObj(base.beneficiary, safeBen);
    mergedBen.address_history = Array.isArray(safeBen.address_history) && safeBen.address_history.length > 0
      ? safeBen.address_history
      : base.beneficiary.address_history;

    return {
      relationship: safeString(parsed?.relationship || base.relationship),
      petitioner: mergedPet as IntakeData['petitioner'],
      beneficiary: mergedBen as IntakeData['beneficiary'],
    };
  }, []);

  /* Load from sessionStorage, or detect saved draft */
  useEffect(() => {
    const raw = sessionStorage.getItem('intakeData');
    if (raw) {
      try {
        const parsed: IntakeData = JSON.parse(raw);
        setData(mergeWithTemplate(parsed));
        // Load confidence map if present
        if (parsed.confidence && typeof parsed.confidence === 'object') {
          setConfidenceMap(parsed.confidence as Record<string, 'high' | 'medium' | 'low'>);
        }
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

  /* Toggle form selection */
  const toggleForm = useCallback((formId: string) => {
    setSelectedForms(prev => {
      const next = new Set(prev);
      if (next.has(formId)) {
        if (next.size > 1) next.delete(formId); // must keep at least one
      } else {
        next.add(formId);
      }
      return next;
    });
  }, []);

  /* Generate PDFs */
  const generate = useCallback(async () => {
    setGenerating(true);
    setGenError('');
    setPdfBlob(null);
    setPdfBlob485(null);
    try {
      const body = JSON.stringify(data);
      const headers = { 'Content-Type': 'application/json' };

      const promises: Promise<void>[] = [];

      if (selectedForms.has('i130')) {
        promises.push(
          fetch('/api/generate', { method: 'POST', headers, body })
            .then(async (res) => {
              if (!res.ok) throw new Error(await res.text() || `I-130: ${res.status}`);
              setPdfBlob(await res.blob());
            })
        );
      }

      if (selectedForms.has('i485')) {
        promises.push(
          fetch('/api/generate-i485', { method: 'POST', headers, body })
            .then(async (res) => {
              if (!res.ok) throw new Error(await res.text() || `I-485: ${res.status}`);
              setPdfBlob485(await res.blob());
            })
        );
      }

      await Promise.all(promises);
      setStep(3);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed.';
      setGenError(message);
    } finally {
      setGenerating(false);
    }
  }, [data, selectedForms]);

  /* Download helper */
  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 3000);
  }, []);

  /* Download all generated PDFs */
  const download = useCallback(() => {
    const surname = data.petitioner.family_name || 'filled';
    const date = new Date().toISOString().slice(0, 10);
    if (pdfBlob) downloadBlob(pdfBlob, `I-130_${surname}_${date}.pdf`);
    if (pdfBlob485) downloadBlob(pdfBlob485, `I-485_${surname}_${date}.pdf`);
    // Auto-clear sensitive data after download
    setTimeout(() => sessionStorage.removeItem('intakeData'), 3000);
  }, [pdfBlob, pdfBlob485, data.petitioner.family_name, downloadBlob]);

  /* Start new */
  const startNew = useCallback(() => {
    sessionStorage.removeItem('intakeData');
    router.push('/');
  }, [router]);

  /* Clear all data handler - must be before any early returns to avoid hooks violation */
  const clearAllData = useCallback(() => {
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

  // Confidence lookup helper
  const conf = (path: string): 'high' | 'medium' | 'low' | undefined => {
    return confidenceMap[path] as 'high' | 'medium' | 'low' | undefined;
  };

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

      {/* Confidence summary */}
      {Object.keys(confidenceMap).length > 0 && (() => {
        const lowFields = Object.entries(confidenceMap).filter(([, v]) => v === 'low');
        const medFields = Object.entries(confidenceMap).filter(([, v]) => v === 'medium');
        if (lowFields.length === 0 && medFields.length === 0) return null;
        return (
          <div className="rounded px-4 py-3 mb-4 text-sm" style={{ backgroundColor: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' }}>
            <div className="font-semibold mb-1">
              {lowFields.length > 0 && <span>{lowFields.length} field{lowFields.length > 1 ? 's' : ''} need verification</span>}
              {lowFields.length > 0 && medFields.length > 0 && <span> &middot; </span>}
              {medFields.length > 0 && <span style={{ color: '#92400e' }}>{medFields.length} field{medFields.length > 1 ? 's' : ''} should be checked</span>}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.75rem' }}>
              Fields marked <span style={{ color: '#dc2626', fontWeight: 600 }}>Verify</span> (red) had unclear handwriting. Fields marked <span style={{ color: '#d97706', fontWeight: 600 }}>Check</span> (orange) had some ambiguity. Scroll down to review them.
            </div>
          </div>
        );
      })()}

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

      {/* Success banner - compact notice at top when PDF is ready */}
      {pdfBlob && (
        <div
          className="card p-4 mb-6 flex items-center justify-between flex-wrap gap-3"
          style={{ borderLeft: '4px solid var(--success)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>
            I-130 Generated Successfully — scroll down to download
          </span>
          <button className="btn btn-primary text-sm px-4 py-2" onClick={download}>
            Download PDF
          </button>
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
          <Field label="Family Name" value={data.petitioner.family_name} onChange={(v) => updatePetitioner('family_name', v)} confidence={conf('petitioner.family_name')} />
          <Field label="Given Name" value={data.petitioner.given_name} onChange={(v) => updatePetitioner('given_name', v)} confidence={conf('petitioner.given_name')} />
          <Field label="Middle Name" value={data.petitioner.middle_name} onChange={(v) => updatePetitioner('middle_name', v)} confidence={conf('petitioner.middle_name')} />
        </Row>
        <Row>
          <Field label="SSN" value={data.petitioner.ssn} onChange={(v) => updatePetitioner('ssn', v)} format="ssn" masked={petitionerSSNMasked} onToggleMask={() => setPetitionerSSNMasked((p) => !p)} error={validateSSN(data.petitioner.ssn)} confidence={conf('petitioner.ssn')} />
          <Field label="Date of Birth" value={data.petitioner.date_of_birth} onChange={(v) => updatePetitioner('date_of_birth', v)} format="date" error={validateDate(data.petitioner.date_of_birth)} confidence={conf('petitioner.date_of_birth')} />
          <SelectField label="Sex" value={data.petitioner.sex} onChange={(v) => updatePetitioner('sex', v)} options={SEX_OPTIONS} confidence={conf('petitioner.sex')} />
        </Row>
        <Row2>
          <Field label="City of Birth" value={data.petitioner.city_of_birth} onChange={(v) => updatePetitioner('city_of_birth', v)} confidence={conf('petitioner.city_of_birth')} />
          <Field label="Country of Birth" value={data.petitioner.country_of_birth} onChange={(v) => updatePetitioner('country_of_birth', v)} confidence={conf('petitioner.country_of_birth')} />
        </Row2>

        <SubHeading text="Mailing Address" />
        <Row>
          <Field label="Street" value={data.petitioner.mailing_address.street} onChange={(v) => updatePetitionerAddress('street', v)} className="sm:col-span-2" confidence={conf('petitioner.mailing_address.street')} />
          <SelectField label="Apt/Ste/Flr" value={data.petitioner.mailing_address.apt_ste_flr} onChange={(v) => updatePetitionerAddress('apt_ste_flr', v)} options={APT_OPTIONS} confidence={conf('petitioner.mailing_address.apt_ste_flr')} />
        </Row>
        <Row>
          <Field label="Unit Number" value={data.petitioner.mailing_address.unit_number} onChange={(v) => updatePetitionerAddress('unit_number', v)} confidence={conf('petitioner.mailing_address.unit_number')} />
          <Field label="City" value={data.petitioner.mailing_address.city} onChange={(v) => updatePetitionerAddress('city', v)} confidence={conf('petitioner.mailing_address.city')} />
          <Field label="State" value={data.petitioner.mailing_address.state} onChange={(v) => updatePetitionerAddress('state', v)} error={validateState(data.petitioner.mailing_address.state)} confidence={conf('petitioner.mailing_address.state')} />
        </Row>
        <Row>
          <Field label="ZIP Code" value={data.petitioner.mailing_address.zip} onChange={(v) => updatePetitionerAddress('zip', v)} confidence={conf('petitioner.mailing_address.zip')} />
          <Field label="Country" value={data.petitioner.mailing_address.country} onChange={(v) => updatePetitionerAddress('country', v)} confidence={conf('petitioner.mailing_address.country')} />
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
          <Field label="Times Married" value={data.petitioner.times_married} onChange={(v) => updatePetitioner('times_married', v)} confidence={conf('petitioner.times_married')} />
          <SelectField label="Marital Status" value={data.petitioner.marital_status} onChange={(v) => updatePetitioner('marital_status', v)} options={MARITAL_OPTIONS} confidence={conf('petitioner.marital_status')} />
          <Field label="Date of Marriage" value={data.petitioner.date_of_marriage} onChange={(v) => updatePetitioner('date_of_marriage', v)} format="date" error={validateDate(data.petitioner.date_of_marriage)} confidence={conf('petitioner.date_of_marriage')} />
        </Row>
        <Row>
          <Field label="Marriage City" value={data.petitioner.marriage_city} onChange={(v) => updatePetitioner('marriage_city', v)} confidence={conf('petitioner.marriage_city')} />
          <Field label="Marriage State" value={data.petitioner.marriage_state} onChange={(v) => updatePetitioner('marriage_state', v)} error={validateState(data.petitioner.marriage_state)} confidence={conf('petitioner.marriage_state')} />
          <Field label="Marriage Country" value={data.petitioner.marriage_country} onChange={(v) => updatePetitioner('marriage_country', v)} confidence={conf('petitioner.marriage_country')} />
        </Row>

        <SubHeading text="Spouse" />
        <Row>
          <Field label="Spouse Family Name" value={data.petitioner.spouse_family_name} onChange={(v) => updatePetitioner('spouse_family_name', v)} confidence={conf('petitioner.spouse_family_name')} />
          <Field label="Given Name" value={data.petitioner.spouse_given_name} onChange={(v) => updatePetitioner('spouse_given_name', v)} confidence={conf('petitioner.spouse_given_name')} />
          <Field label="Middle Name" value={data.petitioner.spouse_middle_name} onChange={(v) => updatePetitioner('spouse_middle_name', v)} confidence={conf('petitioner.spouse_middle_name')} />
        </Row>

        <SubHeading text="Parent 1 (Father)" />
        <Row>
          <Field label="Family Name" value={data.petitioner.parent1_family_name} onChange={(v) => updatePetitioner('parent1_family_name', v)} confidence={conf('petitioner.parent1_family_name')} />
          <Field label="Given Name" value={data.petitioner.parent1_given_name} onChange={(v) => updatePetitioner('parent1_given_name', v)} confidence={conf('petitioner.parent1_given_name')} />
          <SelectField label="Sex" value={data.petitioner.parent1_sex || 'M'} onChange={(v) => updatePetitioner('parent1_sex', v)} options={SEX_OPTIONS} confidence={conf('petitioner.parent1_sex')} />
        </Row>
        <Row2>
          <Field label="Country of Birth" value={data.petitioner.parent1_country_of_birth} onChange={(v) => updatePetitioner('parent1_country_of_birth', v)} confidence={conf('petitioner.parent1_country_of_birth')} />
          <Field label="Country of Residence" value={data.petitioner.parent1_country_of_residence} onChange={(v) => updatePetitioner('parent1_country_of_residence', v)} confidence={conf('petitioner.parent1_country_of_residence')} />
        </Row2>

        <SubHeading text="Parent 2 (Mother)" />
        <Row>
          <Field label="Family Name" value={data.petitioner.parent2_family_name} onChange={(v) => updatePetitioner('parent2_family_name', v)} confidence={conf('petitioner.parent2_family_name')} />
          <Field label="Given Name" value={data.petitioner.parent2_given_name} onChange={(v) => updatePetitioner('parent2_given_name', v)} confidence={conf('petitioner.parent2_given_name')} />
          <SelectField label="Sex" value={data.petitioner.parent2_sex || 'F'} onChange={(v) => updatePetitioner('parent2_sex', v)} options={SEX_OPTIONS} confidence={conf('petitioner.parent2_sex')} />
        </Row>
        <Row2>
          <Field label="Country of Birth" value={data.petitioner.parent2_country_of_birth} onChange={(v) => updatePetitioner('parent2_country_of_birth', v)} confidence={conf('petitioner.parent2_country_of_birth')} />
          <Field label="Country of Residence" value={data.petitioner.parent2_country_of_residence} onChange={(v) => updatePetitioner('parent2_country_of_residence', v)} confidence={conf('petitioner.parent2_country_of_residence')} />
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
          <Field label="Employer Name" value={data.petitioner.employer_name} onChange={(v) => updatePetitioner('employer_name', v)} confidence={conf('petitioner.employer_name')} />
          <Field label="Street" value={data.petitioner.employer_street} onChange={(v) => updatePetitioner('employer_street', v)} confidence={conf('petitioner.employer_street')} />
        </Row2>
        <Row>
          <Field label="City" value={data.petitioner.employer_city} onChange={(v) => updatePetitioner('employer_city', v)} confidence={conf('petitioner.employer_city')} />
          <Field label="State" value={data.petitioner.employer_state} onChange={(v) => updatePetitioner('employer_state', v)} error={validateState(data.petitioner.employer_state)} confidence={conf('petitioner.employer_state')} />
          <Field label="ZIP" value={data.petitioner.employer_zip} onChange={(v) => updatePetitioner('employer_zip', v)} confidence={conf('petitioner.employer_zip')} />
        </Row>
        <Row>
          <Field label="Country" value={data.petitioner.employer_country} onChange={(v) => updatePetitioner('employer_country', v)} confidence={conf('petitioner.employer_country')} />
          <Field label="Occupation" value={data.petitioner.occupation} onChange={(v) => updatePetitioner('occupation', v)} confidence={conf('petitioner.occupation')} />
          <Field label="Date From" value={data.petitioner.employment_date_from} onChange={(v) => updatePetitioner('employment_date_from', v)} format="date" error={validateDate(data.petitioner.employment_date_from)} confidence={conf('petitioner.employment_date_from')} />
        </Row>
      </Section>

      {/* ============================================================
          Section 3: Biographic Information
          ============================================================ */}
      <Section title="3. Biographic Information">
        <Row2>
          <SelectField label="Ethnicity" value={data.petitioner.ethnicity} onChange={(v) => updatePetitioner('ethnicity', v)} options={ETHNICITY_OPTIONS} confidence={conf('petitioner.ethnicity')} />
          <SelectField label="Race" value={data.petitioner.race} onChange={(v) => updatePetitioner('race', v)} options={RACE_OPTIONS} confidence={conf('petitioner.race')} />
        </Row2>
        <Row>
          <SelectField label="Height (Feet)" value={data.petitioner.height_feet} onChange={(v) => updatePetitioner('height_feet', v)} options={HEIGHT_FEET} confidence={conf('petitioner.height_feet')} />
          <SelectField label="Height (Inches)" value={data.petitioner.height_inches} onChange={(v) => updatePetitioner('height_inches', v)} options={HEIGHT_INCHES} confidence={conf('petitioner.height_inches')} />
          <Field label="Weight (lbs)" value={data.petitioner.weight_lbs} onChange={(v) => updatePetitioner('weight_lbs', v)} confidence={conf('petitioner.weight_lbs')} />
        </Row>
        <Row2>
          <SelectField label="Eye Color" value={data.petitioner.eye_color} onChange={(v) => updatePetitioner('eye_color', v)} options={EYE_COLORS} confidence={conf('petitioner.eye_color')} />
          <SelectField label="Hair Color" value={data.petitioner.hair_color} onChange={(v) => updatePetitioner('hair_color', v)} options={HAIR_COLORS} confidence={conf('petitioner.hair_color')} />
        </Row2>
      </Section>

      {/* ============================================================
          Section 4: Beneficiary Information
          ============================================================ */}
      <Section title="4. Beneficiary Information">
        <SubHeading text="Information About Beneficiary" />
        <Row>
          <Field label="Family Name" value={data.beneficiary.family_name} onChange={(v) => updateBeneficiary('family_name', v)} confidence={conf('beneficiary.family_name')} />
          <Field label="Given Name" value={data.beneficiary.given_name} onChange={(v) => updateBeneficiary('given_name', v)} confidence={conf('beneficiary.given_name')} />
          <Field label="Middle Name" value={data.beneficiary.middle_name} onChange={(v) => updateBeneficiary('middle_name', v)} confidence={conf('beneficiary.middle_name')} />
        </Row>
        <Row>
          <Field label="SSN" value={data.beneficiary.ssn} onChange={(v) => updateBeneficiary('ssn', v)} format="ssn" masked={beneficiarySSNMasked} onToggleMask={() => setBeneficiarySSNMasked((p) => !p)} error={validateSSN(data.beneficiary.ssn)} confidence={conf('beneficiary.ssn')} />
          <Field label="Date of Birth" value={data.beneficiary.date_of_birth} onChange={(v) => updateBeneficiary('date_of_birth', v)} format="date" error={validateDate(data.beneficiary.date_of_birth)} confidence={conf('beneficiary.date_of_birth')} />
          <SelectField label="Sex" value={data.beneficiary.sex} onChange={(v) => updateBeneficiary('sex', v)} options={SEX_OPTIONS} confidence={conf('beneficiary.sex')} />
        </Row>
        <Row2>
          <Field label="City of Birth" value={data.beneficiary.city_of_birth} onChange={(v) => updateBeneficiary('city_of_birth', v)} confidence={conf('beneficiary.city_of_birth')} />
          <Field label="Country of Birth" value={data.beneficiary.country_of_birth} onChange={(v) => updateBeneficiary('country_of_birth', v)} confidence={conf('beneficiary.country_of_birth')} />
        </Row2>

        <SubHeading text="Current Address" />
        <Row>
          <Field label="Street" value={data.beneficiary.current_address.street} onChange={(v) => updateBeneficiaryAddress('street', v)} className="sm:col-span-2" confidence={conf('beneficiary.current_address.street')} />
          <SelectField label="Apt/Ste/Flr" value={data.beneficiary.current_address.apt_ste_flr} onChange={(v) => updateBeneficiaryAddress('apt_ste_flr', v)} options={APT_OPTIONS} confidence={conf('beneficiary.current_address.apt_ste_flr')} />
        </Row>
        <Row>
          <Field label="Unit Number" value={data.beneficiary.current_address.unit_number} onChange={(v) => updateBeneficiaryAddress('unit_number', v)} confidence={conf('beneficiary.current_address.unit_number')} />
          <Field label="City" value={data.beneficiary.current_address.city} onChange={(v) => updateBeneficiaryAddress('city', v)} confidence={conf('beneficiary.current_address.city')} />
          <Field label="State" value={data.beneficiary.current_address.state} onChange={(v) => updateBeneficiaryAddress('state', v)} error={validateState(data.beneficiary.current_address.state)} confidence={conf('beneficiary.current_address.state')} />
        </Row>
        <Row>
          <Field label="ZIP Code" value={data.beneficiary.current_address.zip} onChange={(v) => updateBeneficiaryAddress('zip', v)} confidence={conf('beneficiary.current_address.zip')} />
          <Field label="Country" value={data.beneficiary.current_address.country} onChange={(v) => updateBeneficiaryAddress('country', v)} confidence={conf('beneficiary.current_address.country')} />
          <Field label="Phone" value={data.beneficiary.phone} onChange={(v) => updateBeneficiary('phone', v)} format="phone" confidence={conf('beneficiary.phone')} />
        </Row>

        <SubHeading text="Marital Information" />
        <Row>
          <Field label="Times Married" value={data.beneficiary.times_married} onChange={(v) => updateBeneficiary('times_married', v)} confidence={conf('beneficiary.times_married')} />
          <SelectField label="Marital Status" value={data.beneficiary.marital_status} onChange={(v) => updateBeneficiary('marital_status', v)} options={MARITAL_OPTIONS} confidence={conf('beneficiary.marital_status')} />
          <Field label="Date of Marriage" value={data.beneficiary.date_of_marriage} onChange={(v) => updateBeneficiary('date_of_marriage', v)} format="date" error={validateDate(data.beneficiary.date_of_marriage)} confidence={conf('beneficiary.date_of_marriage')} />
        </Row>
        <Row>
          <Field label="Marriage City" value={data.beneficiary.marriage_city} onChange={(v) => updateBeneficiary('marriage_city', v)} confidence={conf('beneficiary.marriage_city')} />
          <Field label="Marriage State" value={data.beneficiary.marriage_state} onChange={(v) => updateBeneficiary('marriage_state', v)} error={validateState(data.beneficiary.marriage_state)} confidence={conf('beneficiary.marriage_state')} />
          <Field label="Marriage Country" value={data.beneficiary.marriage_country} onChange={(v) => updateBeneficiary('marriage_country', v)} confidence={conf('beneficiary.marriage_country')} />
        </Row>

        <SubHeading text="Entry Information" />
        <Row>
          <SelectField label="Ever in U.S." value={data.beneficiary.ever_in_us} onChange={(v) => updateBeneficiary('ever_in_us', v)} options={YES_NO} confidence={conf('beneficiary.ever_in_us')} />
          <Field label="Class of Admission" value={data.beneficiary.class_of_admission} onChange={(v) => updateBeneficiary('class_of_admission', v)} confidence={conf('beneficiary.class_of_admission')} />
          <Field label="Date of Arrival" value={data.beneficiary.date_of_arrival} onChange={(v) => updateBeneficiary('date_of_arrival', v)} format="date" error={validateDate(data.beneficiary.date_of_arrival)} confidence={conf('beneficiary.date_of_arrival')} />
        </Row>

        <SubHeading text="Employment" />
        <Row2>
          <Field label="Employer Name" value={data.beneficiary.employer_name} onChange={(v) => updateBeneficiary('employer_name', v)} confidence={conf('beneficiary.employer_name')} />
          <Field label="Street" value={data.beneficiary.employer_street} onChange={(v) => updateBeneficiary('employer_street', v)} confidence={conf('beneficiary.employer_street')} />
        </Row2>
        <Row>
          <Field label="City" value={data.beneficiary.employer_city} onChange={(v) => updateBeneficiary('employer_city', v)} confidence={conf('beneficiary.employer_city')} />
          <Field label="State" value={data.beneficiary.employer_state} onChange={(v) => updateBeneficiary('employer_state', v)} error={validateState(data.beneficiary.employer_state)} confidence={conf('beneficiary.employer_state')} />
          <Field label="ZIP" value={data.beneficiary.employer_zip} onChange={(v) => updateBeneficiary('employer_zip', v)} confidence={conf('beneficiary.employer_zip')} />
        </Row>
        <Row2>
          <Field label="Country" value={data.beneficiary.employer_country} onChange={(v) => updateBeneficiary('employer_country', v)} confidence={conf('beneficiary.employer_country')} />
          <Field label="Date Employment Began" value={data.beneficiary.employment_date_from} onChange={(v) => updateBeneficiary('employment_date_from', v)} format="date" error={validateDate(data.beneficiary.employment_date_from)} confidence={conf('beneficiary.employment_date_from')} />
        </Row2>

        <SubHeading text="Immigration Proceedings" />
        <Row>
          <SelectField label="In Proceedings" value={data.beneficiary.in_immigration_proceedings} onChange={(v) => updateBeneficiary('in_immigration_proceedings', v)} options={YES_NO} confidence={conf('beneficiary.in_immigration_proceedings')} />
          <SelectField label="Type" value={data.beneficiary.proceedings_type} onChange={(v) => updateBeneficiary('proceedings_type', v)} options={PROCEEDINGS_TYPES} confidence={conf('beneficiary.proceedings_type')} />
          <Field label="City" value={data.beneficiary.proceedings_city} onChange={(v) => updateBeneficiary('proceedings_city', v)} confidence={conf('beneficiary.proceedings_city')} />
        </Row>
        <Row2>
          <Field label="State" value={data.beneficiary.proceedings_state} onChange={(v) => updateBeneficiary('proceedings_state', v)} error={validateState(data.beneficiary.proceedings_state)} confidence={conf('beneficiary.proceedings_state')} />
          <Field label="Date" value={data.beneficiary.proceedings_date} onChange={(v) => updateBeneficiary('proceedings_date', v)} format="date" error={validateDate(data.beneficiary.proceedings_date)} confidence={conf('beneficiary.proceedings_date')} />
        </Row2>
      </Section>

      {/* ============================================================
          Generate / Download
          ============================================================ */}
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
        {(pdfBlob || pdfBlob485) ? (
          <div className="card p-6" style={{ borderLeft: '4px solid var(--success)' }}>
            <h2
              className="text-xl font-semibold mb-2"
              style={{
                fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
                color: 'var(--success)',
              }}
            >
              {[pdfBlob && 'I-130', pdfBlob485 && 'I-485'].filter(Boolean).join(' + ')} Generated Successfully
            </h2>
            <div className="flex items-center justify-center gap-4 mt-4">
              <button className="btn btn-primary text-base px-6 py-3" onClick={download}>
                Download {pdfBlob && pdfBlob485 ? 'All PDFs' : 'PDF'}
              </button>
              <button className="btn btn-secondary" onClick={startNew}>
                Start New
              </button>
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--muted-light)' }}>
              Session data will be cleared after download for security.
            </p>
          </div>
        ) : (
          <>
            {/* Form selection */}
            <div className="flex items-center justify-center gap-6 mb-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--heading)' }}>
                <input
                  type="checkbox"
                  checked={selectedForms.has('i130')}
                  onChange={() => toggleForm('i130')}
                  className="accent-[var(--accent-gold)]"
                  style={{ width: 16, height: 16 }}
                />
                I-130
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm" style={{ color: 'var(--heading)' }}>
                <input
                  type="checkbox"
                  checked={selectedForms.has('i485')}
                  onChange={() => toggleForm('i485')}
                  className="accent-[var(--accent-gold)]"
                  style={{ width: 16, height: 16 }}
                />
                I-485
              </label>
            </div>
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
                {generating ? 'Generating...' : `Generate ${[...selectedForms].map(f => f.toUpperCase().replace('I', 'I-')).join(' + ')} PDF${selectedForms.size > 1 ? 's' : ''}`}
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
          </>
        )}
      </div>

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
