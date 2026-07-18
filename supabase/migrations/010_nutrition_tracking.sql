create table if not exists public.nutrition_targets (
    user_id uuid primary key
        references auth.users(id)
        on delete cascade,

    calorie_target numeric(6, 1) not null default 2200
        check (calorie_target >= 0 and calorie_target <= 10000),
    protein_target_g numeric(5, 1) not null default 160
        check (protein_target_g >= 0 and protein_target_g <= 500),
    fiber_target_g numeric(4, 1) not null default 30
        check (fiber_target_g >= 0 and fiber_target_g <= 150),
    water_target_oz numeric(5, 1) not null default 100
        check (water_target_oz >= 0 and water_target_oz <= 400),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create table if not exists public.nutrition_logs (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,
    log_date date not null,

    calories numeric(6, 1)
        check (calories is null or (calories >= 0 and calories <= 10000)),
    protein_g numeric(5, 1)
        check (protein_g is null or (protein_g >= 0 and protein_g <= 500)),
    fiber_g numeric(4, 1)
        check (fiber_g is null or (fiber_g >= 0 and fiber_g <= 150)),
    water_oz numeric(5, 1)
        check (water_oz is null or (water_oz >= 0 and water_oz <= 400)),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    unique (user_id, log_date)
);

create index if not exists idx_nutrition_logs_user_date
on public.nutrition_logs(user_id, log_date desc);

create table if not exists public.nutrition_entries (
    id uuid primary key default gen_random_uuid(),

    user_id uuid not null
        references auth.users(id)
        on delete cascade,
    log_date date not null,
    name text not null
        check (length(trim(name)) > 0 and length(name) <= 120),

    calories numeric(6, 1)
        check (calories is null or (calories >= 0 and calories <= 10000)),
    protein_g numeric(5, 1)
        check (protein_g is null or (protein_g >= 0 and protein_g <= 500)),
    fiber_g numeric(4, 1)
        check (fiber_g is null or (fiber_g >= 0 and fiber_g <= 150)),
    water_oz numeric(5, 1)
        check (water_oz is null or (water_oz >= 0 and water_oz <= 400)),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_nutrition_entries_user_date
on public.nutrition_entries(user_id, log_date desc, created_at);

alter table public.nutrition_targets
enable row level security;

alter table public.nutrition_logs
enable row level security;

alter table public.nutrition_entries
enable row level security;

drop policy if exists "Users can view own nutrition targets"
on public.nutrition_targets;

create policy "Users can view own nutrition targets"
on public.nutrition_targets
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own nutrition targets"
on public.nutrition_targets;

create policy "Users can insert own nutrition targets"
on public.nutrition_targets
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own nutrition targets"
on public.nutrition_targets;

create policy "Users can update own nutrition targets"
on public.nutrition_targets
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own nutrition logs"
on public.nutrition_logs;

create policy "Users can view own nutrition logs"
on public.nutrition_logs
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own nutrition logs"
on public.nutrition_logs;

create policy "Users can insert own nutrition logs"
on public.nutrition_logs
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own nutrition logs"
on public.nutrition_logs;

create policy "Users can update own nutrition logs"
on public.nutrition_logs
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can view own nutrition entries"
on public.nutrition_entries;

create policy "Users can view own nutrition entries"
on public.nutrition_entries
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own nutrition entries"
on public.nutrition_entries;

create policy "Users can insert own nutrition entries"
on public.nutrition_entries
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own nutrition entries"
on public.nutrition_entries;

create policy "Users can update own nutrition entries"
on public.nutrition_entries
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own nutrition entries"
on public.nutrition_entries;

create policy "Users can delete own nutrition entries"
on public.nutrition_entries
for delete
using (auth.uid() = user_id);

grant select, insert, update
on public.nutrition_targets
to authenticated;

grant select, insert, update
on public.nutrition_logs
to authenticated;

grant select, insert, update, delete
on public.nutrition_entries
to authenticated;
