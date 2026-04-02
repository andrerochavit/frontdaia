-- DISC results table for storing user assessment responses and scores
create table if not exists public.disc_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  d_score integer not null default 0,
  i_score integer not null default 0,
  s_score integer not null default 0,
  c_score integer not null default 0,
  dominant_profile text not null check (dominant_profile in ('D', 'I', 'S', 'C')),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.disc_results enable row level security;

-- Policies for DISC results
create policy "Users can select their own DISC results"
  on public.disc_results for select
  using (auth.uid() = user_id);

create policy "Users can insert their DISC results"
  on public.disc_results for insert
  with check (auth.uid() = user_id);

create policy "Users can update their DISC results"
  on public.disc_results for update
  using (auth.uid() = user_id);

create policy "Users can delete their DISC results"
  on public.disc_results for delete
  using (auth.uid() = user_id);

-- Trigger for automatically updating updated_at
create trigger update_disc_results_updated_at
  before update on public.disc_results
  for each row execute function public.update_updated_at_column();
