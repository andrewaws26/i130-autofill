import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logApiCall } from '@/lib/api-logger';

export const maxDuration = 30;

const failedFields: string[] = [];

// Field name lookup: the cleaned PDF uses full XFA paths like
// "form1[0].#subform[0].Pt2Line4a_FamilyName[0]" but our code uses
// short names like "Pt2Line4a_FamilyName[0]". This map is built once
// when the form is loaded to translate short → full names.
let fieldNameMap: Record<string, string> = {};

function buildFieldNameMap(form: ReturnType<PDFDocument['getForm']>) {
  fieldNameMap = {};
  const fields = form.getFields();
  for (const field of fields) {
    const fullName = field.getName();
    const parts = fullName.split('.');
    const shortName = parts[parts.length - 1];
    // First match wins (avoid overwriting with duplicates)
    if (!fieldNameMap[shortName]) {
      fieldNameMap[shortName] = fullName;
    }
  }
}

function resolve(fieldName: string): string {
  return fieldNameMap[fieldName] || fieldName;
}

function setText(form: ReturnType<PDFDocument['getForm']>, fieldName: string, value: string) {
  if (!value || !value.trim()) return;
  try {
    form.getTextField(resolve(fieldName)).setText(String(value));
  } catch (err) {
    failedFields.push(fieldName);
  }
}

function checkBox(form: ReturnType<PDFDocument['getForm']>, fieldName: string) {
  try {
    form.getCheckBox(resolve(fieldName)).check();
  } catch (err) {
    failedFields.push(fieldName);
  }
}

function selectDropdown(form: ReturnType<PDFDocument['getForm']>, fieldName: string, value: string) {
  if (!value || !value.trim()) return;
  try {
    const dropdown = form.getDropdown(resolve(fieldName));
    const options = dropdown.getOptions();
    if (options.includes(value)) { dropdown.select(value); return; }
    const match = options.find(o => o.toLowerCase() === value.toLowerCase());
    if (match) { dropdown.select(match); return; }
    const partial = options.find(o => o.toUpperCase().startsWith(value.toUpperCase()));
    if (partial) { dropdown.select(partial); return; }
    failedFields.push(fieldName);
  } catch (err) {
    failedFields.push(fieldName);
  }
}

function removeDashes(ssn: string): string {
  return (ssn || '').replace(/-/g, '');
}

export async function POST(request: Request) {
  const startTime = Date.now();
  // Reset the failed fields tracker for each request
  failedFields.length = 0;

  try {
    const data = await request.json();
    const p = data.petitioner;
    const b = data.beneficiary;
    const rel = (data.relationship || '').toLowerCase();

    // Load blank PDF
    const pdfPath = join(process.cwd(), 'public', 'i-130-blank.pdf');
    const pdfBytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    buildFieldNameMap(form);

    // ===== PAGE 1 - Relationship + Petitioner =====

    // Relationship checkboxes
    if (rel.includes('spouse')) {
      checkBox(form, 'Pt1Line1_Spouse[0]');
    } else if (rel.includes('parent')) {
      checkBox(form, 'Pt1Line1_Parent[0]');
    } else if (rel.includes('brother') || rel.includes('sister')) {
      checkBox(form, 'Pt1Line1_Siblings[0]');
    } else if (rel.includes('child')) {
      checkBox(form, 'Pt1Line1_Child[0]');
    }

    // Petitioner name
    setText(form, 'Pt2Line4a_FamilyName[0]', p?.family_name || '');
    setText(form, 'Pt2Line4b_GivenName[0]', p?.given_name || '');
    setText(form, 'Pt2Line4c_MiddleName[0]', p?.middle_name || '');
    setText(form, 'Pt2Line11_SSN[0]', removeDashes(p?.ssn || ''));

    // ===== PAGE 2 - Petitioner details =====

    setText(form, 'Pt2Line6_CityTownOfBirth[0]', p?.city_of_birth || '');
    setText(form, 'Pt2Line7_CountryofBirth[0]', p?.country_of_birth || '');
    setText(form, 'Pt2Line8_DateofBirth[0]', p?.date_of_birth || '');

    // Sex
    if (p?.sex === 'F') {
      checkBox(form, 'Pt2Line9_Female[0]');
    } else if (p?.sex === 'M') {
      checkBox(form, 'Pt2Line9_Male[0]');
    }

    // Mailing address
    const pAddr = p?.mailing_address || {};
    setText(form, 'Pt2Line10_StreetNumberName[0]', pAddr.street || '');

    const unitType = (pAddr.apt_ste_flr || '').toLowerCase();
    if (unitType.includes('apt')) {
      checkBox(form, 'Pt2Line10_Unit[0]');
    } else if (unitType.includes('ste') || unitType.includes('suite')) {
      checkBox(form, 'Pt2Line10_Unit[1]');
    } else if (unitType.includes('flr') || unitType.includes('floor')) {
      checkBox(form, 'Pt2Line10_Unit[2]');
    }

    setText(form, 'Pt2Line10_AptSteFlrNumber[0]', pAddr.unit_number || '');
    setText(form, 'Pt2Line10_CityOrTown[0]', pAddr.city || '');
    selectDropdown(form, 'Pt2Line10_State[0]', pAddr.state || '');
    setText(form, 'Pt2Line10_ZipCode[0]', pAddr.zip || '');
    setText(form, 'Pt2Line10_Country[0]', pAddr.country || '');

    // Physical address same as mailing
    if (p?.physical_same_as_mailing === true || p?.physical_same_as_mailing === 'true') {
      checkBox(form, 'Pt2Line11_Yes[0]');
    } else {
      checkBox(form, 'Pt2Line11_No[0]');
    }

    // Address history
    const pHist = (p?.address_history && p.address_history[0]) || {};
    setText(form, 'Pt2Line12_StreetNumberName[0]', pHist.street || '');
    setText(form, 'Pt2Line12_CityOrTown[0]', pHist.city || '');
    selectDropdown(form, 'Pt2Line12_State[0]', pHist.state || '');
    setText(form, 'Pt2Line12_ZipCode[0]', pHist.zip || '');
    setText(form, 'Pt2Line12_Country[0]', pHist.country || '');
    setText(form, 'Pt2Line13a_DateFrom[0]', pHist.date_from || '');

    // Marriage info
    setText(form, 'Pt2Line16_NumberofMarriages[0]', p?.times_married || '');

    const marital = (p?.marital_status || '').toLowerCase();
    if (marital.includes('married')) {
      checkBox(form, 'Pt2Line17_Married[0]');
    } else if (marital.includes('single')) {
      checkBox(form, 'Pt2Line17_Single[0]');
    } else if (marital.includes('divorced')) {
      checkBox(form, 'Pt2Line17_Divorced[0]');
    } else if (marital.includes('widowed')) {
      checkBox(form, 'Pt2Line17_Widowed[0]');
    } else if (marital.includes('separated')) {
      checkBox(form, 'Pt2Line17_Separated[0]');
    } else if (marital.includes('annulled')) {
      checkBox(form, 'Pt2Line17_Annulled[0]');
    }

    // ===== PAGE 3 - Marriage, parents, citizenship =====

    setText(form, 'Pt2Line18_DateOfMarriage[0]', p?.date_of_marriage || '');
    setText(form, 'Pt2Line19a_CityTown[0]', p?.marriage_city || '');
    selectDropdown(form, 'Pt2Line19b_State[0]', p?.marriage_state || '');
    setText(form, 'Pt2Line19d_Country[0]', p?.marriage_country || '');

    // Spouse name (note: PtLine not Pt2Line for family name)
    setText(form, 'PtLine20a_FamilyName[0]', p?.spouse_family_name || '');
    setText(form, 'Pt2Line20b_GivenName[0]', p?.spouse_given_name || '');
    setText(form, 'Pt2Line20c_MiddleName[0]', p?.spouse_middle_name || '');

    // Parent 1
    setText(form, 'Pt2Line24_FamilyName[0]', p?.parent1_family_name || '');
    setText(form, 'Pt2Line24_GivenName[0]', p?.parent1_given_name || '');
    setText(form, 'Pt2Line25_DateofBirth[0]', p?.parent1_dob || '');
    if (p?.parent1_sex === 'M') {
      checkBox(form, 'Pt2Line26_Male[0]');
    } else if (p?.parent1_sex === 'F') {
      checkBox(form, 'Pt2Line26_Female[0]');
    }
    setText(form, 'Pt2Line27_CountryofBirth[0]', p?.parent1_country_of_birth || '');
    setText(form, 'Pt2Line28_CityTownOrVillageOfResidence[0]', p?.parent1_city_of_residence || '');
    setText(form, 'Pt2Line29_CountryOfResidence[0]', p?.parent1_country_of_residence || '');

    // Parent 2
    setText(form, 'Pt2Line30a_FamilyName[0]', p?.parent2_family_name || '');
    setText(form, 'Pt2Line30b_GivenName[0]', p?.parent2_given_name || '');
    setText(form, 'Pt2Line31_DateofBirth[0]', p?.parent2_dob || '');
    if (p?.parent2_sex === 'F') {
      checkBox(form, 'Pt2Line32_Female[0]');
    } else if (p?.parent2_sex === 'M') {
      checkBox(form, 'Pt2Line32_Male[0]');
    }
    setText(form, 'Pt2Line33_CountryofBirth[0]', p?.parent2_country_of_birth || '');
    setText(form, 'Pt2Line34_CityTownOrVillageOfResidence[0]', p?.parent2_city_of_residence || '');
    setText(form, 'Pt2Line35_CountryOfResidence[0]', p?.parent2_country_of_residence || '');

    // Immigration status
    const immStatus = (p?.immigration_status || '').toLowerCase();
    if (immStatus.includes('citizen')) {
      checkBox(form, 'Pt2Line36_USCitizen[0]');
    } else if (immStatus.includes('lpr') || immStatus.includes('permanent')) {
      checkBox(form, 'Pt2Line36_LPR[0]');
    }

    // Citizenship acquired through
    const citAcq = (p?.citizenship_acquired_through || '').toLowerCase();
    if (citAcq.includes('birth')) {
      checkBox(form, 'Pt2Line23a_checkbox[0]');
    } else if (citAcq.includes('naturalization')) {
      checkBox(form, 'Pt2Line23b_checkbox[0]');
    } else if (citAcq.includes('parents')) {
      checkBox(form, 'Pt2Line23c_checkbox[0]');
    }

    // ===== PAGE 4 - Employment + Biographic =====

    setText(form, 'Pt2Line40_EmployerOrCompName[0]', p?.employer_name || '');
    setText(form, 'Pt2Line41_StreetNumberName[0]', p?.employer_street || '');
    setText(form, 'Pt2Line41_CityOrTown[0]', p?.employer_city || '');
    selectDropdown(form, 'Pt2Line41_State[0]', p?.employer_state || '');
    setText(form, 'Pt2Line41_ZipCode[0]', p?.employer_zip || '');
    setText(form, 'Pt2Line41_Country[0]', p?.employer_country || '');
    setText(form, 'Pt2Line42_Occupation[0]', p?.occupation || '');
    setText(form, 'Pt2Line43a_DateFrom[0]', p?.employment_date_from || '');

    // Biographic - Height
    selectDropdown(form, 'Pt3Line3_HeightFeet[0]', p?.height_feet || '');
    selectDropdown(form, 'Pt3Line3_HeightInches[0]', p?.height_inches || '');

    // Weight - individual digits
    const weight = (p?.weight_lbs || '').toString().padStart(3, '0');
    if (p?.weight_lbs) {
      setText(form, 'Pt3Line4_Pound1[0]', weight[0]);
      setText(form, 'Pt3Line4_Pound2[0]', weight[1]);
      setText(form, 'Pt3Line4_Pound3[0]', weight[2]);
    }

    // Ethnicity - REVERSED: [0] = Not Hispanic, [1] = Hispanic
    const ethnicity = (p?.ethnicity || '').toLowerCase();
    if (ethnicity.includes('not hispanic') || ethnicity === 'not hispanic or latino') {
      checkBox(form, 'Pt3Line1_Ethnicity[0]');
    } else if (ethnicity.includes('hispanic')) {
      checkBox(form, 'Pt3Line1_Ethnicity[1]');
    }

    // Race
    const race = (p?.race || '').toLowerCase();
    if (race.includes('asian')) {
      checkBox(form, 'Pt3Line2_Race_Asian[0]');
    }
    if (race.includes('white')) {
      checkBox(form, 'Pt3Line2_Race_White[0]');
    }
    if (race.includes('black')) {
      checkBox(form, 'Pt3Line2_Race_Black[0]');
    }
    if (race.includes('american indian') || race.includes('alaska native')) {
      checkBox(form, 'Pt3Line2_Race_AmericanIndian[0]');
    }
    if (race.includes('native hawaiian') || race.includes('pacific islander')) {
      checkBox(form, 'Pt3Line2_Race_NativeHawaiian[0]');
    }

    // Eye color: blue=0, brown=1, hazel=2, pink=3, maroon=4, green=5, gray=6, black=7, unknown=8
    const eyeColorMap: Record<string, number> = {
      blue: 0, brown: 1, hazel: 2, pink: 3, maroon: 4,
      green: 5, gray: 6, grey: 6, black: 7, unknown: 8,
    };
    const eyeColor = (p?.eye_color || '').toLowerCase();
    if (eyeColor in eyeColorMap) {
      checkBox(form, `Pt3Line5_EyeColor[${eyeColorMap[eyeColor]}]`);
    }

    // ===== PAGE 5 - Hair + Beneficiary =====

    // Hair color: bald=0, black=1, blond=2, brown=3, gray=4, red=5, sandy=6, white=7, unknown=8
    const hairColorMap: Record<string, number> = {
      bald: 0, black: 1, blond: 2, blonde: 2, brown: 3,
      gray: 4, grey: 4, red: 5, sandy: 6, white: 7, unknown: 8,
    };
    const hairColor = (p?.hair_color || '').toLowerCase();
    if (hairColor in hairColorMap) {
      checkBox(form, `Pt3Line6_HairColor[${hairColorMap[hairColor]}]`);
    }

    // Beneficiary
    setText(form, 'Pt4Line3_SSN[0]', removeDashes(b?.ssn || ''));
    setText(form, 'Pt4Line4a_FamilyName[0]', b?.family_name || '');
    setText(form, 'Pt4Line4b_GivenName[0]', b?.given_name || '');
    setText(form, 'Pt4Line4c_MiddleName[0]', b?.middle_name || '');
    setText(form, 'Pt4Line7_CityTownOfBirth[0]', b?.city_of_birth || '');
    setText(form, 'Pt4Line8_CountryOfBirth[0]', b?.country_of_birth || '');
    setText(form, 'Pt4Line9_DateOfBirth[0]', b?.date_of_birth || '');

    if (b?.sex === 'M') {
      checkBox(form, 'Pt4Line9_Male[0]');
    } else if (b?.sex === 'F') {
      checkBox(form, 'Pt4Line9_Female[0]');
    }

    // Beneficiary address
    const bAddr = b?.current_address || {};
    setText(form, 'Pt4Line11_StreetNumberName[0]', bAddr.street || '');

    const bUnitType = (bAddr.apt_ste_flr || '').toLowerCase();
    if (bUnitType.includes('apt')) {
      checkBox(form, 'Pt4Line11_Unit[0]');
    } else if (bUnitType.includes('ste') || bUnitType.includes('suite')) {
      checkBox(form, 'Pt4Line11_Unit[1]');
    } else if (bUnitType.includes('flr') || bUnitType.includes('floor')) {
      checkBox(form, 'Pt4Line11_Unit[2]');
    }

    setText(form, 'Pt4Line11_AptSteFlrNumber[0]', bAddr.unit_number || '');
    setText(form, 'Pt4Line11_CityOrTown[0]', bAddr.city || '');
    selectDropdown(form, 'Pt4Line11_State[0]', bAddr.state || '');
    setText(form, 'Pt4Line11_ZipCode[0]', bAddr.zip || '');
    setText(form, 'Pt4Line11_Country[0]', bAddr.country || '');

    // Beneficiary safe mailing = SAME
    setText(form, 'Pt4Line12a_StreetNumberName[0]', 'SAME');

    setText(form, 'Pt4Line14_DaytimePhoneNumber[0]', b?.phone || '');
    setText(form, 'Pt4Line15_MobilePhoneNumber[0]', b?.mobile_phone || '');
    setText(form, 'Pt4Line16_EmailAddress[0]', b?.email || '');

    // Petition filed before
    if (b?.petition_filed_before === 'Yes') {
      checkBox(form, 'Pt4Line10_Yes[0]');
    } else {
      checkBox(form, 'Pt4Line10_No[0]');
    }

    // ===== PAGE 6 - Beneficiary marital =====

    setText(form, 'Pt4Line17_NumberofMarriages[0]', b?.times_married || '');

    // Marital status: widowed=0, annulled=1, separated=2, single=3, married=4, divorced=5
    const bMarital = (b?.marital_status || '').toLowerCase();
    const maritalMap: Record<string, number> = {
      widowed: 0, annulled: 1, separated: 2, single: 3, married: 4, divorced: 5,
    };
    for (const [key, idx] of Object.entries(maritalMap)) {
      if (bMarital.includes(key)) {
        checkBox(form, `Pt4Line18_MaritalStatus[${idx}]`);
        break;
      }
    }

    setText(form, 'Pt4Line19_DateOfMarriage[0]', b?.date_of_marriage || '');
    setText(form, 'Pt4Line20a_CityTown[0]', b?.marriage_city || '');
    selectDropdown(form, 'Pt4Line20b_State[0]', b?.marriage_state || '');
    setText(form, 'Pt4Line20d_Country[0]', b?.marriage_country || '');

    // Spouse of beneficiary = petitioner
    setText(form, 'Pt4Line16a_FamilyName[0]', p?.family_name || '');
    setText(form, 'Pt4Line16b_GivenName[0]', p?.given_name || '');
    setText(form, 'Pt4Line16c_MiddleName[0]', p?.middle_name || '');

    // ===== PAGE 7 - Entry info, employment, proceedings =====

    // Ever in US
    if (b?.ever_in_us === 'Yes') {
      checkBox(form, 'Pt4Line20_Yes[0]');
    } else {
      checkBox(form, 'Pt4Line20_No[0]');
    }

    // Class of admission dropdown
    if (b?.class_of_admission) {
      const coa = b.class_of_admission.trim();
      let coaValue = coa;
      if (coa.toLowerCase().startsWith('as') || coa.toLowerCase() === 'asylum') {
        coaValue = 'AS';
      } else if (coa.toLowerCase().startsWith('re') || coa.toLowerCase() === 'refugee') {
        coaValue = 'RE';
      }
      selectDropdown(form, 'Pt4Line21a_ClassOfAdmission[0]', coaValue);
    }

    setText(form, 'Pt4Line21c_DateOfArrival[0]', b?.date_of_arrival || '');

    // Beneficiary employment
    setText(form, 'Pt4Line26_NameOfCompany[0]', b?.employer_name || '');
    setText(form, 'Pt4Line26_StreetNumberName[0]', b?.employer_street || '');
    setText(form, 'Pt4Line26_CityOrTown[0]', b?.employer_city || '');
    selectDropdown(form, 'Pt4Line26_State[0]', b?.employer_state || '');
    setText(form, 'Pt4Line26_ZipCode[0]', b?.employer_zip || '');
    setText(form, 'Pt4Line26_Country[0]', b?.employer_country || '');
    setText(form, 'Pt4Line27_DateEmploymentBegan[0]', b?.employment_date_from || '');

    // Immigration proceedings
    if (b?.in_immigration_proceedings === 'Yes') {
      checkBox(form, 'Pt4Line28_Yes[0]');
    } else {
      checkBox(form, 'Pt4Line28_No[0]');
    }

    const procType = (b?.proceedings_type || '').toLowerCase();
    if (procType.includes('removal')) {
      checkBox(form, 'Pt4Line54_Removal[0]');
    } else if (procType.includes('exclusion')) {
      checkBox(form, 'Pt4Line54_Exclusion[0]');
    } else if (procType.includes('rescission')) {
      checkBox(form, 'Pt4Line54_Rescission[0]');
    } else if (procType.includes('judicial') || procType.includes('other')) {
      checkBox(form, 'Pt4Line54_JudicialProceedings[0]');
    }

    // Proceedings location and date
    setText(form, 'Pt4Line55a_CityOrTown[0]', b?.proceedings_city || '');
    selectDropdown(form, 'Pt4Line55b_State[0]', b?.proceedings_state || '');
    setText(form, 'Pt4Line56_Date[0]', b?.proceedings_date || '');

    // Beneficiary passport / travel document
    setText(form, 'Pt4Line22_PassportNumber[0]', b?.passport_number || '');
    setText(form, 'Pt4Line23_TravelDocNumber[0]', b?.travel_doc_number || '');
    setText(form, 'Pt4Line24_CountryOfIssuance[0]', b?.passport_country || '');
    setText(form, 'Pt4Line25_ExpDate[0]', b?.passport_expiration || '');
    setText(form, 'Pt4Line21d_DateExpired[0]', b?.authorized_stay_expiration || '');

    // I-94 number
    // The I-94 field is a multi-box field, try setting it as text
    setText(form, 'Pt4Line21b_ArrivalDeparture[0]', b?.i94_number || '');

    // Petitioner contact info
    setText(form, 'Pt6Line3_DaytimePhoneNumber[0]', p?.phone || '');
    setText(form, 'Pt6Line4_MobileNumber[0]', p?.phone || '');
    setText(form, 'Pt6Line5_Email[0]', p?.email || '');

    // ===== PAGE 8 - Last address together =====

    // Use petitioner mailing address as "last address together" if same
    const lastAddr = p?.mailing_address || {};
    setText(form, 'Pt4Line57_StreetNumberName[0]', lastAddr.street || '');
    setText(form, 'Pt4Line57_AptSteFlrNumber[0]', lastAddr.unit_number || '');
    setText(form, 'Pt4Line57_CityOrTown[0]', lastAddr.city || '');
    selectDropdown(form, 'Pt4Line57_State[0]', lastAddr.state || '');
    setText(form, 'Pt4Line57_ZipCode[0]', lastAddr.zip || '');
    setText(form, 'Pt4Line57_Country[0]', lastAddr.country || '');

    const lastUnitType = (lastAddr.apt_ste_flr || '').toLowerCase();
    if (lastUnitType.includes('apt')) {
      checkBox(form, 'Pt4Line57_Unit[0]');
    }

    // Previously filed petition
    if (p?.previously_filed_petition === 'Yes') {
      checkBox(form, 'Part4Line1_Yes[0]');
    } else {
      checkBox(form, 'Part4Line1_No[0]');
    }

    // Add metadata about failed fields so the lawyer knows what to check
    if (failedFields.length > 0) {
      console.warn('Fields that failed to fill:', failedFields);
      pdfDoc.setSubject(`AutoFill warnings: The following fields could not be filled automatically and should be checked manually: ${failedFields.join(', ')}`);
    }

    // Save with fallback — XFA forms can have internal ref issues during save
    let filledPdfBytes: Uint8Array | null = null;
    let saveTier = 0;

    // Attempt 1: normal save with field appearances (XFA has been stripped from template)
    try {
      filledPdfBytes = await pdfDoc.save();
      saveTier = 1;
    } catch (e1) {
      console.warn('Save attempt 1 (normal) failed:', e1);
    }

    // Attempt 2: save without updating appearances (fallback)
    if (!filledPdfBytes) {
      try {
        filledPdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
        saveTier = 2;
      } catch (e2) {
        console.warn('Save attempt 2 (no appearances) failed:', e2);
      }
    }

    // Attempt 3: flatten form then save
    if (!filledPdfBytes) {
      try {
        form.flatten();
        filledPdfBytes = await pdfDoc.save();
        saveTier = 3;
      } catch (e3) {
        console.warn('Save attempt 3 (flatten) failed:', e3);
      }
    }

    // Attempt 3: reload blank PDF, fill ONLY text fields (no dropdowns, no checkboxes)
    if (!filledPdfBytes) {
      try {
        const freshBytes = await readFile(pdfPath);
        const freshDoc = await PDFDocument.load(freshBytes, { ignoreEncryption: true });
        const freshForm = freshDoc.getForm();
        const criticalFields: [string, string][] = [
          ['Pt2Line4a_FamilyName[0]', p?.family_name || ''],
          ['Pt2Line4b_GivenName[0]', p?.given_name || ''],
          ['Pt2Line4c_MiddleName[0]', p?.middle_name || ''],
          ['Pt2Line11_SSN[0]', removeDashes(p?.ssn || '')],
          ['Pt2Line6_CityTownOfBirth[0]', p?.city_of_birth || ''],
          ['Pt2Line7_CountryofBirth[0]', p?.country_of_birth || ''],
          ['Pt2Line8_DateofBirth[0]', p?.date_of_birth || ''],
          ['Pt2Line10_StreetNumberName[0]', p?.mailing_address?.street || ''],
          ['Pt2Line10_CityOrTown[0]', p?.mailing_address?.city || ''],
          ['Pt2Line10_ZipCode[0]', p?.mailing_address?.zip || ''],
          ['Pt2Line18_DateOfMarriage[0]', p?.date_of_marriage || ''],
          ['Pt4Line4a_FamilyName[0]', b?.family_name || ''],
          ['Pt4Line4b_GivenName[0]', b?.given_name || ''],
          ['Pt4Line4c_MiddleName[0]', b?.middle_name || ''],
          ['Pt4Line3_SSN[0]', removeDashes(b?.ssn || '')],
          ['Pt4Line7_CityTownOfBirth[0]', b?.city_of_birth || ''],
          ['Pt4Line8_CountryOfBirth[0]', b?.country_of_birth || ''],
          ['Pt4Line9_DateOfBirth[0]', b?.date_of_birth || ''],
          ['Pt4Line14_DaytimePhoneNumber[0]', b?.phone || ''],
        ];
        for (const [field, value] of criticalFields) {
          if (value?.trim()) {
            try { freshForm.getTextField(field).setText(value); } catch { /* skip */ }
          }
        }
        freshDoc.setSubject('WARNING: Limited auto-fill due to PDF compatibility issue. Please review all fields.');
        filledPdfBytes = await freshDoc.save({ updateFieldAppearances: false });
      } catch (e4) {
        console.warn('Save attempt 4 (fresh text-only) failed:', e4);
      }
    }

    // Attempt 5: raw blank PDF bytes without any modification
    if (!filledPdfBytes) {
      saveTier = 5;
      filledPdfBytes = new Uint8Array(await readFile(pdfPath));
    }

    const duration = Date.now() - startTime;
    logApiCall({
      endpoint: 'generate',
      status: saveTier <= 1 ? 'success' : saveTier <= 3 ? 'fallback' : 'error',
      status_code: 200,
      duration_ms: duration,
      relationship: rel || 'unknown',
      save_tier: saveTier,
      failed_fields: failedFields.slice(0, 50),
      failed_field_count: failedFields.length,
      error_message: saveTier > 1 ? `Used save tier ${saveTier}` : undefined,
      error_type: saveTier > 1 ? 'pdf_save' : undefined,
    });

    const headers: Record<string, string> = {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="I-130-filled.pdf"',
    };

    if (failedFields.length > 0) {
      headers['X-Failed-Fields'] = failedFields.join(', ');
    }
    headers['X-Save-Tier'] = String(saveTier);

    return new Response(Buffer.from(filledPdfBytes), { headers });
  } catch (error) {
    const duration = Date.now() - startTime;
    logApiCall({
      endpoint: 'generate',
      status: 'error',
      status_code: 500,
      duration_ms: duration,
      error_message: String(error).slice(0, 200),
      error_type: 'unknown',
    });
    console.error('Generate route error:', error);
    return Response.json(
      { error: 'Failed to generate PDF', details: String(error) },
      { status: 500 }
    );
  }
}
