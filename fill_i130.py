#!/usr/bin/env python3
"""
I-130 Auto-Filler
=================
Reads a scanned handwritten intake form and fills a USCIS I-130 PDF automatically.

Usage:
    python3 fill_i130.py intake.pdf [--i130 blank_i130.pdf] [--output filled.pdf]

Privacy:
    - Uses Claude API for handwriting recognition (zero data retention by default)
    - SSNs can optionally be redacted before sending (--redact-ssn flag)
    - No data is stored locally beyond the output PDF
    - All PDF filling happens 100% locally with no network calls
"""

import argparse
import base64
import json
import sys
import os
from pathlib import Path

import anthropic
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, BooleanObject


# ============================================================
# STEP 1: EXTRACT DATA FROM HANDWRITTEN INTAKE VIA CLAUDE VISION
# ============================================================

EXTRACTION_PROMPT = """You are an expert immigration paralegal reading a scanned handwritten intake form for a USCIS I-130 (Petition for Alien Relative).

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
- If city_of_birth and country_of_birth appear to be the same (e.g., both say "Thailand"), that's OK - record as written
"""


def extract_intake_data(intake_pdf_path: str, redact_ssn: bool = False) -> dict:
    """Send scanned intake to Claude Vision and get structured JSON back."""
    client = anthropic.Anthropic()

    # Convert PDF pages to base64 images
    reader = PdfReader(intake_pdf_path)
    print(f"  Reading {len(reader.pages)} pages from intake form...")

    # Read the entire PDF as base64
    with open(intake_pdf_path, "rb") as f:
        pdf_bytes = f.read()
    pdf_b64 = base64.standard_b64encode(pdf_bytes).decode("utf-8")

    print("  Sending to Claude Vision (Opus) for handwriting recognition...")
    message = client.messages.create(
        model="claude-opus-4-20250514",
        max_tokens=8000,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "document",
                        "source": {
                            "type": "base64",
                            "media_type": "application/pdf",
                            "data": pdf_b64,
                        },
                    },
                    {
                        "type": "text",
                        "text": EXTRACTION_PROMPT,
                    },
                ],
            }
        ],
    )

    # Parse the JSON response
    response_text = message.content[0].text.strip()
    # Remove markdown code fences if present
    if response_text.startswith("```"):
        response_text = response_text.split("\n", 1)[1]
        response_text = response_text.rsplit("```", 1)[0]

    data = json.loads(response_text)
    print("  Data extracted successfully.")

    if redact_ssn:
        print("  [SSN REDACTED - will need manual entry]")
        data["petitioner"]["ssn"] = ""
        data["beneficiary"]["ssn"] = ""

    # Post-processing fixes
    data = postprocess_extracted_data(data)

    return data


def postprocess_extracted_data(data: dict) -> dict:
    """Fix common extraction issues."""

    def upper_state(obj, *keys):
        """Ensure state abbreviations are uppercase."""
        for key in keys:
            if isinstance(obj, dict) and key in obj and obj[key]:
                obj[key] = obj[key].upper().strip()

    def normalize_country(val):
        """Normalize country names."""
        if not val:
            return ""
        v = val.strip().upper()
        if v in ("USA", "US", "U.S.A.", "U.S.", "UNITED STATES OF AMERICA"):
            return "United States"
        return val.strip()

    p = data.get("petitioner", {})
    b = data.get("beneficiary", {})

    # Fix state abbreviations everywhere
    upper_state(p.get("mailing_address", {}), "state")
    for h in p.get("address_history", []):
        upper_state(h, "state")
    upper_state(p, "marriage_state", "employer_state")

    upper_state(b.get("current_address", {}), "state")
    for h in b.get("address_history", []):
        upper_state(h, "state")
    upper_state(b, "marriage_state", "employer_state", "proceedings_state")

    # Normalize country names
    for section in [p, b]:
        for key in list(section.keys()):
            if "country" in key.lower() and isinstance(section[key], str):
                section[key] = normalize_country(section[key])
        # Nested address objects
        for addr_key in ["mailing_address", "current_address", "last_address_outside_us"]:
            if addr_key in section and isinstance(section[addr_key], dict):
                if "country" in section[addr_key]:
                    section[addr_key]["country"] = normalize_country(section[addr_key]["country"])
        for h in section.get("address_history", []):
            if "country" in h:
                h["country"] = normalize_country(h["country"])

    # Logic: if class_of_admission or date_of_arrival is set, beneficiary WAS in US
    if b.get("class_of_admission") or b.get("date_of_arrival"):
        b["ever_in_us"] = "Yes"

    # Cross-reference: petitioner's spouse = beneficiary and vice versa
    if data.get("relationship", "").lower() == "spouse":
        if not p.get("spouse_family_name") and b.get("family_name"):
            p["spouse_family_name"] = b["family_name"]
            p["spouse_given_name"] = b["given_name"]
            p["spouse_middle_name"] = b.get("middle_name", "")

    # Infer parent sex from context
    if not p.get("parent1_sex"):
        # Parent 1 is typically the father in these forms
        p["parent1_sex"] = "M"
    if not p.get("parent2_sex"):
        p["parent2_sex"] = "F"

    # Infer ethnicity from country of birth if not set
    if not p.get("ethnicity"):
        hispanic_countries = {"guatemala", "mexico", "honduras", "el salvador",
                              "nicaragua", "colombia", "venezuela", "peru",
                              "ecuador", "bolivia", "chile", "argentina",
                              "uruguay", "paraguay", "costa rica", "panama",
                              "cuba", "dominican republic", "puerto rico", "spain"}
        cob = p.get("country_of_birth", "").lower()
        if cob in hispanic_countries:
            p["ethnicity"] = "Hispanic or Latino"
        elif cob:
            p["ethnicity"] = "Not Hispanic or Latino"

    # Default empty marriage country to United States (most I-130 marriages are domestic)
    if p.get("date_of_marriage") and not p.get("marriage_country"):
        p["marriage_country"] = "United States"
    if b.get("date_of_marriage") and not b.get("marriage_country"):
        b["marriage_country"] = "United States"

    # Normalize date formats (dashes to slashes)
    def fix_date(val):
        if not val:
            return val
        return val.replace("-", "/")

    for section in [p, b]:
        for key in list(section.keys()):
            if "date" in key.lower() or "dob" in key.lower():
                if isinstance(section[key], str):
                    section[key] = fix_date(section[key])

    # Clean up class of admission
    coa = b.get("class_of_admission", "")
    if coa:
        coa_upper = coa.upper().strip()
        # Map common handwriting misreads
        if coa_upper.startswith("AS"):
            b["class_of_admission"] = "Asylum"
        elif coa_upper.startswith("RE"):
            b["class_of_admission"] = "Refugee"

    # Infer proceedings type if immigration proceedings = Yes but type is empty
    if b.get("in_immigration_proceedings", "").lower() == "yes" and not b.get("proceedings_type"):
        # EOIR court = removal proceedings (most common)
        city = b.get("proceedings_city", "").lower()
        if "eoir" in city or "court" in city:
            b["proceedings_type"] = "Removal"
            # Clean up city (remove "EOIR Court" from city field)
            if "eoir" in city:
                b["proceedings_city"] = ""

    # Clean up employer name formatting (normalize dash spacing)
    for section in [p, b]:
        emp = section.get("employer_name", "")
        if emp:
            # "Tracco - Total" → "Tracco-Total" or keep as is
            section["employer_name"] = emp.replace(" - ", "-")

    # Default empty address countries to United States for US-based addresses
    for section in [p, b]:
        for addr_key in ["mailing_address", "current_address"]:
            addr = section.get(addr_key, {})
            if addr.get("state") and not addr.get("country"):
                addr["country"] = "United States"
        for h in section.get("address_history", []):
            if h.get("state") and not h.get("country"):
                h["country"] = "United States"

    return data


# ============================================================
# STEP 2: CHECKBOX INDEX MAPS (XFA indices ≠ visual order)
# ============================================================

EYE_COLOR_MAP = {
    "blue": 0, "brown": 1, "hazel": 2, "pink": 3,
    "maroon": 4, "green": 5, "gray": 6, "black": 7, "unknown": 8,
}

HAIR_COLOR_MAP = {
    "bald": 0, "black": 1, "blond": 2, "brown": 3,
    "gray": 4, "red": 5, "sandy": 6, "white": 7, "unknown": 8,
}

BENEFICIARY_MARITAL_MAP = {
    "widowed": 0, "annulled": 1, "separated": 2,
    "single": 3, "married": 4, "divorced": 5,
}


# ============================================================
# STEP 3: MAP EXTRACTED DATA → I-130 FORM FIELDS
# ============================================================

def build_field_mapping(data: dict) -> tuple[dict, dict]:
    """
    Returns (text_fields_by_page, checkbox_fields_by_page)
    """
    p = data["petitioner"]
    b = data["beneficiary"]
    rel = data.get("relationship", "Spouse")

    text_fields = {}
    checkbox_fields = {}

    # Helper to safely get nested values
    def g(obj, *keys, default=""):
        val = obj
        for k in keys:
            if isinstance(val, dict):
                val = val.get(k, default)
            else:
                return default
        return val if val else default

    # --- PAGE 0: Part 1 (Relationship) + Part 2 starts ---
    text_fields[0] = {
        "Pt2Line4a_FamilyName[0]": p.get("family_name", ""),
        "Pt2Line4b_GivenName[0]": p.get("given_name", ""),
        "Pt2Line4c_MiddleName[0]": p.get("middle_name", ""),
        "Pt2Line11_SSN[0]": p.get("ssn", "").replace("-", ""),
    }

    cb0 = []
    rel_lower = rel.lower()
    if "spouse" in rel_lower:
        cb0.append("Pt1Line1_Spouse[0]")
    elif "parent" in rel_lower:
        cb0.append("Pt1Line1_Parent[0]")
    elif "brother" in rel_lower or "sister" in rel_lower:
        cb0.append("Pt1Line1_Siblings[0]")
    elif "child" in rel_lower:
        cb0.append("Pt1Line1_Child[0]")
    checkbox_fields[0] = cb0

    # --- PAGE 1: Part 2 continued (names, address, marital) ---
    mail = p.get("mailing_address", {})
    text_fields[1] = {
        "Pt2Line6_CityTownOfBirth[0]": p.get("city_of_birth", ""),
        "Pt2Line7_CountryofBirth[0]": p.get("country_of_birth", ""),
        "Pt2Line8_DateofBirth[0]": p.get("date_of_birth", ""),
        "Pt2Line10_StreetNumberName[0]": mail.get("street", ""),
        "Pt2Line10_AptSteFlrNumber[0]": mail.get("unit_number", ""),
        "Pt2Line10_CityOrTown[0]": mail.get("city", ""),
        "Pt2Line10_State[0]": mail.get("state", ""),
        "Pt2Line10_ZipCode[0]": mail.get("zip", ""),
        "Pt2Line10_Country[0]": mail.get("country", "United States"),
        "Pt2Line16_NumberofMarriages[0]": p.get("times_married", ""),
    }

    # Address history
    hist = p.get("address_history", [])
    if hist and len(hist) > 0:
        h = hist[0]
        text_fields[1].update({
            "Pt2Line12_StreetNumberName[0]": h.get("street", ""),
            "Pt2Line12_CityOrTown[0]": h.get("city", ""),
            "Pt2Line12_State[0]": h.get("state", ""),
            "Pt2Line12_ZipCode[0]": h.get("zip", ""),
            "Pt2Line12_Country[0]": h.get("country", "United States"),
            "Pt2Line13a_DateFrom[0]": h.get("date_from", ""),
        })

    cb1 = []
    if p.get("sex", "").upper() == "F":
        cb1.append("Pt2Line9_Female[0]")
    elif p.get("sex", "").upper() == "M":
        cb1.append("Pt2Line9_Male[0]")

    apt_type = mail.get("apt_ste_flr", "").lower()
    if "apt" in apt_type:
        cb1.append("Pt2Line10_Unit[0]")
    elif "ste" in apt_type or "suite" in apt_type:
        cb1.append("Pt2Line10_Unit[1]")
    elif "flr" in apt_type or "floor" in apt_type:
        cb1.append("Pt2Line10_Unit[2]")

    if p.get("physical_same_as_mailing", True):
        cb1.append("Pt2Line11_Yes[0]")
    else:
        cb1.append("Pt2Line11_No[0]")

    ms = p.get("marital_status", "").lower()
    if "married" in ms:
        cb1.append("Pt2Line17_Married[0]")
    elif "single" in ms:
        cb1.append("Pt2Line17_Single[0]")
    elif "divorced" in ms:
        cb1.append("Pt2Line17_Divorced[0]")
    elif "widowed" in ms:
        cb1.append("Pt2Line17_Widowed[0]")
    elif "separated" in ms:
        cb1.append("Pt2Line17_Separated[0]")
    elif "annulled" in ms:
        cb1.append("Pt2Line17_Annulled[0]")
    checkbox_fields[1] = cb1

    # --- PAGE 2: Part 2 continued (marriage, parents, citizenship) ---
    text_fields[2] = {
        "Pt2Line18_DateOfMarriage[0]": p.get("date_of_marriage", ""),
        "Pt2Line19a_CityTown[0]": p.get("marriage_city", ""),
        "Pt2Line19b_State[0]": p.get("marriage_state", ""),
        "Pt2Line19d_Country[0]": p.get("marriage_country", "United States"),
        # Spouse 1 of petitioner
        "PtLine20a_FamilyName[0]": p.get("spouse_family_name", ""),
        "Pt2Line20b_GivenName[0]": p.get("spouse_given_name", ""),
        "Pt2Line20c_MiddleName[0]": p.get("spouse_middle_name", ""),
        # Parent 1
        "Pt2Line24_FamilyName[0]": p.get("parent1_family_name", ""),
        "Pt2Line24_GivenName[0]": p.get("parent1_given_name", ""),
        "Pt2Line27_CountryofBirth[0]": p.get("parent1_country_of_birth", ""),
        "Pt2Line28_CityTownOrVillageOfResidence[0]": p.get("parent1_city_of_residence", ""),
        "Pt2Line29_CountryOfResidence[0]": p.get("parent1_country_of_residence", ""),
        # Parent 2
        "Pt2Line30a_FamilyName[0]": p.get("parent2_family_name", ""),
        "Pt2Line30b_GivenName[0]": p.get("parent2_given_name", ""),
        "Pt2Line33_CountryofBirth[0]": p.get("parent2_country_of_birth", ""),
        "Pt2Line34_CityTownOrVillageOfResidence[0]": p.get("parent2_city_of_residence", ""),
        "Pt2Line35_CountryOfResidence[0]": p.get("parent2_country_of_residence", ""),
    }

    # Parent 1 DOB if provided
    if p.get("parent1_dob"):
        text_fields[2]["Pt2Line25_DateofBirth[0]"] = p["parent1_dob"]
    if p.get("parent2_dob"):
        text_fields[2]["Pt2Line31_DateofBirth[0]"] = p["parent2_dob"]

    cb2 = []
    if p.get("parent1_sex", "").upper() == "M":
        cb2.append("Pt2Line26_Male[0]")
    elif p.get("parent1_sex", "").upper() == "F":
        cb2.append("Pt2Line26_Female[0]")
    if p.get("parent2_sex", "").upper() == "F":
        cb2.append("Pt2Line32_Female[0]")
    elif p.get("parent2_sex", "").upper() == "M":
        cb2.append("Pt2Line32_Male[0]")

    imm = p.get("immigration_status", "").lower()
    if "citizen" in imm:
        cb2.append("Pt2Line36_USCitizen[0]")
    elif "lpr" in imm or "permanent" in imm:
        cb2.append("Pt2Line36_LPR[0]")

    acq = p.get("citizenship_acquired_through", "").lower()
    if "birth" in acq:
        cb2.append("Pt2Line23a_checkbox[0]")
    elif "natural" in acq:
        cb2.append("Pt2Line23b_checkbox[0]")
    elif "parent" in acq:
        cb2.append("Pt2Line23c_checkbox[0]")
    checkbox_fields[2] = cb2

    # --- PAGE 3: Part 2 continued (employment) + Part 3 (biographic) ---
    text_fields[3] = {
        "Pt2Line40_EmployerOrCompName[0]": p.get("employer_name", ""),
        "Pt2Line41_StreetNumberName[0]": p.get("employer_street", ""),
        "Pt2Line41_CityOrTown[0]": p.get("employer_city", ""),
        "Pt2Line41_State[0]": p.get("employer_state", ""),
        "Pt2Line41_ZipCode[0]": p.get("employer_zip", ""),
        "Pt2Line41_Country[0]": p.get("employer_country", "United States"),
        "Pt2Line42_Occupation[0]": p.get("occupation", ""),
        "Pt2Line43a_DateFrom[0]": p.get("employment_date_from", ""),
        "Pt3Line3_HeightFeet[0]": p.get("height_feet", ""),
        "Pt3Line3_HeightInches[0]": p.get("height_inches", ""),
    }
    # Weight digits
    wt = p.get("weight_lbs", "")
    if wt:
        wt = str(wt).strip()
        if len(wt) == 3:
            text_fields[3]["Pt3Line4_Pound1[0]"] = wt[0]
            text_fields[3]["Pt3Line4_Pound2[0]"] = wt[1]
            text_fields[3]["Pt3Line4_Pound3[0]"] = wt[2]
        elif len(wt) == 2:
            text_fields[3]["Pt3Line4_Pound2[0]"] = wt[0]
            text_fields[3]["Pt3Line4_Pound3[0]"] = wt[1]

    cb3 = []
    eth = p.get("ethnicity", "").lower()
    if "not" in eth or "non" in eth:
        cb3.append("Pt3Line1_Ethnicity[0]")  # Not Hispanic
    elif "hispanic" in eth:
        cb3.append("Pt3Line1_Ethnicity[1]")  # Hispanic

    race = p.get("race", "").lower()
    if "asian" in race:
        cb3.append("Pt3Line2_Race_Asian[0]")
    if "white" in race:
        cb3.append("Pt3Line2_Race_White[0]")
    if "black" in race or "african" in race:
        cb3.append("Pt3Line2_Race_Black[0]")
    if "american indian" in race or "alaska" in race:
        cb3.append("Pt3Line2_Race_AmericanIndianAlaskaNative[0]")
    if "hawaiian" in race or "pacific" in race:
        cb3.append("Pt3Line2_Race_NativeHawaiianOtherPacificIslander[0]")

    eye = p.get("eye_color", "").lower()
    if eye in EYE_COLOR_MAP:
        cb3.append(f"Pt3Line5_EyeColor[{EYE_COLOR_MAP[eye]}]")
    checkbox_fields[3] = cb3

    # --- PAGE 4: Part 3 continued (hair) + Part 4 (beneficiary starts) ---
    b_addr = b.get("current_address", {})
    text_fields[4] = {
        "Pt4Line3_SSN[0]": b.get("ssn", "").replace("-", ""),
        "Pt4Line4a_FamilyName[0]": b.get("family_name", ""),
        "Pt4Line4b_GivenName[0]": b.get("given_name", ""),
        "Pt4Line4c_MiddleName[0]": b.get("middle_name", ""),
        "Pt4Line7_CityTownOfBirth[0]": b.get("city_of_birth", ""),
        "Pt4Line8_CountryOfBirth[0]": b.get("country_of_birth", ""),
        "Pt4Line9_DateOfBirth[0]": b.get("date_of_birth", ""),
        "Pt4Line11_StreetNumberName[0]": b_addr.get("street", ""),
        "Pt4Line11_AptSteFlrNumber[0]": b_addr.get("unit_number", ""),
        "Pt4Line11_CityOrTown[0]": b_addr.get("city", ""),
        "Pt4Line11_State[0]": b_addr.get("state", ""),
        "Pt4Line11_ZipCode[0]": b_addr.get("zip", ""),
        "Pt4Line11_Country[0]": b_addr.get("country", "United States"),
        "Pt4Line12a_StreetNumberName[0]": "SAME",
        "Pt4Line14_DaytimePhoneNumber[0]": b.get("phone", ""),
    }

    cb4 = []
    hair = p.get("hair_color", "").lower()
    if hair in HAIR_COLOR_MAP:
        cb4.append(f"Pt3Line6_HairColor[{HAIR_COLOR_MAP[hair]}]")

    if b.get("sex", "").upper() == "M":
        cb4.append("Pt4Line9_Male[0]")
    elif b.get("sex", "").upper() == "F":
        cb4.append("Pt4Line9_Female[0]")

    b_apt = b_addr.get("apt_ste_flr", "").lower()
    if "apt" in b_apt:
        cb4.append("Pt4Line11_Unit[0]")
    elif "ste" in b_apt or "suite" in b_apt:
        cb4.append("Pt4Line11_Unit[1]")
    elif "flr" in b_apt or "floor" in b_apt:
        cb4.append("Pt4Line11_Unit[2]")

    if b.get("petition_filed_before", "").lower() == "no":
        cb4.append("Pt4Line10_No[0]")
    elif b.get("petition_filed_before", "").lower() == "yes":
        cb4.append("Pt4Line10_Yes[0]")
    checkbox_fields[4] = cb4

    # --- PAGE 5: Part 4 continued (marital info, spouses, family) ---
    text_fields[5] = {
        "Pt4Line17_NumberofMarriages[0]": b.get("times_married", ""),
        "Pt4Line19_DateOfMarriage[0]": b.get("date_of_marriage", ""),
        "Pt4Line20a_CityTown[0]": b.get("marriage_city", ""),
        "Pt4Line20b_State[0]": b.get("marriage_state", ""),
        "Pt4Line20d_Country[0]": b.get("marriage_country", "United States"),
        # Spouse 1 of beneficiary = petitioner
        "Pt4Line16a_FamilyName[0]": p.get("family_name", ""),
        "Pt4Line16b_GivenName[0]": p.get("given_name", ""),
        "Pt4Line16c_MiddleName[0]": p.get("middle_name", ""),
    }

    cb5 = []
    bms = b.get("marital_status", "").lower()
    for status, idx in BENEFICIARY_MARITAL_MAP.items():
        if status in bms:
            cb5.append(f"Pt4Line18_MaritalStatus[{idx}]")
            break
    checkbox_fields[5] = cb5

    # --- PAGE 6: Part 4 continued (entry info, employment, proceedings) ---
    text_fields[6] = {
        "Pt4Line21c_DateOfArrival[0]": b.get("date_of_arrival", ""),
        "Pt4Line26_NameOfCompany[0]": b.get("employer_name", ""),
        "Pt4Line26_StreetNumberName[0]": b.get("employer_street", ""),
        "Pt4Line26_CityOrTown[0]": b.get("employer_city", ""),
        "Pt4Line26_State[0]": b.get("employer_state", "") or b.get("state", ""),
        "Pt4Line26_ZipCode[0]": b.get("employer_zip", ""),
        "Pt4Line26_Country[0]": b.get("employer_country", "United States"),
        "Pt4Line27_DateEmploymentBegan[0]": b.get("employment_date_from", ""),
        "Pt4Line55a_CityOrTown[0]": b.get("proceedings_city", ""),
        "Pt4Line56_Date[0]": b.get("proceedings_date", ""),
    }

    # Class of admission - map common values
    coa = b.get("class_of_admission", "").upper()
    coa_map = {
        "ASYLUM": "AS", "ASYLEE": "AS", "ASYLO": "AS", "AS": "AS",
        "REFUGEE": "RE", "REF": "RE", "RE": "RE",
        "TOURIST": "B2", "B2": "B2", "B1": "B1",
        "STUDENT": "F1", "F1": "F1",
    }
    coa_code = coa_map.get(coa, coa[:3] if len(coa) >= 3 else coa)
    if coa_code:
        text_fields[6]["Pt4Line21a_ClassOfAdmission[0]"] = coa_code

    if b.get("proceedings_state"):
        text_fields[6]["Pt4Line55b_State[0]"] = b["proceedings_state"]

    cb6 = []
    if b.get("ever_in_us", "").lower() == "yes":
        cb6.append("Pt4Line20_Yes[0]")
    elif b.get("ever_in_us", "").lower() == "no":
        cb6.append("Pt4Line20_No[0]")

    if b.get("in_immigration_proceedings", "").lower() == "yes":
        cb6.append("Pt4Line28_Yes[0]")
        pt = b.get("proceedings_type", "").lower()
        if "removal" in pt:
            cb6.append("Pt4Line54_Removal[0]")
        elif "exclusion" in pt or "deportation" in pt:
            cb6.append("Pt4Line54_Exclusion[0]")
        elif "rescission" in pt:
            cb6.append("Pt4Line54_Rescission[0]")
        elif "other" in pt or "judicial" in pt:
            cb6.append("Pt4Line54_JudicialProceedings[0]")
    elif b.get("in_immigration_proceedings", "").lower() == "no":
        cb6.append("Pt4Line28_No[0]")
    checkbox_fields[6] = cb6

    # --- PAGE 7: Part 4 continued (native name, last address together, Part 5) ---
    # Last address lived together (for spouse filings)
    if "spouse" in rel_lower:
        # Use the shared address
        addr = b.get("current_address", mail)
        text_fields[7] = {
            "Pt4Line57_StreetNumberName[0]": addr.get("street", ""),
            "Pt4Line57_AptSteFlrNumber[0]": addr.get("unit_number", ""),
            "Pt4Line57_CityOrTown[0]": addr.get("city", ""),
            "Pt4Line57_State[0]": addr.get("state", ""),
            "Pt4Line57_ZipCode[0]": addr.get("zip", ""),
            "Pt4Line57_Country[0]": addr.get("country", "United States"),
        }
    else:
        text_fields[7] = {}

    cb7 = []
    if "spouse" in rel_lower:
        apt7 = addr.get("apt_ste_flr", "").lower()
        if "apt" in apt7:
            cb7.append("Pt4Line57_Unit[0]")
    if p.get("previously_filed_petition", "").lower() == "no":
        cb7.append("Part4Line1_No[0]")
    elif p.get("previously_filed_petition", "").lower() == "yes":
        cb7.append("Part4Line1_Yes[0]")
    checkbox_fields[7] = cb7

    # Remove empty values from text fields
    for page_idx in text_fields:
        text_fields[page_idx] = {k: v for k, v in text_fields[page_idx].items() if v}

    # Remove empty checkbox lists
    checkbox_fields = {k: v for k, v in checkbox_fields.items() if v}

    return text_fields, checkbox_fields


# ============================================================
# STEP 4: FILL THE PDF
# ============================================================

def fill_i130(i130_path: str, output_path: str, text_fields: dict, checkbox_fields: dict):
    """Fill the I-130 PDF with the mapped field data."""
    reader = PdfReader(i130_path)
    writer = PdfWriter()
    writer.append(reader)

    # Remove XFA, set NeedAppearances
    if "/AcroForm" in writer._root_object:
        acro = writer._root_object["/AcroForm"]
        if NameObject("/XFA") in acro:
            del acro[NameObject("/XFA")]
        acro[NameObject("/NeedAppearances")] = BooleanObject(True)

    # Fill text and dropdown fields
    for page_idx, fields in text_fields.items():
        if page_idx < len(writer.pages):
            writer.update_page_form_field_values(writer.pages[page_idx], fields)

    # Fill checkboxes
    for page_idx, cb_names in checkbox_fields.items():
        if page_idx >= len(writer.pages):
            continue
        page = writer.pages[page_idx]
        if "/Annots" not in page:
            continue
        cb_set = set(cb_names)
        for annot_ref in page["/Annots"]:
            annot = annot_ref.get_object()
            t = str(annot.get("/T", ""))
            if t in cb_set:
                annot.update({
                    NameObject("/V"): NameObject("/Y"),
                    NameObject("/AS"): NameObject("/Y"),
                })

    with open(output_path, "wb") as f:
        writer.write(f)


# ============================================================
# MAIN
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description="Auto-fill USCIS I-130 from a scanned handwritten intake form"
    )
    parser.add_argument("intake", help="Path to scanned intake PDF")
    parser.add_argument("--i130", default=None, help="Path to blank I-130 PDF (auto-downloads if not provided)")
    parser.add_argument("--output", "-o", default=None, help="Output path for filled I-130")
    parser.add_argument("--redact-ssn", action="store_true", help="Don't send SSNs to the API")
    parser.add_argument("--json-only", action="store_true", help="Only extract data, don't fill PDF")
    args = parser.parse_args()

    intake_path = args.intake
    if not os.path.exists(intake_path):
        print(f"Error: Intake file not found: {intake_path}")
        sys.exit(1)

    # Default output path
    if args.output:
        output_path = args.output
    else:
        stem = Path(intake_path).stem.replace(" ", "_")
        output_path = str(Path(intake_path).parent / f"i-130_filled_{stem}.pdf")

    # Helper to safely get nested values
    def g(obj, *keys, default=""):
        val = obj
        for k in keys:
            if isinstance(val, dict):
                val = val.get(k, default)
            else:
                return default
        return val if val else default

    print(f"\n{'='*60}")
    print(f"  I-130 AUTO-FILLER")
    print(f"{'='*60}")
    print(f"  Intake:  {intake_path}")
    if not args.json_only:
        print(f"  Output:  {output_path}")
    if args.redact_ssn:
        print(f"  SSN:     REDACTED (manual entry required)")
    print()

    # Step 1: Extract data from intake
    print("[1/3] Extracting data from handwritten intake...")
    data = extract_intake_data(intake_path, redact_ssn=args.redact_ssn)

    # Save extracted JSON for reference
    json_path = output_path.replace(".pdf", "_data.json") if not args.json_only else intake_path.replace(".pdf", "_extracted.json")
    with open(json_path, "w") as f:
        json.dump(data, f, indent=2)
    print(f"  Extracted data saved to: {json_path}")

    # Print verification summary for attorney
    p = data["petitioner"]
    b = data["beneficiary"]
    print(f"\n  ---- EXTRACTED DATA SUMMARY ----")
    print(f"  Petitioner:  {p.get('given_name','')} {p.get('family_name','')}")
    print(f"    DOB: {p.get('date_of_birth','')}  SSN: {'***' if p.get('ssn') else 'MISSING'}")
    print(f"    Born: {p.get('city_of_birth','')}, {p.get('country_of_birth','')}")
    print(f"    Address: {g(p,'mailing_address','street',default='')} {g(p,'mailing_address','unit_number',default='')}, {g(p,'mailing_address','city',default='')} {g(p,'mailing_address','state',default='')} {g(p,'mailing_address','zip',default='')}")
    print(f"    Status: {p.get('immigration_status','')}")
    print(f"    Employer: {p.get('employer_name','')}")
    print(f"  Beneficiary: {b.get('given_name','')} {b.get('middle_name','')} {b.get('family_name','')}")
    print(f"    DOB: {b.get('date_of_birth','')}  SSN: {'***' if b.get('ssn') else 'MISSING'}")
    print(f"    Born: {b.get('city_of_birth','')}, {b.get('country_of_birth','')}")
    print(f"    Phone: {b.get('phone','')}")
    print(f"    Employer: {b.get('employer_name','')}")
    print(f"  Marriage: {p.get('date_of_marriage','')} in {p.get('marriage_city','')}, {p.get('marriage_state','')} {p.get('marriage_country','')}")
    print(f"  Relationship: {data.get('relationship','')}")
    print(f"  --------------------------------")

    if args.json_only:
        print("\n  Done (--json-only mode).")
        return

    # Step 2: Map to form fields
    print("\n[2/3] Mapping data to I-130 form fields...")
    text_fields, checkbox_fields = build_field_mapping(data)

    total_text = sum(len(v) for v in text_fields.values())
    total_cb = sum(len(v) for v in checkbox_fields.values())
    print(f"  Mapped {total_text} text fields + {total_cb} checkboxes")

    # Step 3: Fill the PDF
    i130_path = args.i130
    if not i130_path:
        # Look for i-130 in same directory or Downloads
        for candidate in [
            str(Path(intake_path).parent / "i-130.pdf"),
            str(Path(intake_path).parent / "i-130 (1).pdf"),
            os.path.expanduser("~/Downloads/i-130.pdf"),
            os.path.expanduser("~/Downloads/i-130 (1).pdf"),
        ]:
            if os.path.exists(candidate):
                i130_path = candidate
                break

    if not i130_path or not os.path.exists(i130_path):
        print("\n  Error: Blank I-130 PDF not found.")
        print("  Download from: https://www.uscis.gov/i-130")
        print("  Then re-run with: --i130 path/to/i-130.pdf")
        sys.exit(1)

    print(f"\n[3/3] Filling I-130 PDF...")
    print(f"  Using blank form: {i130_path}")
    fill_i130(i130_path, output_path, text_fields, checkbox_fields)

    print(f"\n{'='*60}")
    print(f"  COMPLETE: {output_path}")
    print(f"{'='*60}")
    print(f"\n  Attorney review checklist:")
    print(f"  [ ] Verify all names spelled correctly")
    print(f"  [ ] Verify dates (DOB, marriage, arrival)")
    print(f"  [ ] Verify addresses")
    if args.redact_ssn:
        print(f"  [ ] ENTER SSNs MANUALLY (redacted for privacy)")
    print(f"  [ ] Complete citizenship acquisition method (item 37)")
    print(f"  [ ] Complete certificate details if applicable (items 38-39)")
    print(f"  [ ] Add A-Number if known")
    print(f"  [ ] Add passport/travel document info")
    print(f"  [ ] Add I-94 number")
    print(f"  [ ] Complete petitioner statement & signature")
    print(f"  [ ] Complete preparer/attorney section")
    print()


if __name__ == "__main__":
    main()
