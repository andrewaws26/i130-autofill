import { describe, it, expect } from 'vitest';
import {
  normalizeCountry,
  normalizeState,
  normalizeDate,
  inferEthnicity,
  postProcess,
} from '@/lib/postprocess';

describe('normalizeState', () => {
  it('uppercases 2-letter state abbreviations', () => {
    expect(normalizeState('ky')).toBe('KY');
    expect(normalizeState('Ky')).toBe('KY');
    expect(normalizeState('fl')).toBe('FL');
    expect(normalizeState('ca')).toBe('CA');
  });

  it('leaves longer state names unchanged', () => {
    expect(normalizeState('Kentucky')).toBe('Kentucky');
    expect(normalizeState('Florida')).toBe('Florida');
  });

  it('returns empty/falsy values as-is', () => {
    expect(normalizeState('')).toBe('');
  });
});

describe('normalizeCountry', () => {
  it('normalizes common US variants to "United States"', () => {
    expect(normalizeCountry('USA')).toBe('United States');
    expect(normalizeCountry('US')).toBe('United States');
    expect(normalizeCountry('U.S.A.')).toBe('United States');
    expect(normalizeCountry('U.S.')).toBe('United States');
    expect(normalizeCountry('united states of america')).toBe('United States');
    expect(normalizeCountry('United States')).toBe('United States');
  });

  it('leaves non-US countries unchanged', () => {
    expect(normalizeCountry('Guatemala')).toBe('Guatemala');
    expect(normalizeCountry('Myanmar')).toBe('Myanmar');
    expect(normalizeCountry('Thailand')).toBe('Thailand');
  });

  it('returns empty/falsy values as-is', () => {
    expect(normalizeCountry('')).toBe('');
  });
});

describe('normalizeDate', () => {
  it('converts dashes to slashes', () => {
    expect(normalizeDate('06-03-1998')).toBe('06/03/1998');
    expect(normalizeDate('11-02-2002')).toBe('11/02/2002');
  });

  it('leaves slash-formatted dates unchanged', () => {
    expect(normalizeDate('06/03/1998')).toBe('06/03/1998');
  });

  it('returns empty/falsy values as-is', () => {
    expect(normalizeDate('')).toBe('');
  });
});

describe('inferEthnicity', () => {
  it('returns "Hispanic or Latino" for Central/South American countries', () => {
    expect(inferEthnicity('Guatemala')).toBe('Hispanic or Latino');
    expect(inferEthnicity('Mexico')).toBe('Hispanic or Latino');
    expect(inferEthnicity('El Salvador')).toBe('Hispanic or Latino');
    expect(inferEthnicity('Colombia')).toBe('Hispanic or Latino');
    expect(inferEthnicity('Cuba')).toBe('Hispanic or Latino');
    expect(inferEthnicity('Spain')).toBe('Hispanic or Latino');
  });

  it('returns "Not Hispanic or Latino" for non-Hispanic countries', () => {
    expect(inferEthnicity('Thailand')).toBe('Not Hispanic or Latino');
    expect(inferEthnicity('Myanmar')).toBe('Not Hispanic or Latino');
    expect(inferEthnicity('China')).toBe('Not Hispanic or Latino');
    expect(inferEthnicity('Nigeria')).toBe('Not Hispanic or Latino');
    expect(inferEthnicity('Germany')).toBe('Not Hispanic or Latino');
  });

  it('returns empty string for empty input', () => {
    expect(inferEthnicity('')).toBe('');
  });
});

describe('postProcess', () => {
  function makeMinimalData(overrides: Record<string, unknown> = {}) {
    return {
      petitioner: {
        country_of_birth: '',
        employer_country: '',
        parent1_country_of_birth: '',
        parent1_country_of_residence: '',
        parent2_country_of_birth: '',
        parent2_country_of_residence: '',
        mailing_address: { country: '', state: '' },
        address_history: [] as Record<string, string>[],
        marriage_state: '',
        employer_state: '',
        date_of_birth: '',
        date_of_marriage: '',
        parent1_dob: '',
        parent2_dob: '',
        employment_date_from: '',
        marriage_country: '',
        parent1_sex: '',
        parent2_sex: '',
        ethnicity: '',
        spouse_family_name: '',
        spouse_given_name: '',
        spouse_middle_name: '',
        ...overrides,
      },
      beneficiary: {
        country_of_birth: '',
        employer_country: '',
        parent1_country_of_birth: '',
        parent1_current_country: '',
        parent2_country_of_birth: '',
        parent2_current_country: '',
        current_address: { country: '', state: '' },
        address_history: [] as Record<string, string>[],
        last_address_outside_us: { country: '' },
        marriage_state: '',
        employer_state: '',
        date_of_birth: '',
        date_of_marriage: '',
        date_of_arrival: '',
        employment_date_from: '',
        parent1_dob: '',
        parent2_dob: '',
        class_of_admission: '',
        ever_in_us: '',
        marriage_country: '',
        in_immigration_proceedings: '',
        proceedings_type: '',
        proceedings_city: '',
        ethnicity: '',
        family_name: '',
        given_name: '',
        middle_name: '',
      },
      relationship: '',
    };
  }

  describe('state normalization in postProcess', () => {
    it('normalizes petitioner mailing_address.state', () => {
      const data = makeMinimalData();
      data.petitioner.mailing_address = { state: 'ky', country: 'United States' };
      postProcess(data);
      expect(data.petitioner.mailing_address.state).toBe('KY');
    });

    it('normalizes petitioner marriage_state', () => {
      const data = makeMinimalData();
      data.petitioner.marriage_state = 'fl';
      postProcess(data);
      expect(data.petitioner.marriage_state).toBe('FL');
    });

    it('normalizes beneficiary current_address.state', () => {
      const data = makeMinimalData();
      data.beneficiary.current_address = { state: 'ca', country: 'United States' };
      postProcess(data);
      expect(data.beneficiary.current_address.state).toBe('CA');
    });

    it('normalizes states in petitioner address_history', () => {
      const data = makeMinimalData();
      data.petitioner.address_history = [{ state: 'ky', country: '' }];
      postProcess(data);
      expect(data.petitioner.address_history[0].state).toBe('KY');
    });

    it('normalizes states in beneficiary address_history', () => {
      const data = makeMinimalData();
      data.beneficiary.address_history = [{ state: 'tx', country: '' }];
      postProcess(data);
      expect(data.beneficiary.address_history[0].state).toBe('TX');
    });
  });

  describe('country normalization in postProcess', () => {
    it('normalizes petitioner country_of_birth', () => {
      const data = makeMinimalData();
      data.petitioner.country_of_birth = 'USA';
      postProcess(data);
      expect(data.petitioner.country_of_birth).toBe('United States');
    });

    it('normalizes beneficiary employer_country', () => {
      const data = makeMinimalData();
      data.beneficiary.employer_country = 'U.S.A.';
      postProcess(data);
      expect(data.beneficiary.employer_country).toBe('United States');
    });

    it('normalizes last_address_outside_us.country', () => {
      const data = makeMinimalData();
      data.beneficiary.last_address_outside_us = { country: 'US' };
      postProcess(data);
      expect(data.beneficiary.last_address_outside_us.country).toBe('United States');
    });
  });

  describe('date normalization in postProcess', () => {
    it('normalizes petitioner date_of_birth dashes to slashes', () => {
      const data = makeMinimalData();
      data.petitioner.date_of_birth = '06-03-1998';
      postProcess(data);
      expect(data.petitioner.date_of_birth).toBe('06/03/1998');
    });

    it('normalizes beneficiary date_of_arrival', () => {
      const data = makeMinimalData();
      data.beneficiary.date_of_arrival = '05-18-2019';
      postProcess(data);
      expect(data.beneficiary.date_of_arrival).toBe('05/18/2019');
    });

    it('normalizes beneficiary parent1_dob', () => {
      const data = makeMinimalData();
      data.beneficiary.parent1_dob = '10-17-1982';
      postProcess(data);
      expect(data.beneficiary.parent1_dob).toBe('10/17/1982');
    });
  });

  describe('ethnicity inference', () => {
    it('infers Hispanic for Guatemala', () => {
      const data = makeMinimalData();
      data.beneficiary.country_of_birth = 'Guatemala';
      data.beneficiary.ethnicity = '';
      postProcess(data);
      expect(data.beneficiary.ethnicity).toBe('Hispanic or Latino');
    });

    it('infers Not Hispanic for Thailand', () => {
      const data = makeMinimalData();
      data.petitioner.country_of_birth = 'Thailand';
      data.petitioner.ethnicity = '';
      postProcess(data);
      expect(data.petitioner.ethnicity).toBe('Not Hispanic or Latino');
    });

    it('infers Not Hispanic for Myanmar', () => {
      const data = makeMinimalData();
      data.petitioner.country_of_birth = 'Myanmar';
      data.petitioner.ethnicity = '';
      postProcess(data);
      expect(data.petitioner.ethnicity).toBe('Not Hispanic or Latino');
    });

    it('overrides placeholder "Hispanic or Not Hispanic"', () => {
      const data = makeMinimalData();
      data.petitioner.country_of_birth = 'Guatemala';
      data.petitioner.ethnicity = 'Hispanic or Not Hispanic';
      postProcess(data);
      expect(data.petitioner.ethnicity).toBe('Hispanic or Latino');
    });

    it('does not override explicitly set ethnicity', () => {
      const data = makeMinimalData();
      data.petitioner.country_of_birth = 'Guatemala';
      data.petitioner.ethnicity = 'Not Hispanic or Latino';
      postProcess(data);
      // Already set, should not be overridden
      expect(data.petitioner.ethnicity).toBe('Not Hispanic or Latino');
    });
  });

  describe('class of admission normalization', () => {
    it('normalizes "AS10" to "Asylum"', () => {
      const data = makeMinimalData();
      data.beneficiary.class_of_admission = 'AS10';
      postProcess(data);
      expect(data.beneficiary.class_of_admission).toBe('Asylum');
    });

    it('normalizes "asylum" (lowercase) to "Asylum"', () => {
      const data = makeMinimalData();
      data.beneficiary.class_of_admission = 'asylum';
      postProcess(data);
      expect(data.beneficiary.class_of_admission).toBe('Asylum');
    });

    it('normalizes "RE" to "Refugee"', () => {
      const data = makeMinimalData();
      data.beneficiary.class_of_admission = 'RE';
      postProcess(data);
      expect(data.beneficiary.class_of_admission).toBe('Refugee');
    });

    it('normalizes "Refugee" (starts with RE) to "Refugee"', () => {
      const data = makeMinimalData();
      data.beneficiary.class_of_admission = 'Refugee';
      postProcess(data);
      expect(data.beneficiary.class_of_admission).toBe('Refugee');
    });
  });

  describe('spouse name cross-referencing', () => {
    it('sets petitioner spouse names from beneficiary when relationship is Spouse', () => {
      const data = makeMinimalData();
      data.relationship = 'Spouse';
      data.petitioner.spouse_family_name = '';
      data.petitioner.spouse_given_name = '';
      data.petitioner.spouse_middle_name = '';
      data.beneficiary.family_name = 'Cardona Hernandez';
      data.beneficiary.given_name = 'Geovany';
      data.beneficiary.middle_name = 'Estuardo';
      postProcess(data);
      expect(data.petitioner.spouse_family_name).toBe('Cardona Hernandez');
      expect(data.petitioner.spouse_given_name).toBe('Geovany');
      expect(data.petitioner.spouse_middle_name).toBe('Estuardo');
    });

    it('does not overwrite existing spouse names', () => {
      const data = makeMinimalData();
      data.relationship = 'Spouse';
      data.petitioner.spouse_family_name = 'Existing';
      data.petitioner.spouse_given_name = 'Name';
      data.petitioner.spouse_middle_name = 'Here';
      data.beneficiary.family_name = 'Other';
      data.beneficiary.given_name = 'Person';
      data.beneficiary.middle_name = 'Middle';
      postProcess(data);
      expect(data.petitioner.spouse_family_name).toBe('Existing');
      expect(data.petitioner.spouse_given_name).toBe('Name');
      expect(data.petitioner.spouse_middle_name).toBe('Here');
    });

    it('does not cross-reference when relationship is not Spouse', () => {
      const data = makeMinimalData();
      data.relationship = 'Parent';
      data.petitioner.spouse_family_name = '';
      data.beneficiary.family_name = 'SomeFamily';
      postProcess(data);
      expect(data.petitioner.spouse_family_name).toBe('');
    });
  });

  describe('parent sex defaults', () => {
    it('defaults parent1_sex to "M" when empty', () => {
      const data = makeMinimalData();
      data.petitioner.parent1_sex = '';
      postProcess(data);
      expect(data.petitioner.parent1_sex).toBe('M');
    });

    it('defaults parent2_sex to "F" when empty', () => {
      const data = makeMinimalData();
      data.petitioner.parent2_sex = '';
      postProcess(data);
      expect(data.petitioner.parent2_sex).toBe('F');
    });

    it('does not override explicitly set parent sex', () => {
      const data = makeMinimalData();
      data.petitioner.parent1_sex = 'F';
      data.petitioner.parent2_sex = 'M';
      postProcess(data);
      expect(data.petitioner.parent1_sex).toBe('F');
      expect(data.petitioner.parent2_sex).toBe('M');
    });
  });

  describe('ever-in-US logic', () => {
    it('sets ever_in_us to "Yes" when class_of_admission is set', () => {
      const data = makeMinimalData();
      data.beneficiary.class_of_admission = 'AS10';
      data.beneficiary.ever_in_us = '';
      postProcess(data);
      expect(data.beneficiary.ever_in_us).toBe('Yes');
    });

    it('sets ever_in_us to "Yes" when date_of_arrival is set', () => {
      const data = makeMinimalData();
      data.beneficiary.date_of_arrival = '05/18/2019';
      data.beneficiary.ever_in_us = '';
      postProcess(data);
      expect(data.beneficiary.ever_in_us).toBe('Yes');
    });

    it('does not set ever_in_us when neither class nor arrival is set', () => {
      const data = makeMinimalData();
      data.beneficiary.class_of_admission = '';
      data.beneficiary.date_of_arrival = '';
      data.beneficiary.ever_in_us = '';
      postProcess(data);
      expect(data.beneficiary.ever_in_us).toBe('');
    });
  });

  describe('EOIR proceedings detection', () => {
    it('sets proceedings_type to "Removal" and clears city when city contains EOIR', () => {
      const data = makeMinimalData();
      data.beneficiary.in_immigration_proceedings = 'Yes';
      data.beneficiary.proceedings_type = '';
      data.beneficiary.proceedings_city = 'EOIR Louisville';
      postProcess(data);
      expect(data.beneficiary.proceedings_type).toBe('Removal');
      expect(data.beneficiary.proceedings_city).toBe('');
    });

    it('does not trigger when proceedings_type is already set', () => {
      const data = makeMinimalData();
      data.beneficiary.in_immigration_proceedings = 'Yes';
      data.beneficiary.proceedings_type = 'Exclusion';
      data.beneficiary.proceedings_city = 'EOIR Louisville';
      postProcess(data);
      expect(data.beneficiary.proceedings_type).toBe('Exclusion');
      expect(data.beneficiary.proceedings_city).toBe('EOIR Louisville');
    });

    it('does not trigger when not in proceedings', () => {
      const data = makeMinimalData();
      data.beneficiary.in_immigration_proceedings = 'No';
      data.beneficiary.proceedings_type = '';
      data.beneficiary.proceedings_city = 'EOIR Louisville';
      postProcess(data);
      expect(data.beneficiary.proceedings_type).toBe('');
      expect(data.beneficiary.proceedings_city).toBe('EOIR Louisville');
    });
  });

  describe('empty address country defaults', () => {
    it('sets mailing_address country to "United States" when state is set but country is empty', () => {
      const data = makeMinimalData();
      data.petitioner.mailing_address = { state: 'KY', country: '' };
      postProcess(data);
      expect(data.petitioner.mailing_address.country).toBe('United States');
    });

    it('sets current_address country to "United States" when state is set but country is empty', () => {
      const data = makeMinimalData();
      data.beneficiary.current_address = { state: 'KY', country: '' };
      postProcess(data);
      expect(data.beneficiary.current_address.country).toBe('United States');
    });

    it('sets address_history country to "United States" when state is set but country is empty', () => {
      const data = makeMinimalData();
      data.petitioner.address_history = [{ state: 'KY', country: '' }];
      postProcess(data);
      expect(data.petitioner.address_history[0].country).toBe('United States');
    });

    it('does not overwrite existing country', () => {
      const data = makeMinimalData();
      data.petitioner.mailing_address = { state: 'BC', country: 'Canada' };
      postProcess(data);
      expect(data.petitioner.mailing_address.country).toBe('Canada');
    });
  });

  describe('marriage country defaults', () => {
    it('sets petitioner marriage_country to "United States" when date_of_marriage is set but country is empty', () => {
      const data = makeMinimalData();
      data.petitioner.date_of_marriage = '09/20/2025';
      data.petitioner.marriage_country = '';
      postProcess(data);
      expect(data.petitioner.marriage_country).toBe('United States');
    });

    it('sets beneficiary marriage_country to "United States" when date_of_marriage is set but country is empty', () => {
      const data = makeMinimalData();
      data.beneficiary.date_of_marriage = '09/20/2025';
      data.beneficiary.marriage_country = '';
      postProcess(data);
      expect(data.beneficiary.marriage_country).toBe('United States');
    });

    it('does not default marriage_country when no date_of_marriage', () => {
      const data = makeMinimalData();
      data.petitioner.date_of_marriage = '';
      data.petitioner.marriage_country = '';
      postProcess(data);
      expect(data.petitioner.marriage_country).toBe('');
    });
  });

  describe('handles null/missing sections gracefully', () => {
    it('does not crash when petitioner is null', () => {
      const data = { petitioner: null, beneficiary: null, relationship: '' };
      expect(() => postProcess(data)).not.toThrow();
    });

    it('does not crash when beneficiary is null', () => {
      const data = makeMinimalData();
      (data as Record<string, unknown>).beneficiary = null;
      expect(() => postProcess(data)).not.toThrow();
    });

    it('does not crash when address_history is missing', () => {
      const data = makeMinimalData();
      delete (data.petitioner as Record<string, unknown>).address_history;
      expect(() => postProcess(data)).not.toThrow();
    });
  });
});
