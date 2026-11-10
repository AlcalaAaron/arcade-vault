-- Catálogo de juegos (copiado de arcade-vault-dev). Idempotente.

insert into public.games (id, title, short, long, cat, cover, color, created_at) values
('asteroids', 'ASTEROIDS', 'Pulveriza rocas en gravedad cero.',
 'Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Supera niveles y acumula puntos antes de que los asteroides te alcancen.',
 'SHOOTER', 'cover-rocas', 'yellow', '2026-10-30 09:07:09.689812+00'),
('tetris', 'TETRIS', 'Apila tetrominos antes de que el techo te aplaste.',
 'Siete piezas, diez columnas, una sola regla: no dejes que el tablero llegue arriba. Gira y encaja tetrominos para completar líneas y ganar puntos; cada nivel te las acelera un poco más.',
 'PUZZLE', 'cover-tetro', 'cyan', '2026-10-30 09:08:09.689812+00'),
('arkanoid', 'ARKANOID', 'Rompe todos los bloques antes de perder tus 3 vidas.',
 'Controla la paleta y rebota la pelota para destruir todos los bloques. Cinco niveles con patrones distintos y velocidad creciente ponen a prueba tus reflejos. Completa el nivel 5 sin agotar tus vidas para ganar.',
 'ARCADE', 'cover-bricks', 'cyan', '2026-10-30 09:09:09.689812+00'),
('snake', 'SNAKE', 'Come frutas, crece y no te muerdas la cola.',
 'Guía a la serpiente por el tablero comiendo frutas que aparecen aleatoriamente. Cada fruta que comes hace crecer tu cuerpo y sube tu puntuación. La partida termina si chocas contra una pared o contra ti mismo.',
 'ARCADE', 'cover-snake', 'green', '2026-10-30 09:10:09.689812+00'),
('frogger', 'FROGGER', 'Cruza la carretera y el río sin convertirte en papilla.',
 'Guía a tu rana a través de una carretera repleta de coches y un río de troncos y tortugas flotantes. Llena las cinco bocas del otro lado para completar la ronda; cada nivel acelera el tráfico y acorta el tiempo. Tres vidas y mucho asfalto por delante.',
 'ARCADE', 'cover-rana', 'green', '2026-10-30 09:11:09.689812+00')
on conflict (id) do update set
  title = excluded.title,
  short = excluded.short,
  long  = excluded.long,
  cat   = excluded.cat,
  cover = excluded.cover,
  color = excluded.color;
