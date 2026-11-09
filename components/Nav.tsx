'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useUser } from '@/app/context/UserContext';

export default function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user, username, signOut } = useUser();
  const displayName = username ?? user?.email?.split('@')[0] ?? 'JUGADOR';
  const initial = displayName.charAt(0).toUpperCase();

  const isLibrary = pathname.startsWith('/games');
  const isHall = pathname === '/hall-of-fame';
  const isAbout = pathname === '/about';
  const isPlayPage = pathname.endsWith('/play');

  function close() {
    setOpen(false);
  }

  function handleSignOut() {
    signOut();
    close();
  }

  return (
    <>
      <nav className={`av-nav${isPlayPage ? ' nav-hide-mobile' : ''}`}>
        <Link href="/" className="logo" onClick={close}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </Link>

        <div className="links">
          <Link href="/games" className={isLibrary ? 'active' : ''}>
            Biblioteca
          </Link>
          <Link href="/hall-of-fame" className={isHall ? 'active' : ''}>
            Salón de la Fama
          </Link>
          <Link href="/about" className={isAbout ? 'active' : ''}>
            Sobre Nosotros
          </Link>
        </div>

        <div className="spacer" />

        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>

        {user ? (
          <div
            className="auth-btn"
            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
          >
            <div
              aria-hidden="true"
              className="pixel"
              style={{
                width: 32,
                height: 32,
                display: 'grid',
                placeItems: 'center',
                borderRadius: '50%',
                border: '1px solid var(--cyan)',
                color: 'var(--cyan)',
                fontSize: 11,
              }}
            >
              {initial}
            </div>
            <span
              className="mono"
              style={{ fontSize: 12, color: 'var(--ink)' }}
            >
              {displayName}
            </span>
            <button className="btn ghost" onClick={handleSignOut}>
              Cerrar sesión
            </button>
          </div>
        ) : (
          <Link href="/auth" className="btn auth-btn">
            Iniciar Sesión
          </Link>
        )}

        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={`av-mobile-backdrop${open ? ' open' : ''}${isPlayPage ? ' nav-hide-mobile' : ''}`}
        onClick={close}
      />
      <aside
        className={`av-mobile-panel${open ? ' open' : ''}${isPlayPage ? ' nav-hide-mobile' : ''}`}
      >
        <div
          className="pixel neon-cyan"
          style={{ fontSize: 11, marginBottom: 16 }}
        >
          MENÚ
        </div>
        <Link
          href="/games"
          className={isLibrary ? 'active' : ''}
          onClick={close}
        >
          Biblioteca
        </Link>
        <Link
          href="/hall-of-fame"
          className={isHall ? 'active' : ''}
          onClick={close}
        >
          Salón de la Fama
        </Link>
        <Link href="/about" className={isAbout ? 'active' : ''} onClick={close}>
          Sobre Nosotros
        </Link>
        {user ? (
          <>
            <div
              className="mono"
              style={{
                fontSize: 12,
                color: 'var(--ink-dim)',
                padding: '8px 0',
              }}
            >
              {displayName}
            </div>
            <button className="btn ghost" onClick={handleSignOut}>
              Cerrar sesión
            </button>
          </>
        ) : (
          <Link
            href="/auth"
            className={pathname === '/auth' ? 'active' : ''}
            onClick={close}
          >
            Iniciar Sesión
          </Link>
        )}
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{
            fontSize: 9,
            color: 'var(--ink-faint)',
            letterSpacing: '0.16em',
          }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
