import { PDFDocument } from 'pdf-lib';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { logApiCall } from '@/lib/api-logger';

export const maxDuration = 30;

const failedFields: string[] = [];

let fieldNameMap: Record<string, string> = {};

function buildFieldNameMap(form: ReturnType<PDFDocument['getForm']>) {
  fieldNameMap = {};
  const fields = form.getFields();
  for (const field of fields) {
    const fullName = field.getName();
    const parts = fullName.split('.');
    const shortName = parts[parts.length - 1];
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
  } catch {
    failedFields.push(fieldName);
  }
}

function checkBox(form: ReturnType<PDFDocument['getForm']>, fieldName: string) {
  try {
    form.getCheckBox(resolve(fieldName)).check();
  } catch {
    failedFields.push(fieldName);
  }
}

function removeDashes(ssn: string): string {
  return (ssn || '').replace(/-/g, '');
}

export async function POST(request: Request) {
  const startTime = Date.now();
  failedFields.length = 0;

  try {
    const data = await request.json();
    const p = data.petitioner;
    const b = data.beneficiary;

    // Load blank I-360 PDF
    const pdfPath = join(process.cwd(), 'public', 'i-360-blank.pdf');
    const pdfBytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    buildFieldNameMap(form);

    // ===== PART 1: Information About You (= petitioner) =====

    // Petitioner name
    setText(form, 'Pt1Line1_FamilyName[0]', p?.family_name || '');
    setText(form, 'Pt1Line1_GivenName[0]', p?.given_name || '');
    setText(form, 'Pt1Line1_MiddleName[0]', p?.middle_name || '');

    // SSN
    setText(form, 'Pt1Line3_SSN[0]', removeDashes(p?.ssn || ''));

    // Petitioner address
    const pAddr = p?.mailing_address || {};
    setText(form, 'Pt1Line6_StreetNumberName[0]', pAddr.street || '');
    setText(form, 'Pt1Line6_AptSteFlrNumber[0]', pAddr.unit_number || '');
    setText(form, 'Pt1Line6_CityOrTown[0]', pAddr.city || '');
    setText(form, 'Pt1Line6_State[0]', pAddr.state || '');
    setText(form, 'Pt1Line6_ZipCode[0]', pAddr.zip || '');
    setText(form, 'Pt1Line6_Country[0]', pAddr.country || '');

    // Petitioner address unit type checkboxes
    const pUnitType = (pAddr.apt_ste_flr || '').toLowerCase();
    if (pUnitType.includes('apt')) {
      checkBox(form, 'Pt1Line6_Unit[0]');
    } else if (pUnitType.includes('ste') || pUnitType.includes('suite')) {
      checkBox(form, 'Pt1Line6_Unit[1]');
    } else if (pUnitType.includes('flr') || pUnitType.includes('floor')) {
      checkBox(form, 'Pt1Line6_Unit[2]');
    }

    // ===== PART 3: Information About the Person This Petition Is For (= beneficiary) =====

    // Beneficiary name
    setText(form, 'Pt3Line1_FamilyName[0]', b?.family_name || '');
    setText(form, 'Pt3Line1_GivenName[0]', b?.given_name || '');
    setText(form, 'Pt3Line1_MiddleName[0]', b?.middle_name || '');

    // Beneficiary address
    const bAddr = b?.current_address || {};
    setText(form, 'Pt3Line2_StreetNumberName[0]', bAddr.street || '');
    setText(form, 'Pt3Line2_AptSteFlrNumber[0]', bAddr.unit_number || '');
    setText(form, 'Pt3Line2_CityOrTown[0]', bAddr.city || '');
    setText(form, 'Pt3Line2_State[0]', bAddr.state || '');
    setText(form, 'Pt3Line2_ZipCode[0]', bAddr.zip || '');
    setText(form, 'Pt3Line2_Country[0]', bAddr.country || '');

    // Beneficiary address unit type checkboxes
    const bUnitType = (bAddr.apt_ste_flr || '').toLowerCase();
    if (bUnitType.includes('apt')) {
      checkBox(form, 'Pt3Line2_Unit[0]');
    } else if (bUnitType.includes('ste') || bUnitType.includes('suite')) {
      checkBox(form, 'Pt3Line2_Unit[1]');
    } else if (bUnitType.includes('flr') || bUnitType.includes('floor')) {
      checkBox(form, 'Pt3Line2_Unit[2]');
    }

    // DOB
    setText(form, 'Pt3Line3_DateOfBirth[0]', b?.date_of_birth || '');

    // Country of birth
    setText(form, 'Pt3Line4_CountryOfBirth[0]', b?.country_of_birth || '');

    // SSN
    setText(form, 'Pt3Line5_SSN[0]', removeDashes(b?.ssn || ''));

    // Marital status: 0=single, 1=married, 2=divorced, 3=widowed
    const maritalStatus = (b?.marital_status || '').toLowerCase();
    if (maritalStatus === 'single' || maritalStatus === 'never married') {
      checkBox(form, 'Pt3Line7_MaritalStatus[0]');
    } else if (maritalStatus === 'married') {
      checkBox(form, 'Pt3Line7_MaritalStatus[1]');
    } else if (maritalStatus === 'divorced') {
      checkBox(form, 'Pt3Line7_MaritalStatus[2]');
    } else if (maritalStatus === 'widowed') {
      checkBox(form, 'Pt3Line7_MaritalStatus[3]');
    }

    // Date of last arrival
    setText(form, 'Pt3Line8_DateOfLastArrival[0]', b?.date_of_arrival || '');

    // I-94 number
    setText(form, 'Pt3Line9_I94[0]', b?.i94_number || '');

    // Passport number
    setText(form, 'Pt3Line10_Passport[0]', b?.passport_number || '');

    // Travel document number
    setText(form, 'Pt3Line11_TravelDoc[0]', b?.travel_doc_number || '');

    // Country of issuance
    setText(form, 'Pt3Line12_CountryOfIssuanceDocument[0]', b?.passport_country || '');

    // Passport/travel doc expiration date
    setText(form, 'Pt3Line13_ExpDate[0]', b?.passport_expiration || '');

    // Nationality / current USCIS status
    setText(form, 'Pt3Line14_CurrentUSCISStatus[0]', b?.country_of_citizenship || b?.country_of_birth || '');

    // ===== PART 6: Information About Your Parents (= beneficiary's parents) =====

    // Parent 1
    setText(form, 'Pt6Line1_FamilyName[0]', b?.parent1_family_name || '');
    setText(form, 'Pt6Line1_GivenName[0]', b?.parent1_given_name || '');

    // Parent 2
    setText(form, 'Pt6Line3_FamilyName[0]', b?.parent2_family_name || '');
    setText(form, 'Pt6Line3_GivenName[0]', b?.parent2_given_name || '');
    setText(form, 'Pt6Line4_DateOfBirth[0]', b?.parent2_dob || '');
    setText(form, 'Pt6Line5_CountryOfBirth[0]', b?.parent2_country_of_birth || '');

    // ===== Save PDF =====
    let filledPdfBytes: Uint8Array | null = null;
    let saveTier = 0;

    try {
      filledPdfBytes = await pdfDoc.save();
      saveTier = 1;
    } catch {
      // Fallback: save without updating appearances
      try {
        filledPdfBytes = await pdfDoc.save({ updateFieldAppearances: false });
        saveTier = 2;
      } catch {
        // Last resort: flatten
        try {
          form.flatten();
          filledPdfBytes = await pdfDoc.save();
          saveTier = 3;
        } catch {
          saveTier = 4;
          filledPdfBytes = new Uint8Array(await readFile(pdfPath));
        }
      }
    }

    const duration = Date.now() - startTime;
    logApiCall({
      endpoint: 'generate-i360' as 'generate',
      status: saveTier <= 1 ? 'success' : saveTier <= 3 ? 'fallback' : 'error',
      status_code: 200,
      duration_ms: duration,
      save_tier: saveTier,
      failed_fields: failedFields.slice(0, 50),
      failed_field_count: failedFields.length,
    });

    return new Response(Buffer.from(filledPdfBytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="I-360-filled.pdf"',
        'X-Save-Tier': String(saveTier),
        ...(failedFields.length > 0 ? { 'X-Failed-Fields': failedFields.join(', ') } : {}),
      },
    });
  } catch (error) {
    logApiCall({
      endpoint: 'generate-i360' as 'generate',
      status: 'error',
      status_code: 500,
      duration_ms: Date.now() - startTime,
      error_message: String(error).slice(0, 200),
      error_type: 'unknown',
    });
    console.error('Generate I-360 route error:', error);
    return Response.json(
      { error: 'Failed to generate I-360 PDF', details: String(error) },
      { status: 500 }
    );
  }
}
