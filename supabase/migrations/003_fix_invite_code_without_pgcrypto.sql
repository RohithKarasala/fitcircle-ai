begin;

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

commit;
