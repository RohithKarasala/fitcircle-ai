begin;

alter table public.workout_drafts
add column if not exists workout_date date;

alter table public.workout_drafts
drop constraint if exists workout_drafts_user_id_workout_day_key;

create index if not exists idx_workout_drafts_user_date
on public.workout_drafts(user_id, workout_date);

create unique index if not exists idx_workout_drafts_user_date_unique
on public.workout_drafts(user_id, workout_date)
where workout_date is not null;

commit;
