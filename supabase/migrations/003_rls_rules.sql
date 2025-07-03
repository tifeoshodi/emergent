-- Row Level Security policies for PMFusion tables
-- This migration enables RLS on all tables and adds policies that
-- enforce org_id, project_id and discipline_id checks using JWT claims.

-- ----------------------------------------------
-- Organizations
-- ----------------------------------------------
alter table if exists orgs enable row level security;
create policy orgs_select on orgs
  for select using (id::text = auth.jwt()->> 'org_id');
create policy orgs_modify on orgs
  for all using (
    id::text = auth.jwt()->> 'org_id' and auth.jwt()->> 'role' = 'admin'
  ) with check (
    id::text = auth.jwt()->> 'org_id' and auth.jwt()->> 'role' = 'admin'
  );

-- ----------------------------------------------
-- Disciplines
-- ----------------------------------------------
alter table if exists disciplines enable row level security;
create policy disciplines_policy on disciplines
  for all using (org_id::text = auth.jwt()->> 'org_id')
  with check (org_id::text = auth.jwt()->> 'org_id');

-- ----------------------------------------------
-- Users
-- ----------------------------------------------
alter table if exists users enable row level security;
create policy users_select on users
  for select using (org_id::text = auth.jwt()->> 'org_id');
create policy users_modify on users
  for all using (
    org_id::text = auth.jwt()->> 'org_id' and auth.jwt()->> 'role' = 'admin'
  ) with check (
    org_id::text = auth.jwt()->> 'org_id' and auth.jwt()->> 'role' = 'admin'
  );

-- ----------------------------------------------
-- Projects
-- ----------------------------------------------
alter table if exists projects enable row level security;
create policy projects_policy on projects
  for all using (org_id::text = auth.jwt()->> 'org_id')
  with check (org_id::text = auth.jwt()->> 'org_id');

-- ----------------------------------------------
-- WBS nodes
-- ----------------------------------------------
alter table if exists wbs_nodes enable row level security;
create policy wbs_nodes_policy on wbs_nodes
  for all using (
    project_id in (
      select id from projects
       where org_id::text = auth.jwt()->> 'org_id'
    )
  ) with check (
    project_id in (
      select id from projects
       where org_id::text = auth.jwt()->> 'org_id'
    )
  );

-- ----------------------------------------------
-- CPM links
-- ----------------------------------------------
alter table if exists cpm_links enable row level security;
create policy cpm_links_policy on cpm_links
  for all using (
    project_id in (
      select id from projects
       where org_id::text = auth.jwt()->> 'org_id'
    )
  ) with check (
    project_id in (
      select id from projects
       where org_id::text = auth.jwt()->> 'org_id'
    )
  );

-- ----------------------------------------------
-- Critical paths
-- ----------------------------------------------
alter table if exists critical_paths enable row level security;
create policy critical_paths_policy on critical_paths
  for all using (
    project_id in (
      select id from projects
       where org_id::text = auth.jwt()->> 'org_id'
    )
  ) with check (
    project_id in (
      select id from projects
       where org_id::text = auth.jwt()->> 'org_id'
    )
  );

-- ----------------------------------------------
-- Tasks
-- ----------------------------------------------
alter table if exists tasks enable row level security;
create policy tasks_policy on tasks
  for all using (
    project_id in (select id from projects where org_id::text = auth.jwt()->> 'org_id')
    and (
      auth.jwt()->> 'role' in ('admin','scheduler','team_lead','dcc')
      or discipline_id::text = auth.jwt()->> 'discipline_id'
    )
  ) with check (
    project_id in (select id from projects where org_id::text = auth.jwt()->> 'org_id')
    and (
      auth.jwt()->> 'role' in ('admin','scheduler','team_lead','dcc')
      or discipline_id::text = auth.jwt()->> 'discipline_id'
    )
  );

-- ----------------------------------------------
-- Documents
-- ----------------------------------------------
alter table if exists documents enable row level security;
create policy documents_policy on documents
  for all using (
    org_id::text = auth.jwt()->> 'org_id' and
    project_id in (select id from projects where org_id::text = auth.jwt()->> 'org_id') and
    (
      auth.jwt()->> 'role' in ('admin','scheduler','team_lead','dcc')
      or discipline_id::text = auth.jwt()->> 'discipline_id'
    )
  ) with check (
    org_id::text = auth.jwt()->> 'org_id' and
    project_id in (select id from projects where org_id::text = auth.jwt()->> 'org_id') and
    (
      auth.jwt()->> 'role' in ('admin','scheduler','team_lead','dcc')
      or discipline_id::text = auth.jwt()->> 'discipline_id'
    )
  );

-- ----------------------------------------------
-- Document comments
-- ----------------------------------------------
alter table if exists document_comments enable row level security;
create policy document_comments_policy on document_comments
  for all using (
    document_id in (
      select id from documents
      where org_id::text = auth.jwt()->> 'org_id'
    )
  ) with check (
    document_id in (
      select id from documents
      where org_id::text = auth.jwt()->> 'org_id'
    )
  );

-- ----------------------------------------------
-- Activity log
-- ----------------------------------------------
alter table if exists activity_log enable row level security;
create policy activity_log_policy on activity_log
  for all using (org_id::text = auth.jwt()->> 'org_id')
  with check (org_id::text = auth.jwt()->> 'org_id');

-- ----------------------------------------------
-- Notifications
-- ----------------------------------------------
alter table if exists notifications enable row level security;
create policy notifications_policy on notifications
  for all using (
    user_id in (select id from users where org_id::text = auth.jwt()->> 'org_id')
  ) with check (
    user_id in (select id from users where org_id::text = auth.jwt()->> 'org_id')
  );
