begin;

alter table public.profiles
add column if not exists track_rir boolean not null default false;

commit;
