import Anthropic from '@anthropic-ai/sdk';

export const maxDuration = 120;

const EXTRACTION_PROMPT = `You are an expert immigration paralegal reading a scanned handwritten intake form for a USCIS I-130 (Petition for Alien Relative).

Extract ALL information from EVERY page (including the last pages) into the JSON structure below.

CRITICAL READING INSTRUCTIONS:
- Read EVERY page carefully - SSNs and important details may appear on ANY page including the last
- Handwriting from non-native English speakers may be difficult - use context clues
- US state abbreviations MUST be uppercase 2-letter codes (e.g., "KY" not "Ky", "FL" not "Fl")
- For Hispanic/Latino names: the LAST TWO words are typically family names (paternal + maternal surname). First word = given name, second word = middle name
  Example: "Geovany Estuardo Cardona Hernandez" → given: "Geovany", middle: "Estuardo", family: "Cardona Hernandez"
- If the form has a section for "INFORMATION ABOUT BENEFICIARY (NON-US CITIZEN)" - that's the beneficiary section, read it completely
- If there's a section listing SSN cards or identification numbers near the end, capture those SSNs
- The beneficiary's spouse = the petitioner (they are married to each other). Cross-reference names.
- If class of admission / arrival date is provided, the person HAS been in the US → ever_in_us = "Yes"
- Determine ethnicity from context: Central/South American countries = "Hispanic or Latino", Asian/African/European countries = "Not Hispanic or Latino"
- For the petitioner's parent sex: if the label says "FATHER" → sex is "M", if "MOTHER" → sex is "F"
- Common handwriting misreads to watch for: "Tracco" not "Tyco", "Leitchfield" not "Jethorhed", look for street name patterns

Return ONLY valid JSON, no markdown, no explanation.

{
  "petitioner": {
    "family_name": "",
    "given_name": "",
    "middle_name": "",
    "ssn": "",
    "other_names": "",
    "city_of_birth": "",
    "country_of_birth": "",
    "date_of_birth": "",
    "sex": "M or F",
    "ethnicity": "Hispanic or Not Hispanic",
    "race": "",
    "height_feet": "",
    "height_inches": "",
    "weight_lbs": "",
    "eye_color": "",
    "hair_color": "",
    "mailing_address": {
      "street": "",
      "apt_ste_flr": "Apt, Ste, or Flr",
      "unit_number": "",
      "city": "",
      "state": "",
      "zip": "",
      "country": "United States"
    },
    "physical_same_as_mailing": true,
    "address_history": [
      {
        "street": "",
        "city": "",
        "state": "",
        "zip": "",
        "country": "",
        "date_from": "",
        "date_to": ""
      }
    ],
    "times_married": "",
    "marital_status": "Single, Married, Divorced, Widowed, Separated, or Annulled",
    "date_of_marriage": "",
    "marriage_city": "",
    "marriage_state": "",
    "marriage_country": "",
    "spouse_family_name": "",
    "spouse_given_name": "",
    "spouse_middle_name": "",
    "parent1_family_name": "",
    "parent1_given_name": "",
    "parent1_middle_name": "",
    "parent1_sex": "M or F",
    "parent1_dob": "",
    "parent1_country_of_birth": "",
    "parent1_city_of_residence": "",
    "parent1_country_of_residence": "",
    "parent2_family_name": "",
    "parent2_given_name": "",
    "parent2_middle_name": "",
    "parent2_sex": "M or F",
    "parent2_dob": "",
    "parent2_country_of_birth": "",
    "parent2_city_of_residence": "",
    "parent2_country_of_residence": "",
    "immigration_status": "US Citizen or LPR",
    "citizenship_acquired_through": "Birth in US, Naturalization, or Parents",
    "employer_name": "",
    "employer_street": "",
    "employer_city": "",
    "employer_state": "",
    "employer_zip": "",
    "employer_country": "United States",
    "occupation": "",
    "employment_date_from": "",
    "employment_date_to": "PRESENT",
    "previously_filed_petition": "Yes or No",
    "phone": "",
    "email": ""
  },
  "beneficiary": {
    "family_name": "",
    "given_name": "",
    "middle_name": "",
    "ssn": "",
    "other_names": "",
    "city_of_birth": "",
    "country_of_birth": "",
    "date_of_birth": "",
    "sex": "M or F",
    "current_address": {
      "street": "",
      "apt_ste_flr": "Apt, Ste, or Flr",
      "unit_number": "",
      "city": "",
      "state": "",
      "zip": "",
      "country": "United States"
    },
    "phone": "",
    "mobile_phone": "",
    "email": "",
    "times_married": "",
    "marital_status": "Single, Married, Divorced, Widowed, Separated, or Annulled",
    "date_of_marriage": "",
    "marriage_city": "",
    "marriage_state": "",
    "marriage_country": "",
    "previous_spouses": "N/A or list",
    "children": "None or list",
    "petition_filed_before": "Yes or No",
    "ever_in_us": "Yes or No",
    "class_of_admission": "",
    "date_of_arrival": "",
    "authorized_stay_expiration": "",
    "in_immigration_proceedings": "Yes or No",
    "proceedings_type": "Removal, Exclusion, Rescission, or Other",
    "proceedings_city": "",
    "proceedings_state": "",
    "proceedings_date": "",
    "address_history": [
      {
        "street": "",
        "city": "",
        "state": "",
        "zip": "",
        "country": "",
        "date_from": "",
        "date_to": ""
      }
    ],
    "last_address_outside_us": {
      "street": "",
      "city": "",
      "province": "",
      "country": ""
    },
    "parent1_family_name": "",
    "parent1_given_name": "",
    "parent1_middle_name": "",
    "parent1_dob": "",
    "parent1_city_of_birth": "",
    "parent1_country_of_birth": "",
    "parent1_current_city": "",
    "parent1_current_country": "",
    "parent2_family_name": "",
    "parent2_given_name": "",
    "parent2_middle_name": "",
    "parent2_dob": "",
    "parent2_city_of_birth": "",
    "parent2_country_of_birth": "",
    "parent2_current_city": "",
    "parent2_current_country": "",
    "employer_name": "",
    "employer_street": "",
    "employer_city": "",
    "employer_state": "",
    "employer_zip": "",
    "employer_country": "",
    "occupation": "",
    "employment_date_from": "",
    "i94_number": "",
    "passport_number": "",
    "travel_doc_number": "",
    "passport_country": "",
    "passport_expiration": ""
  },
  "relationship": "Spouse, Parent, Brother/Sister, or Child"
}

IMPORTANT:
- For Hispanic/Latino names with two surnames (e.g., "Cardona Hernandez"), put BOTH in family_name
- If a field is blank or not provided, use empty string ""
- For sex, use just "M" or "F"
- For yes/no fields, use "Yes" or "No"
- Read carefully - handwriting may be difficult
- If city_of_birth and country_of_birth appear to be the same (e.g., both say "Thailand"), that's OK - record as written`;

const HISPANIC_COUNTRIES = [
  'guatemala', 'mexico', 'honduras', 'el salvador', 'nicaragua', 'costa rica',
  'panama', 'colombia', 'venezuela', 'ecuador', 'peru', 'bolivia', 'chile',
  'argentina', 'uruguay', 'paraguay', 'cuba', 'dominican republic',
  'puerto rico', 'spain',
];

function normalizeCountry(country: string): string {
  if (!country) return country;
  const lower = country.trim().toLowerCase();
  if (['usa', 'us', 'u.s.a.', 'u.s.', 'united states of america', 'united states'].includes(lower)) {
    return 'United States';
  }
  return country;
}

function normalizeState(state: string): string {
  if (!state) return state;
  if (state.length === 2) return state.toUpperCase();
  return state;
}

function normalizeDate(date: string): string {
  if (!date) return date;
  return date.replace(/-/g, '/');
}

function inferEthnicity(countryOfBirth: string): string {
  if (!countryOfBirth) return '';
  const lower = countryOfBirth.toLowerCase();
  if (HISPANIC_COUNTRIES.some((c) => lower.includes(c))) {
    return 'Hispanic or Latino';
  }
  return 'Not Hispanic or Latino';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function postProcess(data: any) {
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

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('file') as File[];

    if (!files || files.length === 0) {
      return Response.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const client = new Anthropic();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const content: any[] = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');

      const isPdf = file.type === 'application/pdf' || file.name.endsWith('.pdf');

      if (isPdf) {
        content.push({
          type: 'document',
          source: {
            type: 'base64',
            media_type: 'application/pdf',
            data: base64,
          },
        });
      } else {
        // Image file
        const mediaType = file.type || 'image/jpeg';
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: mediaType,
            data: base64,
          },
        });
      }
    }

    content.push({ type: 'text', text: EXTRACTION_PROMPT });

    let message;
    try {
      message = await client.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content }],
      });
    } catch (apiError) {
      console.error('Claude API error:', apiError);
      return Response.json(
        { error: 'Failed to process document with Claude API', details: String(apiError) },
        { status: 502 }
      );
    }

    // Parse response
    let responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    if (responseText.startsWith('```')) {
      responseText = responseText.split('\n').slice(1).join('\n');
      responseText = responseText.replace(/```\s*$/, '');
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      // Claude returned text instead of JSON - likely not an intake form
      const lower = responseText.toLowerCase();
      const isWrongDoc = lower.includes('not a') || lower.includes('not an intake') ||
        lower.includes('cannot extract') || lower.includes('not a uscis') ||
        lower.includes('mailing') || lower.includes('not the requested');

      const userMessage = isWrongDoc
        ? 'This document is not an immigration intake form. Please upload the correct I-130 intake form (handwritten client questionnaire).'
        : 'Could not read this document. Please make sure the image is clear and shows a handwritten I-130 intake form.';

      console.error('Extraction failed - not valid JSON. Claude said:', responseText.slice(0, 300));
      return Response.json({ error: userMessage }, { status: 422 });
    }

    // Post-process
    postProcess(data);

    // Validation pass - log issues but don't block response
    const validationIssues: string[] = [];
    const datePattern = /^\d{2}\/\d{2}\/\d{4}$/;
    const ssnPattern = /^\d{3}-?\d{2}-?\d{4}$/;
    const statePattern = /^[A-Z]{2}$/;

    const checkDate = (label: string, val: string) => {
      if (val && !datePattern.test(val)) validationIssues.push(`${label}: "${val}" is not MM/DD/YYYY`);
    };
    const checkSSN = (label: string, val: string) => {
      if (val && !ssnPattern.test(val)) validationIssues.push(`${label}: "${val}" is not 9 digits`);
    };
    const checkState = (label: string, val: string) => {
      if (val && !statePattern.test(val)) validationIssues.push(`${label}: "${val}" is not 2 uppercase letters`);
    };

    if (data.petitioner) {
      const p = data.petitioner;
      checkSSN('petitioner.ssn', p.ssn || '');
      checkDate('petitioner.date_of_birth', p.date_of_birth || '');
      checkDate('petitioner.date_of_marriage', p.date_of_marriage || '');
      checkDate('petitioner.employment_date_from', p.employment_date_from || '');
      checkState('petitioner.mailing_address.state', p.mailing_address?.state || '');
      checkState('petitioner.marriage_state', p.marriage_state || '');
      checkState('petitioner.employer_state', p.employer_state || '');
    }
    if (data.beneficiary) {
      const b = data.beneficiary;
      checkSSN('beneficiary.ssn', b.ssn || '');
      checkDate('beneficiary.date_of_birth', b.date_of_birth || '');
      checkDate('beneficiary.date_of_marriage', b.date_of_marriage || '');
      checkDate('beneficiary.date_of_arrival', b.date_of_arrival || '');
      checkDate('beneficiary.employment_date_from', b.employment_date_from || '');
      checkState('beneficiary.current_address.state', b.current_address?.state || '');
      checkState('beneficiary.marriage_state', b.marriage_state || '');
      checkState('beneficiary.employer_state', b.employer_state || '');
    }
    if (validationIssues.length > 0) {
      console.warn('Extraction validation issues:', validationIssues);
    }

    // Validate that the extraction found actual intake data
    const pet = data.petitioner || {};
    const hasUsableData = pet.family_name || pet.given_name || pet.date_of_birth || pet.ssn;
    if (!hasUsableData) {
      return Response.json(
        { error: 'This document does not appear to be an I-130 intake form. No petitioner information could be extracted. Please upload the correct form.' },
        { status: 422 }
      );
    }

    // Audit log (no PII - only metadata)
    console.log(JSON.stringify({
      event: 'i130_extract',
      timestamp: new Date().toISOString(),
      fileCount: files.length,
      fileTypes: files.map((f: File) => f.type),
      relationship: data.relationship || 'unknown',
      fieldsExtracted: Object.keys(data.petitioner || {}).filter((k: string) => data.petitioner[k]).length +
                       Object.keys(data.beneficiary || {}).filter((k: string) => data.beneficiary[k]).length,
    }));

    return Response.json(data);
  } catch (error) {
    console.error('Extract route error:', error);
    return Response.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
