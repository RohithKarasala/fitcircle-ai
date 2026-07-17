begin;

-- =====================================================
-- Private helper schema
--
-- This schema is not intended to be exposed through
-- the Supabase Data API.
-- =====================================================

create schema if not exists app_private;

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
grant usage on schema app_private to authenticated;

-- =====================================================
-- Groups
-- =====================================================

create table if not exists public.groups (
    id uuid primary key default gen_random_uuid(),

    name text not null
        check (char_length(trim(name)) between 2 and 60),

    invite_code text not null unique,

    created_by uuid not null
        references auth.users(id)
        on delete cascade,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now()
);

-- =====================================================
-- Group Members
-- =====================================================

create table if not exists public.group_members (
    group_id uuid not null
        references public.groups(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    role text not null default 'member'
        check (role in ('owner', 'member')),

    joined_at timestamptz not null default now(),

    primary key (group_id, user_id)
);

-- =====================================================
-- Workout Shares
--
-- The actual workout remains in workout_sessions and
-- workout_sets. This row explicitly grants group access
-- through the secure feed function below.
-- =====================================================

create table if not exists public.workout_shares (
    id uuid primary key default gen_random_uuid(),

    workout_session_id uuid not null
        references public.workout_sessions(id)
        on delete cascade,

    group_id uuid not null
        references public.groups(id)
        on delete cascade,

    user_id uuid not null
        references auth.users(id)
        on delete cascade,

    -- Date intentionally shared with the group.
    -- This avoids exposing the workout's exact timestamp.
    workout_date date not null,

    message text
        check (
            message is null
            or char_length(message) <= 500
        ),

    shared_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    unique (workout_session_id, group_id)
);

-- =====================================================
-- Indexes
-- =====================================================

create unique index if not exists groups_invite_code_idx
    on public.groups(invite_code);

create index if not exists groups_created_by_idx
    on public.groups(created_by);

create index if not exists group_members_user_idx
    on public.group_members(user_id);

create index if not exists group_members_group_idx
    on public.group_members(group_id);

create index if not exists workout_shares_group_date_idx
    on public.workout_shares(group_id, shared_at desc);

create index if not exists workout_shares_user_idx
    on public.workout_shares(user_id);

create index if not exists workout_shares_session_idx
    on public.workout_shares(workout_session_id);

-- =====================================================
-- Updated-at trigger helper
-- =====================================================

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists groups_set_updated_at
on public.groups;

create trigger groups_set_updated_at
before update on public.groups
for each row
execute function app_private.set_updated_at();

drop trigger if exists workout_shares_set_updated_at
on public.workout_shares;

create trigger workout_shares_set_updated_at
before update on public.workout_shares
for each row
execute function app_private.set_updated_at();

-- =====================================================
-- Private membership helpers
--
-- SECURITY DEFINER avoids recursive RLS checks when
-- group policies need to inspect group_members.
-- =====================================================

create or replace function app_private.is_group_member(
    p_group_id uuid,
    p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.group_members gm
        where gm.group_id = p_group_id
          and gm.user_id = p_user_id
    );
$$;

create or replace function app_private.is_group_owner(
    p_group_id uuid,
    p_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.group_members gm
        where gm.group_id = p_group_id
          and gm.user_id = p_user_id
          and gm.role = 'owner'
    );
$$;

revoke all on function app_private.is_group_member(uuid, uuid)
from public, anon;

revoke all on function app_private.is_group_owner(uuid, uuid)
from public, anon;

grant execute on function app_private.is_group_member(uuid, uuid)
to authenticated;

grant execute on function app_private.is_group_owner(uuid, uuid)
to authenticated;

-- =====================================================
-- Enable Row Level Security
-- =====================================================

alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.workout_shares enable row level security;

-- =====================================================
-- Groups RLS
--
-- Group records are visible only to current members.
-- All writes happen through controlled RPC functions.
-- =====================================================

drop policy if exists "Members can view their groups"
on public.groups;

create policy "Members can view their groups"
on public.groups
for select
to authenticated
using (
    app_private.is_group_member(
        groups.id,
        (select auth.uid())
    )
);

-- =====================================================
-- Group Members RLS
--
-- Members can see the roster of groups they belong to.
-- Direct insert/update/delete is intentionally disabled.
-- =====================================================

drop policy if exists "Members can view group roster"
on public.group_members;

create policy "Members can view group roster"
on public.group_members
for select
to authenticated
using (
    app_private.is_group_member(
        group_members.group_id,
        (select auth.uid())
    )
);

-- =====================================================
-- Workout Shares RLS
--
-- Group members may see share metadata.
-- Sharing and unsharing happen through RPC functions.
-- =====================================================

drop policy if exists "Members can view group workout shares"
on public.workout_shares;

create policy "Members can view group workout shares"
on public.workout_shares
for select
to authenticated
using (
    app_private.is_group_member(
        workout_shares.group_id,
        (select auth.uid())
    )
);

-- =====================================================
-- Table Permissions
--
-- Authenticated clients receive read-only table access.
-- Mutations are handled through secure functions.
-- =====================================================

revoke all on public.groups
from anon, authenticated;

revoke all on public.group_members
from anon, authenticated;

revoke all on public.workout_shares
from anon, authenticated;

grant select on public.groups
to authenticated;

grant select on public.group_members
to authenticated;

grant select on public.workout_shares
to authenticated;

-- =====================================================
-- Generate Invite Code
-- =====================================================

create or replace function app_private.generate_invite_code()
returns text
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
    generated_code text;
begin
    loop
        generated_code :=
            upper(
                substr(
                    md5(
                        random()::text
                        || clock_timestamp()::text
                        || txid_current()::text
                    ),
                    1,
                    12
                )
            );

        exit when not exists (
            select 1
            from public.groups g
            where g.invite_code = generated_code
        );
    end loop;

    return generated_code;
end;
$$;

revoke all on function app_private.generate_invite_code()
from public, anon, authenticated;

-- =====================================================
-- Create Group
--
-- Creates the group and owner membership atomically.
-- =====================================================

create or replace function public.create_group(
    p_name text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    new_group_id uuid;
    cleaned_name text;
begin
    current_user_id := auth.uid();
    cleaned_name := trim(p_name);

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if cleaned_name is null
       or char_length(cleaned_name) < 2
       or char_length(cleaned_name) > 60 then
        raise exception 'Group name must contain between 2 and 60 characters';
    end if;

    insert into public.groups (
        name,
        invite_code,
        created_by
    )
    values (
        cleaned_name,
        app_private.generate_invite_code(),
        current_user_id
    )
    returning id into new_group_id;

    insert into public.group_members (
        group_id,
        user_id,
        role
    )
    values (
        new_group_id,
        current_user_id,
        'owner'
    );

    return new_group_id;
end;
$$;

-- =====================================================
-- Join Group
--
-- Users join using a case-insensitive invite code.
-- =====================================================

create or replace function public.join_group(
    p_invite_code text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    matched_group_id uuid;
    cleaned_code text;
begin
    current_user_id := auth.uid();
    cleaned_code := upper(
        replace(
            replace(trim(p_invite_code), '-', ''),
            ' ',
            ''
        )
    );

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if cleaned_code is null or cleaned_code = '' then
        raise exception 'Invite code is required';
    end if;

    select g.id
    into matched_group_id
    from public.groups g
    where g.invite_code = cleaned_code;

    if matched_group_id is null then
        raise exception 'Invalid invite code';
    end if;

    insert into public.group_members (
        group_id,
        user_id,
        role
    )
    values (
        matched_group_id,
        current_user_id,
        'member'
    )
    on conflict (group_id, user_id)
    do nothing;

    return matched_group_id;
end;
$$;

-- =====================================================
-- Leave Group
--
-- Owners cannot leave while still owning the group.
-- For v1, an owner can delete the group instead.
-- =====================================================

create or replace function public.leave_group(
    p_group_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    current_role text;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    select gm.role
    into current_role
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = current_user_id;

    if current_role is null then
        raise exception 'You are not a member of this group';
    end if;

    if current_role = 'owner' then
        raise exception 'The group owner must delete the group instead';
    end if;

    delete from public.group_members
    where group_id = p_group_id
      and user_id = current_user_id;
end;
$$;

-- =====================================================
-- Remove Group Member
--
-- Only the owner can remove another member.
-- The owner cannot remove themselves with this function.
-- =====================================================

create or replace function public.remove_group_member(
    p_group_id uuid,
    p_member_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not app_private.is_group_owner(
        p_group_id,
        current_user_id
    ) then
        raise exception 'Only the group owner can remove members';
    end if;

    if p_member_user_id = current_user_id then
        raise exception 'The owner cannot remove themselves';
    end if;

    delete from public.group_members
    where group_id = p_group_id
      and user_id = p_member_user_id;
end;
$$;

-- =====================================================
-- Rename Group
-- =====================================================

create or replace function public.rename_group(
    p_group_id uuid,
    p_name text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    cleaned_name text;
begin
    current_user_id := auth.uid();
    cleaned_name := trim(p_name);

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not app_private.is_group_owner(
        p_group_id,
        current_user_id
    ) then
        raise exception 'Only the group owner can rename the group';
    end if;

    if cleaned_name is null
       or char_length(cleaned_name) < 2
       or char_length(cleaned_name) > 60 then
        raise exception 'Group name must contain between 2 and 60 characters';
    end if;

    update public.groups
    set name = cleaned_name
    where id = p_group_id;
end;
$$;

-- =====================================================
-- Regenerate Invite Code
--
-- The old invite code immediately stops working.
-- =====================================================

create or replace function public.regenerate_group_invite_code(
    p_group_id uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    new_invite_code text;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not app_private.is_group_owner(
        p_group_id,
        current_user_id
    ) then
        raise exception 'Only the group owner can regenerate the invite code';
    end if;

    new_invite_code := app_private.generate_invite_code();

    update public.groups
    set invite_code = new_invite_code
    where id = p_group_id;

    return new_invite_code;
end;
$$;

-- =====================================================
-- Delete Group
--
-- Cascading foreign keys remove memberships and shares.
-- The original private workouts remain untouched.
-- =====================================================

create or replace function public.delete_group(
    p_group_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not app_private.is_group_owner(
        p_group_id,
        current_user_id
    ) then
        raise exception 'Only the group owner can delete the group';
    end if;

    delete from public.groups
    where id = p_group_id;
end;
$$;

-- =====================================================
-- Share Workout
--
-- A user may only share:
-- 1. Their own workout
-- 2. With a group they currently belong to
--
-- Personal session notes and RIR are never copied.
-- =====================================================

create or replace function public.share_workout_with_group(
    p_workout_session_id uuid,
    p_group_id uuid,
    p_workout_date date,
    p_message text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    share_id uuid;
    cleaned_message text;
begin
    current_user_id := auth.uid();
    cleaned_message := nullif(trim(p_message), '');

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if p_workout_date is null then
        raise exception 'Workout date is required';
    end if;

    if cleaned_message is not null
       and char_length(cleaned_message) > 500 then
        raise exception 'Share message cannot exceed 500 characters';
    end if;

    if not exists (
        select 1
        from public.workout_sessions ws
        where ws.id = p_workout_session_id
          and ws.user_id = current_user_id
    ) then
        raise exception 'Workout not found or does not belong to you';
    end if;

    if not app_private.is_group_member(
        p_group_id,
        current_user_id
    ) then
        raise exception 'You are not a member of this group';
    end if;

    insert into public.workout_shares (
        workout_session_id,
        group_id,
        user_id,
        workout_date,
        message
    )
    values (
        p_workout_session_id,
        p_group_id,
        current_user_id,
        p_workout_date,
        cleaned_message
    )
    on conflict (workout_session_id, group_id)
    do update set
        workout_date = excluded.workout_date,
        message = excluded.message,
        updated_at = now()
    returning id into share_id;

    return share_id;
end;
$$;

-- =====================================================
-- Unshare Workout
-- =====================================================

create or replace function public.unshare_workout_from_group(
    p_workout_session_id uuid,
    p_group_id uuid
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    delete from public.workout_shares
    where workout_session_id = p_workout_session_id
      and group_id = p_group_id
      and user_id = current_user_id;
end;
$$;

-- =====================================================
-- Get Group Feed
--
-- Returns only share-safe information:
-- - Group message
-- - Shared date
-- - Workout type
-- - Exercise names
-- - Set numbers
-- - Weights
-- - Reps
--
-- Explicitly excluded:
-- - workout_sessions.notes
-- - workout_sets.rir
-- - body measurements
-- - nutrition
-- - progress photos
-- =====================================================

create or replace function public.get_group_workout_feed(
    p_group_id uuid,
    p_limit integer default 30,
    p_offset integer default 0
)
returns table (
    share_id uuid,
    workout_session_id uuid,
    user_id uuid,
    display_name text,
    avatar_url text,
    workout_date date,
    workout_day text,
    workout_name text,
    message text,
    shared_at timestamptz,
    total_sets bigint,
    exercises jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
    current_user_id uuid;
    safe_limit integer;
    safe_offset integer;
begin
    current_user_id := auth.uid();

    if current_user_id is null then
        raise exception 'Authentication required';
    end if;

    if not app_private.is_group_member(
        p_group_id,
        current_user_id
    ) then
        raise exception 'You are not a member of this group';
    end if;

    safe_limit := least(greatest(coalesce(p_limit, 30), 1), 100);
    safe_offset := greatest(coalesce(p_offset, 0), 0);

    return query
    select
        wsh.id as share_id,
        ws.id as workout_session_id,
        wsh.user_id,
        coalesce(
            nullif(trim(p.display_name), ''),
            'FitCircle Member'
        ) as display_name,
        p.avatar_url,
        wsh.workout_date,
        ws.workout_day,
        ws.workout_name,
        wsh.message,
        wsh.shared_at,

        (
            select count(*)
            from public.workout_sets count_set
            where count_set.session_id = ws.id
              and count_set.user_id = wsh.user_id
        ) as total_sets,

        coalesce(
            (
                select jsonb_agg(
                    jsonb_build_object(
                        'exerciseId',
                        exercise_group.exercise_id,
                        'exerciseName',
                        exercise_group.exercise_name,
                        'sets',
                        exercise_group.sets
                    )
                    order by exercise_group.first_set_created_at
                )
                from (
                    select
                        workout_set.exercise_id,
                        workout_set.exercise_name,
                        min(workout_set.created_at)
                            as first_set_created_at,
                        jsonb_agg(
                            jsonb_build_object(
                                'setNumber',
                                workout_set.set_number,
                                'weight',
                                workout_set.weight,
                                'reps',
                                workout_set.reps
                            )
                            order by workout_set.set_number
                        ) as sets
                    from public.workout_sets workout_set
                    where workout_set.session_id = ws.id
                      and workout_set.user_id = wsh.user_id
                    group by
                        workout_set.exercise_id,
                        workout_set.exercise_name
                ) exercise_group
            ),
            '[]'::jsonb
        ) as exercises

    from public.workout_shares wsh

    join public.workout_sessions ws
      on ws.id = wsh.workout_session_id
     and ws.user_id = wsh.user_id

    left join public.profiles p
      on p.id = wsh.user_id

    where wsh.group_id = p_group_id

    order by
        wsh.workout_date desc,
        wsh.shared_at desc

    limit safe_limit
    offset safe_offset;
end;
$$;

-- =====================================================
-- Function Permissions
--
-- Functions are not protected by table RLS in the same
-- way as normal table queries, so execution permission
-- is explicitly restricted to authenticated users.
-- =====================================================

revoke all on function public.create_group(text)
from public, anon;

revoke all on function public.join_group(text)
from public, anon;

revoke all on function public.leave_group(uuid)
from public, anon;

revoke all on function public.remove_group_member(uuid, uuid)
from public, anon;

revoke all on function public.rename_group(uuid, text)
from public, anon;

revoke all on function public.regenerate_group_invite_code(uuid)
from public, anon;

revoke all on function public.delete_group(uuid)
from public, anon;

revoke all on function public.share_workout_with_group(
    uuid,
    uuid,
    date,
    text
)
from public, anon;

revoke all on function public.unshare_workout_from_group(uuid, uuid)
from public, anon;

revoke all on function public.get_group_workout_feed(
    uuid,
    integer,
    integer
)
from public, anon;

grant execute on function public.create_group(text)
to authenticated;

grant execute on function public.join_group(text)
to authenticated;

grant execute on function public.leave_group(uuid)
to authenticated;

grant execute on function public.remove_group_member(uuid, uuid)
to authenticated;

grant execute on function public.rename_group(uuid, text)
to authenticated;

grant execute on function public.regenerate_group_invite_code(uuid)
to authenticated;

grant execute on function public.delete_group(uuid)
to authenticated;

grant execute on function public.share_workout_with_group(
    uuid,
    uuid,
    date,
    text
)
to authenticated;

grant execute on function public.unshare_workout_from_group(uuid, uuid)
to authenticated;

grant execute on function public.get_group_workout_feed(
    uuid,
    integer,
    integer
)
to authenticated;

commit;
