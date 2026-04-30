# I-130 AutoFill - Claude Code Instructions

## Project Overview

Automated USCIS I-130 (Petition for Alien Relative) form filling from intake forms. Uses Claude Opus vision to read handwriting, extract structured data, and fill 100+ PDF form fields including text, checkboxes, and dropdowns. Supports I-130, I-485, and combined intake forms.

Built for Attum Law Office (attumlaw.com). Handles sensitive immigration PII -- treat accordingly.

## Components

1. **Python CLI** (`fill_i130.py`) -- standalone script using pypdf + Anthropic SDK. Reads intake PDF, extracts via Claude Opus, fills I-130 locally.
2. **Next.js Web App** (`web/`) -- full web interface with upload, AI extraction, lawyer review/edit, and PDF generation. See `web/CLAUDE.md` for web-specific details.

## Tech Stack

- **Web**: Next.js 16, Tailwind v4 (`@import "tailwindcss"` + `@theme inline`), pdf-lib, mammoth, Anthropic SDK
- **CLI**: Python 3, pypdf, anthropic SDK
- **AI**: Claude Opus for vision/handwriting recognition (zero data retention)
- **PDF**: XFA form fields filled via pdf-lib (web) or pypdf (CLI)
- **Document parsing**: mammoth for .docx text extraction

## Critical: XFA Checkbox Index Mappings

The I-130 PDF uses XFA form fields where checkbox indices DO NOT match visual order on the form. These mappings were verified by inspecting actual PDF field tooltips with pypdf. **NEVER change these mappings without re-verifying against the actual PDF.**

- **Eye color**: blue=0, brown=1, hazel=2, pink=3, maroon=4, green=5, gray=6, black=7
- **Hair color**: bald=0, black=1, blond=2, brown=3, gray=4, red=5, sandy=6, white=7
- **Beneficiary marital status**: widowed=0, annulled=1, separated=2, single=3, married=4, divorced=5
- **Ethnicity**: `[0]` = Not Hispanic, `[1]` = Hispanic (REVERSED from visual order on the form)

## Extraction Prompt

The extraction prompt in `web/src/app/api/extract/route.ts` (and mirrored in `fill_i130.py`) has been heavily tested and refined against real intake forms. It handles:
- Hispanic/Latino multi-surname name parsing
- Handwriting misreads with context clues
- State abbreviation normalization
- Cross-referencing petitioner/beneficiary spouse data
- Ethnicity inference from country of birth
- Multiple form types (I-130, I-485, combined) with automatic role mapping (e.g., I-485 applicant → beneficiary)

Changes to the extraction prompt should be tested against the sample intake PDF before deploying.

## Supported Upload Formats

- **PDF** -- scanned handwritten or typed intake forms (sent to Claude as document)
- **Images** -- JPEG, PNG, GIF, WEBP (sent to Claude as image, e.g. phone camera photos)
- **Word documents** -- .docx/.doc (text extracted via mammoth, sent to Claude as text)

The extract route validates file types upfront and rejects unsupported formats with a clear error message.

## Common Gotchas

- **Spouse family name field**: `PtLine20a_FamilyName` (NOT `Pt2Line20a` -- the "2" is missing in the actual PDF field name)
- **State dropdowns**: require 2-letter uppercase codes (e.g., "KY" not "Ky")
- **Checkboxes**: use `/Y` for checked state (pypdf uses `NameObject("/Y")`, pdf-lib uses checkbox.check())
- **Weight field**: split into 3 individual digit fields (`Pt3Line4_Pound1`, `Pound2`, `Pound3`)
- **SSN fields**: stored without dashes in the PDF (strip before setting)
- **Employment date "to"**: defaults to "PRESENT" for current employment

## Blank I-130 Template

Located at `web/public/i-130-blank.pdf` -- Edition 04/01/24. This is the template used by both the web app and can be used with the CLI.

## Privacy Requirements

- No PII in logs (audit logging only, no names/SSNs/addresses)
- Encrypted localStorage drafts (AES-256-GCM via Web Crypto API)
- sessionStorage cleared on tab close
- Anthropic API with zero data retention
- SSN masking in the review UI (shows `***-**-XXXX`)

## Branding

Matches Attum Law Office branding -- conservative, professional, light theme only. Gold accent (`#b8860b`), serif headings (Source Serif 4), sans-serif body (DM Sans). No dark mode.

## Deploy

```bash
cd web
npx vercel --prod
```

`ANTHROPIC_API_KEY` must be set as a Vercel environment variable.

## Test

Upload the sample intake PDF at `/Users/andrewsieg/Downloads/i-130 intake geovany .pdf` to verify extraction and PDF generation end-to-end.

## CLI Usage

```bash
cd /Users/andrewsieg/Documents/i130-filler
python3 fill_i130.py intake.pdf [--i130 blank_i130.pdf] [--output filled.pdf] [--redact-ssn] [--json-only]
```

Requires `ANTHROPIC_API_KEY` env var, plus `pip install anthropic pypdf`.
