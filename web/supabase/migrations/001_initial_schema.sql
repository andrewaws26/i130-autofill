-- ============================================================================
-- Case Keeper 2.0 — Initial Schema
-- Attum Law Office: Immigration, Family Law, Criminal Defense
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Helper: auto-update updated_at on row modification
-- ----------------------------------------------------------------------------
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;


-- ============================================================================
-- ATTORNEYS
-- Lawyers, paralegals, and admin staff linked to Clerk auth
-- ============================================================================
create table attorneys (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text unique not null,
  first_name     text not null,
  last_name      text not null,
  email          text unique not null,
  phone          text,
  bar_number     text,
  role           text not null default 'attorney',  -- attorney | paralegal | admin
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create trigger attorneys_updated_at
  before update on attorneys
  for each row execute function update_updated_at();


-- ============================================================================
-- CLIENTS
-- People the firm represents
-- ============================================================================
create table clients (
  id                 uuid primary key default gen_random_uuid(),
  first_name         text not null,
  last_name          text not null,
  middle_name        text,
  email              text,
  phone              text,
  date_of_birth      date,
  ssn_encrypted      text,                         -- encrypted at app layer, never plain
  alien_number       text,                         -- USCIS A-number for immigration clients
  country_of_birth   text,
  preferred_language text not null default 'English',
  address_street     text,
  address_city       text,
  address_state      text,
  address_zip        text,
  address_country    text,
  notes              text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  created_by         uuid references attorneys(id)
);

create trigger clients_updated_at
  before update on clients
  for each row execute function update_updated_at();


-- ============================================================================
-- CASES
-- Legal matters linking a client to an attorney
-- ============================================================================
create table cases (
  id                uuid primary key default gen_random_uuid(),
  client_id         uuid not null references clients(id),
  attorney_id       uuid not null references attorneys(id),
  case_number       text,                          -- internal tracking number
  case_type         text not null,                 -- immigration | family | criminal
  case_subtype      text,                          -- e.g. I-130 Spousal, Divorce, DUI, Asylum, Custody
  status            text not null default 'active', -- active | pending | closed | archived
  title             text not null,                 -- short description
  description       text,
  court_name        text,
  court_case_number text,
  filing_date       date,
  next_hearing_date timestamptz,
  priority          text not null default 'normal', -- low | normal | high | urgent
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create trigger cases_updated_at
  before update on cases
  for each row execute function update_updated_at();


-- ============================================================================
-- CASE EVENTS
-- Deadlines, hearings, milestones, appointments
-- ============================================================================
create table case_events (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references cases(id) on delete cascade,
  event_type  text not null,                       -- hearing | deadline | filing | milestone | appointment
  title       text not null,
  description text,
  event_date  timestamptz not null,
  completed   boolean not null default false,
  created_at  timestamptz not null default now()
);


-- ============================================================================
-- DOCUMENTS
-- Files attached to cases, stored in Supabase Storage
-- ============================================================================
create table documents (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references cases(id) on delete cascade,
  client_id     uuid references clients(id),
  document_type text,                              -- intake_form | filled_form | evidence | correspondence | court_filing | identification | financial
  file_name     text not null,
  file_url      text not null,                     -- Supabase storage URL
  file_size     bigint,
  mime_type     text,
  description   text,
  uploaded_by   uuid references attorneys(id),
  created_at    timestamptz not null default now()
);


-- ============================================================================
-- EVIDENCE CHECKLIST
-- Track required documents per case (e.g. Marriage Certificate, Pay Stubs)
-- ============================================================================
create table evidence_checklist (
  id            uuid primary key default gen_random_uuid(),
  case_id       uuid not null references cases(id) on delete cascade,
  item_name     text not null,
  received      boolean not null default false,
  received_date date,
  notes         text,
  created_at    timestamptz not null default now()
);


-- ============================================================================
-- FORM SUBMISSIONS
-- I-130 and other immigration form auto-fills
-- ============================================================================
create table form_submissions (
  id                uuid primary key default gen_random_uuid(),
  case_id           uuid references cases(id) on delete cascade,
  form_type         text not null,                 -- I-130 | I-485 | I-765 | etc.
  intake_data       jsonb,                         -- extracted JSON from intake form
  generated_pdf_url text,                          -- filled PDF in Supabase storage
  status            text not null default 'draft', -- draft | reviewed | filed
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  created_by        uuid references attorneys(id)
);

create trigger form_submissions_updated_at
  before update on form_submissions
  for each row execute function update_updated_at();


-- ============================================================================
-- INVOICES
-- Billing records per case
-- ============================================================================
create table invoices (
  id               uuid primary key default gen_random_uuid(),
  case_id          uuid not null references cases(id),
  client_id        uuid not null references clients(id),
  invoice_number   text unique not null,
  amount           numeric(10,2) not null,
  government_fees  numeric(10,2) not null default 0,
  status           text not null default 'draft',  -- draft | sent | paid | overdue | cancelled
  due_date         date,
  paid_date        date,
  description      text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger invoices_updated_at
  before update on invoices
  for each row execute function update_updated_at();


-- ============================================================================
-- NOTES
-- Case notes written by attorneys
-- ============================================================================
create table notes (
  id          uuid primary key default gen_random_uuid(),
  case_id     uuid not null references cases(id) on delete cascade,
  attorney_id uuid not null references attorneys(id),
  content     text not null,
  created_at  timestamptz not null default now()
);


-- ============================================================================
-- INDEXES
-- ============================================================================
create index idx_clients_name              on clients(last_name, first_name);
create index idx_cases_client_id           on cases(client_id);
create index idx_cases_attorney_id         on cases(attorney_id);
create index idx_cases_status              on cases(status);
create index idx_cases_case_type           on cases(case_type);
create index idx_case_events_case_date     on case_events(case_id, event_date);
create index idx_documents_case_id         on documents(case_id);
create index idx_invoices_case_id          on invoices(case_id);
create index idx_invoices_client_id        on invoices(client_id);
create index idx_invoices_status           on invoices(status);


-- ============================================================================
-- ROW LEVEL SECURITY
-- Enabled on all tables. Current policy: authenticated users get full access.
-- TODO: tighten with role-based checks (attorney vs. paralegal vs. admin)
-- ============================================================================

alter table attorneys          enable row level security;
alter table clients            enable row level security;
alter table cases              enable row level security;
alter table case_events        enable row level security;
alter table documents          enable row level security;
alter table evidence_checklist enable row level security;
alter table form_submissions   enable row level security;
alter table invoices           enable row level security;
alter table notes              enable row level security;

-- Authenticated users: full CRUD on all tables

create policy "Authenticated users full access"
  on attorneys for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on clients for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on cases for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on case_events for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on documents for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on evidence_checklist for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on form_submissions for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on invoices for all using (auth.role() = 'authenticated');

create policy "Authenticated users full access"
  on notes for all using (auth.role() = 'authenticated');
