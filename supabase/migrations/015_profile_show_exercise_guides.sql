begin;

alter table public.profiles
add column if not exists show_exercise_guides boolean not null default true;

commit;
