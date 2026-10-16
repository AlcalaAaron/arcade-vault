# Esqueleto: `app/games/<id>/play/page.tsx`

Extraído de `app/games/asteroids/play/page.tsx` (specs 05 y 06). Si el código vigente difiere, **manda el código vigente**.
Se guarda como `.md` para que `tsc`/ESLint no lo procesen; al implementar se crea el `page.tsx` real.

Sustituye: `<id>` (slug), `<Pascal>` (nombre del componente), `<TITLE>` (texto de `crt-bottom`), el color del
botón/`neon-*` si procede. Elimina las `hud-stat` de vidas/nivel (y su estado) si el juego no las tiene.

```tsx
'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState, useCallback, useEffect } from 'react';
import { useUser } from '@/app/context/UserContext';
import { createClient } from '@/lib/supabase/client';

const <Pascal>Game = dynamic(
  () => import('@/components/games/<Pascal>Game'),
  { ssr: false },
);

export default function <Pascal>Play() {
  const { user } = useUser();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [name, setName] = useState(user ?? 'INVITADO');
  const [saved, setSaved] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const handleScoreChange = useCallback((s: number) => setScore(s), []);
  const handleLivesChange = useCallback((l: number) => setLives(l), []);
  const handleLevelChange = useCallback((l: number) => setLevel(l), []);
  const handleGameOver = useCallback((finalScore: number) => {
    setScore(finalScore);
    setOver(true);
  }, []);

  useEffect(() => {
    if (over) {
      const stored = localStorage.getItem('av_player_name');
      if (stored) setName(stored);
    }
  }, [over]);

  function restart() {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setSaved(false);
    setName(user ?? 'INVITADO');
    setGameKey((k) => k + 1);
  }

  async function saveScore() {
    setSaved(true); // disable the button immediately: no double insert
    localStorage.setItem('av_player_name', name);
    const supabase = createClient();
    const { error } = await supabase.from('scores').insert({
      game_id: '<id>',
      player_name: name,
      score,
      user_id: null,
    });
    if (error) setSaved(false); // let the player retry
  }

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          <div className="hud-stat">
            <div className="l">Jugador</div>
            <div className="v" style={{ color: 'var(--ink)' }}>
              {name}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{score.toLocaleString('es-ES')}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">
              {'♥ '.repeat(Math.max(0, lives)).trim() || '—'}
            </div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{String(level).padStart(2, '0')}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? 'REANUDAR' : 'PAUSA'}
          </button>
          <button className="btn magenta" onClick={() => setOver(true)}>
            FIN
          </button>
          <Link href="/games/<id>" className="btn ghost">
            SALIR
          </Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <<Pascal>Game
            key={gameKey}
            paused={paused || over}
            onScoreChange={handleScoreChange}
            onLivesChange={handleLivesChange}
            onLevelChange={handleLevelChange}
            onGameOver={handleGameOver}
          />
          {paused && (
            <div
              className="crt-content"
              style={{ background: 'rgba(0,0,0,0.6)', zIndex: 5 }}
            >
              <div>
                <div className="pixel neon-yellow" style={{ fontSize: 22 }}>
                  EN PAUSA
                </div>
                <div
                  className="mono"
                  style={{
                    fontSize: 11,
                    color: 'var(--ink-dim)',
                    marginTop: 10,
                    letterSpacing: '0.16em',
                  }}
                >
                  PULSA REANUDAR PARA CONTINUAR
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span><TITLE> · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>

      {over && (
        <div className="modal-bd">
          <div className="modal">
            <h2>FIN DEL JUEGO</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString('es-ES')}</div>
            {!saved ? (
              <div className="input-row">
                <input
                  value={name}
                  onChange={(e) =>
                    setName(e.target.value.toUpperCase().slice(0, 10))
                  }
                  placeholder="TUS INICIALES"
                />
                <button className="btn yellow" onClick={saveScore}>
                  GUARDAR PUNTUACIÓN
                </button>
              </div>
            ) : (
              <div className="toast-saved">▸ PUNTUACIÓN GUARDADA_</div>
            )}
            <div className="actions">
              <button className="btn" onClick={restart}>
                JUGAR DE NUEVO
              </button>
              <Link href="/games" className="btn magenta">
                VOLVER AL VAULT
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

## Notas

- Diferencias deliberadas respecto a la play-page de Asteroids: el insert se encapsula en `saveScore()`,
  comprueba `error` y revierte `saved` para permitir reintento; y se pasa `paused={paused || over}` para que
  el juego quede congelado mientras el modal está abierto (el botón FIN lo abre sin terminar la partida).
  Si al implementar se prefiere no tocar el comportamiento original, quitar ambos cambios.
- Orden de aparición en el leaderboard: `scores` se ordena por `score DESC`; no hace falta nada más aquí.
- Si el juego no tiene vidas o nivel, borra el estado, el callback, el `hud-stat` y la prop correspondientes
  (y quítala también de la interfaz del componente).
- Si el canvas no es 4:3, ajusta el contenedor `.crt-screen` (estilos en `app/globals.css`).
