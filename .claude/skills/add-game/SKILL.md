---
name: add-game
description: Diseña el spec para añadir un juego canvas jugable a Arcade Vault con su leaderboard en Supabase y su integración en la plataforma. El juego puede venir de references/started-games o escribirse desde cero. Úsala cuando se quiera integrar un juego nuevo. Solo genera el spec; la implementación la hace /spec-impl.
disable-model-invocation: true
argument-hint: '<id-juego | NN-carpeta-referencia>'
---

# /add-game — Spec para integrar un juego con leaderboard

Esta skill produce **un único fichero: `specs/NN-<id>-game.md`**. Condensa lo aprendido en
`specs/05-asteroids-game.md` (canvas → componente React + play-page) y
`specs/06-games-table-leaderboard-supabase.md` (fila en `games` + scores en `scores`).

**No escribes código aquí.** Ni componentes, ni play-pages, ni assets, ni CSS, ni SQL ejecutado.
La implementación la hace `/spec-impl NN-<slug>` cuando el usuario apruebe el spec. Por eso el plan de
implementación del spec debe salir ya redactado y autosuficiente.

Responde en el idioma del prompt (normalmente español).

## Ficheros de apoyo (léelos cuando se indique)

- `templates/spec.md` — esqueleto del spec a generar.
- `templates/game-component.tsx.md` — esqueleto del componente canvas.
- `templates/play-page.tsx.md` — esqueleto de la play-page con modal y guardado de score.
- `references/porting-guide.md` — cómo portar JS vanilla a componente + notas por juego de referencia.

Las plantillas son `.md` a propósito: así `tsc` y ESLint no las procesan. Se leen para **redactar el spec**
y para que `/spec-impl` las use después; no se copian a `app/` ni a `components/` en esta skill.

## Fase 0 — Contexto (obligatoria)

1. Lee `CLAUDE.md` y `AGENTS.md` (esta versión de Next.js difiere de lo conocido).
2. `ls specs/` para calcular el siguiente número `NN`.
3. `ls references/started-games/`, `ls components/games` y `ls app/games` para saber qué juegos existen
   y cuáles están ya integrados.
4. Lee el código vigente, que manda sobre las plantillas si difieren:
   `components/games/AsteroidsGame.tsx`, `app/games/asteroids/play/page.tsx`, `lib/supabase/types.ts`.
5. Lee los dos últimos specs (05 y 06 o los más recientes) para igualar el estilo.

## Fase 1 — Identificar el origen del juego

`$ARGUMENTS` es el argumento recibido. Si está vacío, pide el id o la carpeta de referencia y espera.

- **Con referencia.** Si el argumento coincide con una carpeta de `references/started-games/` (por nombre
  completo o parcial, p. ej. `tetris` → `03-tetris`), léela entera: `index.html`, `game.js`, `levels.js`,
  `assets/`, `README.md`, `CLAUDE.md`. Esa carpeta es **solo lectura**. Si ya existe
  `components/games/<X>Game.tsx` para ese juego, avisa y pregunta si se trata de una revisión.
- **Sin referencia.** Pide una descripción **en una frase** (mecánica, controles, cómo se puntúa,
  vidas/niveles). Si no cabe en una frase, el juego es demasiado grande: propón dividirlo. El spec describirá
  el juego desde cero; no leas `references/`.

Lee `references/porting-guide.md` y aplícalo al juego concreto.

## Fase 2 — Preguntas

Bloques de 3 a 5 preguntas numeradas, concretas, con 2–4 opciones y tu recomendación marcada. Espera respuesta
entre bloques. Cubre siempre:

1. **Identidad.** `id` (slug, único, también ruta `/games/<id>`), `title`, `short`, `long` en español.
2. **Catálogo.** `cat` (`ARCADE` | `PUZZLE` | `SHOOTER`), `color` (`cyan` | `magenta` | `yellow` | `green`)
   y `cover`: una clase `.cover-*` existente de `app/globals.css` o una nueva (¿qué dibujo?).
   Si hace falta un valor fuera de esas uniones, el spec debe incluir ampliar `GameRow` en `lib/supabase/types.ts`.
3. **Controles.** Teclas/ratón; cuáles necesitan `preventDefault`.
4. **HUD.** Qué valores existen de verdad: `score` siempre; `lives` y `level` solo si aplican (Tetris: líneas
   en lugar de vidas). Los que no apliquen se omiten de la play-page.
5. **Fin de partida.** Qué dispara `onGameOver` (en Arkanoid también existe `win`: ¿cuenta como game over
   con la puntuación?). Cuál es el score final que se guarda.
6. **Assets.** Sprites, sonidos, niveles externos → irán a `public/games/<id>/`.
7. **Fuera de alcance.** Skins, temas, controles táctiles, leaderboard local del original, etc.
8. **Cierres ya decididos.** Lo que el usuario no quiera reabrir.

Para de preguntar cuando puedas responder sin suponer: qué ficheros aparecen o cambian, cuál es el primer
y el último paso, y cómo se verifica.

## Fase 3 — Desarrollar el spec sección a sección

Lee `templates/spec.md`. No generes todo de golpe: muestra cada sección, pregunta
«¿Se queda así o quieres ajustar algo?» y avanza solo con confirmación. Orden:

1. Cabecera (estado `Borrador`, depende de `05-asteroids-game, 06-games-table-leaderboard-supabase`
   y de los specs de juegos ya integrados, fecha, objetivo en **una** frase).
2. Scope (In / Fuera de alcance, ambos obligatorios).
3. Data model: `INSERT` literal de la fila en `games`, interfaz de props del componente, y — si aplica —
   tipos nuevos de `types.ts`.
4. Implementation plan (ver «Plan de implementación obligatorio»).
5. Acceptance criteria (checklist booleano).
6. Decisions.
7. Riesgos (solo si hay).

### Plan de implementación obligatorio

El spec debe contener estos pasos, adaptados al juego. Cada paso deja el sistema funcional y se puede commitear:

1. **Fila en Supabase.** `INSERT INTO games (id, title, short, long, cat, cover, color) VALUES (...)` literal,
   para pegar en el SQL Editor. No se recrean tablas; si `games`/`scores` no existen, remitir al DDL del spec 06.
   Si hay MCP de Supabase disponible en la sesión de implementación, puede ejecutarse con él.
   _Verificación:_ la fila aparece en el Table Editor y la card sale en `/games`.
2. **(Si aplica) Tipos.** Ampliar uniones de `lib/supabase/types.ts`.
3. **Assets** a `public/games/<id>/` (rutas `/games/<id>/…`) y datos grandes (`levels.js`) a módulo `.ts`
   junto al componente.
4. **Componente** `components/games/<Pascal>Game.tsx` según `templates/game-component.tsx.md` y la guía de portado.
   _Verificación:_ el juego arranca y es jugable en la play-page.
5. **Play-page** `app/games/<id>/play/page.tsx` según `templates/play-page.tsx.md`.
   _Verificación:_ HUD React sincronizado, pausa, modal de game over, «JUGAR DE NUEVO».
6. **Portada.** Reutilizar `.cover-*` o añadir una a `app/globals.css`.
7. **Verificación final.** `npm run build` y lint sin errores; con Playwright MCP recorrer `/games` →
   `/games/<id>` → `/games/<id>/play` → game over → guardar → el score aparece en `/games/<id>` y
   `/hall-of-fame`. Capturas en `.playwright-screenshots/`.

### Fuera de alcance que el spec debe declarar siempre

- `app/games/[id]/play/page.tsx`, `app/games/GamesGrid.tsx`, `app/games/page.tsx`, `app/games/[id]/page.tsx` y
  `app/hall-of-fame/*`: son data-driven desde Supabase; el juego aparece al insertar la fila.
- Supabase Auth (`user_id` siempre `null`), RLS y Realtime.
- Componente genérico `CanvasGame` o `GamePlayShell`: se copia el patrón de Asteroids, una play-page por juego.
- Modificar `references/` o el juego Asteroids existente.

### Criterios de aceptación mínimos

Adapta la lista de `specs/05` y `specs/06`: la card aparece en `/games`; `/games/<id>` carga con datos reales y
404 no aplica; `/games/<id>/play` carga sin errores de SSR; el HUD React refleja el estado; pausa congela y reanuda;
el game over abre el modal con la puntuación final; el nombre se pre-rellena desde `av_player_name`; al guardar se
inserta en `scores` con `game_id = '<id>'` y `user_id = null`, se persiste `av_player_name` y el botón queda
deshabilitado (sin doble inserción); el score aparece en `/games/<id>` y en `/hall-of-fame`; `npm run build` sin errores.

## Fase 4 — Guardar y traspasar

1. Calcula `NN` (siguiente al último de `specs/`) y un slug `NN-<id>-game`.
2. Pregunta si el nombre del fichero está bien antes de escribir.
3. Escribe `specs/NN-<id>-game.md` con las secciones aprobadas. Estado `Borrador` por defecto: **nunca**
   lo marques `Aprobado` tú.
4. Confirma: ruta del fichero, que está en `Borrador`, y el siguiente paso —
   revisarlo, pasarlo a `Aprobado` y ejecutar `/spec-impl NN-<id>-game`.

## Reglas duras

- Lo único que escribes es `specs/NN-<id>-game.md`. Nada de código, assets, CSS ni cambios en `references/`.
- No supongas decisiones que el usuario no confirmó; pregunta.
- No generes el spec completo en una sola respuesta.
- Si el usuario quiere saltarse la Fase 2, recuérdale que las preguntas ahorran horas; si insiste, anótalo
  en Decisions («Definición rápida sin clarificación detallada»).
- Si se piden varios juegos a la vez, un spec por juego.
