begin;

alter table public.profiles
add column if not exists current_weight_lb numeric(5, 1)
    check (
        current_weight_lb is null
        or (
            current_weight_lb >= 40
            and current_weight_lb <= 900
        )
    );

commit;
