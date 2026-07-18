begin;

alter table public.nutrition_targets
add column if not exists carb_target_g numeric(5, 1) not null default 220
    check (carb_target_g >= 0 and carb_target_g <= 1000);

alter table public.nutrition_targets
add column if not exists fat_target_g numeric(5, 1) not null default 70
    check (fat_target_g >= 0 and fat_target_g <= 500);

alter table public.nutrition_logs
add column if not exists carbs_g numeric(5, 1)
    check (carbs_g is null or (carbs_g >= 0 and carbs_g <= 1000));

alter table public.nutrition_logs
add column if not exists fat_g numeric(5, 1)
    check (fat_g is null or (fat_g >= 0 and fat_g <= 500));

alter table public.nutrition_entries
add column if not exists carbs_g numeric(5, 1)
    check (carbs_g is null or (carbs_g >= 0 and carbs_g <= 1000));

alter table public.nutrition_entries
add column if not exists fat_g numeric(5, 1)
    check (fat_g is null or (fat_g >= 0 and fat_g <= 500));

commit;
