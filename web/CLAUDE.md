@AGENTS.md

# I-130 AutoFill -- Next.js Web App

This is the Next.js web app component of I-130 AutoFill. It provides the upload, AI extraction, lawyer review, and PDF generation workflow.

## Architecture

App Router with Tailwind v4 (uses `@import "tailwindcss"` and `@theme inline` in globals.css).

### Key Files

- `src/app/page.tsx` -- Upload page with mobile camera capture (multi-page photo flow) and desktop drag-and-drop
- `src/app/review/page.tsx` -- Review/edit form covering all I-130 sections (petitioner, beneficiary, biographic, marriage, parents, employment, immigration history). Includes field validation, auto-formatting, SSN masking, and encrypted draft save/restore.
- `src/app/api/extract/route.ts` -- Claude Opus vision extraction endpoint. Sends intake images/PDF to Claude, parses JSON response, applies post-processing (state normalization, country normalization, spouse cross-referencing, ethnicity inference). Returns 422 with a clean message for non-intake documents.
- `src/app/api/generate/route.ts` -- PDF generation endpoint using pdf-lib. Loads the blank I-130 template, maps all extracted data to form fields (text, checkboxes, dropdowns), and returns the filled PDF as a blob.
- `src/lib/types.ts` -- TypeScript interfaces (`IntakeData`, `Petitioner`, `Beneficiary`, `Address`, `AddressHistory`) matching the extraction JSON schema. Also exports `createEmptyIntakeData()`.
- `src/app/globals.css` -- Design system with CSS custom properties. Light theme only, Attum Law Office branding (gold accent `#b8860b`, conservative palette).
- `public/i-130-blank.pdf` -- Blank I-130 template, Edition 04/01/24.

## CRITICAL: Checkbox Index Mappings

The generate route contains checkbox index mappings for XFA form fields. These indices are verified against the actual I-130 PDF and DO NOT match the visual order on the form. **Do not change these without testing against the PDF.**

- **Eye color**: blue=0, brown=1, hazel=2, pink=3, maroon=4, green=5, gray=6, black=7
- **Hair color**: bald=0, black=1, blond=2, brown=3, gray=4, red=5, sandy=6, white=7
- **Beneficiary marital status**: widowed=0, annulled=1, separated=2, single=3, married=4, divorced=5
- **Ethnicity**: `[0]` = Not Hispanic, `[1]` = Hispanic (REVERSED from visual order on the form)
- **Spouse 1 family name field**: `PtLine20a_FamilyName` (NOT `Pt2Line20a` -- the "2" is missing in the actual PDF field name)

## Error Handling

- Extract route returns HTTP 422 with a user-friendly error message when the uploaded document is not an intake form
- The upload page validates that the response contains usable petitioner/beneficiary data before navigating to review
- Raw JSON and technical errors are never shown to the user -- they are replaced with clean messages
- Error messages are truncated to 200 characters max

## State Management

- **sessionStorage**: holds active `intakeData` JSON during the upload-to-review flow. Cleared when the tab closes.
- **Encrypted localStorage**: drafts saved from the review page are encrypted with AES-256-GCM (Web Crypto API, PBKDF2 key derivation). Allows restoring work across sessions.

## Fonts

- **DM Sans** -- body text (loaded via Google Fonts import in globals.css)
- **Source Serif 4** -- headings (loaded via Google Fonts import in globals.css)

## Theme

Always light theme. No dark mode. Attum Law Office branding with conservative gold/navy palette. See CSS custom properties in `globals.css` for the full color system.

## Field Formatting

The review page auto-formats as the user types:
- SSN: `XXX-XX-XXXX` (9 digits, masked as `***-**-XXXX` when not focused)
- Dates: `MM/DD/YYYY`
- Phone: `XXX-XXX-XXXX`
- States: validated as 2-letter uppercase codes
