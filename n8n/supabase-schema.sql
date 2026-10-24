-- Tables the two n8n workflows read and write.
-- Run in the Supabase SQL editor. If your tables already exist, the ALTERs add only what is missing.
-- If units.id is uuid in your project, change the id / unit_id types below to uuid.

create table if not exists units (
  id               text primary key,
  building         text,
  unit_label       text,
  city             text,
  stage            text default 'Notice',   -- Notice | Move-out | Listed | Showing | Application | Lease signed
  stage_entered_at timestamptz default now(),
  move_out_date    date,
  rent             numeric,
  owner            text,
  listing_draft    text
);

alter table units add column if not exists stage_entered_at timestamptz default now();
alter table units add column if not exists move_out_date date;
alter table units add column if not exists listing_draft text;

create table if not exists turnover_tasks (
  id         bigint generated always as identity primary key,
  unit_id    text not null,
  title      text not null,
  role       text,
  due_date   date,
  status     text not null default 'open',
  created_at timestamptz default now()
);

create index if not exists turnover_tasks_unit_idx on turnover_tasks (unit_id);
create index if not exists units_stage_idx on units (stage);
