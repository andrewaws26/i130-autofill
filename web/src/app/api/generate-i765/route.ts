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
    const b = data.beneficiary;

    // Load blank I-765 PDF
    const pdfPath = join(process.cwd(), 'public', 'i-765-blank.pdf');
    const pdfBytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    buildFieldNameMap(form);

    // ===== Applicant Name (= beneficiary) =====
    setText(form, 'Line1a_FamilyName[0]', b?.family_name || '');
    setText(form, 'Line1b_GivenName[0]', b?.given_name || '');
    setText(form, 'Line1c_MiddleName[0]', b?.middle_name || '');

    // Other names used
    if (b?.other_names) {
      setText(form, 'Line2a_FamilyName[0]', b.other_names);
    }

    // ===== Mailing Address =====
    const bAddr = b?.current_address || {};
    setText(form, 'Line4b_StreetNumberName[0]', bAddr.street || '');
    setText(form, 'Pt2Line5_AptSteFlrNumber[0]', bAddr.unit_number || '');
    setText(form, 'Pt2Line5_CityOrTown[0]', bAddr.city || '');
    setText(form, 'Pt2Line5_State[0]', bAddr.state || '');
    setText(form, 'Pt2Line5_ZipCode[0]', bAddr.zip || '');

    // ===== A-Number =====
    if (b?.a_number) {
      setText(form, 'Line7_AlienNumber[0]', b.a_number);
    }

    // ===== Eligibility Category =====
    setText(form, 'section_1[0]', b?.eligibility_category || '');

    // ===== SSN =====
    setText(form, 'Line12b_SSN[0]', removeDashes(b?.ssn || ''));

    // ===== Country / Place of Birth =====
    setText(form, 'Line17a_CountryOfBirth[0]', b?.country_of_birth || '');
    setText(form, 'Line16_CountryOfCitizenship[0]', b?.country_of_citizenship || b?.country_of_birth || '');
    setText(form, 'Line18a_CityTownOfBirth[0]', b?.city_of_birth || '');

    // ===== Date of Birth =====
    setText(form, 'Line19_DOB[0]', b?.date_of_birth || '');

    // ===== Sex =====
    // [0] = Male, [1] = Female
    if (b?.sex === 'M') {
      checkBox(form, 'Line19_Checkbox[0]');
    } else if (b?.sex === 'F') {
      checkBox(form, 'Line19_Checkbox[1]');
    }

    // ===== I-94 / Passport / Travel Document =====
    setText(form, 'Line20a_I94Number[0]', b?.i94_number || '');
    setText(form, 'Line20b_Passport[0]', b?.passport_number || '');
    setText(form, 'Line20c_TravelDoc[0]', b?.travel_doc_number || '');
    setText(form, 'Line20d_CountryOfIssuance[0]', b?.passport_country || '');
    setText(form, 'Line20e_ExpDate[0]', b?.passport_expiration || '');

    // ===== Entry / Status =====
    setText(form, 'Line21_DateOfLastEntry[0]', b?.date_of_arrival || '');
    setText(form, 'Line23_StatusLastEntry[0]', b?.class_of_admission || '');
    setText(form, 'Line24_CurrentStatus[0]', b?.class_of_admission || '');

    // ===== Contact Information =====
    setText(form, 'Pt3Line3_DaytimePhoneNumber1[0]', b?.phone || '');
    setText(form, 'Pt3Line4_MobileNumber1[0]', b?.mobile_phone || '');
    setText(form, 'Pt3Line5_Email[0]', b?.email || '');

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
      endpoint: 'generate-i765' as 'generate',
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
        'Content-Disposition': 'attachment; filename="I-765-filled.pdf"',
        'X-Save-Tier': String(saveTier),
        ...(failedFields.length > 0 ? { 'X-Failed-Fields': failedFields.join(', ') } : {}),
      },
    });
  } catch (error) {
    logApiCall({
      endpoint: 'generate-i765' as 'generate',
      status: 'error',
      status_code: 500,
      duration_ms: Date.now() - startTime,
      error_message: String(error).slice(0, 200),
      error_type: 'unknown',
    });
    console.error('Generate I-765 route error:', error);
    return Response.json(
      { error: 'Failed to generate I-765 PDF', details: String(error) },
      { status: 500 }
    );
  }
}
