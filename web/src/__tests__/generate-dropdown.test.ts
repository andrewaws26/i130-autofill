/**
 * Tests for dropdown value validation logic.
 *
 * The real I-130 PDF uses XFA form fields that pdf-lib can't fully parse
 * in node tests. So we test the validation logic separately to ensure
 * invalid dropdown values are caught before they corrupt the PDF.
 *
 * This test exists because a production bug caused "Expected instance of e,
 * but got instance of undefined" — pdf-lib's internal state was corrupted
 * by a dropdown.select() call with an invalid value, and the error only
 * surfaced during pdfDoc.save().
 */
import { describe, it, expect } from 'vitest';

// Replicate the dropdown matching logic from generate/route.ts
function findDropdownMatch(value: string, options: string[]): string | null {
  if (!value || !value.trim()) return null;

  // Exact match
  if (options.includes(value)) return value;

  // Case-insensitive match
  const ciMatch = options.find(o => o.toLowerCase() === value.toLowerCase());
  if (ciMatch) return ciMatch;

  // Partial match (prefix)
  const partial = options.find(o => o.toUpperCase().startsWith(value.toUpperCase()));
  if (partial) return partial;

  return null;
}

// Common I-130 dropdown options
const STATE_OPTIONS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'DC', 'GU', 'PR', 'VI', 'AS', 'MP',
];

const HEIGHT_FEET_OPTIONS = ['1', '2', '3', '4', '5', '6', '7', '8'];
const HEIGHT_INCHES_OPTIONS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];

describe('Dropdown value validation', () => {
  describe('State dropdown', () => {
    it('matches exact 2-letter state codes', () => {
      expect(findDropdownMatch('KY', STATE_OPTIONS)).toBe('KY');
      expect(findDropdownMatch('CA', STATE_OPTIONS)).toBe('CA');
      expect(findDropdownMatch('NY', STATE_OPTIONS)).toBe('NY');
    });

    it('matches case-insensitive state codes', () => {
      expect(findDropdownMatch('ky', STATE_OPTIONS)).toBe('KY');
      expect(findDropdownMatch('Ky', STATE_OPTIONS)).toBe('KY');
    });

    it('rejects invalid state codes', () => {
      expect(findDropdownMatch('ZZ', STATE_OPTIONS)).toBeNull();
      expect(findDropdownMatch('INVALID', STATE_OPTIONS)).toBeNull();
      expect(findDropdownMatch('Kentucky', STATE_OPTIONS)).toBeNull();
    });

    it('handles empty/whitespace values', () => {
      expect(findDropdownMatch('', STATE_OPTIONS)).toBeNull();
      expect(findDropdownMatch('  ', STATE_OPTIONS)).toBeNull();
    });
  });

  describe('Height dropdown', () => {
    it('matches valid height values', () => {
      expect(findDropdownMatch('5', HEIGHT_FEET_OPTIONS)).toBe('5');
      expect(findDropdownMatch('3', HEIGHT_INCHES_OPTIONS)).toBe('3');
    });

    it('rejects out-of-range heights', () => {
      expect(findDropdownMatch('99', HEIGHT_FEET_OPTIONS)).toBeNull();
      expect(findDropdownMatch('15', HEIGHT_INCHES_OPTIONS)).toBeNull();
    });
  });

  describe('Class of Admission', () => {
    // These are common values for the I-130 class of admission dropdown
    const COA_OPTIONS = ['AS', 'RE', 'F1', 'F2A', 'F2B', 'F3', 'F4', 'K1', 'K2', 'K3', 'IR', 'CR'];

    it('matches exact codes', () => {
      expect(findDropdownMatch('AS', COA_OPTIONS)).toBe('AS');
      expect(findDropdownMatch('RE', COA_OPTIONS)).toBe('RE');
    });

    it('matches case-insensitive', () => {
      expect(findDropdownMatch('as', COA_OPTIONS)).toBe('AS');
      expect(findDropdownMatch('re', COA_OPTIONS)).toBe('RE');
    });

    it('rejects full words that no option starts with', () => {
      // "Asylum" does NOT match because partial checks if options start
      // with the value, not vice versa. The generate route normalizes
      // "Asylum" to "AS" before calling selectDropdown.
      expect(findDropdownMatch('Asylum', COA_OPTIONS)).toBeNull();
    });

    it('matches when the normalized code is passed', () => {
      // The generate route converts "Asylum" -> "AS" before calling selectDropdown
      expect(findDropdownMatch('AS', COA_OPTIONS)).toBe('AS');
    });

    it('rejects completely invalid values', () => {
      expect(findDropdownMatch('MADE_UP', COA_OPTIONS)).toBeNull();
      expect(findDropdownMatch('Tourist', COA_OPTIONS)).toBeNull();
    });
  });

  describe('Edge cases', () => {
    it('handles null-like values safely', () => {
      expect(findDropdownMatch('', ['A', 'B'])).toBeNull();
      expect(findDropdownMatch('   ', ['A', 'B'])).toBeNull();
    });

    it('handles single-option dropdowns', () => {
      expect(findDropdownMatch('Yes', ['Yes'])).toBe('Yes');
      expect(findDropdownMatch('No', ['Yes'])).toBeNull();
    });

    it('handles empty option list', () => {
      expect(findDropdownMatch('anything', [])).toBeNull();
    });

    it('prefers exact match over partial', () => {
      const options = ['AS', 'ASY', 'ASYLUM'];
      expect(findDropdownMatch('AS', options)).toBe('AS');
      expect(findDropdownMatch('ASY', options)).toBe('ASY');
    });
  });
});
