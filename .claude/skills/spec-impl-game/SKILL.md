---
name: spec-impl-game
description: Implementa un spec de juego aprobado igual que /spec-impl y, al terminar, lanza secuencialmente los agentes skin-designer y mobile-porter sobre ese juego.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Implementa un spec de juego + skins + mobile

Variante de `/spec-impl` para specs de juegos. Hace exactamente lo mismo que `/spec-impl` y, cuando la implementación termina, ejecuta dos agentes **en secuencia** sobre el juego implementado: primero `skin-designer`, después `mobile-porter`.

Tus respuestas deben estar siempre en el **mismo idioma que el prompt inicial**.

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

Game-jam specs:
!`ls specs/game-jam/* 2>/dev/null || echo "No game-jam specs"`

---

## Instructions

### Fases 1 a 4 — Implementación (idéntica a `/spec-impl`)

1. Lee `.agents/skills/spec-impl/SKILL.md` y sigue sus **Fases 1 a 4 al pie de la letra**: identificar el spec, validar que el estado significa "Aprobado", crear/cambiar a la rama `spec-NN-slug` e implementar paso a paso con pausas para revisar el diff. Trata `$ARGUMENTS` como el argumento de ese skill.
2. Ajustes sobre `/spec-impl`:
   - En la Fase 1, busca también en `specs/game-jam/<game-id>/` (los specs de game-jam viven en subcarpetas). Si el spec está ahí, la rama sigue el formato `spec-<game-id>-NN-slug` a partir del nombre de archivo.
   - Las rutas `specs/$ARGUMENTS.md` de ese skill pueden no aplicar a game-jam; resuelve el archivo tú mismo.
3. **Si `/spec-impl` se detiene** (argumento vacío, spec no encontrado, estado distinto de Aprobado, ambigüedad sin resolver, usuario que no confirma), `/spec-impl-game` también se detiene. **No lances ningún agente.**
4. Los agentes solo se lanzan cuando se hayan completado **todos** los pasos del plan, es decir, cuando muestres el mensaje final `✅ All steps of the plan are implemented` de `/spec-impl`.

### Fase 5 — Identificar el juego

Determina el `<game-id>` (slug, ej. `frogger`) del spec implementado, por orden de prioridad:

1. El `id` del `INSERT INTO games` del spec.
2. La ruta `app/games/<id>/` mencionada o creada por el spec.
3. El nombre del archivo `NN-<id>-game.md` o la carpeta `specs/game-jam/<id>/`.

Verifica que existen:

- `components/games/<Juego>.tsx`
- `app/games/<id>/play/page.tsx`

Si no puedes determinar el id con certeza o falta alguno de los archivos, **pregunta al usuario**. No adivines: ambos agentes exigen un juego objetivo explícito.

### Fase 6 — Lanzar los agentes en secuencia

Usa la herramienta `Agent`. **Un agente a la vez: no lances el segundo hasta tener el resultado del primero.**

1. **`skin-designer`** (`subagent_type: "skin-designer"`). Prompt:

   > Aplica skins a `<game-id>`. Componente: `components/games/<Juego>.tsx`. Play-page: `app/games/<game-id>/play/page.tsx`. Spec recién implementado: `<ruta del spec>`. Trabaja solo sobre este juego.

   Cuando termine, muestra su resumen al usuario.

2. **`mobile-porter`** (`subagent_type: "mobile-porter"`). Prompt:

   > Porta `<game-id>` a mobile. Play-page: `app/games/<game-id>/play/page.tsx`. `skin-designer` acaba de aplicar el sistema de skins a este juego: cablea `skinKey`/`changeSkin` reales en `<MobileGamepad>` en lugar de `skin="classic"`. Trabaja solo sobre este juego.

   Cuando termine, muestra su resumen al usuario.

3. Si `skin-designer` falla o devuelve un error, informa al usuario y **pregunta antes** de lanzar `mobile-porter`.

### Fase 7 — Cierre

Muestra un resumen combinado:

- Spec implementado y rama activa.
- Archivos modificados por cada agente (`components/games/<Juego>.tsx`, `references/game-with-themes.md`, `app/games/<game-id>/play/page.tsx`).
- Recordatorio (el de `/spec-impl`): verificar los criterios de aceptación uno a uno, cambiar el estado del spec a "Implementado" y hacer el commit final antes de mergear.
- Verificación mobile manual: `npm run dev`, abrir `/games/<game-id>/play` con viewport de 390 px y ejecutar `npm run build` sin errores TS.

---

## Reglas invariantes

- Un juego por ejecución.
- Esta skill no modifica los agentes, `components/MobileGamepad.tsx` ni otros juegos.
- No hagas commits: el commit final lo decide el usuario.
- El resto de las reglas de `/spec-impl` (implementar lo que dice el spec, no improvisar ante ambigüedades, no salirse del alcance) siguen vigentes durante las Fases 1 a 4.
