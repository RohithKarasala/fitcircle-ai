create table if not exists public.workout_drafts (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    workout_day text not null,
    workout_name text not null,
    workout_key text,
    workout_payload jsonb not null default '{}'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id, workout_day)
);

create index if not exists idx_workout_drafts_user
on public.workout_drafts(user_id);

create index if not exists idx_workout_drafts_updated
on public.workout_drafts(updated_at desc);

alter table public.workout_drafts
enable row level security;

drop policy if exists "Users can view own workout drafts"
on public.workout_drafts;

create policy "Users can view own workout drafts"
on public.workout_drafts
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout drafts"
on public.workout_drafts;

create policy "Users can insert own workout drafts"
on public.workout_drafts
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own workout drafts"
on public.workout_drafts;

create policy "Users can update own workout drafts"
on public.workout_drafts
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own workout drafts"
on public.workout_drafts;

create policy "Users can delete own workout drafts"
on public.workout_drafts
for delete
using (auth.uid() = user_id);

grant select, insert, update, delete
on public.workout_drafts
to authenticated;
