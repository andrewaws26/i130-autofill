'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DEMO_INTAKE_DATA } from '@/lib/demo-data';

const PROCESSING_MESSAGES = [
  'Reading handwriting...',
  'Extracting data...',
  'Almost done...',
];

export default function DemoPage() {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!processing) return;
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < PROCESSING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [processing]);

  useEffect(() => {
    if (!processing) return;
    const timeout = setTimeout(() => {
      sessionStorage.setItem('intakeData', JSON.stringify(DEMO_INTAKE_DATA));
      router.push('/review');
    }, 3000);
    return () => clearTimeout(timeout);
  }, [processing, router]);

  if (processing) {
    return (
      <div className="w-full px-4 py-16" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div
          className="flex flex-col items-center justify-center text-center"
          style={{ minHeight: 300 }}
        >
          <svg
            className="mb-6"
            width="48"
            height="48"
            viewBox="0 0 36 36"
            fill="none"
            style={{ color: 'var(--accent-gold)' }}
          >
            <circle cx="18" cy="18" r="15" stroke="var(--border)" strokeWidth="3" fill="none" />
            <path d="M18 3a15 15 0 0 1 15 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="none">
              <animateTransform attributeName="transform" type="rotate" from="0 18 18" to="360 18 18" dur="1s" repeatCount="indefinite" />
            </path>
          </svg>
          <p className="text-lg font-medium mb-1" style={{ color: 'var(--heading)' }}>
            {PROCESSING_MESSAGES[messageIndex]}
          </p>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Demo intake form
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8" style={{ maxWidth: 600, margin: '0 auto' }}>
      {/* Title */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl sm:text-3xl font-semibold mb-1"
          style={{
            fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
            color: 'var(--heading)',
          }}
        >
          I-130 AutoFill — Demo
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          See how the system processes a handwritten intake form
        </p>
      </div>

      {/* Case description card */}
      <div
        style={{
          background: 'var(--card-bg)',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: '24px',
          marginBottom: 24,
        }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: 'var(--heading)' }}>
          Sample Case
        </p>
        <p className="text-sm" style={{ color: 'var(--body)', lineHeight: 1.6 }}>
          Spousal petition. Petitioner <strong>Kho Meh</strong> (US Citizen, Thailand)
          filing for beneficiary <strong>Geovany Estuardo Cardona Hernandez</strong> (Guatemala).
        </p>
      </div>

      {/* Start Demo button */}
      <div className="flex flex-col items-center gap-4">
        <button
          onClick={() => setProcessing(true)}
          style={{
            background: 'var(--accent-gold)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '18px 40px',
            fontSize: '1.125rem',
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            maxWidth: 360,
            boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
          }}
        >
          Start Demo
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--muted-light)' }}>
          This demo uses pre-loaded sample data. No documents are uploaded or processed.
        </p>
      </div>
    </div>
  );
}
