const HISPANIC_COUNTRIES = [
  'guatemala', 'mexico', 'honduras', 'el salvador', 'nicaragua', 'costa rica',
  'panama', 'colombia', 'venezuela', 'ecuador', 'peru', 'bolivia', 'chile',
  'argentina', 'uruguay', 'paraguay', 'cuba', 'dominican republic',
  'puerto rico', 'spain',
];

export function normalizeCountry(country: string): string {
  if (!country) return country;
  const lower = country.trim().toLowerCase();
  if (['usa', 'us', 'u.s.a.', 'u.s.', 'united states of america', 'united states'].includes(lower)) {
    return 'United States';
  }
  return country;
}

export function normalizeState(state: string): string {
  if (!state) return state;
  if (state.length === 2) return state.toUpperCase();
  return state;
}

const MONTH_MAP: Record<string, string> = {
  january: '01', february: '02', march: '03', april: '04',
  may: '05', june: '06', july: '07', august: '08',
  september: '09', october: '10', november: '11', december: '12',
  jan: '01', feb: '02', mar: '03', apr: '04',
  jun: '06', jul: '07', aug: '08', sep: '09', sept: '09',
  oct: '10', nov: '11', dec: '12',
};

export function normalizeDate(date: string): string {
  if (!date) return date;
  const s = date.trim();

  // Already MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // Dash-separated (2025-09-20 or 09-20-2025)
  const dashISO = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dashISO) return `${dashISO[2]}/${dashISO[3]}/${dashISO[1]}`;
  const dashMDY = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (dashMDY) return `${dashMDY[1]}/${dashMDY[2]}/${dashMDY[3]}`;

  // Natural language: "October 9th, 2025" or "October 9, 2025" or "Oct 9 2025"
  const natural = s.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?,?\s*(\d{4})$/);
  if (natural) {
    const month = MONTH_MAP[natural[1].toLowerCase()];
    if (month) return `${month}/${natural[2].padStart(2, '0')}/${natural[3]}`;
  }

  // "9 October 2025" or "9th October 2025"
  const naturalDM = s.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+),?\s*(\d{4})$/);
  if (naturalDM) {
    const month = MONTH_MAP[naturalDM[2].toLowerCase()];
    if (month) return `${month}/${naturalDM[1].padStart(2, '0')}/${naturalDM[3]}`;
  }

  // Month + day only, no year: "October 9th" or "October 9"
  // If there are multiple dates separated by comma, take the first one
  const parts = s.split(/,\s*/);
  const firstPart = parts[0].trim();
  const monthDay = firstPart.match(/^([A-Za-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?$/);
  if (monthDay) {
    const month = MONTH_MAP[monthDay[1].toLowerCase()];
    if (month) return `${month}/${monthDay[2].padStart(2, '0')}/`;
  }

  // Fallback: just replace dashes with slashes
  return s.replace(/-/g, '/');
}

export function inferEthnicity(countryOfBirth: string): string {
  if (!countryOfBirth) return '';
  const lower = countryOfBirth.toLowerCase();
  if (HISPANIC_COUNTRIES.some((c) => lower.includes(c))) {
    return 'Hispanic or Latino';
  }
  return 'Not Hispanic or Latino';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function postProcess(data: any) {
  const p = data.petitioner;
  const b = data.beneficiary;

  // Normalize countries
  if (p) {
    p.country_of_birth = normalizeCountry(p.country_of_birth || '');
    p.employer_country = normalizeCountry(p.employer_country || '');
    p.parent1_country_of_birth = normalizeCountry(p.parent1_country_of_birth || '');
    p.parent1_country_of_residence = normalizeCountry(p.parent1_country_of_residence || '');
    p.parent2_country_of_birth = normalizeCountry(p.parent2_country_of_birth || '');
    p.parent2_country_of_residence = normalizeCountry(p.parent2_country_of_residence || '');

    if (p.mailing_address) {
      p.mailing_address.country = normalizeCountry(p.mailing_address.country || '');
      p.mailing_address.state = normalizeState(p.mailing_address.state || '');
      if (p.mailing_address.state && !p.mailing_address.country) {
        p.mailing_address.country = 'United States';
      }
    }

    if (p.address_history && Array.isArray(p.address_history)) {
      for (const addr of p.address_history) {
        addr.country = normalizeCountry(addr.country || '');
        addr.state = normalizeState(addr.state || '');
        if (addr.state && !addr.country) {
          addr.country = 'United States';
        }
      }
    }

    // Normalize states
    p.marriage_state = normalizeState(p.marriage_state || '');
    p.employer_state = normalizeState(p.employer_state || '');

    // Normalize dates
    p.date_of_birth = normalizeDate(p.date_of_birth || '');
    p.date_of_marriage = normalizeDate(p.date_of_marriage || '');
    p.parent1_dob = normalizeDate(p.parent1_dob || '');
    p.parent2_dob = normalizeDate(p.parent2_dob || '');
    p.employment_date_from = normalizeDate(p.employment_date_from || '');

    // Default marriage country
    if (p.date_of_marriage && !p.marriage_country) {
      p.marriage_country = 'United States';
    }
    p.marriage_country = normalizeCountry(p.marriage_country || '');

    // Infer parent sex
    if (!p.parent1_sex) p.parent1_sex = 'M';
    if (!p.parent2_sex) p.parent2_sex = 'F';

    // Infer ethnicity
    if (!p.ethnicity || p.ethnicity === 'Hispanic or Not Hispanic') {
      p.ethnicity = inferEthnicity(p.country_of_birth);
    }
  }

  if (b) {
    b.country_of_birth = normalizeCountry(b.country_of_birth || '');
    b.employer_country = normalizeCountry(b.employer_country || '');
    b.parent1_country_of_birth = normalizeCountry(b.parent1_country_of_birth || '');
    b.parent1_current_country = normalizeCountry(b.parent1_current_country || '');
    b.parent2_country_of_birth = normalizeCountry(b.parent2_country_of_birth || '');
    b.parent2_current_country = normalizeCountry(b.parent2_current_country || '');

    if (b.current_address) {
      b.current_address.country = normalizeCountry(b.current_address.country || '');
      b.current_address.state = normalizeState(b.current_address.state || '');
      if (b.current_address.state && !b.current_address.country) {
        b.current_address.country = 'United States';
      }
    }

    if (b.address_history && Array.isArray(b.address_history)) {
      for (const addr of b.address_history) {
        addr.country = normalizeCountry(addr.country || '');
        addr.state = normalizeState(addr.state || '');
        if (addr.state && !addr.country) {
          addr.country = 'United States';
        }
      }
    }

    if (b.last_address_outside_us) {
      b.last_address_outside_us.country = normalizeCountry(b.last_address_outside_us.country || '');
    }

    // Normalize states
    b.marriage_state = normalizeState(b.marriage_state || '');
    b.employer_state = normalizeState(b.employer_state || '');

    // Normalize dates
    b.date_of_birth = normalizeDate(b.date_of_birth || '');
    b.date_of_marriage = normalizeDate(b.date_of_marriage || '');
    b.date_of_arrival = normalizeDate(b.date_of_arrival || '');
    b.employment_date_from = normalizeDate(b.employment_date_from || '');
    b.parent1_dob = normalizeDate(b.parent1_dob || '');
    b.parent2_dob = normalizeDate(b.parent2_dob || '');

    // Normalize proceedings date
    b.proceedings_date = normalizeDate(b.proceedings_date || '');
    b.authorized_stay_expiration = normalizeDate(b.authorized_stay_expiration || '');
    b.passport_expiration = normalizeDate(b.passport_expiration || '');

    // Normalize proceedings state
    b.proceedings_state = normalizeState(b.proceedings_state || '');

    // If class_of_admission or date_of_arrival exists, ever_in_us = Yes
    if (b.class_of_admission || b.date_of_arrival) {
      b.ever_in_us = 'Yes';
    }

    // Clean class_of_admission
    if (b.class_of_admission) {
      const coa = b.class_of_admission.trim();
      if (coa.toUpperCase().startsWith('AS')) {
        b.class_of_admission = 'Asylum';
      } else if (coa.toUpperCase().startsWith('RE')) {
        b.class_of_admission = 'Refugee';
      }
    }

    // Default marriage country
    if (b.date_of_marriage && !b.marriage_country) {
      b.marriage_country = 'United States';
    }
    b.marriage_country = normalizeCountry(b.marriage_country || '');

    // If in_immigration_proceedings = Yes, proceedings_type empty, city contains EOIR
    if (b.in_immigration_proceedings === 'Yes' && !b.proceedings_type) {
      if (b.proceedings_city && b.proceedings_city.toUpperCase().includes('EOIR')) {
        b.proceedings_type = 'Removal';
        b.proceedings_city = '';
      }
    }

    // Infer ethnicity if present on beneficiary
    if (b.ethnicity === undefined || b.ethnicity === '' || b.ethnicity === 'Hispanic or Not Hispanic') {
      b.ethnicity = inferEthnicity(b.country_of_birth);
    }
  }

  // Cross-reference spouse names if relationship is Spouse
  if (data.relationship && data.relationship.toLowerCase().includes('spouse') && p && b) {
    if (!p.spouse_family_name && b.family_name) {
      p.spouse_family_name = b.family_name;
    }
    if (!p.spouse_given_name && b.given_name) {
      p.spouse_given_name = b.given_name;
    }
    if (!p.spouse_middle_name && b.middle_name) {
      p.spouse_middle_name = b.middle_name;
    }
  }
}
