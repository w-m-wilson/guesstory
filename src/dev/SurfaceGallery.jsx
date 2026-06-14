import { useState, useEffect } from 'react'
import ChamferedSurface from '../components/primitives/ChamferedSurface.jsx'
import RaisedPill from '../components/primitives/RaisedPill.jsx'
import PressedPill from '../components/primitives/PressedPill.jsx'
import EmptySlot from '../components/primitives/EmptySlot.jsx'

const SCHEMES = ['guesstory', 'gruvbox', 'solarized', 'minimal', 'bailly']
const MODES = ['light', 'dark']

/**
 * Visual regression gallery. Renders every primitive variant in every theme.
 * Open at /?dev=surfaces — wired in main.jsx.
 *
 * The point: when you ship a visual change, scan this page once and you'll
 * see any regression across all 10 theme combinations in one place.
 */
export default function SurfaceGallery() {
  const [scheme, setScheme] = useState('guesstory')
  const [mode, setMode] = useState('light')

  useEffect(() => {
    document.documentElement.dataset.theme = `${scheme}-${mode}`
  }, [scheme, mode])

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--color-bg)', color: 'var(--color-text)', padding: '24px' }}>
      <header style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <strong style={{ fontSize: 18 }}>Surface gallery</strong>
        <select value={scheme} onChange={e => setScheme(e.target.value)}>
          {SCHEMES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={mode} onChange={e => setMode(e.target.value)}>
          {MODES.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <a href="/" style={{ marginLeft: 'auto', color: 'var(--color-action)' }}>← back to app</a>
      </header>

      <Section title="Overlay shadows (ChamferedSurface)">
        <Tile label="popover">
          <ChamferedSurface shadow="popover" style={{ width: 180 }}>
            <div style={{ padding: 16 }}>Popover surface</div>
          </ChamferedSurface>
        </Tile>
        <Tile label="popover-up">
          <ChamferedSurface shadow="popover-up" style={{ width: 180 }}>
            <div style={{ padding: 16 }}>Popover (up)</div>
          </ChamferedSurface>
        </Tile>
        <Tile label="dialog">
          <ChamferedSurface shadow="dialog" bg="var(--color-bg)" style={{ width: 220 }}>
            <div style={{ padding: 20 }}>Dialog body</div>
          </ChamferedSurface>
        </Tile>
        <Tile label="sheet (variant=top)">
          <ChamferedSurface shadow="sheet" variant="top" bg="var(--color-bg)" style={{ width: 240 }}>
            <div style={{ padding: 20 }}>Sheet content</div>
          </ChamferedSurface>
        </Tile>
      </Section>

      <Section title="Tactile pills">
        <Tile label="RaisedPill (btn)">
          <RaisedPill style={{ padding: '6px 14px', color: 'var(--color-text)' }}>Raised btn</RaisedPill>
        </Tile>
        <Tile label="RaisedPill (pill chamfer)">
          <RaisedPill chamfer="pill" style={{ padding: '6px 14px', color: 'var(--color-text)' }}>Raised pill</RaisedPill>
        </Tile>
        <Tile label="PressedPill">
          <PressedPill style={{ padding: '6px 14px', color: 'var(--color-text-strong)' }}>Pressed</PressedPill>
        </Tile>
        <Tile label="EmptySlot">
          <EmptySlot style={{ padding: '12px 28px', color: 'var(--color-text-faint)' }}>Empty slot</EmptySlot>
        </Tile>
      </Section>

      <Section title="Chamfer utilities">
        <Tile label=".bit-pill (3px)">
          <div className="bit-pill" style={{ background: 'var(--color-bg-elevated)', padding: '6px 14px' }}>bit-pill</div>
        </Tile>
        <Tile label=".bit-btn (4px)">
          <div className="bit-btn" style={{ background: 'var(--color-bg-elevated)', padding: '6px 14px' }}>bit-btn</div>
        </Tile>
        <Tile label=".bit-surface (8px)">
          <div className="bit-surface" style={{ padding: 14, width: 140 }}>bit-surface</div>
        </Tile>
      </Section>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 32 }}>
      <h2 style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-text-faint)', marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>{children}</div>
    </section>
  )
}

function Tile({ label, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-start' }}>
      <div style={{ padding: 24, background: 'var(--color-bg)' }}>{children}</div>
      <span style={{ fontSize: 11, color: 'var(--color-text-faint)' }}>{label}</span>
    </div>
  )
}
