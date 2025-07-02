-- Initialize base schema
create table orgs (
  id uuid primary key default uuid_generate_v4(),
  name text not null
);

create table profiles (
  id uuid primary key,
  org_id uuid references orgs(id),
  email text
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  org_id uuid references orgs(id),
  name text not null,
  owner uuid references profiles(id),
  created_at timestamp with time zone default now()
);

alter table orgs enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;

create policy "Allow logged-in read" on orgs
  for select using (auth.role() = 'authenticated');
create policy "Allow insert" on orgs
  for insert with check (auth.role() = 'authenticated');

create policy "Allow logged-in read" on profiles
  for select using (auth.role() = 'authenticated');
create policy "Allow insert" on profiles
  for insert with check (auth.role() = 'authenticated');

create policy "Allow logged-in read" on projects
  for select using (auth.role() = 'authenticated');
create policy "Allow insert" on projects
  for insert with check (auth.role() = 'authenticated');
