'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion, useScroll, type MotionStyle } from 'framer-motion'
import Link from 'next/link'
import { Icon } from './Icon'
import { navLinks, GITHUB_URL, DISCORD_URL, GET_STARTED_URL } from './landingData'
import { trackEvent } from '@/lib/analytics'
import { currentVersion } from '@/config/changelog'
import { useScrollDirection } from './motion/useScrollDirection'

const linkStyle = { color: 'var(--muted)', padding: '6px 11px', borderRadius: 8 } as const

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const reduce = useReducedMotion()
  const { hidden, compact } = useScrollDirection(120, 80)
  const { scrollYProgress } = useScroll()

  // Never hide while the mobile menu is open or focus is inside the bar.
  const tucked = !reduce && hidden && !menuOpen && !focusWithin
  const shrunk = !reduce && compact && !menuOpen

  // --lv-progress drives the ::after filament (landing.css) as a scroll-progress
  // bar; framer writes it straight to the element, no re-render. Omitted under
  // reduced motion so the CSS fallback (a full, static filament) applies.
  const navStyle = reduce ? undefined : ({ '--lv-progress': scrollYProgress, transformOrigin: '50% 0%' } as unknown as MotionStyle)

  return (
    <motion.div
      className="lv-nav-shell"
      animate={{ y: tucked ? '-140%' : '0%' }}
      transition={{ duration: reduce ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={() => setFocusWithin(false)}
    >
      <motion.nav
        className="lv-nav"
        data-open={menuOpen}
        style={navStyle}
        animate={{ scale: shrunk ? 0.965 : 1 }}
        transition={{ duration: reduce ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          style={{
            padding: '5px 6px 5px 16px',
            minHeight: 46,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'nowrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: 'var(--text)',
              fontFamily: 'var(--font-display)',
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: '-0.02em',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'var(--accent)',
                boxShadow: '0 0 10px color-mix(in oklab, var(--accent) 70%, transparent)',
              }}
            />
            elah
          </Link>

          <span data-lv-mobile style={{ flex: 1 }} />

          <div
            data-lv-desktop
            style={{
              display: 'flex',
              gap: 2,
              fontSize: 13.5,
              flex: 1,
              justifyContent: 'center',
              flexWrap: 'nowrap',
            }}
          >
            {navLinks.map((l) =>
              l.href.startsWith('#') ? (
                <a key={l.label} href={l.href} className="lv-navlink" style={linkStyle}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} href={l.href} className="lv-navlink" style={linkStyle}>
                  {l.label}
                </Link>
              ),
            )}
          </div>

          <Link
            data-lv-wide
            href="/changelog"
            className="lv-pill"
            style={{
              fontFamily: 'var(--font-geist-mono)',
              fontSize: 11,
              color: 'var(--muted)',
              border: '1px solid var(--line)',
              borderRadius: 99,
              padding: '4px 10px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            <span style={{ color: 'var(--accent)' }}>v{currentVersion}</span> · What&apos;s new
          </Link>

          <a
            data-lv-desktop
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="lv-ghost"
            style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, flexShrink: 0 }}
            onClick={() => trackEvent('discord_clicked', { source: 'nav_desktop' })}
          >
            Discord
          </a>

          <a
            data-lv-desktop
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="lv-ghost"
            style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 500, flexShrink: 0 }}
          >
            GitHub
          </a>

          <Link
            href={GET_STARTED_URL}
            className="lv-accent-btn lv-nav-cta"
            style={{
              color: 'var(--ink)',
              fontWeight: 600,
              fontSize: 13,
              padding: '6px 12px',
              borderRadius: 10,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            Get Started
          </Link>

          <button
            data-lv-mobile
            onClick={() => setMenuOpen((v) => !v)}
            title="Menu"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            style={{
              width: 34,
              height: 34,
              borderRadius: '50%',
              border: '1px solid var(--line)',
              background: 'transparent',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              flexShrink: 0,
            }}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} size={18} />
          </button>
        </div>

        <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="panel"
            data-lv-mobile
            className="lv-nav-panel"
            initial={reduce ? false : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, y: -10 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
            style={{
              borderTop: '1px solid var(--line2)',
              padding: '6px 20px 14px',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 1,
            }}
          >
            {navLinks.map((l) => {
              const style = {
                color: 'var(--text)',
                fontSize: 15,
                padding: '11px 2px',
                borderBottom: '1px solid var(--line2)',
              } as const
              return l.href.startsWith('#') ? (
                <a key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={style}>
                  {l.label}
                </a>
              ) : (
                <Link key={l.label} href={l.href} onClick={() => setMenuOpen(false)} style={style}>
                  {l.label}
                </Link>
              )
            })}
            <a
              href={DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                trackEvent('discord_clicked', { source: 'nav_mobile' })
                setMenuOpen(false)
              }}
              style={{ color: 'var(--muted)', fontSize: 13, padding: '12px 2px 2px', fontFamily: 'var(--font-geist-mono)' }}
            >
              Discord ↗
            </a>
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMenuOpen(false)}
              style={{ color: 'var(--muted)', fontSize: 13, padding: '2px 2px 2px', fontFamily: 'var(--font-geist-mono)' }}
            >
              <span style={{ color: 'var(--accent)' }}>v{currentVersion}</span> · What&apos;s new — GitHub ↗
            </a>
          </motion.div>
        )}
        </AnimatePresence>
      </motion.nav>
    </motion.div>
  )
}
