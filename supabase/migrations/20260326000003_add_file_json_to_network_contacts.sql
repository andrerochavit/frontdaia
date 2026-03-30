alter table public.network_contacts
    add column if not exists file_json jsonb;
