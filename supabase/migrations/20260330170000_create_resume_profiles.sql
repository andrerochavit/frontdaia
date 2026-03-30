-- Resume profiles table for uploaded curricula
create table if not exists public.resume_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  file_url text,
  file_name text,
  source_type text default 'pdf',
  extracted_skills jsonb not null default '[]'::jsonb,
  experience_summary text not null default '',
  value_proposition text not null default '',
  stakeholders jsonb not null default '[]'::jsonb,
  plain_text text,
  analysis jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resume_profiles enable row level security;

create policy "Users can select their resume profiles"
  on public.resume_profiles for select
  using (auth.uid() = user_id);

create policy "Users can insert their resume profiles"
  on public.resume_profiles for insert
  with check (auth.uid() = user_id);

create policy "Users can update their resume profiles"
  on public.resume_profiles for update
  using (auth.uid() = user_id);

create policy "Users can delete their resume profiles"
  on public.resume_profiles for delete
  using (auth.uid() = user_id);

create trigger update_resume_profiles_updated_at
  before update on public.resume_profiles
  for each row execute function public.update_updated_at_column();
