import { describe, it, expect } from 'vitest';
import type { ConfidenceMap, ConfidenceLevel } from '@/lib/types';

describe('Confidence scoring', () => {
  it('ConfidenceMap type accepts valid entries', () => {
    const map: ConfidenceMap = {
      'petitioner.family_name': 'high',
      'petitioner.ssn': 'medium',
      'beneficiary.date_of_arrival': 'low',
    };
    expect(map['petitioner.family_name']).toBe('high');
    expect(map['petitioner.ssn']).toBe('medium');
    expect(map['beneficiary.date_of_arrival']).toBe('low');
  });

  it('ConfidenceLevel only accepts valid values', () => {
    const levels: ConfidenceLevel[] = ['high', 'medium', 'low'];
    expect(levels).toHaveLength(3);
    expect(levels).toContain('high');
    expect(levels).toContain('medium');
    expect(levels).toContain('low');
  });

  it('empty confidence map is valid', () => {
    const map: ConfidenceMap = {};
    expect(Object.keys(map)).toHaveLength(0);
  });

  it('confidence map survives JSON roundtrip', () => {
    const map: ConfidenceMap = {
      'petitioner.family_name': 'high',
      'petitioner.ssn': 'low',
      'beneficiary.phone': 'medium',
    };
    const json = JSON.stringify(map);
    const parsed = JSON.parse(json) as ConfidenceMap;
    expect(parsed['petitioner.family_name']).toBe('high');
    expect(parsed['petitioner.ssn']).toBe('low');
    expect(parsed['beneficiary.phone']).toBe('medium');
  });

  it('confidence lookup helper pattern works', () => {
    const confidenceMap: Record<string, 'high' | 'medium' | 'low'> = {
      'petitioner.family_name': 'high',
      'petitioner.parent2_family_name': 'low',
      'beneficiary.phone': 'medium',
    };
    const conf = (path: string): 'high' | 'medium' | 'low' | undefined => {
      return confidenceMap[path] as 'high' | 'medium' | 'low' | undefined;
    };

    expect(conf('petitioner.family_name')).toBe('high');
    expect(conf('petitioner.parent2_family_name')).toBe('low');
    expect(conf('beneficiary.phone')).toBe('medium');
    expect(conf('nonexistent.field')).toBeUndefined();
  });

  it('counts low and medium confidence fields correctly', () => {
    const confidenceMap: ConfidenceMap = {
      'petitioner.family_name': 'high',
      'petitioner.ssn': 'high',
      'petitioner.parent2_family_name': 'low',
      'beneficiary.phone': 'medium',
      'beneficiary.date_of_arrival': 'low',
      'beneficiary.city_of_birth': 'medium',
    };
    const lowFields = Object.entries(confidenceMap).filter(([, v]) => v === 'low');
    const medFields = Object.entries(confidenceMap).filter(([, v]) => v === 'medium');
    expect(lowFields).toHaveLength(2);
    expect(medFields).toHaveLength(2);
    expect(lowFields.map(([k]) => k)).toContain('petitioner.parent2_family_name');
    expect(lowFields.map(([k]) => k)).toContain('beneficiary.date_of_arrival');
  });
});
