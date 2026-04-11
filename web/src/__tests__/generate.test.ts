import { describe, it, expect } from 'vitest';
import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';

const BLANK_PDF_PATH = join(__dirname, '../../public/i-130-blank.pdf');
const TEST_DATA_PATH = join(__dirname, '../../../test_data.json');

async function loadTestData(): Promise<Record<string, unknown>> {
  const raw = await readFile(TEST_DATA_PATH, 'utf-8');
  return JSON.parse(raw);
}

function removeDashes(ssn: string): string {
  return (ssn || '').replace(/-/g, '');
}

/**
 * Creates a simple AcroForm PDF with the fields we need to test against.
 * The actual I-130 PDF uses compressed object streams that pdf-lib cannot
 * fully parse in standalone Node (the AcroForm ref lives inside an
 * unresolvable object stream). So we create a synthetic form PDF that
 * mirrors the field names used by the generate route.
 */
async function createTestFormPdf(): Promise<PDFDocument> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([612, 792]);
  const form = pdfDoc.getForm();

  // Petitioner fields
  const petitionerTextFields = [
    'Pt2Line4a_FamilyName[0]',
    'Pt2Line4b_GivenName[0]',
    'Pt2Line4c_MiddleName[0]',
    'Pt2Line11_SSN[0]',
    'Pt2Line6_CityTownOfBirth[0]',
    'Pt2Line7_CountryofBirth[0]',
    'Pt2Line8_DateofBirth[0]',
    'Pt2Line10_StreetNumberName[0]',
    'Pt2Line10_AptSteFlrNumber[0]',
    'Pt2Line10_CityOrTown[0]',
    'Pt2Line10_ZipCode[0]',
    'Pt2Line10_Country[0]',
    'Pt2Line16_NumberofMarriages[0]',
    'Pt2Line18_DateOfMarriage[0]',
    'Pt2Line19a_CityTown[0]',
    'Pt2Line19d_Country[0]',
    'PtLine20a_FamilyName[0]',
    'Pt2Line20b_GivenName[0]',
    'Pt2Line20c_MiddleName[0]',
    'Pt2Line24_FamilyName[0]',
    'Pt2Line24_GivenName[0]',
    'Pt2Line25_DateofBirth[0]',
    'Pt2Line27_CountryofBirth[0]',
    'Pt2Line28_CityTownOrVillageOfResidence[0]',
    'Pt2Line29_CountryOfResidence[0]',
    'Pt2Line30a_FamilyName[0]',
    'Pt2Line30b_GivenName[0]',
    'Pt2Line31_DateofBirth[0]',
    'Pt2Line33_CountryofBirth[0]',
    'Pt2Line34_CityTownOrVillageOfResidence[0]',
    'Pt2Line35_CountryOfResidence[0]',
    'Pt2Line40_EmployerOrCompName[0]',
    'Pt2Line41_StreetNumberName[0]',
    'Pt2Line41_CityOrTown[0]',
    'Pt2Line41_ZipCode[0]',
    'Pt2Line41_Country[0]',
    'Pt2Line42_Occupation[0]',
    'Pt2Line43a_DateFrom[0]',
    'Pt6Line3_DaytimePhoneNumber[0]',
    'Pt6Line4_MobileNumber[0]',
    'Pt6Line5_Email[0]',
    // Beneficiary fields
    'Pt4Line3_SSN[0]',
    'Pt4Line4a_FamilyName[0]',
    'Pt4Line4b_GivenName[0]',
    'Pt4Line4c_MiddleName[0]',
    'Pt4Line7_CityTownOfBirth[0]',
    'Pt4Line8_CountryOfBirth[0]',
    'Pt4Line9_DateOfBirth[0]',
    'Pt4Line11_StreetNumberName[0]',
    'Pt4Line11_AptSteFlrNumber[0]',
    'Pt4Line11_CityOrTown[0]',
    'Pt4Line11_ZipCode[0]',
    'Pt4Line11_Country[0]',
    'Pt4Line14_DaytimePhoneNumber[0]',
    'Pt4Line15_MobilePhoneNumber[0]',
    'Pt4Line16_EmailAddress[0]',
    'Pt4Line17_NumberofMarriages[0]',
    'Pt4Line19_DateOfMarriage[0]',
    'Pt4Line20a_CityTown[0]',
    'Pt4Line20d_Country[0]',
    'Pt4Line16a_FamilyName[0]',
    'Pt4Line16b_GivenName[0]',
    'Pt4Line16c_MiddleName[0]',
    'Pt4Line21c_DateOfArrival[0]',
    'Pt4Line26_NameOfCompany[0]',
    'Pt4Line26_StreetNumberName[0]',
    'Pt4Line26_CityOrTown[0]',
    'Pt4Line26_ZipCode[0]',
    'Pt4Line26_Country[0]',
    'Pt4Line27_DateEmploymentBegan[0]',
    'Pt4Line22_PassportNumber[0]',
    'Pt4Line23_TravelDocNumber[0]',
    'Pt4Line24_CountryOfIssuance[0]',
    'Pt4Line25_ExpDate[0]',
    'Pt4Line21d_DateExpired[0]',
    'Pt4Line21b_ArrivalDeparture[0]',
    'Pt4Line55a_CityOrTown[0]',
    'Pt4Line56_Date[0]',
    'Pt4Line57_StreetNumberName[0]',
    'Pt4Line57_AptSteFlrNumber[0]',
    'Pt4Line57_CityOrTown[0]',
    'Pt4Line57_ZipCode[0]',
    'Pt4Line57_Country[0]',
    // Address history
    'Pt2Line12_StreetNumberName[0]',
    'Pt2Line12_CityOrTown[0]',
    'Pt2Line12_ZipCode[0]',
    'Pt2Line12_Country[0]',
    'Pt2Line13a_DateFrom[0]',
    // Weight digits
    'Pt3Line4_Pound1[0]',
    'Pt3Line4_Pound2[0]',
    'Pt3Line4_Pound3[0]',
  ];

  for (const name of petitionerTextFields) {
    form.createTextField(name);
  }

  // Checkbox fields
  const checkboxFields = [
    'Pt1Line1_Spouse[0]',
    'Pt1Line1_Parent[0]',
    'Pt1Line1_Siblings[0]',
    'Pt1Line1_Child[0]',
    'Pt2Line9_Male[0]',
    'Pt2Line9_Female[0]',
    'Pt2Line11_Yes[0]',
    'Pt2Line11_No[0]',
    'Pt2Line17_Single[0]',
    'Pt2Line17_Married[0]',
    'Pt2Line17_Divorced[0]',
    'Pt2Line17_Widowed[0]',
    'Pt2Line17_Separated[0]',
    'Pt2Line17_Annulled[0]',
    'Pt2Line26_Male[0]',
    'Pt2Line26_Female[0]',
    'Pt2Line32_Male[0]',
    'Pt2Line32_Female[0]',
    'Pt2Line36_USCitizen[0]',
    'Pt2Line36_LPR[0]',
    'Pt2Line23a_checkbox[0]',
    'Pt2Line23b_checkbox[0]',
    'Pt2Line23c_checkbox[0]',
    'Pt4Line9_Male[0]',
    'Pt4Line9_Female[0]',
    'Pt4Line10_Yes[0]',
    'Pt4Line10_No[0]',
    'Pt4Line20_Yes[0]',
    'Pt4Line20_No[0]',
    'Pt4Line28_Yes[0]',
    'Pt4Line28_No[0]',
    'Pt4Line54_Removal[0]',
    'Pt4Line54_Exclusion[0]',
    'Pt4Line54_Rescission[0]',
    'Pt4Line54_JudicialProceedings[0]',
    'Part4Line1_Yes[0]',
    'Part4Line1_No[0]',
    'Pt3Line1_Ethnicity[0]',
    'Pt3Line1_Ethnicity[1]',
    'Pt3Line2_Race_Asian[0]',
    'Pt3Line2_Race_White[0]',
    'Pt3Line2_Race_Black[0]',
    'Pt3Line2_Race_AmericanIndian[0]',
    'Pt3Line2_Race_NativeHawaiian[0]',
    'Pt2Line10_Unit[0]',
    'Pt2Line10_Unit[1]',
    'Pt2Line10_Unit[2]',
    'Pt4Line11_Unit[0]',
    'Pt4Line11_Unit[1]',
    'Pt4Line11_Unit[2]',
    'Pt4Line57_Unit[0]',
  ];

  const page = pdfDoc.getPage(0);
  let yPos = 780;
  for (const name of checkboxFields) {
    const cb = form.createCheckBox(name);
    cb.addToPage(page, { x: 0, y: yPos, width: 8, height: 8 });
    yPos -= 10;
    if (yPos < 10) yPos = 780; // wrap
  }

  return pdfDoc;
}

/**
 * Applies the generate route's field-mapping logic to a form.
 * This mirrors the production code in src/app/api/generate/route.ts.
 */
function fillForm(
  form: ReturnType<PDFDocument['getForm']>,
  data: Record<string, unknown>
) {
  const p = data.petitioner as Record<string, unknown> | undefined;
  const b = data.beneficiary as Record<string, unknown> | undefined;
  const rel = ((data.relationship as string) || '').toLowerCase();

  function setText(fieldName: string, value: string) {
    if (!value) return;
    try {
      form.getTextField(fieldName).setText(value);
    } catch {
      // skip
    }
  }

  function checkBox(fieldName: string) {
    try {
      form.getCheckBox(fieldName).check();
    } catch {
      // skip
    }
  }

  // Relationship
  if (rel.includes('spouse')) {
    checkBox('Pt1Line1_Spouse[0]');
  } else if (rel.includes('parent')) {
    checkBox('Pt1Line1_Parent[0]');
  } else if (rel.includes('brother') || rel.includes('sister')) {
    checkBox('Pt1Line1_Siblings[0]');
  } else if (rel.includes('child')) {
    checkBox('Pt1Line1_Child[0]');
  }

  // Petitioner name
  setText('Pt2Line4a_FamilyName[0]', (p?.family_name as string) || '');
  setText('Pt2Line4b_GivenName[0]', (p?.given_name as string) || '');
  setText('Pt2Line4c_MiddleName[0]', (p?.middle_name as string) || '');
  setText('Pt2Line11_SSN[0]', removeDashes((p?.ssn as string) || ''));

  setText('Pt2Line6_CityTownOfBirth[0]', (p?.city_of_birth as string) || '');
  setText('Pt2Line7_CountryofBirth[0]', (p?.country_of_birth as string) || '');
  setText('Pt2Line8_DateofBirth[0]', (p?.date_of_birth as string) || '');

  if (p?.sex === 'F') {
    checkBox('Pt2Line9_Female[0]');
  } else if (p?.sex === 'M') {
    checkBox('Pt2Line9_Male[0]');
  }

  // Mailing address
  const pAddr = (p?.mailing_address as Record<string, string>) || {};
  setText('Pt2Line10_StreetNumberName[0]', pAddr.street || '');
  setText('Pt2Line10_CityOrTown[0]', pAddr.city || '');
  setText('Pt2Line10_ZipCode[0]', pAddr.zip || '');
  setText('Pt2Line10_Country[0]', pAddr.country || '');

  if (p?.physical_same_as_mailing === true || p?.physical_same_as_mailing === 'true') {
    checkBox('Pt2Line11_Yes[0]');
  } else {
    checkBox('Pt2Line11_No[0]');
  }

  // Address history
  const pHist = ((p?.address_history as Array<Record<string, string>>) || [])[0] || {};
  setText('Pt2Line12_StreetNumberName[0]', pHist.street || '');
  setText('Pt2Line12_CityOrTown[0]', pHist.city || '');
  setText('Pt2Line12_ZipCode[0]', pHist.zip || '');
  setText('Pt2Line12_Country[0]', pHist.country || '');
  setText('Pt2Line13a_DateFrom[0]', pHist.date_from || '');

  // Marriage
  setText('Pt2Line16_NumberofMarriages[0]', (p?.times_married as string) || '');

  const marital = ((p?.marital_status as string) || '').toLowerCase();
  if (marital.includes('married')) checkBox('Pt2Line17_Married[0]');
  else if (marital.includes('single')) checkBox('Pt2Line17_Single[0]');
  else if (marital.includes('divorced')) checkBox('Pt2Line17_Divorced[0]');

  setText('Pt2Line18_DateOfMarriage[0]', (p?.date_of_marriage as string) || '');
  setText('Pt2Line19a_CityTown[0]', (p?.marriage_city as string) || '');
  setText('Pt2Line19d_Country[0]', (p?.marriage_country as string) || '');

  // Spouse name
  setText('PtLine20a_FamilyName[0]', (p?.spouse_family_name as string) || '');
  setText('Pt2Line20b_GivenName[0]', (p?.spouse_given_name as string) || '');
  setText('Pt2Line20c_MiddleName[0]', (p?.spouse_middle_name as string) || '');

  // Parents
  setText('Pt2Line24_FamilyName[0]', (p?.parent1_family_name as string) || '');
  setText('Pt2Line24_GivenName[0]', (p?.parent1_given_name as string) || '');
  setText('Pt2Line25_DateofBirth[0]', (p?.parent1_dob as string) || '');
  if (p?.parent1_sex === 'M') checkBox('Pt2Line26_Male[0]');
  else if (p?.parent1_sex === 'F') checkBox('Pt2Line26_Female[0]');

  setText('Pt2Line30a_FamilyName[0]', (p?.parent2_family_name as string) || '');
  setText('Pt2Line30b_GivenName[0]', (p?.parent2_given_name as string) || '');
  setText('Pt2Line31_DateofBirth[0]', (p?.parent2_dob as string) || '');
  if (p?.parent2_sex === 'F') checkBox('Pt2Line32_Female[0]');
  else if (p?.parent2_sex === 'M') checkBox('Pt2Line32_Male[0]');

  // Immigration status
  const immStatus = ((p?.immigration_status as string) || '').toLowerCase();
  if (immStatus.includes('citizen')) checkBox('Pt2Line36_USCitizen[0]');
  else if (immStatus.includes('lpr') || immStatus.includes('permanent')) checkBox('Pt2Line36_LPR[0]');

  // Employer
  setText('Pt2Line40_EmployerOrCompName[0]', (p?.employer_name as string) || '');
  setText('Pt2Line43a_DateFrom[0]', (p?.employment_date_from as string) || '');

  // Weight
  const weight = ((p?.weight_lbs as string) || '').toString().padStart(3, '0');
  if (p?.weight_lbs) {
    setText('Pt3Line4_Pound1[0]', weight[0]);
    setText('Pt3Line4_Pound2[0]', weight[1]);
    setText('Pt3Line4_Pound3[0]', weight[2]);
  }

  // Ethnicity
  const ethnicity = ((p?.ethnicity as string) || '').toLowerCase();
  if (ethnicity.includes('not hispanic')) checkBox('Pt3Line1_Ethnicity[0]');
  else if (ethnicity.includes('hispanic')) checkBox('Pt3Line1_Ethnicity[1]');

  // Race
  const race = ((p?.race as string) || '').toLowerCase();
  if (race.includes('asian')) checkBox('Pt3Line2_Race_Asian[0]');
  if (race.includes('white')) checkBox('Pt3Line2_Race_White[0]');

  // Beneficiary
  setText('Pt4Line3_SSN[0]', removeDashes((b?.ssn as string) || ''));
  setText('Pt4Line4a_FamilyName[0]', (b?.family_name as string) || '');
  setText('Pt4Line4b_GivenName[0]', (b?.given_name as string) || '');
  setText('Pt4Line4c_MiddleName[0]', (b?.middle_name as string) || '');
  setText('Pt4Line7_CityTownOfBirth[0]', (b?.city_of_birth as string) || '');
  setText('Pt4Line8_CountryOfBirth[0]', (b?.country_of_birth as string) || '');
  setText('Pt4Line9_DateOfBirth[0]', (b?.date_of_birth as string) || '');

  if (b?.sex === 'M') checkBox('Pt4Line9_Male[0]');
  else if (b?.sex === 'F') checkBox('Pt4Line9_Female[0]');

  // Beneficiary address
  const bAddr = (b?.current_address as Record<string, string>) || {};
  setText('Pt4Line11_StreetNumberName[0]', bAddr.street || '');
  setText('Pt4Line11_CityOrTown[0]', bAddr.city || '');
  setText('Pt4Line11_ZipCode[0]', bAddr.zip || '');
  setText('Pt4Line11_Country[0]', bAddr.country || '');

  setText('Pt4Line14_DaytimePhoneNumber[0]', (b?.phone as string) || '');

  // Beneficiary ever in US
  if (b?.ever_in_us === 'Yes') checkBox('Pt4Line20_Yes[0]');
  else checkBox('Pt4Line20_No[0]');

  // Immigration proceedings
  if (b?.in_immigration_proceedings === 'Yes') checkBox('Pt4Line28_Yes[0]');
  else checkBox('Pt4Line28_No[0]');

  const procType = ((b?.proceedings_type as string) || '').toLowerCase();
  if (procType.includes('removal')) checkBox('Pt4Line54_Removal[0]');

  // Petitioner contact
  setText('Pt6Line3_DaytimePhoneNumber[0]', (p?.phone as string) || '');
  setText('Pt6Line5_Email[0]', (p?.email as string) || '');

  // Previously filed
  if (p?.previously_filed_petition === 'Yes') checkBox('Part4Line1_Yes[0]');
  else checkBox('Part4Line1_No[0]');
}

describe('PDF generation', () => {
  describe('field mapping with synthetic form', () => {
    it('maps petitioner name fields correctly', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt2Line4a_FamilyName[0]').getText()).toBe('Meh');
      expect(form.getTextField('Pt2Line4b_GivenName[0]').getText()).toBe('Kho');
    });

    it('maps beneficiary name and birth fields correctly', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt4Line4a_FamilyName[0]').getText()).toBe('Cardona Hernandez');
      expect(form.getTextField('Pt4Line4b_GivenName[0]').getText()).toBe('Geovany');
      expect(form.getTextField('Pt4Line4c_MiddleName[0]').getText()).toBe('Estuardo');
      expect(form.getTextField('Pt4Line8_CountryOfBirth[0]').getText()).toBe('Guatemala');
      expect(form.getTextField('Pt4Line9_DateOfBirth[0]').getText()).toBe('11/02/2002');
    });

    it('strips dashes from SSN before setting', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt2Line11_SSN[0]').getText()).toBe('359831756');
      expect(form.getTextField('Pt4Line3_SSN[0]').getText()).toBe('842779175');
    });

    it('maps spouse names from test data', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('PtLine20a_FamilyName[0]').getText()).toBe('Cardona Hernandez');
      expect(form.getTextField('Pt2Line20b_GivenName[0]').getText()).toBe('Geovany');
      expect(form.getTextField('Pt2Line20c_MiddleName[0]').getText()).toBe('Estuardo');
    });

    it('maps marriage info correctly', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt2Line18_DateOfMarriage[0]').getText()).toBe('09/20/2025');
      expect(form.getTextField('Pt2Line19a_CityTown[0]').getText()).toBe('Beaver Dam');
      expect(form.getTextField('Pt2Line19d_Country[0]').getText()).toBe('United States');
      expect(form.getTextField('Pt2Line16_NumberofMarriages[0]').getText()).toBe('1');
    });

    it('maps employer info correctly', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt2Line40_EmployerOrCompName[0]').getText()).toBe('Tracco Total Packaging, LLC');
      expect(form.getTextField('Pt2Line43a_DateFrom[0]').getText()).toBe('02/26/2020');
    });

    it('maps petitioner mailing address correctly', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt2Line10_StreetNumberName[0]').getText()).toBe('1300 Nassau Ave');
      expect(form.getTextField('Pt2Line10_CityOrTown[0]').getText()).toBe('Owensboro');
      expect(form.getTextField('Pt2Line10_ZipCode[0]').getText()).toBe('42301');
      expect(form.getTextField('Pt2Line10_Country[0]').getText()).toBe('United States');
    });

    it('maps address history first entry', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt2Line12_StreetNumberName[0]').getText()).toBe('2321 Homestead Point');
      expect(form.getTextField('Pt2Line12_CityOrTown[0]').getText()).toBe('Owensboro');
      expect(form.getTextField('Pt2Line13a_DateFrom[0]').getText()).toBe('09/01/2019');
    });

    it('maps parent info correctly', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt2Line24_FamilyName[0]').getText()).toBe('Reh');
      expect(form.getTextField('Pt2Line24_GivenName[0]').getText()).toBe('Nga');
      expect(form.getTextField('Pt2Line30a_FamilyName[0]').getText()).toBe('Meu');
      expect(form.getTextField('Pt2Line30b_GivenName[0]').getText()).toBe('Hseh');
    });

    it('checks correct sex checkboxes', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      // Petitioner is F
      expect(form.getCheckBox('Pt2Line9_Female[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt2Line9_Male[0]').isChecked()).toBe(false);

      // Beneficiary is M
      expect(form.getCheckBox('Pt4Line9_Male[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt4Line9_Female[0]').isChecked()).toBe(false);
    });

    it('checks spouse relationship checkbox', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt1Line1_Spouse[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt1Line1_Parent[0]').isChecked()).toBe(false);
    });

    it('checks married marital status checkbox', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt2Line17_Married[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt2Line17_Single[0]').isChecked()).toBe(false);
    });

    it('checks immigration status checkbox', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt2Line36_USCitizen[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt2Line36_LPR[0]').isChecked()).toBe(false);
    });

    it('checks ethnicity checkbox (Not Hispanic = [0])', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      // Petitioner is from Thailand -> Not Hispanic -> checkbox index [0]
      expect(form.getCheckBox('Pt3Line1_Ethnicity[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt3Line1_Ethnicity[1]').isChecked()).toBe(false);
    });

    it('checks Asian race checkbox', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt3Line2_Race_Asian[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt3Line2_Race_White[0]').isChecked()).toBe(false);
    });

    it('maps weight digits correctly', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getTextField('Pt3Line4_Pound1[0]').getText()).toBe('1');
      expect(form.getTextField('Pt3Line4_Pound2[0]').getText()).toBe('5');
      expect(form.getTextField('Pt3Line4_Pound3[0]').getText()).toBe('5');
    });

    it('checks parent1 sex as Male', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt2Line26_Male[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt2Line26_Female[0]').isChecked()).toBe(false);
    });

    it('checks parent2 sex as Female', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt2Line32_Female[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt2Line32_Male[0]').isChecked()).toBe(false);
    });

    it('checks immigration proceedings and removal type', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt4Line28_Yes[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt4Line54_Removal[0]').isChecked()).toBe(true);
    });

    it('checks ever_in_us = Yes', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      expect(form.getCheckBox('Pt4Line20_Yes[0]').isChecked()).toBe(true);
      expect(form.getCheckBox('Pt4Line20_No[0]').isChecked()).toBe(false);
    });
  });

  describe('resilience', () => {
    it('does not crash with empty data', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();

      expect(() => fillForm(form, { petitioner: {}, beneficiary: {}, relationship: '' })).not.toThrow();
    });

    it('does not crash with null nested objects', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();

      expect(() =>
        fillForm(form, {
          petitioner: { family_name: 'Test', mailing_address: null, address_history: null },
          beneficiary: { current_address: null },
          relationship: 'Spouse',
        } as unknown as Record<string, unknown>)
      ).not.toThrow();
    });

    it('does not crash with undefined petitioner/beneficiary', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();

      expect(() => fillForm(form, { relationship: '' })).not.toThrow();
    });
  });

  describe('save and output', () => {
    it('saves to valid PDF bytes', async () => {
      const pdfDoc = await createTestFormPdf();
      const form = pdfDoc.getForm();
      const testData = await loadTestData();

      fillForm(form, testData);

      const savedBytes = await pdfDoc.save();
      expect(savedBytes.length).toBeGreaterThan(0);

      const header = String.fromCharCode(...savedBytes.slice(0, 5));
      expect(header).toBe('%PDF-');
    });

    it('saved PDF is larger than empty form (data was written)', async () => {
      const emptyDoc = await createTestFormPdf();
      const emptyBytes = await emptyDoc.save();

      const filledDoc = await createTestFormPdf();
      const filledForm = filledDoc.getForm();
      const testData = await loadTestData();
      fillForm(filledForm, testData);
      const filledBytes = await filledDoc.save();

      expect(filledBytes.length).toBeGreaterThan(emptyBytes.length);
    });
  });

  describe('actual I-130 PDF loading', () => {
    it('can load the blank I-130 PDF without crashing', async () => {
      const pdfBytes = await readFile(BLANK_PDF_PATH);
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

      // The PDF loads successfully even though some object refs are invalid.
      // pdf-lib logs warnings but does not throw.
      expect(pdfDoc).toBeDefined();
    });
  });

  describe('removeDashes utility', () => {
    it('strips dashes from SSN format', () => {
      expect(removeDashes('123-45-6789')).toBe('123456789');
    });

    it('leaves dashless strings unchanged', () => {
      expect(removeDashes('123456789')).toBe('123456789');
    });

    it('handles empty string', () => {
      expect(removeDashes('')).toBe('');
    });

    it('handles all dashes', () => {
      expect(removeDashes('---')).toBe('');
    });
  });
});
