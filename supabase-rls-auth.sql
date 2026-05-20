-- Omzet & Forecast hardening
-- Toegestane gebruikers:
--   b.groot@grobagroep.nl
--   j.wardenburg@grobagroep.nl
--   b.deboer@grobagroep.nl
--
-- Vooraf in Supabase Dashboard:
-- 1) Authentication > Users: maak deze 3 gebruikers aan.
-- 2) Authentication > Providers/Settings: zet publieke sign-ups uit.
-- 3) Draai daarna dit SQL-blok in Supabase SQL Editor.

alter table public.werkelijk enable row level security;
alter table public.forecast enable row level security;

-- Helperfunctie: alleen deze drie e-mails mogen bij de data.
create or replace function public.omzet_is_allowed_user()
returns boolean
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) in (
    'b.groot@grobagroep.nl',
    'j.wardenburg@grobagroep.nl',
    'b.deboer@grobagroep.nl'
  );
$$;

-- Oude policies opruimen, zodat het script herhaalbaar is.
drop policy if exists "omzet allowed read werkelijk" on public.werkelijk;
drop policy if exists "omzet allowed insert werkelijk" on public.werkelijk;
drop policy if exists "omzet allowed update werkelijk" on public.werkelijk;
drop policy if exists "omzet allowed delete werkelijk" on public.werkelijk;
drop policy if exists "omzet allowed read forecast" on public.forecast;
drop policy if exists "omzet allowed insert forecast" on public.forecast;
drop policy if exists "omzet allowed update forecast" on public.forecast;
drop policy if exists "omzet allowed delete forecast" on public.forecast;

-- Eventuele vorige generieke policies ook verwijderen.
drop policy if exists "omzet authenticated read werkelijk" on public.werkelijk;
drop policy if exists "omzet authenticated insert werkelijk" on public.werkelijk;
drop policy if exists "omzet authenticated update werkelijk" on public.werkelijk;
drop policy if exists "omzet authenticated delete werkelijk" on public.werkelijk;
drop policy if exists "omzet authenticated read forecast" on public.forecast;
drop policy if exists "omzet authenticated insert forecast" on public.forecast;
drop policy if exists "omzet authenticated update forecast" on public.forecast;
drop policy if exists "omzet authenticated delete forecast" on public.forecast;

create policy "omzet allowed read werkelijk"
on public.werkelijk for select
to authenticated
using (public.omzet_is_allowed_user());

create policy "omzet allowed insert werkelijk"
on public.werkelijk for insert
to authenticated
with check (public.omzet_is_allowed_user());

create policy "omzet allowed update werkelijk"
on public.werkelijk for update
to authenticated
using (public.omzet_is_allowed_user())
with check (public.omzet_is_allowed_user());

create policy "omzet allowed delete werkelijk"
on public.werkelijk for delete
to authenticated
using (public.omzet_is_allowed_user());

create policy "omzet allowed read forecast"
on public.forecast for select
to authenticated
using (public.omzet_is_allowed_user());

create policy "omzet allowed insert forecast"
on public.forecast for insert
to authenticated
with check (public.omzet_is_allowed_user());

create policy "omzet allowed update forecast"
on public.forecast for update
to authenticated
using (public.omzet_is_allowed_user())
with check (public.omzet_is_allowed_user());

create policy "omzet allowed delete forecast"
on public.forecast for delete
to authenticated
using (public.omzet_is_allowed_user());
