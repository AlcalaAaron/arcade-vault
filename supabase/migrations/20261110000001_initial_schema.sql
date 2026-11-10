-- Esquema inicial de Arcade Vault (reproduce arcade-vault-dev).

create table if not exists public.games (
  id         text primary key,
  title      text not null,
  short      text not null,
  long       text not null,
  cat        text not null check (cat in ('ARCADE', 'PUZZLE', 'SHOOTER')),
  cover      text not null,
  color      text not null check (color in ('cyan', 'magenta', 'yellow', 'green')),
  created_at timestamptz not null default now()
);

create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     text not null references public.games (id),
  player_name text not null,
  score       integer not null,
  user_id     uuid,
  created_at  timestamptz not null default now()
);

create index if not exists scores_game_score_idx
  on public.scores (game_id, score desc);
