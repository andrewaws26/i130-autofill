import Anthropic from '@anthropic-ai/sdk';
import { postProcess } from '@/lib/postprocess';
import { logApiCall } from '@/lib/api-logger';

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
- ALL dates MUST be in MM/DD/YYYY format. If the handwriting shows "October 9th" without a year, use the most likely year based on context (e.g., if the form was recently filled, use the current or recent year). If a field has multiple dates like "October 9th, September 9th", pick the FIRST date only.
- proceedings_type MUST be one of: "Removal", "Exclusion", "Rescission", or "Other". If the handwriting is unclear, default to "Removal".

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
  "relationship": "Spouse, Parent, Brother/Sister, or Child",
  "confidence": {
    "petitioner.family_name": "high",
    "petitioner.ssn": "medium",
    "beneficiary.date_of_arrival": "low"
  }
}

IMPORTANT:
- For Hispanic/Latino names with two surnames (e.g., "Cardona Hernandez"), put BOTH in family_name
- If a field is blank or not provided, use empty string ""
- For sex, use just "M" or "F"
- For yes/no fields, use "Yes" or "No"
- Read carefully - handwriting may be difficult
- If city_of_birth and country_of_birth appear to be the same (e.g., both say "Thailand"), that's OK - record as written

CONFIDENCE SCORING:
In the "confidence" object, rate your confidence for EVERY non-empty field you extracted. Use dot-path keys like "petitioner.family_name" or "beneficiary.ssn". Rates:
- "high" = clearly readable, no ambiguity (>90% sure)
- "medium" = readable but some characters were unclear, used context clues (70-90% sure)
- "low" = guessed based on context, multiple interpretations possible (<70% sure)
Only include fields that have values (skip empty fields). Be honest — if handwriting was messy, say "low".`;

export async function POST(request: Request) {
  const startTime = Date.now();
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
    } catch (apiError: unknown) {
      console.error('Claude API error:', apiError);
      // Extract useful error info for debugging
      const errMsg = apiError instanceof Error ? apiError.message : String(apiError);
      const isTimeout = errMsg.includes('timeout') || errMsg.includes('ETIMEDOUT');
      const isAuth = errMsg.includes('auth') || errMsg.includes('401') || errMsg.includes('api_key');
      const isOverloaded = errMsg.includes('overloaded') || errMsg.includes('529');
      const isRateLimit = errMsg.includes('rate') || errMsg.includes('429');

      let userMessage = 'Failed to process document. Please try again.';
      let errorType = 'unknown';
      if (isTimeout) { userMessage = 'The document took too long to process. Try uploading a smaller or clearer image.'; errorType = 'timeout'; }
      else if (isAuth) { userMessage = 'API authentication error. Please contact support.'; errorType = 'auth'; }
      else if (isOverloaded) { userMessage = 'The AI service is temporarily busy. Please wait a moment and try again.'; errorType = 'overloaded'; }
      else if (isRateLimit) { userMessage = 'Too many requests. Please wait a moment and try again.'; errorType = 'rate_limit'; }

      logApiCall({
        endpoint: 'extract',
        status: 'error',
        status_code: 502,
        duration_ms: Date.now() - startTime,
        file_count: files.length,
        file_types: files.map((f: File) => f.type),
        error_message: errMsg.slice(0, 200),
        error_type: errorType,
      });

      return Response.json(
        { error: userMessage, details: errMsg.slice(0, 200) },
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

    const fieldsExtracted = Object.keys(data.petitioner || {}).filter((k: string) => data.petitioner[k]).length +
                       Object.keys(data.beneficiary || {}).filter((k: string) => data.beneficiary[k]).length;

    logApiCall({
      endpoint: 'extract',
      status: 'success',
      status_code: 200,
      duration_ms: Date.now() - startTime,
      file_count: files.length,
      file_types: files.map((f: File) => f.type),
      fields_extracted: fieldsExtracted,
      relationship: data.relationship || 'unknown',
      validation_issues: validationIssues.length > 0 ? validationIssues : undefined,
    });

    return Response.json(data);
  } catch (error) {
    logApiCall({
      endpoint: 'extract',
      status: 'error',
      status_code: 500,
      duration_ms: Date.now() - startTime,
      error_message: String(error).slice(0, 200),
      error_type: 'unknown',
    });
    console.error('Extract route error:', error);
    return Response.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}
