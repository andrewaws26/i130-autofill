import { describe, it, expect } from 'vitest';
import { DEMO_INTAKE_DATA } from '@/lib/demo-data';
import { createEmptyIntakeData } from '@/lib/types';
import { DEMO_TIMELINE } from '@/lib/demo-engine';
import { DEMO_PLATFORM_DATA } from '@/lib/demo-platform-data';

// ---------------------------------------------------------------------------
// 1. Demo data matches IntakeData type
// ---------------------------------------------------------------------------
describe('DEMO_INTAKE_DATA matches IntakeData type', () => {
  it('has petitioner, beneficiary, and relationship', () => {
    expect(DEMO_INTAKE_DATA).toHaveProperty('petitioner');
    expect(DEMO_INTAKE_DATA).toHaveProperty('beneficiary');
    expect(DEMO_INTAKE_DATA).toHaveProperty('relationship');
  });

  it('every key in the empty petitioner template exists in demo petitioner', () => {
    const template = createEmptyIntakeData().petitioner;
    for (const key of Object.keys(template)) {
      expect(DEMO_INTAKE_DATA.petitioner).toHaveProperty(key);
    }
  });

  it('every key in the empty beneficiary template exists in demo beneficiary', () => {
    const template = createEmptyIntakeData().beneficiary;
    for (const key of Object.keys(template)) {
      expect(DEMO_INTAKE_DATA.beneficiary).toHaveProperty(key);
    }
  });

  it('no undefined values in top-level petitioner object', () => {
    for (const [key, value] of Object.entries(DEMO_INTAKE_DATA.petitioner)) {
      expect(value, `petitioner.${key} should not be undefined`).not.toBeUndefined();
    }
  });

  it('no undefined values in top-level beneficiary object', () => {
    for (const [key, value] of Object.entries(DEMO_INTAKE_DATA.beneficiary)) {
      expect(value, `beneficiary.${key} should not be undefined`).not.toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Demo engine timeline is valid
// ---------------------------------------------------------------------------
describe('DEMO_TIMELINE is valid', () => {
  it('every event has required fields', () => {
    for (const event of DEMO_TIMELINE) {
      expect(event).toHaveProperty('time');
      expect(event).toHaveProperty('phase');
      expect(event).toHaveProperty('title');
      expect(event).toHaveProperty('contextLabel');
      expect(event).toHaveProperty('interactive');
    }
  });

  it('every interactive event has interactivePrompt', () => {
    const interactive = DEMO_TIMELINE.filter((e) => e.interactive === true);
    for (const event of interactive) {
      expect(
        event.interactivePrompt,
        `interactive event "${event.phase}" must have interactivePrompt`,
      ).toBeTruthy();
    }
  });

  it('phase names are unique', () => {
    const phases = DEMO_TIMELINE.map((e) => e.phase);
    expect(new Set(phases).size).toBe(phases.length);
  });

  it('has at least 8 events', () => {
    expect(DEMO_TIMELINE.length).toBeGreaterThanOrEqual(8);
  });
});

// ---------------------------------------------------------------------------
// 3. Platform demo data is valid
// ---------------------------------------------------------------------------
describe('DEMO_PLATFORM_DATA is valid', () => {
  it('has cases, clients, and attorneys arrays', () => {
    expect(Array.isArray(DEMO_PLATFORM_DATA.cases)).toBe(true);
    expect(Array.isArray(DEMO_PLATFORM_DATA.clients)).toBe(true);
    expect(Array.isArray(DEMO_PLATFORM_DATA.attorneys)).toBe(true);
  });

  it('every case has a client_id that exists in clients', () => {
    const clientIds = new Set(DEMO_PLATFORM_DATA.clients.map((c) => c.id));
    for (const c of DEMO_PLATFORM_DATA.cases) {
      expect(
        clientIds.has(c.client_id),
        `case ${c.id} references client_id "${c.client_id}" which does not exist`,
      ).toBe(true);
    }
  });

  it('every case has an attorney_id that exists in attorneys', () => {
    const attorneyIds = new Set(DEMO_PLATFORM_DATA.attorneys.map((a) => a.id));
    for (const c of DEMO_PLATFORM_DATA.cases) {
      expect(
        attorneyIds.has(c.attorney_id),
        `case ${c.id} references attorney_id "${c.attorney_id}" which does not exist`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. createEmptyIntakeData produces a complete object
// ---------------------------------------------------------------------------
describe('createEmptyIntakeData produces complete object', () => {
  const empty = createEmptyIntakeData();

  it('has all top-level keys', () => {
    expect(empty).toHaveProperty('petitioner');
    expect(empty).toHaveProperty('beneficiary');
    expect(empty).toHaveProperty('relationship');
  });

  it('petitioner has no undefined values', () => {
    for (const [key, value] of Object.entries(empty.petitioner)) {
      expect(value, `petitioner.${key} should not be undefined`).not.toBeUndefined();
    }
  });

  it('beneficiary has no undefined values', () => {
    for (const [key, value] of Object.entries(empty.beneficiary)) {
      expect(value, `beneficiary.${key} should not be undefined`).not.toBeUndefined();
    }
  });

  it('nested mailing_address has all keys', () => {
    const addr = empty.petitioner.mailing_address;
    for (const key of ['street', 'apt_ste_flr', 'unit_number', 'city', 'state', 'zip', 'country']) {
      expect(addr).toHaveProperty(key);
      expect((addr as Record<string, unknown>)[key]).not.toBeUndefined();
    }
  });

  it('nested current_address has all keys', () => {
    const addr = empty.beneficiary.current_address;
    for (const key of ['street', 'apt_ste_flr', 'unit_number', 'city', 'state', 'zip', 'country']) {
      expect(addr).toHaveProperty(key);
      expect((addr as Record<string, unknown>)[key]).not.toBeUndefined();
    }
  });

  it('nested last_address_outside_us has all keys', () => {
    const addr = empty.beneficiary.last_address_outside_us;
    for (const key of ['street', 'city', 'province', 'country']) {
      expect(addr).toHaveProperty(key);
      expect((addr as Record<string, unknown>)[key]).not.toBeUndefined();
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Type coercion safety
// ---------------------------------------------------------------------------
describe('Type coercion safety', () => {
  const safeString = (v: unknown): string => {
    if (v == null) return '';
    if (typeof v === 'string') return v;
    return String(v);
  };

  it('null becomes empty string', () => {
    expect(safeString(null)).toBe('');
  });

  it('undefined becomes empty string', () => {
    expect(safeString(undefined)).toBe('');
  });

  it('number becomes string', () => {
    expect(safeString(155)).toBe('155');
  });

  it('string passes through', () => {
    expect(safeString('hello')).toBe('hello');
  });

  it('coercion across a template object replaces null/undefined/number with strings', () => {
    const template: Record<string, unknown> = { a: '', b: '', c: '', d: '' };
    const source: Record<string, unknown> = { a: null, b: undefined, c: 42, d: 'ok' };

    const result: Record<string, string> = {};
    for (const key of Object.keys(template)) {
      result[key] = source[key] != null ? safeString(source[key]) : safeString(template[key]);
    }

    expect(result.a).toBe('');
    expect(result.b).toBe('');
    expect(result.c).toBe('42');
    expect(result.d).toBe('ok');
  });
});
