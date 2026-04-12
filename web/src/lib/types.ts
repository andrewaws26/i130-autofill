export interface Address {
  street: string;
  apt_ste_flr: string;
  unit_number: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AddressHistory {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  date_from: string;
  date_to: string;
}

export interface Petitioner {
  family_name: string;
  given_name: string;
  middle_name: string;
  ssn: string;
  other_names: string;
  city_of_birth: string;
  country_of_birth: string;
  date_of_birth: string;
  sex: string;
  ethnicity: string;
  race: string;
  height_feet: string;
  height_inches: string;
  weight_lbs: string;
  eye_color: string;
  hair_color: string;
  mailing_address: Address;
  physical_same_as_mailing: boolean;
  address_history: AddressHistory[];
  times_married: string;
  marital_status: string;
  date_of_marriage: string;
  marriage_city: string;
  marriage_state: string;
  marriage_country: string;
  spouse_family_name: string;
  spouse_given_name: string;
  spouse_middle_name: string;
  parent1_family_name: string;
  parent1_given_name: string;
  parent1_middle_name: string;
  parent1_sex: string;
  parent1_dob: string;
  parent1_country_of_birth: string;
  parent1_city_of_residence: string;
  parent1_country_of_residence: string;
  parent2_family_name: string;
  parent2_given_name: string;
  parent2_middle_name: string;
  parent2_sex: string;
  parent2_dob: string;
  parent2_country_of_birth: string;
  parent2_city_of_residence: string;
  parent2_country_of_residence: string;
  immigration_status: string;
  citizenship_acquired_through: string;
  employer_name: string;
  employer_street: string;
  employer_city: string;
  employer_state: string;
  employer_zip: string;
  employer_country: string;
  occupation: string;
  employment_date_from: string;
  employment_date_to: string;
  previously_filed_petition: string;
  phone: string;
  email: string;
}

export interface Beneficiary {
  family_name: string;
  given_name: string;
  middle_name: string;
  ssn: string;
  other_names: string;
  city_of_birth: string;
  country_of_birth: string;
  date_of_birth: string;
  sex: string;
  current_address: Address;
  phone: string;
  mobile_phone: string;
  email: string;
  times_married: string;
  marital_status: string;
  date_of_marriage: string;
  marriage_city: string;
  marriage_state: string;
  marriage_country: string;
  previous_spouses: string;
  children: string;
  petition_filed_before: string;
  ever_in_us: string;
  class_of_admission: string;
  date_of_arrival: string;
  authorized_stay_expiration: string;
  in_immigration_proceedings: string;
  proceedings_type: string;
  proceedings_city: string;
  proceedings_state: string;
  proceedings_date: string;
  address_history: AddressHistory[];
  last_address_outside_us: {
    street: string;
    city: string;
    province: string;
    country: string;
  };
  parent1_family_name: string;
  parent1_given_name: string;
  parent1_middle_name: string;
  parent1_dob: string;
  parent1_city_of_birth: string;
  parent1_country_of_birth: string;
  parent1_current_city: string;
  parent1_current_country: string;
  parent2_family_name: string;
  parent2_given_name: string;
  parent2_middle_name: string;
  parent2_dob: string;
  parent2_city_of_birth: string;
  parent2_country_of_birth: string;
  parent2_current_city: string;
  parent2_current_country: string;
  employer_name: string;
  employer_street: string;
  employer_city: string;
  employer_state: string;
  employer_zip: string;
  employer_country: string;
  occupation: string;
  employment_date_from: string;
  i94_number: string;
  passport_number: string;
  travel_doc_number: string;
  passport_country: string;
  passport_expiration: string;
}

// Confidence levels: 'high' (>90%), 'medium' (70-90%), 'low' (<70%)
// Keyed by dot-path: e.g., "petitioner.family_name", "beneficiary.ssn"
export type ConfidenceLevel = 'high' | 'medium' | 'low';
export type ConfidenceMap = Record<string, ConfidenceLevel>;

export interface IntakeData {
  petitioner: Petitioner;
  beneficiary: Beneficiary;
  relationship: string;
  confidence?: ConfidenceMap;
}

function createEmptyAddress(): Address {
  return {
    street: "",
    apt_ste_flr: "",
    unit_number: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  };
}

export function createEmptyIntakeData(): IntakeData {
  return {
    petitioner: {
      family_name: "",
      given_name: "",
      middle_name: "",
      ssn: "",
      other_names: "",
      city_of_birth: "",
      country_of_birth: "",
      date_of_birth: "",
      sex: "",
      ethnicity: "",
      race: "",
      height_feet: "",
      height_inches: "",
      weight_lbs: "",
      eye_color: "",
      hair_color: "",
      mailing_address: createEmptyAddress(),
      physical_same_as_mailing: false,
      address_history: [],
      times_married: "",
      marital_status: "",
      date_of_marriage: "",
      marriage_city: "",
      marriage_state: "",
      marriage_country: "",
      spouse_family_name: "",
      spouse_given_name: "",
      spouse_middle_name: "",
      parent1_family_name: "",
      parent1_given_name: "",
      parent1_middle_name: "",
      parent1_sex: "",
      parent1_dob: "",
      parent1_country_of_birth: "",
      parent1_city_of_residence: "",
      parent1_country_of_residence: "",
      parent2_family_name: "",
      parent2_given_name: "",
      parent2_middle_name: "",
      parent2_sex: "",
      parent2_dob: "",
      parent2_country_of_birth: "",
      parent2_city_of_residence: "",
      parent2_country_of_residence: "",
      immigration_status: "",
      citizenship_acquired_through: "",
      employer_name: "",
      employer_street: "",
      employer_city: "",
      employer_state: "",
      employer_zip: "",
      employer_country: "",
      occupation: "",
      employment_date_from: "",
      employment_date_to: "",
      previously_filed_petition: "",
      phone: "",
      email: "",
    },
    beneficiary: {
      family_name: "",
      given_name: "",
      middle_name: "",
      ssn: "",
      other_names: "",
      city_of_birth: "",
      country_of_birth: "",
      date_of_birth: "",
      sex: "",
      current_address: createEmptyAddress(),
      phone: "",
      mobile_phone: "",
      email: "",
      times_married: "",
      marital_status: "",
      date_of_marriage: "",
      marriage_city: "",
      marriage_state: "",
      marriage_country: "",
      previous_spouses: "",
      children: "",
      petition_filed_before: "",
      ever_in_us: "",
      class_of_admission: "",
      date_of_arrival: "",
      authorized_stay_expiration: "",
      in_immigration_proceedings: "",
      proceedings_type: "",
      proceedings_city: "",
      proceedings_state: "",
      proceedings_date: "",
      address_history: [],
      last_address_outside_us: {
        street: "",
        city: "",
        province: "",
        country: "",
      },
      parent1_family_name: "",
      parent1_given_name: "",
      parent1_middle_name: "",
      parent1_dob: "",
      parent1_city_of_birth: "",
      parent1_country_of_birth: "",
      parent1_current_city: "",
      parent1_current_country: "",
      parent2_family_name: "",
      parent2_given_name: "",
      parent2_middle_name: "",
      parent2_dob: "",
      parent2_city_of_birth: "",
      parent2_country_of_birth: "",
      parent2_current_city: "",
      parent2_current_country: "",
      employer_name: "",
      employer_street: "",
      employer_city: "",
      employer_state: "",
      employer_zip: "",
      employer_country: "",
      occupation: "",
      employment_date_from: "",
      i94_number: "",
      passport_number: "",
      travel_doc_number: "",
      passport_country: "",
      passport_expiration: "",
    },
    relationship: "",
  };
}
