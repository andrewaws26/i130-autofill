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

    // Load blank I-485 PDF
    const pdfPath = join(process.cwd(), 'public', 'i-485-blank.pdf');
    const pdfBytes = await readFile(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

    const form = pdfDoc.getForm();
    buildFieldNameMap(form);

    // ===== PART 1: Information About You (= beneficiary) =====

    // Applicant name
    setText(form, 'Pt1Line1_FamilyName[0]', b?.family_name || '');
    setText(form, 'Pt1Line1_GivenName[0]', b?.given_name || '');
    setText(form, 'Pt1Line1_MiddleName[0]', b?.middle_name || '');

    // Other names used
    if (b?.other_names) {
      setText(form, 'Pt1Line2_FamilyName[0]', b.other_names);
    }

    // DOB
    setText(form, 'Pt1Line3_DOB[0]', b?.date_of_birth || '');

    // Sex - [0] = Male, [1] = Female
    if (b?.sex === 'M') {
      checkBox(form, 'Pt1Line6_CB_Sex[0]');
    } else if (b?.sex === 'F') {
      checkBox(form, 'Pt1Line6_CB_Sex[1]');
    }

    // Place of birth
    setText(form, 'Pt1Line7_CityTownOfBirth[0]', b?.city_of_birth || '');
    setText(form, 'Pt1Line7_CountryOfBirth[0]', b?.country_of_birth || '');

    // Country of citizenship
    setText(form, 'Pt1Line8_CountryofCitizenshipNationality[0]', b?.country_of_citizenship || b?.country_of_birth || '');

    // A-Number (if known)
    if (b?.a_number) {
      setText(form, 'Pt1Line4_AlienNumber[0]', b.a_number);
    }

    // I-94 number
    setText(form, 'Pt1Line12_I94[0]', b?.i94_number || '');

    // Date of last arrival
    setText(form, 'Pt1Line10_DateofArrival[0]', b?.date_of_arrival || '');

    // Class of admission / immigration status
    setText(form, 'Pt1Line11_Admitted[0]', b?.class_of_admission || '');
    setText(form, 'Pt1Line12_Status[0]', b?.class_of_admission || '');

    // Passport info
    setText(form, 'Pt1Line10_PassportNum[0]', b?.passport_number || '');
    setText(form, 'Pt1Line10_Passport[0]', b?.passport_country || '');
    setText(form, 'Pt1Line10_ExpDate[0]', b?.passport_expiration || '');

    // SSN
    setText(form, 'Pt1Line19_SSN[0]', removeDashes(b?.ssn || ''));

    // SSN - has SSN checkbox
    if (b?.ssn) {
      checkBox(form, 'Pt1Line19_YN[0]'); // Yes, has SSN
    } else {
      checkBox(form, 'Pt1Line19_YN[1]'); // No SSN
    }

    // ===== APPLICANT ADDRESS (= beneficiary address) =====
    const bAddr = b?.current_address || {};
    setText(form, 'Pt1Line18_StreetNumberName[0]', bAddr.street || '');
    setText(form, 'Pt1Line18US_AptSteFlrNumber[0]', bAddr.unit_number || '');
    setText(form, 'Pt1Line18_CityOrTown[0]', bAddr.city || '');
    setText(form, 'Pt1Line18_State[0]', bAddr.state || '');
    setText(form, 'Pt1Line18_ZipCode[0]', bAddr.zip || '');

    // Unit type checkboxes
    const unitType = (bAddr.apt_ste_flr || '').toLowerCase();
    if (unitType.includes('apt')) {
      checkBox(form, 'Pt1Line18US_Unit[0]');
    } else if (unitType.includes('ste') || unitType.includes('suite')) {
      checkBox(form, 'Pt1Line18US_Unit[1]');
    } else if (unitType.includes('flr') || unitType.includes('floor')) {
      checkBox(form, 'Pt1Line18US_Unit[2]');
    }

    // Address history
    const bHist = (b?.address_history && b.address_history[0]) || {};
    if (bHist.street) {
      setText(form, 'Pt1Line18_PriorStreetName[0]', bHist.street || '');
      setText(form, 'Pt1Line18_PriorCity[0]', bHist.city || '');
      setText(form, 'Pt1Line18_PriorZipCode[0]', bHist.zip || '');
      setText(form, 'Pt1Line18_PriorCountry[0]', bHist.country || '');
      setText(form, 'Pt1Line18_PriorDateFrom[0]', bHist.date_from || '');
      setText(form, 'Pt1Line18PriorDateTo[0]', bHist.date_to || '');
    }

    // Last address outside US
    const lastOutside = b?.last_address_outside_us || {};
    if (lastOutside.street || lastOutside.city) {
      setText(form, 'Pt1Line18_RecentStreetName[0]', lastOutside.street || '');
      setText(form, 'Pt1Line18_RecentCity[0]', lastOutside.city || '');
      setText(form, 'Pt1Line18_RecentCountry[0]', lastOutside.country || '');
    }

    // Contact info
    setText(form, 'Pt3Line3_DaytimePhoneNumber1[0]', b?.phone || '');
    setText(form, 'Pt3Line4_MobileNumber1[0]', b?.mobile_phone || '');
    setText(form, 'Pt3Line5_Email[0]', b?.email || '');

    // ===== PART 2: Application Type =====
    // For I-130-based family petition: check "immigrant petition" category
    // Pt2Line1_YN[0] = Yes (immigrant visa petition filed for you)
    checkBox(form, 'Pt2Line1_YN[0]');

    // Petitioner info in Part 2
    setText(form, 'Pt2Line2_FamilyName[0]', p?.family_name || '');
    setText(form, 'Pt2Line2_GivenName[0]', p?.given_name || '');
    setText(form, 'Pt2Line2_MiddleName[0]', p?.middle_name || '');

    // ===== PART 4: Employment =====
    setText(form, 'Pt4Line7_EmployerName[0]', b?.employer_name || '');
    setText(form, 'Pt4Line8_Occupation[0]', b?.occupation || '');
    setText(form, 'Pt4Line8_DateFrom[0]', b?.employment_date_from || '');

    // ===== PART 5: Parents (beneficiary's parents) =====
    // Parent 1
    setText(form, 'Pt5Line1_FamilyName[0]', b?.parent1_family_name || '');
    setText(form, 'Pt5Line1_GivenName[0]', b?.parent1_given_name || '');
    setText(form, 'Pt5Line1_MiddleName[0]', b?.parent1_middle_name || '');
    setText(form, 'Pt5Line3_DateofBirth[0]', b?.parent1_dob || '');
    setText(form, 'Pt5Line5_CityTownOfBirth[0]', b?.parent1_city_of_birth || '');

    // Parent 2
    setText(form, 'Pt5Line6_FamilyName[0]', b?.parent2_family_name || '');
    setText(form, 'Pt5Line6_GivenName[0]', b?.parent2_given_name || '');
    setText(form, 'Pt5Line6_MiddleName[0]', b?.parent2_middle_name || '');
    setText(form, 'Pt5Line8_DateofBirth[0]', b?.parent2_dob || '');
    setText(form, 'Pt5Line10_CityTownOfBirth[0]', b?.parent2_city_of_birth || '');

    // ===== PART 6: Marital History =====
    setText(form, 'Pt6Line3_TimesMarried[0]', b?.times_married || '');

    // Current spouse = petitioner
    setText(form, 'Pt6Line4_FamilyName[0]', p?.family_name || '');
    setText(form, 'Pt6Line4_GivenName[0]', p?.given_name || '');
    setText(form, 'Pt6Line4_MiddleName[0]', p?.middle_name || '');
    setText(form, 'Pt6Line7_Country[0]', b?.marriage_country || p?.marriage_country || '');

    // Marriage date/place
    setText(form, 'Pt6Line16_DateofBirth[0]', p?.date_of_birth || '');

    // ===== PART 7: Biographic (height/weight from petitioner data — same person) =====
    // Weight digits
    const weight = (b?.weight_lbs || p?.weight_lbs || '').toString();
    if (weight) {
      const padded = weight.padStart(3, '0');
      setText(form, 'Pt7Line4_Weight1[0]', padded[0]);
      setText(form, 'Pt7Line4_Weight2[0]', padded[1]);
      setText(form, 'Pt7Line4_Weight3[0]', padded[2]);
    }

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
      endpoint: 'generate-i485' as 'generate',
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
        'Content-Disposition': 'attachment; filename="I-485-filled.pdf"',
        'X-Save-Tier': String(saveTier),
        ...(failedFields.length > 0 ? { 'X-Failed-Fields': failedFields.join(', ') } : {}),
      },
    });
  } catch (error) {
    logApiCall({
      endpoint: 'generate-i485' as 'generate',
      status: 'error',
      status_code: 500,
      duration_ms: Date.now() - startTime,
      error_message: String(error).slice(0, 200),
      error_type: 'unknown',
    });
    console.error('Generate I-485 route error:', error);
    return Response.json(
      { error: 'Failed to generate I-485 PDF', details: String(error) },
      { status: 500 }
    );
  }
}
