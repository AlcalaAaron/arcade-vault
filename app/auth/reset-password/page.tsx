'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type Status = 'checking' | 'ready' | 'invalid' | 'done';

const messageStyle = (color: string): React.CSSProperties => ({
  marginTop: 12,
  fontSize: 12,
  lineHeight: 1.5,
  color,
});

export default function ResetPassword() {
  const supabase = useMemo(() => createClient(), []);
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function verify() {
      // Fallback: link carries ?token_hash=…&type=recovery instead of a hash/code.
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      if (tokenHash && params.get('type') === 'recovery') {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        if (cancelled) return;
        setStatus(error ? 'invalid' : 'ready');
        return;
      }

      // Supabase processes the recovery token from the URL on client init.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setStatus(data.session ? 'ready' : 'invalid');
    }

    verify();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStatus('done');
  }

  return (
    <div className="av-auth-wrap fade-in">
      <div className="auth-card">
        <div className="auth-header">
          <div className="mark" />
          <h2 className="neon-cyan">ARCADE VAULT</h2>
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-faint)',
              letterSpacing: '0.16em',
              marginTop: 6,
            }}
          >
            NUEVA CONTRASEÑA
          </div>
        </div>

        {status === 'checking' && (
          <p role="status" style={messageStyle('var(--ink-dim)')}>
            Comprobando el enlace…
          </p>
        )}

        {status === 'invalid' && (
          <div role="alert">
            <p style={messageStyle('var(--magenta)')}>
              El enlace no es válido o ha caducado. Pide uno nuevo desde
              «¿Olvidaste tu contraseña?».
            </p>
            <Link
              className="btn ghost"
              href="/auth"
              style={{ display: 'block', textAlign: 'center', marginTop: 16 }}
            >
              IR A ACCESO
            </Link>
          </div>
        )}

        {status === 'done' && (
          <div role="status">
            <p style={messageStyle('var(--green)')}>Contraseña actualizada.</p>
            <Link
              className="btn lg"
              href="/auth"
              style={{ display: 'block', textAlign: 'center', marginTop: 16 }}
            >
              INICIAR SESIÓN
            </Link>
          </div>
        )}

        {status === 'ready' && (
          <form onSubmit={submit}>
            <div className="field">
              <label>Nueva contraseña</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="field">
              <label>Confirmar contraseña</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <button
              className="btn lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? 'GUARDANDO…' : 'GUARDAR CONTRASEÑA'}
            </button>
            {error && (
              <p role="alert" style={messageStyle('var(--magenta)')}>
                {error}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
