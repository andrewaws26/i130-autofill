# I-130 AutoFill

Automatically fills USCIS Form I-130 (Petition for Alien Relative) from handwritten intake forms using AI-powered handwriting recognition.

## How It Works

1. **Upload or photograph** a handwritten intake form (PDF scan or phone camera photos)
2. **AI reads the handwriting** -- Claude Opus vision extracts 100+ fields from the intake form, handling difficult handwriting, Hispanic multi-surname names, and abbreviations
3. **Review and download** -- lawyer reviews all extracted data in an editable form interface, then downloads a filled I-130 PDF ready for filing

## Features

- Claude Opus vision reads handwritten intake forms with high accuracy
- 100+ I-130 fields auto-filled including checkboxes, dropdowns, and text fields
- Mobile camera capture with multi-page photo flow for photographing intake forms
- Lawyer review/edit interface with field validation before PDF generation
- Auto-formatting for SSN (XXX-XX-XXXX), dates (MM/DD/YYYY), and phone numbers (XXX-XXX-XXXX)
- AES-256 encrypted draft storage in the browser (Web Crypto API / PBKDF2)
- SSN masking in the review UI for over-the-shoulder privacy
- Clean error handling for non-intake documents (returns user-friendly messages)
- Audit logging with no PII recorded
- Matches Attum Law Office branding (conservative, professional theme)

## Tech Stack

| Component | Technology |
|-----------|------------|
| Web App | Next.js 16 (App Router) |
| Styling | Tailwind CSS v4 |
| PDF Generation | pdf-lib |
| AI Extraction | Anthropic SDK (Claude Opus, vision) |
| CLI Tool | Python 3, pypdf |
| Encryption | Web Crypto API (AES-256-GCM) |

## Setup

```bash
cd web
npm install
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
npm run dev
```

The app will be available at `http://localhost:3000`.

### Requirements

- Node.js 18+
- An Anthropic API key with access to Claude Opus

## Deploy to Vercel

```bash
cd web
npx vercel --prod
```

Set `ANTHROPIC_API_KEY` as an environment variable in the Vercel project settings before deploying.

## CLI Tool

A standalone Python script is also available for command-line use:

```bash
pip install anthropic pypdf
export ANTHROPIC_API_KEY=sk-ant-...

python3 fill_i130.py intake.pdf
python3 fill_i130.py intake.pdf --i130 blank_i130.pdf --output filled.pdf
python3 fill_i130.py intake.pdf --redact-ssn        # Don't send SSNs to API
python3 fill_i130.py intake.pdf --json-only          # Extract data only, no PDF
```

The CLI extracts data via Claude Opus vision, maps it to I-130 form fields, and fills the PDF entirely locally using pypdf. It outputs both the filled PDF and a JSON file with the extracted data for attorney review.

## Privacy and Compliance

This tool processes sensitive immigration PII. The following measures are in place:

- **Zero server storage**: documents are processed in-memory via the Anthropic API and never stored on any server
- **Anthropic zero data retention**: API requests are not used for training and are not retained beyond the request lifecycle
- **Encrypted browser storage**: draft data in localStorage is encrypted with AES-256-GCM
- **Session isolation**: active data is stored in sessionStorage and cleared when the tab closes
- **SSN masking**: Social Security Numbers are masked in the review interface
- **No PII logging**: audit logs record actions but never names, SSNs, or addresses

References: KBA E-457, ABA Formal Opinion 512, KRS 365.732 (Kentucky data protection).

## License

This is a proprietary internal tool built for Attum Law Office. Not licensed for distribution or reuse.
