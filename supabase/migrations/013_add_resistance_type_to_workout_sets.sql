alter table public.workout_sets
add column if not exists resistance_type text not null default 'machine';

alter table public.workout_sets
drop constraint if exists workout_sets_resistance_type_check;

alter table public.workout_sets
add constraint workout_sets_resistance_type_check
check (
  resistance_type in (
    'bodyweight',
    'dumbbell',
    'barbell',
    'machine',
    'cable',
    'plate-loaded',
    'assisted'
  )
);

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
                                workout_set.reps,
                                'resistanceType',
                                workout_set.resistance_type
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
