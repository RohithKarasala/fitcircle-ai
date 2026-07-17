create extension if not exists pgcrypto;

-- =====================================================
-- Profiles
-- =====================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,

    display_name text,
    avatar_url text,

    preferred_unit text not null default 'lb'
        check (preferred_unit in ('lb','kg')),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- =====================================================
-- Workout Sessions
-- =====================================================

create table if not exists public.workout_sessions (

    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    workout_date timestamptz not null default now(),

    workout_day text not null,

    workout_name text not null,

    notes text,

    created_at timestamptz not null default now()
);

-- =====================================================
-- Workout Sets
-- =====================================================

create table if not exists public.workout_sets (

    id uuid primary key default gen_random_uuid(),

    session_id uuid not null
        references public.workout_sessions(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    exercise_id text not null,

    exercise_name text not null,

    set_number integer not null
        check (set_number > 0),

    weight numeric(8,2),

    reps integer
        check (reps >= 0),

    rir integer
        check (rir >= 0 and rir <= 10),

    created_at timestamptz not null default now()
);

-- =====================================================
-- Indexes
-- =====================================================

create index if not exists idx_workout_sessions_user
on public.workout_sessions(user_id);

create index if not exists idx_workout_sessions_date
on public.workout_sessions(workout_date desc);

create index if not exists idx_workout_sets_session
on public.workout_sets(session_id);

create index if not exists idx_workout_sets_user
on public.workout_sets(user_id);

create index if not exists idx_workout_sets_exercise
on public.workout_sets(exercise_id);

-- =====================================================
-- Enable RLS
-- =====================================================

alter table public.profiles
enable row level security;

alter table public.workout_sessions
enable row level security;

alter table public.workout_sets
enable row level security;

-- =====================================================
-- Profiles Policies
-- =====================================================

drop policy if exists "Users can view own profile"
on public.profiles;

create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

drop policy if exists "Users can insert own profile"
on public.profiles;

create policy "Users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile"
on public.profiles;

create policy "Users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- =====================================================
-- Workout Session Policies
-- =====================================================

drop policy if exists "Users can view own workout sessions"
on public.workout_sessions;

create policy "Users can view own workout sessions"
on public.workout_sessions
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout sessions"
on public.workout_sessions;

create policy "Users can insert own workout sessions"
on public.workout_sessions
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own workout sessions"
on public.workout_sessions;

create policy "Users can update own workout sessions"
on public.workout_sessions
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own workout sessions"
on public.workout_sessions;

create policy "Users can delete own workout sessions"
on public.workout_sessions
for delete
using (auth.uid() = user_id);

-- =====================================================
-- Workout Set Policies
-- =====================================================

drop policy if exists "Users can view own workout sets"
on public.workout_sets;

create policy "Users can view own workout sets"
on public.workout_sets
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own workout sets"
on public.workout_sets;

create policy "Users can insert own workout sets"
on public.workout_sets
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own workout sets"
on public.workout_sets;

create policy "Users can update own workout sets"
on public.workout_sets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own workout sets"
on public.workout_sets;

create policy "Users can delete own workout sets"
on public.workout_sets
for delete
using (auth.uid() = user_id);

-- =====================================================
-- Permissions
-- =====================================================

grant usage on schema public to authenticated;

grant select, insert, update
on public.profiles
to authenticated;

grant select, insert, update, delete
on public.workout_sessions
to authenticated;

grant select, insert, update, delete
on public.workout_sets
to authenticated;
