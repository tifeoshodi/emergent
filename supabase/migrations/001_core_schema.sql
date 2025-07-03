-- ============================================================================
-- PMFusion Core Schema Migration
-- Implements the complete three-phase project management workflow
-- ============================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";

-- ============================================================================
-- 1. ENUMS & TYPES
-- ============================================================================

-- User roles following the North Star blueprint role hierarchy
create type user_role as enum (
  'admin',         -- Org Owner/Admin
  'scheduler',     -- Project creation, WBS generation
  'team_lead',     -- Task assignment, discipline coordination
  'team_member',   -- Task execution, document upload
  'dcc',          -- Document Control Centre
  'client'        -- External client reviewer
);

-- Task status following kanban workflow
create type task_status as enum (
  'backlog',       -- Synced from WBS, unassigned
  'todo',          -- Assigned by team lead
  'in_progress',   -- Being worked on
  'review_dic',    -- Discipline Internal Check
  'review_idc',    -- Inter-Discipline Check
  'review_dcc',    -- Document Control Centre review
  'done'           -- Completed and approved
);

-- Document lifecycle stages
create type doc_stage as enum (
  'dic',           -- Discipline Internal Check
  'idc',           -- Inter-Discipline Check
  'dcc',           -- Document Control Centre
  'client',        -- Client review
  'approved',      -- Final approval
  'rejected'       -- Requires rework
);

-- Project status
create type project_status as enum (
  'planning',
  'active',
  'on_hold',
  'completed',
  'cancelled'
);

-- CPM calculation status
create type cmp_status as enum (
  'pending',
  'running',
  'completed',
  'error'
);

-- ============================================================================
-- 2. ORGANIZATIONS & PEOPLE
-- ============================================================================

-- Keep existing orgs table, add created_at if missing
alter table orgs add column if not exists created_at timestamptz default now();

-- Disciplines (Process, Civil, Electrical, etc.)
create table disciplines (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references orgs(id) on delete cascade,
  name            text not null,
  code            text,
  color_hex       text default '#6366f1',
  wip_limit       int default 10,
  created_at      timestamptz default now()
);

-- Extended users table
create table users (
  id              uuid primary key,
  org_id          uuid not null references orgs(id) on delete cascade,
  discipline_id   uuid references disciplines(id),
  role            user_role not null,
  email           text unique not null,
  full_name       text not null,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- 3. PROJECTS & WBS
-- ============================================================================

-- Extended projects table (modify existing table)
alter table projects add column if not exists code text;
alter table projects add column if not exists description text;
alter table projects add column if not exists client_name text;
alter table projects add column if not exists start_date date;
alter table projects add column if not exists end_date date;
alter table projects add column if not exists status project_status default 'planning';
alter table projects add column if not exists cmp_status cmp_status default 'pending';
alter table projects add column if not exists updated_at timestamptz default now();
alter table projects add column if not exists owner_id uuid;

-- Add foreign key constraints after owner_id column is created
alter table projects drop constraint if exists projects_owner_id_fkey;
alter table projects add constraint projects_owner_id_fkey foreign key (owner_id) references users(id);

-- Work Breakdown Structure nodes
create table wbs_nodes (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  parent_id       uuid references wbs_nodes(id),
  code            text not null,
  name            text not null,
  description     text,
  discipline_id   uuid references disciplines(id),
  duration_days   numeric(10,2),
  is_milestone    boolean default false,
  sequence        int default 0,
  created_at      timestamptz default now()
);

-- Critical Path Method links (dependencies)
create table cmp_links (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  predecessor_id  uuid not null references wbs_nodes(id),
  successor_id    uuid not null references wbs_nodes(id),
  lag_days        numeric(10,2) default 0,
  created_at      timestamptz default now()
);

-- Critical path results
create table critical_paths (
  project_id      uuid primary key references projects(id) on delete cascade,
  path_nodes      jsonb not null,
  total_duration  numeric(10,2),
  calculated_at   timestamptz default now()
);

-- ============================================================================
-- 4. TASKS & KANBAN
-- ============================================================================

-- Tasks synced from WBS for kanban workflow
create table tasks (
  id              uuid primary key default uuid_generate_v4(),
  project_id      uuid not null references projects(id) on delete cascade,
  wbs_node_id     uuid references wbs_nodes(id),
  discipline_id   uuid not null references disciplines(id),
  assignee_id     uuid references users(id),
  title           text not null,
  description     text,
  status          task_status default 'backlog',
  priority        int default 3,
  due_date        date,
  created_by      uuid not null references users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ============================================================================
-- 5. DOCUMENTS & VERSIONS
-- ============================================================================

-- Document metadata with version control
create table documents (
  id              uuid primary key default uuid_generate_v4(),
  task_id         uuid not null references tasks(id) on delete cascade,
  org_id          uuid not null references orgs(id),
  project_id      uuid not null references projects(id),
  discipline_id   uuid not null references disciplines(id),
  
  -- File information
  file_name       text not null,
  original_name   text not null,
  mime_type       text not null,
  file_size       bigint not null,
  storage_path    text not null,
  
  -- Version control
  version_major   int not null default 1,
  version_minor   int not null default 0,
  revision        text default 'A',
  supersedes_id   uuid references documents(id),
  
  -- Document lifecycle
  stage           doc_stage default 'dic',
  
  -- Timestamps and actors
  created_by      uuid not null references users(id),
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- Document comments/reviews
create table document_comments (
  id              uuid primary key default uuid_generate_v4(),
  document_id     uuid not null references documents(id) on delete cascade,
  author_id       uuid not null references users(id),
  comment         text not null,
  stage           doc_stage not null,      -- Which review stage this comment is from
  is_resolved     boolean default false,
  created_at      timestamptz default now()
);

-- ============================================================================
-- 6. ACTIVITY LOG & NOTIFICATIONS
-- ============================================================================

-- Audit trail for all major actions
create table activity_log (
  id              bigserial primary key,
  org_id          uuid not null references orgs(id),
  actor_id        uuid references users(id),
  entity_type     text not null,
  entity_id       uuid not null,
  action          text not null,
  details         jsonb,
  created_at      timestamptz default now()
);

-- User notifications
create table notifications (
  id              bigserial primary key,
  user_id         uuid not null references users(id) on delete cascade,
  title           text not null,
  message         text not null,
  entity_type     text,
  entity_id       uuid,
  is_read         boolean default false,
  created_at      timestamptz default now()
);

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

-- Core lookup indexes
create index idx_users_org_id on users(org_id);
create index idx_users_discipline_id on users(discipline_id);
create index idx_projects_org_id on projects(org_id);
create index idx_wbs_nodes_project_id on wbs_nodes(project_id);
create index idx_tasks_project_discipline_status on tasks(project_id, discipline_id, status);
create index idx_documents_task_id on documents(task_id);
create index idx_activity_log_org_id on activity_log(org_id);
create index idx_notifications_user_id on notifications(user_id);

-- Unique constraints
create unique index idx_wbs_nodes_project_code on wbs_nodes(project_id, code);
create unique index idx_documents_storage_path on documents(storage_path);

-- ============================================================================
-- 8. TRIGGERS FOR AUTOMATED TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply to relevant tables
create trigger update_users_updated_at before update on users
  for each row execute function update_updated_at_column();

create trigger update_projects_updated_at before update on projects  
  for each row execute function update_updated_at_column();

create trigger update_tasks_updated_at before update on tasks
  for each row execute function update_updated_at_column();

create trigger update_documents_updated_at before update on documents
  for each row execute function update_updated_at_column();

-- ============================================================================
-- 9. INITIAL DATA SETUP
-- ============================================================================

-- Insert default disciplines that most engineering projects need
-- These will be created for each org during seeding 