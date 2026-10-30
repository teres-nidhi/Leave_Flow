create extension if not exists "pgcrypto";

create type leave_status as enum ('Pending','Approved','Rejected','Cancelled');
create type app_role as enum ('employee','manager','admin');

create table organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text not null default 'India',
  weekend_days smallint[] not null default array[0,6],
  settings jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references organizations(id),
  employee_id text unique,
  full_name text not null,
  email text not null unique,
  phone text,
  department text,
  designation text,
  manager_id uuid references profiles(id),
  employment_status text not null default 'Active' check (employment_status in ('Active','Inactive','Probation')),
  role app_role not null default 'employee',
  avatar_url text,
  joining_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table departments (id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id), name text not null, unique(organization_id,name));
create table leave_types (id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id), name text not null, code text not null, unpaid boolean default false, active boolean default true, unique(organization_id,code));
create table leave_policies (
  id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id), leave_type_id uuid references leave_types(id),
  annual_allocation numeric(7,2) not null default 0, accrual_frequency text default 'Annual',
  maximum_accumulation numeric(7,2), carry_forward_limit numeric(7,2), minimum_notice integer default 0,
  max_consecutive_days integer, half_day_allowed boolean default true, document_required boolean default false,
  negative_balance_allowed boolean default false, probation_eligible boolean default true,
  applicable_categories text[] default array['Full-time'], updated_at timestamptz default now(),
  unique(organization_id,leave_type_id)
);
create table employee_leave_policies (employee_id uuid references profiles(id), policy_id uuid references leave_policies(id), primary key(employee_id,policy_id));
create table leave_balances (
  id uuid primary key default gen_random_uuid(), employee_id uuid references profiles(id), leave_type_id uuid references leave_types(id),
  year integer not null, annual_allocation numeric(7,2) default 0, opening_balance numeric(7,2) default 0,
  accrued_balance numeric(7,2) default 0, used_balance numeric(7,2) default 0, pending_balance numeric(7,2) default 0,
  carried_forward numeric(7,2) default 0, available_balance numeric(7,2) generated always as
    (opening_balance + accrued_balance + carried_forward - used_balance - pending_balance) stored,
  unique(employee_id,leave_type_id,year)
);
create table leave_balance_transactions (
  id uuid primary key default gen_random_uuid(), balance_id uuid references leave_balances(id), application_id uuid,
  amount numeric(7,2) not null, transaction_type text not null check (transaction_type in ('allocation','pending','approve','reject','cancel','adjustment')),
  reason text, created_by uuid references profiles(id), created_at timestamptz default now()
);
create table leave_applications (
  id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id),
  employee_id uuid references profiles(id), leave_type_id uuid references leave_types(id),
  start_date date not null, end_date date not null, is_half_day boolean default false, total_days numeric(5,2) not null,
  reason text not null, contact_details text, attachment_url text, status leave_status default 'Pending',
  submitted_at timestamptz default now(), updated_at timestamptz default now(),
  check(end_date >= start_date), check(total_days >= 0)
);
create table leave_approvals (
  id uuid primary key default gen_random_uuid(), application_id uuid references leave_applications(id) on delete cascade,
  approver_id uuid references profiles(id), decision leave_status not null, comment text,
  created_at timestamptz default now(), unique(application_id,approver_id)
);
create table holidays (id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id), name text not null,
  holiday_date date not null, description text, recurring boolean default false, holiday_type text default 'Organization',
  state_code text, optional boolean default false, unique(organization_id,name,holiday_date));
create table notifications (id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id),
  user_id uuid references profiles(id), title text not null, body text, link text, read_at timestamptz, created_at timestamptz default now());
create table audit_logs (id uuid primary key default gen_random_uuid(), organization_id uuid references organizations(id),
  user_id uuid references profiles(id), action text not null, record_type text, record_id uuid,
  previous_value jsonb, updated_value jsonb, reason text, created_at timestamptz default now());
create index on profiles(organization_id); create index on leave_applications(employee_id,status); create index on leave_applications(start_date,end_date);
create index on holidays(organization_id,holiday_date); create index on notifications(user_id,read_at);

create or replace function is_admin() returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles where id=auth.uid() and role='admin');
$$;
create or replace function is_manager_of(employee uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from profiles e join profiles m on m.id=auth.uid() where e.id=employee and e.manager_id=m.id)
  or is_admin();
$$;

alter table organizations enable row level security; alter table profiles enable row level security;
alter table leave_applications enable row level security; alter table leave_balances enable row level security;
alter table leave_types enable row level security; alter table leave_policies enable row level security;
alter table holidays enable row level security; alter table notifications enable row level security; alter table audit_logs enable row level security;

create policy profile_self on profiles for select using (id=auth.uid() or is_manager_of(id) or is_admin());
create policy profile_admin_update on profiles for update using (is_admin());
create policy leave_read on leave_applications for select using (employee_id=auth.uid() or is_manager_of(employee_id) or is_admin());
create policy leave_insert on leave_applications for insert with check (employee_id=auth.uid());
create policy leave_update on leave_applications for update using (employee_id=auth.uid() or is_manager_of(employee_id) or is_admin());
create policy balance_read on leave_balances for select using (employee_id=auth.uid() or is_admin());
create policy shared_read_types on leave_types for select using (true);
create policy shared_read_policies on leave_policies for select using (true);
create policy holiday_read on holidays for select using (true);
create policy notification_owner on notifications for all using (user_id=auth.uid());
create policy audit_admin on audit_logs for select using (is_admin());

create or replace function approve_leave(application uuid, decision leave_status, comment text default null)
returns leave_applications language plpgsql security definer set search_path=public as $$
declare app leave_applications; old_status leave_status; balance uuid; begin
  select * into app from leave_applications where id=application for update;
  if not found then raise exception 'Application not found'; end if;
  if app.status <> 'Pending' then raise exception 'Application has already been decided'; end if;
  if app.employee_id=auth.uid() or not is_manager_of(app.employee_id) then raise exception 'Not authorized'; end if;
  if decision='Rejected' and coalesce(btrim(comment),'')='' then raise exception 'Rejection reason required'; end if;
  old_status:=app.status;
  update leave_applications set status=decision,updated_at=now() where id=application returning * into app;
  insert into leave_approvals(application_id,approver_id,decision,comment) values(application,auth.uid(),decision,comment);
  insert into audit_logs(user_id,organization_id,action,record_type,record_id,previous_value,updated_value,reason)
    values(auth.uid(),app.organization_id,case when decision='Approved' then 'leave.approved' else 'leave.rejected' end,'leave_application',application,jsonb_build_object('status',old_status),jsonb_build_object('status',decision),comment);
  return app;
end; $$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles (id,email,full_name,role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name','New Employee'), 'employee')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
