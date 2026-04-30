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

export async function POST(request: Request) {
  const startTime = Date.now();
  failedFields.length = 0;

  try {
    const data = await request.json();
    const b = data.beneficiary;

    // Load blank I-130A PDF
    const pdfPath = join(process.cwd(), 'public', 'i-130a-blank.pdf');
    const pdfBytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    buildFieldNameMap(form);

    // ===== PART 1: Information About You (= beneficiary spouse) =====

    // Beneficiary name
    setText(form, 'Pt1Line3a_FamilyName[0]', b?.family_name || '');
    setText(form, 'Pt1Line3b_GivenName[0]', b?.given_name || '');
    setText(form, 'Pt1Line3c_MiddleName[0]', b?.middle_name || '');

    // A-Number — strip "A-" prefix
    const aNum = (b?.a_number || '').replace(/^A-?/i, '').trim();
    if (aNum) {
      setText(form, 'Pt1Line1_AlienNumber[0]', aNum);
    }

    // ===== Current Physical Address =====
    const bAddr = b?.current_address || {};
    setText(form, 'Pt1Line4a_StreetNumberName[0]', bAddr.street || '');
    setText(form, 'Pt1Line4b_AptSteFlrNumber[0]', bAddr.unit_number || '');
    setText(form, 'Pt1Line4c_CityOrTown[0]', bAddr.city || '');
    setText(form, 'Pt1Line4e_ZipCode[0]', bAddr.zip || '');
    setText(form, 'Pt1Line4h_Country[0]', bAddr.country || '');

    // Current address unit type checkboxes
    const unitType = (bAddr.apt_ste_flr || '').toLowerCase();
    if (unitType.includes('apt')) {
      checkBox(form, 'Pt1Line4b_Unit[0]');
    } else if (unitType.includes('ste') || unitType.includes('suite')) {
      checkBox(form, 'Pt1Line4b_Unit[1]');
    } else if (unitType.includes('flr') || unitType.includes('floor')) {
      checkBox(form, 'Pt1Line4b_Unit[2]');
    }

    // Current address dates
    setText(form, 'Pt1Line5a_DateFrom[0]', bAddr.date_from || b?.address_date_from || '');
    setText(form, 'Pt1Line5b_DateTo[0]', bAddr.date_to || b?.address_date_to || '');

    // ===== Address History =====
    const bHist = (b?.address_history && b.address_history[0]) || {};
    if (bHist.street) {
      setText(form, 'Pt1Line6a_StreetNumberName[0]', bHist.street || '');
      setText(form, 'Pt1Line6b_AptSteFlrNumber[0]', bHist.unit_number || '');
      setText(form, 'Pt1Line6c_CityOrTown[0]', bHist.city || '');
      setText(form, 'Pt1Line6e_ZipCode[0]', bHist.zip || '');
      setText(form, 'Pt1Line6h_Country[0]', bHist.country || '');
      setText(form, 'Pt1Line7a_DateFrom[0]', bHist.date_from || '');
      setText(form, 'Pt1Line7b_DateTo[0]', bHist.date_to || '');

      // Address history unit type checkboxes
      const histUnitType = (bHist.apt_ste_flr || '').toLowerCase();
      if (histUnitType.includes('apt')) {
        checkBox(form, 'Pt1Line6b_Unit[0]');
      } else if (histUnitType.includes('ste') || histUnitType.includes('suite')) {
        checkBox(form, 'Pt1Line6b_Unit[1]');
      } else if (histUnitType.includes('flr') || histUnitType.includes('floor')) {
        checkBox(form, 'Pt1Line6b_Unit[2]');
      }
    }

    // ===== Last Address Outside the US =====
    const lastOutside = b?.last_address_outside_us || {};
    if (lastOutside.street || lastOutside.city) {
      setText(form, 'Pt1Line8a_StreetNumberName[0]', lastOutside.street || '');
      setText(form, 'Pt1Line8c_CityOrTown[0]', lastOutside.city || '');
      setText(form, 'Pt1Line8d_Province[0]', lastOutside.province || '');
      setText(form, 'Pt1Line8f_Country[0]', lastOutside.country || '');
      setText(form, 'Pt1Line9a_DateFrom[0]', lastOutside.date_from || '');
      setText(form, 'Pt1Line9b_DateTo[0]', lastOutside.date_to || '');
    }

    // ===== Parent 1 (Beneficiary's) =====
    setText(form, 'Pt1Line10_FamilyName[0]', b?.parent1_family_name || '');
    setText(form, 'Pt1Line10_GivenName[0]', b?.parent1_given_name || '');
    setText(form, 'Pt1Line10_MiddleName[0]', b?.parent1_middle_name || '');
    setText(form, 'Pt1Line11_DateofBirth[0]', b?.parent1_dob || '');
    setText(form, 'Pt1Line12CityTownOfBirth[0]', b?.parent1_city_of_birth || '');
    setText(form, 'Pt1Line13_CountryofBirth[0]', b?.parent1_country_of_birth || '');

    // Parent 1 sex
    if (b?.parent1_sex === 'M') {
      checkBox(form, 'Pt1Line12_Male[0]');
    } else if (b?.parent1_sex === 'F') {
      checkBox(form, 'Pt1Line12_Female[0]');
    }

    // ===== Parent 2 (Beneficiary's) =====
    setText(form, 'Pt1Line16_FamilyName[0]', b?.parent2_family_name || '');
    setText(form, 'Pt1Line16_GivenName[0]', b?.parent2_given_name || '');
    setText(form, 'Pt1Line17_DateofBirth[0]', b?.parent2_dob || '');
    setText(form, 'Pt1Line18_CityTownOfBirth[0]', b?.parent2_city_of_birth || '');
    setText(form, 'Pt1Line19_CountryofBirth[0]', b?.parent2_country_of_birth || '');

    // Parent 2 sex
    if (b?.parent2_sex === 'M') {
      checkBox(form, 'Pt1Line19_Male[0]');
    } else if (b?.parent2_sex === 'F') {
      checkBox(form, 'Pt1Line19_Female[0]');
    }

    // ===== PART 2: Employment =====
    setText(form, 'Pt2Line1_EmployerOrCompName[0]', b?.employer_name || '');
    setText(form, 'Pt2Line2a_StreetNumberName[0]', b?.employer_street || '');
    setText(form, 'Pt2Line2c_CityOrTown[0]', b?.employer_city || '');
    setText(form, 'Pt2Line2e_ZipCode[0]', b?.employer_zip || '');
    setText(form, 'Pt2Line2h_Country[0]', b?.employer_country || '');
    setText(form, 'Pt2Line3_Occupation[0]', b?.occupation || '');
    setText(form, 'Pt2Line4a_DateFrom[0]', b?.employment_date_from || '');

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
      endpoint: 'generate-i130a' as 'generate',
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
        'Content-Disposition': 'attachment; filename="I-130A-filled.pdf"',
        'X-Save-Tier': String(saveTier),
        ...(failedFields.length > 0 ? { 'X-Failed-Fields': failedFields.join(', ') } : {}),
      },
    });
  } catch (error) {
    logApiCall({
      endpoint: 'generate-i130a' as 'generate',
      status: 'error',
      status_code: 500,
      duration_ms: Date.now() - startTime,
      error_message: String(error).slice(0, 200),
      error_type: 'unknown',
    });
    console.error('Generate I-130A route error:', error);
    return Response.json(
      { error: 'Failed to generate I-130A PDF', details: String(error) },
      { status: 500 }
    );
  }
}
