begin;

create or replace function public.get_group_members_with_profiles(
    p_group_id uuid
)
returns table (
    group_id uuid,
    user_id uuid,
    role text,
    joined_at timestamptz,
    display_name text,
    avatar_url text
)
language plpgsql
stable
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

    if not app_private.is_group_member(
        p_group_id,
        current_user_id
    ) then
        raise exception 'You are not a member of this group';
    end if;

    return query
    select
        gm.group_id,
        gm.user_id,
        gm.role,
        gm.joined_at,
        nullif(trim(p.display_name), '') as display_name,
        p.avatar_url
    from public.group_members gm
    left join public.profiles p
      on p.id = gm.user_id
    where gm.group_id = p_group_id
    order by
        case when gm.role = 'owner' then 0 else 1 end,
        gm.joined_at asc;
end;
$$;

revoke all on function public.get_group_members_with_profiles(uuid)
from public, anon;

grant execute on function public.get_group_members_with_profiles(uuid)
to authenticated;

commit;
