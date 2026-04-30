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

    // Load blank I-601 PDF
    const pdfPath = join(process.cwd(), 'public', 'i-601-blank.pdf');
    const pdfBytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    buildFieldNameMap(form);

    // ===== PART 1: Information About You (Applicant = beneficiary) =====

    // Applicant name
    setText(form, 'p1Line3aFamilyName[0]', b?.family_name || '');
    setText(form, 'p1Line3bGivenName[0]', b?.given_name || '');
    setText(form, 'p1Line3cMiddleName[0]', b?.middle_name || '');

    // A-Number — strip "A-" prefix
    const aNum = (b?.a_number || '').replace(/^A-?/i, '').trim();
    if (aNum) {
      setText(form, 'p1Line1ANum[0]', aNum);
    }

    // SSN (remove dashes)
    setText(form, 'p1Line8SSN[0]', removeDashes(b?.ssn || ''));

    // Sex - [0] = Male, [1] = Female
    if (b?.sex === 'M') {
      checkBox(form, 'p1Line9Gender[0]');
    } else if (b?.sex === 'F') {
      checkBox(form, 'p1Line9Gender[1]');
    }

    // Date of birth
    setText(form, 'p1Line10DateofBirth[0]', b?.date_of_birth || '');

    // Place of birth
    setText(form, 'p1Line11CityOrTownOfBirth[0]', b?.city_of_birth || '');
    setText(form, 'p1Line13CountryOfBirth[0]', b?.country_of_birth || '');

    // Country of citizenship/nationality
    setText(form, 'p1Line14CountryOfCitzOrNat[0]', b?.country_of_citizenship || b?.country_of_birth || '');

    // ===== Applicant US mailing address =====
    const bAddr = b?.current_address || {};
    setText(form, 'p1Line5StreetNumberName[0]', bAddr.street || '');
    setText(form, 'p1Line5AptSteFlrNumber[0]', bAddr.unit_number || '');
    setText(form, 'p1Line5CityOrTown[0]', bAddr.city || '');
    setText(form, 'p1Line5ZipCode[0]', bAddr.zip || '');
    setText(form, 'p1Line5Country[0]', bAddr.country || '');

    // Unit type checkboxes: [0] = Apt, [1] = Ste, [2] = Flr
    const unitType = (bAddr.apt_ste_flr || '').toLowerCase();
    if (unitType.includes('apt')) {
      checkBox(form, 'p1Line5Unit[0]');
    } else if (unitType.includes('ste') || unitType.includes('suite')) {
      checkBox(form, 'p1Line5Unit[1]');
    } else if (unitType.includes('flr') || unitType.includes('floor')) {
      checkBox(form, 'p1Line5Unit[2]');
    }

    // Last address abroad
    const lastAbroad = b?.last_address_outside_us || {};
    if (lastAbroad.street || lastAbroad.city) {
      setText(form, 'p1Line7StreetNumberName[0]', lastAbroad.street || '');
      setText(form, 'p1Line7CityTown[0]', lastAbroad.city || '');
      setText(form, 'p1Line7Country[0]', lastAbroad.country || '');
    }

    // ===== PART 2: Immigration Information =====

    // Date of entry
    setText(form, 'p2Line1aDateEntered[0]', b?.date_of_arrival || '');

    // Immigration status at entry
    setText(form, 'p2Line1bImmigrationStatus[0]', b?.class_of_admission || '');

    // ===== PART 3: Biographic Information =====

    // Ethnicity - [0] = Not Hispanic, [1] = Hispanic
    const ethnicity = (b?.ethnicity || '').toLowerCase();
    if (ethnicity.includes('not hispanic') || ethnicity === 'not hispanic or latino') {
      checkBox(form, 'p3Line1Ethnicity[0]');
    } else if (ethnicity.includes('hispanic')) {
      checkBox(form, 'p3Line1Ethnicity[1]');
    }

    // Race
    const race = (b?.race || '').toLowerCase();
    if (race.includes('white')) {
      checkBox(form, 'p3Line2Race[0]');
    }
    if (race.includes('asian')) {
      checkBox(form, 'p3Line2Race[1]');
    }
    if (race.includes('black')) {
      checkBox(form, 'p3Line2Race[2]');
    }
    if (race.includes('american indian') || race.includes('alaska native')) {
      checkBox(form, 'p3Line2Race[3]');
    }
    if (race.includes('native hawaiian') || race.includes('pacific islander')) {
      checkBox(form, 'p3Line2Race[4]');
    }

    // Height
    setText(form, 'p3Line3HeightFeet[0]', b?.height_feet || '');
    setText(form, 'p3Line3HeightInches[0]', b?.height_inches || '');

    // Weight - individual digits
    const weight = (b?.weight_lbs || '').toString();
    if (weight) {
      const padded = weight.padStart(3, '0');
      setText(form, 'p3Line4Weight1[0]', padded[0]);
      setText(form, 'p3Line4Weight2[0]', padded[1]);
      setText(form, 'p3Line4Weight3[0]', padded[2]);
    }

    // Eye color: [0]=Black, [1]=Blue, [2]=Brown, [3]=Gray, [4]=Green,
    //            [5]=Hazel, [6]=Maroon, [7]=Pink, [8]=Unknown
    const eyeColorMap: Record<string, number> = {
      black: 0, blue: 1, brown: 2, gray: 3, grey: 3, green: 4,
      hazel: 5, maroon: 6, pink: 7, unknown: 8,
    };
    const eyeColor = (b?.eye_color || '').toLowerCase();
    if (eyeColor in eyeColorMap) {
      checkBox(form, `p3Line5EyeColor[${eyeColorMap[eyeColor]}]`);
    }

    // Hair color: [0]=Bald, [1]=Black, [2]=Blond, [3]=Brown, [4]=Gray,
    //             [5]=Red, [6]=Sandy, [7]=White, [8]=Unknown
    const hairColorMap: Record<string, number> = {
      bald: 0, black: 1, blond: 2, blonde: 2, brown: 3,
      gray: 4, grey: 4, red: 5, sandy: 6, white: 7, unknown: 8,
    };
    const hairColor = (b?.hair_color || '').toLowerCase();
    if (hairColor in hairColorMap) {
      checkBox(form, `p3Line6HairColor[${hairColorMap[hairColor]}]`);
    }

    // ===== PART 5: Qualifying Relative 1 (= petitioner) =====

    setText(form, 'p5Line1aFamilyName[0]', p?.family_name || '');
    setText(form, 'p5Line1bGivenName[0]', p?.given_name || '');
    setText(form, 'p5Line1cMiddleName[0]', p?.middle_name || '');

    // Qualifying relative address
    const pAddr = p?.mailing_address || {};
    setText(form, 'p5Line2StreetNumberName[0]', pAddr.street || '');
    setText(form, 'p5Line2CityOrTown[0]', pAddr.city || '');
    setText(form, 'p5Line2ZipCode[0]', pAddr.zip || '');
    setText(form, 'p5Line2Country[0]', pAddr.country || '');

    // Qualifying relative contact
    setText(form, 'p5Line3DayPhone[0]', p?.phone || '');
    setText(form, 'p5Line4Email[0]', p?.email || '');

    // Relationship to applicant
    setText(form, 'p5Line5Relationship[0]', data.relationship || '');

    // Qualifying relative immigration status
    setText(form, 'p5Line6ImmigrationStatus[0]', p?.immigration_status || '');

    // Qualifying relative date of birth
    setText(form, 'p5Line8DateofBirth[0]', p?.date_of_birth || '');

    // ===== PART 7: Contact Information =====

    setText(form, 'p7Line1DayPhone[0]', b?.phone || '');
    setText(form, 'p7Line2MobilePhone[0]', b?.mobile_phone || '');
    setText(form, 'p7Line3Email[0]', b?.email || '');

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
      endpoint: 'generate-i601' as 'generate',
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
        'Content-Disposition': 'attachment; filename="I-601-filled.pdf"',
        'X-Save-Tier': String(saveTier),
        ...(failedFields.length > 0 ? { 'X-Failed-Fields': failedFields.join(', ') } : {}),
      },
    });
  } catch (error) {
    logApiCall({
      endpoint: 'generate-i601' as 'generate',
      status: 'error',
      status_code: 500,
      duration_ms: Date.now() - startTime,
      error_message: String(error).slice(0, 200),
      error_type: 'unknown',
    });
    console.error('Generate I-601 route error:', error);
    return Response.json(
      { error: 'Failed to generate I-601 PDF', details: String(error) },
      { status: 500 }
    );
  }
}
