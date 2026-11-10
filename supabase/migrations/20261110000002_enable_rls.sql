-- RLS + permisos mínimos. En dev las tablas están abiertas (RLS off, ALL para anon).

alter table public.games  enable row level security;
alter table public.scores enable row level security;

-- Lectura pública
create policy "games_select_public" on public.games
  for select to anon, authenticated using (true);

create policy "scores_select_public" on public.scores
  for select to anon, authenticated using (true);

-- Insert: invitados (user_id null) o el propio usuario autenticado
create policy "scores_insert_own_or_guest" on public.scores
  for insert to anon, authenticated
  with check (
    score >= 0
    and (user_id is null or user_id = (select auth.uid()))
  );

-- Quitar privilegios que no usa la app
revoke insert, update, delete, truncate on public.games  from anon, authenticated;
revoke update, delete, truncate         on public.scores from anon, authenticated;
