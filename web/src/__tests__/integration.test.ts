import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { readFile } from 'fs/promises';
import { postProcess } from '@/lib/postprocess';

const INTAKE_PDF_PATH = '/Users/andrewsieg/Downloads/i-130 intake geovany .pdf';

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
    "address_history": [],
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
    "address_history": [],
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

const HAS_API_KEY = !!process.env.ANTHROPIC_API_KEY;

describe.skipIf(!HAS_API_KEY)('Live integration: Claude extraction from intake PDF', () => {
  it(
    'extracts key fields from the Geovany intake PDF',
    async () => {
      const pdfBytes = await readFile(INTAKE_PDF_PATH);
      const base64 = pdfBytes.toString('base64');

      const client = new Anthropic();

      const message = await client.messages.create({
        model: 'claude-opus-4-20250514',
        max_tokens: 8000,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'document',
                source: {
                  type: 'base64',
                  media_type: 'application/pdf',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: EXTRACTION_PROMPT,
              },
            ],
          },
        ],
      });

      // Parse the response
      let responseText = message.content[0].type === 'text' ? message.content[0].text : '';
      if (responseText.startsWith('```')) {
        responseText = responseText.split('\n').slice(1).join('\n');
        responseText = responseText.replace(/```\s*$/, '');
      }

      const data = JSON.parse(responseText);

      // Apply post-processing
      postProcess(data);

      // Verify key fields
      expect(data.petitioner.family_name).toBe('Meh');
      expect(data.petitioner.given_name).toBe('Kho');
      expect(data.beneficiary.family_name).toContain('Cardona');
      expect(data.beneficiary.country_of_birth).toBe('Guatemala');
      expect(data.relationship.toLowerCase()).toContain('spouse');

      // Verify post-processing was applied
      expect(data.beneficiary.ethnicity).toBe('Hispanic or Latino');
      expect(data.petitioner.ethnicity).toBe('Not Hispanic or Latino');
    },
    120_000
  );
});
