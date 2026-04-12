-- ============================================================================
-- Case Keeper 2.0 — Training System Schema
-- Modules, steps, quizzes, progress tracking, and simulation sessions
-- ============================================================================

-- Create the updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRAINING MODULES
-- Module definitions for each practice area
-- ============================================================================
create table training_modules (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title            text not null,
  description      text,
  practice_area    text not null,                    -- immigration | family | criminal
  duration_minutes integer not null,
  sort_order       integer not null default 0,
  prerequisite_id  uuid references training_modules(id),
  is_active        boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger training_modules_updated_at
  before update on training_modules
  for each row execute function update_updated_at();


-- ============================================================================
-- TRAINING MODULE STEPS
-- Ordered steps within each module
-- ============================================================================
create table training_module_steps (
  id           uuid primary key default gen_random_uuid(),
  module_id    uuid not null references training_modules(id) on delete cascade,
  step_number  integer not null,
  step_type    text not null,                        -- content | quiz | scenario | summary
  title        text not null,
  content_json jsonb not null,
  created_at   timestamptz not null default now(),
  unique(module_id, step_number)
);


-- ============================================================================
-- TRAINING QUIZ QUESTIONS
-- Quiz questions attached to quiz steps
-- ============================================================================
create table training_quiz_questions (
  id              uuid primary key default gen_random_uuid(),
  step_id         uuid not null references training_module_steps(id) on delete cascade,
  question_number integer not null,
  question_text   text not null,
  options         jsonb not null,                    -- array of {key, text}
  correct_key     text not null,
  explanations    jsonb not null,                    -- map of key -> explanation text
  created_at      timestamptz not null default now(),
  unique(step_id, question_number)
);


-- ============================================================================
-- USER MODULE PROGRESS
-- Per-user progress through training modules
-- ============================================================================
create table user_module_progress (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  module_id     uuid not null references training_modules(id) on delete cascade,
  current_step  integer not null default 1,
  status        text not null default 'not_started', -- not_started | in_progress | completed
  score         numeric(5,2),
  started_at    timestamptz,
  completed_at  timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique(clerk_user_id, module_id)
);

create trigger user_module_progress_updated_at
  before update on user_module_progress
  for each row execute function update_updated_at();


-- ============================================================================
-- USER QUIZ ATTEMPTS
-- Individual quiz answer records
-- ============================================================================
create table user_quiz_attempts (
  id             uuid primary key default gen_random_uuid(),
  clerk_user_id  text not null,
  question_id    uuid not null references training_quiz_questions(id) on delete cascade,
  selected_key   text not null,
  is_correct     boolean not null,
  attempt_number integer not null default 1,
  ai_explanation text,
  created_at     timestamptz not null default now()
);


-- ============================================================================
-- SIMULATION SESSIONS
-- Stateful simulation sessions for resume support
-- ============================================================================
create table simulation_sessions (
  id            uuid primary key default gen_random_uuid(),
  clerk_user_id text not null,
  scenario_id   text not null,
  current_phase integer not null default 1,
  status        text not null default 'in_progress', -- in_progress | completed
  decisions     jsonb not null default '[]',
  chat_messages jsonb not null default '[]',
  score         integer,
  max_score     integer,
  started_at    timestamptz not null default now(),
  completed_at  timestamptz,
  updated_at    timestamptz not null default now(),
  unique(clerk_user_id, scenario_id)
);

create trigger simulation_sessions_updated_at
  before update on simulation_sessions
  for each row execute function update_updated_at();


-- ============================================================================
-- INDEXES
-- ============================================================================

-- training_modules
create index idx_training_modules_practice_area  on training_modules(practice_area);
create index idx_training_modules_prerequisite   on training_modules(prerequisite_id);
create index idx_training_modules_sort           on training_modules(sort_order);

-- training_module_steps
create index idx_training_steps_module_id        on training_module_steps(module_id);

-- training_quiz_questions
create index idx_training_questions_step_id      on training_quiz_questions(step_id);

-- user_module_progress
create index idx_user_progress_clerk_user        on user_module_progress(clerk_user_id);
create index idx_user_progress_module            on user_module_progress(module_id);
create index idx_user_progress_status            on user_module_progress(status);

-- user_quiz_attempts
create index idx_quiz_attempts_clerk_user        on user_quiz_attempts(clerk_user_id);
create index idx_quiz_attempts_question          on user_quiz_attempts(question_id);

-- simulation_sessions
create index idx_sim_sessions_clerk_user         on simulation_sessions(clerk_user_id);
create index idx_sim_sessions_status             on simulation_sessions(status);


-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table training_modules       enable row level security;
alter table training_module_steps  enable row level security;
alter table training_quiz_questions enable row level security;
alter table user_module_progress   enable row level security;
alter table user_quiz_attempts     enable row level security;
alter table simulation_sessions    enable row level security;

-- --------------------------------------------------------------------------
-- Content tables: authenticated can read, service_role can do everything
-- --------------------------------------------------------------------------

create policy "Authenticated users can read training_modules"
  on training_modules for select
  to authenticated
  using (true);

create policy "Service role full access on training_modules"
  on training_modules for all
  to service_role
  using (true)
  with check (true);

create policy "Authenticated users can read training_module_steps"
  on training_module_steps for select
  to authenticated
  using (true);

create policy "Service role full access on training_module_steps"
  on training_module_steps for all
  to service_role
  using (true)
  with check (true);

create policy "Authenticated users can read training_quiz_questions"
  on training_quiz_questions for select
  to authenticated
  using (true);

create policy "Service role full access on training_quiz_questions"
  on training_quiz_questions for all
  to service_role
  using (true)
  with check (true);

-- --------------------------------------------------------------------------
-- User tables: users can CRUD their own rows, service_role can do everything
-- --------------------------------------------------------------------------

create policy "Users can manage own module progress"
  on user_module_progress for all
  to authenticated
  using (clerk_user_id = auth.jwt()->>'sub')
  with check (clerk_user_id = auth.jwt()->>'sub');

create policy "Service role full access on user_module_progress"
  on user_module_progress for all
  to service_role
  using (true)
  with check (true);

create policy "Users can manage own quiz attempts"
  on user_quiz_attempts for all
  to authenticated
  using (clerk_user_id = auth.jwt()->>'sub')
  with check (clerk_user_id = auth.jwt()->>'sub');

create policy "Service role full access on user_quiz_attempts"
  on user_quiz_attempts for all
  to service_role
  using (true)
  with check (true);

create policy "Users can manage own simulation sessions"
  on simulation_sessions for all
  to authenticated
  using (clerk_user_id = auth.jwt()->>'sub')
  with check (clerk_user_id = auth.jwt()->>'sub');

create policy "Service role full access on simulation_sessions"
  on simulation_sessions for all
  to service_role
  using (true)
  with check (true);
