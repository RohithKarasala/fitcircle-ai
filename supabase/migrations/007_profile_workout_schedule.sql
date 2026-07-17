begin;

alter table public.profiles
add column if not exists workout_schedule jsonb not null default '{
    "monday": "monday",
    "tuesday": "tuesday",
    "wednesday": "wednesday",
    "thursday": "thursday",
    "friday": "friday",
    "saturday": "saturday",
    "sunday": "sunday"
}'::jsonb;

commit;
