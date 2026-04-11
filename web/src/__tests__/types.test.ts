import { describe, it, expect } from 'vitest';
import { createEmptyIntakeData } from '@/lib/types';

describe('createEmptyIntakeData', () => {
  const data = createEmptyIntakeData();

  it('returns object with all required top-level keys', () => {
    expect(data).toHaveProperty('petitioner');
    expect(data).toHaveProperty('beneficiary');
    expect(data).toHaveProperty('relationship');
  });

  it('relationship defaults to empty string', () => {
    expect(data.relationship).toBe('');
  });

  describe('petitioner', () => {
    const p = data.petitioner;

    it('has all expected string fields', () => {
      const expectedStringFields = [
        'family_name', 'given_name', 'middle_name', 'ssn', 'other_names',
        'city_of_birth', 'country_of_birth', 'date_of_birth', 'sex',
        'ethnicity', 'race', 'height_feet', 'height_inches', 'weight_lbs',
        'eye_color', 'hair_color', 'times_married', 'marital_status',
        'date_of_marriage', 'marriage_city', 'marriage_state', 'marriage_country',
        'spouse_family_name', 'spouse_given_name', 'spouse_middle_name',
        'parent1_family_name', 'parent1_given_name', 'parent1_middle_name',
        'parent1_sex', 'parent1_dob', 'parent1_country_of_birth',
        'parent1_city_of_residence', 'parent1_country_of_residence',
        'parent2_family_name', 'parent2_given_name', 'parent2_middle_name',
        'parent2_sex', 'parent2_dob', 'parent2_country_of_birth',
        'parent2_city_of_residence', 'parent2_country_of_residence',
        'immigration_status', 'citizenship_acquired_through',
        'employer_name', 'employer_street', 'employer_city', 'employer_state',
        'employer_zip', 'employer_country', 'occupation',
        'employment_date_from', 'employment_date_to',
        'previously_filed_petition', 'phone', 'email',
      ];

      for (const field of expectedStringFields) {
        expect(p).toHaveProperty(field);
        expect((p as unknown as Record<string, unknown>)[field]).toBe('');
      }
    });

    it('has mailing_address with all address fields as empty strings', () => {
      expect(p.mailing_address).toBeDefined();
      expect(p.mailing_address.street).toBe('');
      expect(p.mailing_address.apt_ste_flr).toBe('');
      expect(p.mailing_address.unit_number).toBe('');
      expect(p.mailing_address.city).toBe('');
      expect(p.mailing_address.state).toBe('');
      expect(p.mailing_address.zip).toBe('');
      expect(p.mailing_address.country).toBe('');
    });

    it('physical_same_as_mailing defaults to false', () => {
      expect(p.physical_same_as_mailing).toBe(false);
    });

    it('address_history is an empty array', () => {
      expect(Array.isArray(p.address_history)).toBe(true);
      expect(p.address_history).toHaveLength(0);
    });
  });

  describe('beneficiary', () => {
    const b = data.beneficiary;

    it('has all expected string fields', () => {
      const expectedStringFields = [
        'family_name', 'given_name', 'middle_name', 'ssn', 'other_names',
        'city_of_birth', 'country_of_birth', 'date_of_birth', 'sex',
        'phone', 'mobile_phone', 'email',
        'times_married', 'marital_status', 'date_of_marriage',
        'marriage_city', 'marriage_state', 'marriage_country',
        'previous_spouses', 'children', 'petition_filed_before',
        'ever_in_us', 'class_of_admission', 'date_of_arrival',
        'authorized_stay_expiration', 'in_immigration_proceedings',
        'proceedings_type', 'proceedings_city', 'proceedings_state', 'proceedings_date',
        'parent1_family_name', 'parent1_given_name', 'parent1_middle_name',
        'parent1_dob', 'parent1_city_of_birth', 'parent1_country_of_birth',
        'parent1_current_city', 'parent1_current_country',
        'parent2_family_name', 'parent2_given_name', 'parent2_middle_name',
        'parent2_dob', 'parent2_city_of_birth', 'parent2_country_of_birth',
        'parent2_current_city', 'parent2_current_country',
        'employer_name', 'employer_street', 'employer_city', 'employer_state',
        'employer_zip', 'employer_country', 'occupation', 'employment_date_from',
        'i94_number', 'passport_number', 'travel_doc_number',
        'passport_country', 'passport_expiration',
      ];

      for (const field of expectedStringFields) {
        expect(b).toHaveProperty(field);
        expect((b as unknown as Record<string, unknown>)[field]).toBe('');
      }
    });

    it('has current_address with all address fields as empty strings', () => {
      expect(b.current_address).toBeDefined();
      expect(b.current_address.street).toBe('');
      expect(b.current_address.apt_ste_flr).toBe('');
      expect(b.current_address.unit_number).toBe('');
      expect(b.current_address.city).toBe('');
      expect(b.current_address.state).toBe('');
      expect(b.current_address.zip).toBe('');
      expect(b.current_address.country).toBe('');
    });

    it('address_history is an empty array', () => {
      expect(Array.isArray(b.address_history)).toBe(true);
      expect(b.address_history).toHaveLength(0);
    });

    it('last_address_outside_us is properly initialized', () => {
      expect(b.last_address_outside_us).toBeDefined();
      expect(b.last_address_outside_us.street).toBe('');
      expect(b.last_address_outside_us.city).toBe('');
      expect(b.last_address_outside_us.province).toBe('');
      expect(b.last_address_outside_us.country).toBe('');
    });
  });

  it('no field is undefined anywhere in the structure', () => {
    function checkNoUndefined(obj: unknown, path: string) {
      if (obj === null) return;
      if (Array.isArray(obj)) {
        obj.forEach((item, i) => checkNoUndefined(item, `${path}[${i}]`));
        return;
      }
      if (typeof obj === 'object' && obj !== null) {
        for (const [key, val] of Object.entries(obj)) {
          expect(val).not.toBeUndefined();
          checkNoUndefined(val, `${path}.${key}`);
        }
        return;
      }
      // Leaf values: should be string, boolean, or number -- never undefined
      expect(obj).not.toBeUndefined();
    }

    checkNoUndefined(data, 'root');
  });
});
