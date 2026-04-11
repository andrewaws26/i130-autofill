'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const PROCESSING_MESSAGES = [
  'Reading handwriting...',
  'Extracting data...',
  'Almost done...',
];

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

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [fileNames, setFileNames] = useState<string[]>([]);
  const [messageIndex, setMessageIndex] = useState(0);
  const [error, setError] = useState('');
  const [consentChecked, setConsentChecked] = useState(false);
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
          const body = await res.text();
          throw new Error(body || `Server returned ${res.status}`);
        }

        const data = await res.json();
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

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!processing) setDragActive(true);
    },
    [processing]
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
    },
    []
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (processing || !consentChecked) return;
      const dropped = Array.from(e.dataTransfer.files || []);
      if (dropped.length > 0) handleFiles(dropped);
    },
    [processing, consentChecked, handleFiles]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!consentChecked) return;
      const selected = Array.from(e.target.files || []);
      if (selected.length === 0) return;

      // If it's a PDF or from the file browser (multiple files), send immediately
      const isPdf = selected.some(f => f.type === 'application/pdf' || f.name.endsWith('.pdf'));
      const isMultiSelect = selected.length > 1;
      if (isPdf || isMultiSelect) {
        handleFiles(selected);
        return;
      }

      // Single image (likely from camera) - accumulate for multi-page capture
      const newPhotos = [...capturedPhotos, ...selected];
      const newUrls = [...photoUrls, ...selected.map(f => URL.createObjectURL(f))];
      setCapturedPhotos(newPhotos);
      setPhotoUrls(newUrls);
      // Reset the input so the same camera can be triggered again
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    },
    [consentChecked, handleFiles, capturedPhotos, photoUrls]
  );

  const submitPhotos = useCallback(() => {
    if (capturedPhotos.length > 0) {
      handleFiles(capturedPhotos);
    }
  }, [capturedPhotos, handleFiles]);

  const removePhoto = useCallback((index: number) => {
    URL.revokeObjectURL(photoUrls[index]);
    setCapturedPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  }, [photoUrls]);

  const clearPhotos = useCallback(() => {
    photoUrls.forEach(url => URL.revokeObjectURL(url));
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

  return (
    <div
      className="w-full px-4 py-10"
      style={{ maxWidth: '700px', margin: '0 auto' }}
    >
      <StepIndicator active={1} />

      {/* Hero */}
      <div className="text-center mb-8">
        <h1
          className="text-3xl font-semibold mb-1"
          style={{
            fontFamily: "var(--font-source-serif), 'Source Serif 4', serif",
            color: 'var(--heading)',
          }}
        >
          Petition for Alien Relative
        </h1>
        <p
          className="text-base mb-2"
          style={{ color: 'var(--muted)' }}
        >
          Form I-130
        </p>
        <p
          className="text-sm"
          style={{ color: 'var(--muted-light)' }}
        >
          Upload a scanned intake form. We'll read the handwriting and fill the
          I-130 automatically.
        </p>
      </div>

      {/* Privacy notice */}
      <p
        className="text-center text-xs mb-3"
        style={{ color: 'var(--muted-light)' }}
      >
        Your data is processed securely. Documents are sent to Anthropic&apos;s API (zero data retention) for handwriting recognition only. No data is stored on any server.
      </p>

      {/* Consent checkbox */}
      <div className="flex items-center justify-center mb-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="accent-[var(--accent-gold)]"
          />
          <span className="text-xs" style={{ color: 'var(--muted-light)' }}>
            Client has consented to AI-assisted form processing
          </span>
        </label>
      </div>

      {/* Upload zone / Processing / Error */}
      {processing ? (
        <div className="paper-content p-10 flex flex-col items-center justify-center" style={{ minHeight: '250px' }}>
          {/* Spinner */}
          <svg
            className="mb-4"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: 'var(--accent-gold)' }}
          >
            <circle
              cx="18"
              cy="18"
              r="15"
              stroke="var(--border)"
              strokeWidth="3"
              fill="none"
            />
            <path
              d="M18 3a15 15 0 0 1 15 15"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 18 18"
                to="360 18 18"
                dur="1s"
                repeatCount="indefinite"
              />
            </path>
          </svg>

          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--heading)' }}
          >
            {fileNames.length === 1 ? fileNames[0] : `${fileNames.length} files`}
          </p>
          <p
            className="text-sm"
            style={{ color: 'var(--muted)' }}
          >
            {PROCESSING_MESSAGES[messageIndex]}
          </p>
          {fileNames.length > 1 && (
            <div className="file-list mt-3">
              {fileNames.map((name, i) => (
                <div key={i} className="file-item">
                  <svg className="file-item-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="1" width="10" height="14" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none" />
                    <line x1="5.5" y1="5" x2="10.5" y2="5" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                    <line x1="5.5" y1="8" x2="10.5" y2="8" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
                  </svg>
                  <span>{name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`upload-zone ${dragActive ? 'upload-zone-active' : ''} ${
            error ? '' : ''
          }`}
          style={{
            minHeight: '250px',
            borderColor: error ? 'var(--error)' : undefined,
            opacity: consentChecked ? 1 : 0.5,
            transition: 'opacity 0.2s',
            cursor: consentChecked ? undefined : 'default',
          }}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => consentChecked && fileInputRef.current?.click()}
        >
          {error ? (
            <div className="flex flex-col items-center text-center">
              {/* Error icon */}
              <svg
                className="mb-3"
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: 'var(--error)' }}
              >
                <circle
                  cx="20"
                  cy="20"
                  r="17"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
                <line
                  x1="20"
                  y1="12"
                  x2="20"
                  y2="22"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="20" cy="27" r="1.5" fill="currentColor" />
              </svg>

              <p
                className="text-sm font-medium mb-2"
                style={{ color: 'var(--error)' }}
              >
                {error}
              </p>
              <div className="flex gap-3">
                {pendingFilesRef.current.length > 0 && (
                  <button
                    className="btn btn-primary text-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      retryExtract();
                    }}
                  >
                    Retry
                  </button>
                )}
                <button
                  className="btn btn-secondary text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    reset();
                  }}
                >
                  Upload different file
                </button>
              </div>
            </div>
          ) : capturedPhotos.length > 0 ? (
            /* Photo capture review - shows thumbnails of captured pages */
            <div className="flex flex-col items-center w-full px-4">
              <p className="text-sm font-medium mb-3" style={{ color: 'var(--heading)' }}>
                {capturedPhotos.length} page{capturedPhotos.length !== 1 ? 's' : ''} captured
              </p>
              <div className="flex gap-2 flex-wrap justify-center mb-4">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative" style={{ width: 72, height: 96 }}>
                    <img
                      src={url}
                      alt={`Page ${i + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: 6,
                        border: '1px solid var(--border)',
                      }}
                    />
                    <button
                      onClick={() => removePhoto(i)}
                      style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: 'var(--error)',
                        color: '#fff',
                        border: 'none',
                        fontSize: 12,
                        lineHeight: '20px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      aria-label={`Remove page ${i + 1}`}
                    >
                      x
                    </button>
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        fontSize: 10,
                        background: 'rgba(0,0,0,0.6)',
                        color: '#fff',
                        borderRadius: 3,
                        padding: '1px 5px',
                      }}
                    >
                      {i + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 items-center flex-wrap justify-center">
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="btn btn-secondary text-sm"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Add Another Page
                </button>
                <button
                  onClick={submitPhotos}
                  style={{
                    background: 'var(--accent-gold)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: '0.9375rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Process {capturedPhotos.length} Page{capturedPhotos.length !== 1 ? 's' : ''}
                </button>
              </div>
              <button
                onClick={clearPhotos}
                className="text-xs underline mt-3"
                style={{ color: 'var(--muted)' }}
              >
                Start over
              </button>
            </div>
          ) : (
            <>
              {/* Upload icon */}
              <svg
                className="upload-zone-icon"
                width="40"
                height="40"
                viewBox="0 0 40 40"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect
                  x="10"
                  y="4"
                  width="20"
                  height="28"
                  rx="2"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path
                  d="M20 14v8M17 17l3-3 3 3"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <line
                  x1="14"
                  y1="26"
                  x2="26"
                  y2="26"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>

              {/* Desktop layout */}
              <div className="hidden sm:block">
                <p className="upload-zone-text">Drop intake form here</p>
                <p className="upload-zone-hint mb-4">PDF, JPG, or PNG &mdash; multiple images OK</p>
                <button
                  className="btn btn-secondary text-sm"
                  disabled={!consentChecked}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (consentChecked) fileInputRef.current?.click();
                  }}
                >
                  Browse files
                </button>
              </div>

              {/* Mobile layout - camera is primary action */}
              <div className="sm:hidden flex flex-col items-center gap-4 w-full">
                <button
                  disabled={!consentChecked}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (consentChecked) cameraInputRef.current?.click();
                  }}
                  style={{
                    background: consentChecked ? 'var(--accent-gold)' : '#ccc',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '20px 32px',
                    fontSize: '1.125rem',
                    fontWeight: 600,
                    width: '100%',
                    maxWidth: '320px',
                    cursor: consentChecked ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  Take Photos of Intake Form
                </button>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Photograph each page &mdash; you can add multiple photos
                </p>
                <button
                  className="text-sm underline"
                  style={{ color: 'var(--muted)' }}
                  disabled={!consentChecked}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (consentChecked) fileInputRef.current?.click();
                  }}
                >
                  Or upload a PDF file
                </button>
              </div>
              {!consentChecked && (
                <p className="text-xs mt-3" style={{ color: 'var(--muted-light)' }}>
                  Please confirm client consent above
                </p>
              )}
            </>
          )}

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
      )}
    </div>
  );
}
