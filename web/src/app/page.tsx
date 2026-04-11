'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PROCESSING_MESSAGES = [
  'Reading handwriting...',
  'Extracting data...',
  'Almost done...',
];

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [processing, setProcessing] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState('');
  const pendingFilesRef = useRef<File[]>([]);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  useEffect(() => {
    if (!processing) return;
    setMessageIndex(0);
    const interval = setInterval(() => {
      setMessageIndex((prev) =>
        prev < PROCESSING_MESSAGES.length - 1 ? prev + 1 : prev
      );
    }, 8000);
    return () => clearInterval(interval);
  }, [processing]);

  const sendFiles = useCallback(
    async (files: File[]) => {
      setError('');
      setFileNames(files.map((f) => f.name));
      setProcessing(true);

      try {
        const formData = new FormData();
        for (const file of files) {
          formData.append('file', file);
        }

        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          let errorMsg = `Server error (${res.status})`;
          try {
            const body = await res.json();
            errorMsg = body.error || body.message || errorMsg;
          } catch {
            const text = await res.text();
            if (text) errorMsg = text;
          }
          throw new Error(errorMsg);
        }

        const data = await res.json();

        // Validate that we got usable data back
        if (!data || !data.petitioner || !data.beneficiary) {
          throw new Error(
            'Could not extract immigration form data from this document. Please upload an I-130 intake form.'
          );
        }

        // Check if the extraction found any actual data
        const p = data.petitioner;
        const hasData = p.family_name || p.given_name || p.date_of_birth || p.ssn;
        if (!hasData) {
          throw new Error(
            'The uploaded document does not appear to be an immigration intake form. No petitioner information was found.'
          );
        }

        sessionStorage.setItem('intakeData', JSON.stringify(data));
        router.push('/review');
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
        setProcessing(false);
      }
    },
    [router]
  );

  const handleFiles = useCallback(
    (files: File[]) => {
      pendingFilesRef.current = files;
      sendFiles(files);
    },
    [sendFiles]
  );

  const retryExtract = useCallback(() => {
    if (pendingFilesRef.current.length > 0) {
      sendFiles(pendingFilesRef.current);
    }
  }, [sendFiles]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (processing) return;
      const dropped = Array.from(e.dataTransfer.files || []);
      if (dropped.length > 0) handleFiles(dropped);
    },
    [processing, handleFiles]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files || []);
      if (selected.length === 0) return;

      // PDF or multi-file from browser: send immediately
      const isPdf = selected.some(
        (f) => f.type === 'application/pdf' || f.name.endsWith('.pdf')
      );
      if (isPdf || selected.length > 1) {
        handleFiles(selected);
        return;
      }

      // Single image (likely camera) - accumulate for multi-page capture
      const newPhotos = [...capturedPhotos, ...selected];
      const newUrls = [
        ...photoUrls,
        ...selected.map((f) => URL.createObjectURL(f)),
      ];
      setCapturedPhotos(newPhotos);
      setPhotoUrls(newUrls);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    },
    [handleFiles, capturedPhotos, photoUrls]
  );

  const submitPhotos = useCallback(() => {
    if (capturedPhotos.length > 0) handleFiles(capturedPhotos);
  }, [capturedPhotos, handleFiles]);

  const removePhoto = useCallback(
    (index: number) => {
      URL.revokeObjectURL(photoUrls[index]);
      setCapturedPhotos((prev) => prev.filter((_, i) => i !== index));
      setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
    },
    [photoUrls]
  );

  const clearPhotos = useCallback(() => {
    photoUrls.forEach((url) => URL.revokeObjectURL(url));
    setCapturedPhotos([]);
    setPhotoUrls([]);
  }, [photoUrls]);

  const reset = useCallback(() => {
    setError('');
    setProcessing(false);
    setFileNames([]);
    setMessageIndex(0);
    pendingFilesRef.current = [];
    clearPhotos();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  }, [clearPhotos]);

  // ── PROCESSING STATE ──
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
            {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`}
          </p>
        </div>
      </div>
    );
  }

  // ── ERROR STATE ──
  if (error) {
    return (
      <div className="w-full px-4 py-16" style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: 300 }}>
          <svg
            className="mb-4"
            width="48"
            height="48"
            viewBox="0 0 40 40"
            fill="none"
            style={{ color: 'var(--error)' }}
          >
            <circle cx="20" cy="20" r="17" stroke="currentColor" strokeWidth="2" fill="none" />
            <line x1="20" y1="12" x2="20" y2="22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="20" cy="27" r="1.5" fill="currentColor" />
          </svg>
          <p className="text-lg font-medium mb-2" style={{ color: 'var(--heading)' }}>
            Something went wrong
          </p>
          <p className="text-sm mb-6" style={{ color: 'var(--muted)', maxWidth: 400 }}>
            {error}
          </p>
          <div className="flex gap-3 flex-wrap justify-center">
            {pendingFilesRef.current.length > 0 && (
              <button
                onClick={retryExtract}
                style={{
                  background: 'var(--accent-gold)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '12px 28px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Try Again
              </button>
            )}
            <button
              onClick={reset}
              className="btn btn-secondary"
            >
              Upload Different File
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PHOTO REVIEW STATE (multi-page capture) ──
  if (capturedPhotos.length > 0) {
    return (
      <div className="w-full px-4 py-10" style={{ maxWidth: 600, margin: '0 auto' }}>
        <p
          className="text-lg font-medium text-center mb-4"
          style={{ color: 'var(--heading)' }}
        >
          {capturedPhotos.length} page{capturedPhotos.length !== 1 ? 's' : ''} captured
        </p>
        <div className="flex gap-2 flex-wrap justify-center mb-6">
          {photoUrls.map((url, i) => (
            <div key={i} className="relative" style={{ width: 80, height: 106 }}>
              <img
                src={url}
                alt={`Page ${i + 1}`}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                }}
              />
              <button
                onClick={() => removePhoto(i)}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--error)',
                  color: '#fff',
                  border: 'none',
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                x
              </button>
              <span
                style={{
                  position: 'absolute',
                  bottom: 4,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: 11,
                  background: 'rgba(0,0,0,0.6)',
                  color: '#fff',
                  borderRadius: 4,
                  padding: '1px 6px',
                }}
              >
                {i + 1}
              </span>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 items-center">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', padding: '12px 24px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            Add Another Page
          </button>
          <button
            onClick={submitPhotos}
            style={{
              background: 'var(--accent-gold)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '16px 32px',
              fontSize: '1.125rem',
              fontWeight: 600,
              cursor: 'pointer',
              width: '100%',
              maxWidth: 320,
            }}
          >
            Process {capturedPhotos.length} Page{capturedPhotos.length !== 1 ? 's' : ''}
          </button>
          <button
            onClick={clearPhotos}
            className="text-xs underline mt-1"
            style={{ color: 'var(--muted)' }}
          >
            Start over
          </button>
        </div>

        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={onFileChange}
        />
      </div>
    );
  }

  // ── DEFAULT: UPLOAD / CAPTURE ──
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
          I-130 AutoFill
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Upload or photograph a handwritten intake form
        </p>
      </div>

      {/* ── MOBILE: Big action buttons ── */}
      <div className="sm:hidden flex flex-col gap-4 items-center mb-6">
        <button
          onClick={() => cameraInputRef.current?.click()}
          style={{
            background: 'var(--accent-gold)',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            padding: '22px 24px',
            fontSize: '1.125rem',
            fontWeight: 600,
            width: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            boxShadow: '0 2px 8px rgba(184, 134, 11, 0.25)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
            <circle cx="12" cy="13" r="4" />
          </svg>
          Take Photos of Intake Form
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            background: '#fff',
            color: 'var(--heading)',
            border: '2px solid var(--border)',
            borderRadius: 12,
            padding: '18px 24px',
            fontSize: '1rem',
            fontWeight: 500,
            width: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          Upload PDF File
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--muted-light)' }}>
          Photograph each page of the intake form, or upload a scanned PDF
        </p>
      </div>

      {/* ── DESKTOP: Drag and drop zone ── */}
      <div
        className="hidden sm:flex flex-col items-center justify-center"
        style={{
          minHeight: 280,
          border: '2px dashed var(--border)',
          borderRadius: 12,
          background: 'var(--card-bg)',
          padding: '40px 24px',
          cursor: 'pointer',
          transition: 'border-color 0.2s',
        }}
        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <svg
          className="mb-4"
          width="48"
          height="48"
          viewBox="0 0 40 40"
          fill="none"
          style={{ color: 'var(--muted)' }}
        >
          <rect x="10" y="4" width="20" height="28" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M20 14v8M17 17l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <line x1="14" y1="26" x2="26" y2="26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <p className="text-base font-medium mb-1" style={{ color: 'var(--heading)' }}>
          Drop intake form here
        </p>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          PDF, JPG, or PNG
        </p>
        <button
          className="btn btn-secondary text-sm"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          Browse files
        </button>
      </div>

      {/* Privacy note */}
      <p className="text-center text-xs mt-6" style={{ color: 'var(--muted-light)' }}>
        Documents are processed securely via Anthropic API (zero data retention). No data is stored on any server.
      </p>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        multiple
        className="hidden"
        onChange={onFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  );
}
