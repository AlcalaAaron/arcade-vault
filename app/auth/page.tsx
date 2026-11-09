'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

type View = 'form' | 'forgot' | 'signup-sent' | 'reset-sent';

const messageStyle = (color: string): React.CSSProperties => ({
  marginTop: 12,
  fontSize: 12,
  lineHeight: 1.5,
  color,
});

export default function Auth() {
  const [tab, setTab] = useState<'in' | 'up'>('in');
  const [view, setView] = useState<View>('form');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  function switchTab(next: 'in' | 'up') {
    setTab(next);
    setView('form');
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (tab === 'in') {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: pass,
      });
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      router.push('/');
      return;
    }

    const cleanUsername = username.trim().toUpperCase().slice(0, 10);
    if (!cleanUsername) {
      setLoading(false);
      setError('Escribe un nombre de usuario.');
      return;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: { username: cleanUsername },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setView('signup-sent');
  }

  async function sendReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setView('reset-sent');
  }

  async function oauth(provider: 'google' | 'github') {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) setError(error.message);
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
            ACCESO AL SISTEMA · v2.6
          </div>
        </div>

        {view === 'signup-sent' && (
          <div role="status">
            <p style={messageStyle('var(--green)')}>
              Revisa tu correo para confirmar tu cuenta. Al abrir el enlace
              entrarás con la sesión iniciada.
            </p>
            <button
              className="btn ghost"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => switchTab('in')}
            >
              VOLVER A INICIAR SESIÓN
            </button>
          </div>
        )}

        {view === 'reset-sent' && (
          <div role="status">
            <p style={messageStyle('var(--green)')}>
              Te hemos enviado un enlace de recuperación. Revisa tu correo.
            </p>
            <button
              className="btn ghost"
              style={{ width: '100%', marginTop: 16 }}
              onClick={() => switchTab('in')}
            >
              VOLVER A INICIAR SESIÓN
            </button>
          </div>
        )}

        {view === 'forgot' && (
          <form onSubmit={sendReset}>
            <p style={{ ...messageStyle('var(--ink-dim)'), marginTop: 0 }}>
              Escribe tu correo y te enviaremos un enlace para elegir una
              contraseña nueva.
            </p>
            <div className="field">
              <label>Correo electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jugador@vault.gg"
              />
            </div>
            <button
              className="btn lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? 'ENVIANDO…' : 'ENVIAR ENLACE'}
            </button>
            <button
              className="btn ghost"
              type="button"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => {
                setView('form');
                setError(null);
              }}
            >
              CANCELAR
            </button>
            {error && (
              <p role="alert" style={messageStyle('var(--magenta)')}>
                {error}
              </p>
            )}
          </form>
        )}

        {view === 'form' && (
          <>
            <div className="auth-tabs">
              <button
                className={tab === 'in' ? 'on' : ''}
                onClick={() => switchTab('in')}
              >
                INICIAR SESIÓN
              </button>
              <button
                className={tab === 'up' ? 'on' : ''}
                onClick={() => switchTab('up')}
              >
                CREAR CUENTA
              </button>
            </div>

            <form onSubmit={submit}>
              {tab === 'up' && (
                <div className="field slide-in">
                  <label>Usuario</label>
                  <input
                    required
                    maxLength={10}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="px_kai"
                  />
                </div>
              )}
              <div className="field">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jugador@vault.gg"
                />
              </div>
              <div className="field">
                <label>Contraseña</label>
                <input
                  type="password"
                  required
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button
                className="btn lg"
                type="submit"
                disabled={loading}
                style={{ width: '100%', marginTop: 8 }}
              >
                {loading
                  ? 'UN MOMENTO…'
                  : tab === 'in'
                    ? 'ENTRAR AL VAULT'
                    : 'CREAR CUENTA'}
              </button>
              {error && (
                <p role="alert" style={messageStyle('var(--magenta)')}>
                  {error}
                </p>
              )}
            </form>

            {tab === 'in' && (
              <button
                className="btn ghost"
                type="button"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => {
                  setView('forgot');
                  setError(null);
                }}
              >
                ¿OLVIDASTE TU CONTRASEÑA?
              </button>
            )}

            <div className="auth-divider">O CONTINÚA CON</div>
            <div className="social">
              <button
                className="btn ghost"
                type="button"
                onClick={() => oauth('google')}
              >
                ◆ GOOGLE
              </button>
              <button
                className="btn ghost"
                type="button"
                onClick={() => oauth('github')}
              >
                ▣ GITHUB
              </button>
            </div>
          </>
        )}

        <div
          style={{
            marginTop: 18,
            textAlign: 'center',
            fontSize: 11,
            color: 'var(--ink-faint)',
            letterSpacing: '0.1em',
          }}
        >
          AL ENTRAR ACEPTAS LOS TÉRMINOS DEL SALÓN ARCADE
        </div>
      </div>
    </div>
  );
}
