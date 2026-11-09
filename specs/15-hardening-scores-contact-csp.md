# SPEC 15 — Hardening: validación de scores en servidor, /api/contact y CSP

> **Estado:** Aprobado
> **Depende de:** 04-supabase-integration · 06-games-table-leaderboard-supabase · 13-supabase-auth · 14-security-rls-password-headers
> **Fecha:** 2026-11-06
> **Objetivo:** Cerrar los huecos de seguridad que los specs 13 y 14 no cubren:
> validar puntuaciones en el servidor mediante una RPC, sanear y limitar
> `/api/contact`, y añadir una CSP en modo Report-Only.

---

## Por qué existe este spec

La revisión de seguridad del 2026-11-06 encontró cuatro problemas. Dos ya están
especificados y solo falta implementarlos, y este spec no los repite:

- Auth falsa basada en `localStorage` → SPEC 13.
- RLS, regex de contraseña, headers básicos y proxy → SPEC 14.

Quedan sin especificar los tres puntos de este spec: el cliente inserta `score` y
`player_name` directamente en `scores` (el RLS del spec 14 solo comprueba
`user_id`, no el valor del puntaje), `/api/contact` interpola entrada del usuario
en HTML sin escapar y no tiene límite de uso, y no hay Content-Security-Policy.

> **Nota de estado:** a fecha de este spec, el código de la rama no refleja lo
> descrito en 13 y 14 (el spec 14 figura como `Implementado`). Reconciliar ese
> estado queda fuera de este spec; ver "Riesgos".

---

## Scope

**In:**

- Migración en Supabase: añadir `games.max_score` y poblarla para los cinco juegos.
- Función SQL `public.submit_score(...)` (`SECURITY DEFINER`) que valida y inserta
  la puntuación fijando `user_id = auth.uid()`.
- Eliminar la política de INSERT directo `authenticated_insert_own_score` sobre
  `scores`, de modo que la RPC sea la única vía de escritura.
- `lib/scores.ts` — helper `submitScore` que llama a la RPC.
- Los cinco `app/games/*/play/page.tsx` (`arkanoid`, `asteroids`, `frogger`,
  `snake`, `tetris`) — sustituir `supabase.from('scores').insert(...)` por `submitScore`.
- `lib/supabase/types.ts` — añadir `max_score` a `GameRow`.
- `app/api/contact/route.ts` — escapar HTML, validar tipos y longitudes, capturar
  JSON inválido, no devolver `err.message` y aplicar rate limiting por IP.
- `lib/security/escape-html.ts` y `lib/security/rate-limit.ts` — utilidades nuevas.
- `next.config.ts` — añadir `Content-Security-Policy-Report-Only`.

**Out of scope (para futuros specs):**

- Implementar auth real, RLS base, regex de contraseña, headers básicos y proxy
  (SPEC 13 y 14).
- HSTS — depende de tener dominio de producción; decisión irreversible.
- CSP en modo enforcing — este spec solo la deja en Report-Only.
- Rate limiting distribuido (Upstash o tabla en Supabase).
- Detección de trampas dentro de la partida (validar el juego en el servidor).
- Mover el destinatario del correo de contacto a una variable de entorno.
- Guardar scores de invitados (el spec 14 ya decidió que solo guardan los autenticados).

---

## Modelo de datos

### Columna nueva `public.games.max_score`

```sql
ALTER TABLE public.games ADD COLUMN max_score integer NOT NULL DEFAULT 1000000;
```

Valores propuestos (a revisar antes de aprobar el spec):

| `games.id`  | `max_score` |
| ----------- | ----------- |
| `tetris`    | 1000000     |
| `asteroids` | 1000000     |
| `arkanoid`  | 500000      |
| `snake`     | 100000      |
| `frogger`   | 100000      |

### Función `public.submit_score`

```sql
public.submit_score(p_game_id text, p_player_name text, p_score integer) returns void
```

Reglas que aplica, en este orden:

1. `auth.uid()` no es `NULL`; si lo es, lanza excepción.
2. `p_game_id` existe en `games`; si no, lanza excepción.
3. `p_player_name` tras `trim` tiene entre 1 y 10 caracteres.
4. `p_score` está entre 0 y `games.max_score` del juego.
5. Inserta `(game_id, player_name, score, user_id)` con `user_id = auth.uid()`.

`EXECUTE` se concede solo a `authenticated` y se revoca a `public` y `anon`.
Se fija `SET search_path = public` en la función.

### `GameRow` (TypeScript)

```ts
export interface GameRow {
  // ...campos existentes
  max_score: number;
}
```

### Rate limit en memoria

```ts
// lib/security/rate-limit.ts
// Mapa IP → timestamps de los envíos dentro de la ventana
const hits = new Map<string, number[]>();
```

Límite: 5 envíos por IP cada 60 minutos. Superado el límite → HTTP 429.

### Límites de entrada de `/api/contact`

| Campo   | Tipo   | Longitud máxima |
| ------- | ------ | --------------- |
| `name`  | string | 80              |
| `email` | string | 254             |
| `msg`   | string | 2000            |

### CSP Report-Only

```
default-src 'self';
script-src 'self' 'unsafe-inline';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
media-src 'self';
font-src 'self' data:;
connect-src 'self' https://*.supabase.co wss://*.supabase.co;
frame-ancestors 'none';
base-uri 'self';
form-action 'self'
```

Se añade en modo dev solo si no rompe HMR (`'unsafe-eval'` únicamente en desarrollo).

---

## Plan de implementación

1. **Migración `games.max_score`** (Supabase vía MCP). Añadir la columna y
   poblar los cinco valores. Verificación: `SELECT id, max_score FROM games`
   devuelve un valor por juego. La app sigue funcionando sin cambios.

2. **Crear `public.submit_score`** con las reglas del modelo de datos y los
   `GRANT`/`REVOKE` indicados. La política de INSERT directo sigue activa.
   Verificación: como `authenticated`, `submit_score('tetris','AAA',100)` inserta
   una fila con `user_id` correcto; con `score = -1` o `score` mayor que
   `max_score` lanza error.

3. **Crear `lib/scores.ts` y actualizar `GameRow`.** `submitScore(gameId, name, score)`
   llama a `supabase.rpc('submit_score', ...)` y devuelve `{ ok, error }`.
   Verificación: `npm run build` sin errores de TypeScript.

4. **Cablear `submitScore` en los cinco play-pages.** Cada uno reemplaza su
   `insert` y muestra un mensaje inline si la RPC devuelve error, en lugar de
   marcar la puntuación como guardada. Verificación: guardar un score en cada
   juego con sesión activa crea la fila; sin sesión muestra el error.

5. **Eliminar el INSERT directo.**
   `DROP POLICY authenticated_insert_own_score ON public.scores;`
   Verificación: un `insert` directo por la API REST con la publishable key
   devuelve error de RLS; la RPC sigue funcionando.

6. **Crear `lib/security/escape-html.ts` y `lib/security/rate-limit.ts`.**
   Verificación: `escapeHtml('<b>&"\'')` devuelve la cadena con las cinco
   entidades escapadas; la sexta llamada seguida de la misma IP devuelve bloqueada.

7. **Endurecer `app/api/contact/route.ts`.** Aplicar en este orden: rate limit
   por IP (429), `try/catch` en `request.json()` (400), validación de tipo y
   longitud (400), `escapeHtml` en `name`, `email` y `msg`, y respuesta de error
   genérica en 500 (el detalle solo se registra con `console.error`).
   Verificación: un `msg` con `<script>` llega escapado al HTML del correo; un
   cuerpo no JSON devuelve 400; el error de Resend ya no llega al cliente.

8. **Añadir CSP Report-Only en `next.config.ts`**, conservando los headers del
   spec 14 si ya están aplicados. Verificación: `curl -I` muestra
   `Content-Security-Policy-Report-Only`; recorrer home, juegos, hall of fame y
   about sin que la app se rompa; revisar la consola por violaciones y ajustar
   la política.

---

## Criterios de aceptación

- [ ] `games.max_score` existe y tiene valor para `tetris`, `asteroids`, `arkanoid`, `snake` y `frogger`.
- [ ] `submit_score` rechaza llamadas sin sesión, con `game_id` inexistente, nombre vacío o de más de 10 caracteres.
- [ ] `submit_score` rechaza `score < 0` y `score > games.max_score`.
- [ ] La fila insertada por `submit_score` tiene `user_id = auth.uid()` aunque el cliente no lo envíe.
- [ ] `EXECUTE` sobre `submit_score` no está concedido a `anon` ni a `public`.
- [ ] La política `authenticated_insert_own_score` ya no existe y un `INSERT` directo sobre `scores` falla por RLS.
- [ ] Ningún archivo bajo `app/` ni `components/` contiene `.from('scores').insert`.
- [ ] Los cinco juegos guardan su puntuación a través de `submitScore`.
- [ ] Si `submitScore` falla, el modal de game-over muestra un error y no el mensaje "PUNTUACIÓN GUARDADA".
- [ ] `/api/contact` escapa `& < > " '` en `name`, `email` y `msg` antes de construir el HTML.
- [ ] `/api/contact` devuelve 400 ante cuerpo no JSON, campos que no son string o que superan la longitud máxima.
- [ ] `/api/contact` devuelve 429 en el sexto envío desde la misma IP dentro de 60 minutos.
- [ ] Un fallo de Resend devuelve un mensaje genérico, sin `err.message`.
- [ ] Las respuestas HTTP incluyen `Content-Security-Policy-Report-Only`.
- [ ] Home, juegos, hall of fame, about y auth cargan y funcionan con la CSP Report-Only activa.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisiones tomadas

- **Sí: RPC `SECURITY DEFINER` para escribir scores** — es el único punto donde se
  puede validar el valor del puntaje y fijar `user_id` sin confiar en el cliente.
  **No:** route handler `/api/scores` — añade un salto de red y duplica la sesión;
  **No:** solo `CHECK` constraints — no permite límites distintos por juego.

- **Sí: `games.max_score` como columna** — los límites se ajustan con un `UPDATE`
  sin redefinir la función. **No:** constantes dentro de la función — cambiarlas
  exige una nueva migración.

- **Sí: eliminar el INSERT directo tras migrar los clientes** — si se deja, la RPC
  se puede saltar. El orden del plan (pasos 4 y 5) evita romper el guardado.

- **Sí: solo autenticados guardan scores** — coherente con la decisión del spec 14.

- **Sí: rate limiting en memoria por IP** — sin dependencias nuevas. **No:** Upstash
  ni tabla en Supabase; se reevalúa si hay abuso real.

- **Sí: CSP en Report-Only, sin HSTS** — permite detectar orígenes olvidados sin
  romper la app. HSTS se pospone hasta tener dominio de producción.

- **Sí: mantener la entrada de contacto como texto escapado** — no se admite HTML
  en el mensaje. **No:** sanitizar con una librería, innecesario para texto plano.

---

## Riesgos identificados

| Riesgo                                                                                                    | Mitigación                                                                                                              |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Los specs 13/14 figuran como aprobados/implementados pero el código de la rama no los aplica              | Implementar 13 y 14 con `/spec-impl` antes de este spec; la RPC asume `auth.uid()` real. Revisar el estado del spec 14. |
| Los `max_score` propuestos pueden bloquear puntuaciones legítimas o ser demasiado laxos                   | Revisar los valores con partidas reales antes de aprobar; se corrigen con un `UPDATE`.                                  |
| La RPC no impide puntajes falsos dentro del rango (un cliente puede enviar `max_score`)                   | Aceptado: la detección de trampas queda fuera de scope. Los topes reducen el daño.                                      |
| Rate limit en memoria se reinicia en cada cold start y no se comparte entre instancias                    | Aceptado como primera barrera; migrar a Upstash si hay abuso.                                                           |
| La IP viene de cabeceras (`x-forwarded-for`) que un cliente puede falsificar si no hay proxy de confianza | Tomar la primera IP del header solo cuando el despliegue lo garantice; documentarlo al desplegar.                       |
| La CSP con `'unsafe-inline'` es débil frente a XSS                                                        | Es una primera versión Report-Only; endurecer con nonces en un spec futuro.                                             |
| La CSP puede bloquear recursos legítimos al pasar a enforcing                                             | Se mantiene en Report-Only hasta revisar las violaciones en todas las rutas.                                            |

---

## Qué **no** está en este spec

- Implementación de auth real, RLS base, regex de contraseña y proxy (specs 13 y 14).
- HSTS y CSP en modo enforcing.
- Rate limiting distribuido.
- Anti-cheat dentro de la partida.
- Variable de entorno para el destinatario del correo de contacto.
- Scores de invitados.

Cada uno de ellos, si se aborda, va en su propio spec.
