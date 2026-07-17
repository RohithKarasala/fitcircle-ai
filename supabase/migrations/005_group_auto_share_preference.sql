begin;

alter table public.group_members
add column if not exists auto_share_workouts boolean not null default false;

create or replace function public.update_group_auto_share(
    p_group_id uuid,
    p_enabled boolean
)
returns boolean
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

    update public.group_members
    set auto_share_workouts = coalesce(p_enabled, false)
    where group_id = p_group_id
      and user_id = current_user_id;

    if not found then
        raise exception 'Group not found or you no longer have access';
    end if;

    return coalesce(p_enabled, false);
end;
$$;

revoke all on function public.update_group_auto_share(uuid, boolean)
from public, anon, authenticated;

grant execute on function public.update_group_auto_share(uuid, boolean)
to authenticated;

commit;
