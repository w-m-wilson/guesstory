import React from 'react'
import { modalScrimBackground } from '../utils/modalScrim.js'
import ChamferedSurface from './primitives/ChamferedSurface.jsx'

const MODES = [
  { key: 'light',  label: 'Light' },
  { key: 'system', label: 'System' },
  { key: 'dark',   label: 'Dark' },
]

const SCHEMES = [
  { key: 'guesstory',          label: 'Guesstory',          description: 'Warm neutral' },
  { key: 'gruvbox',            label: 'Gruvbox',            description: 'Retro earthy tones' },
  { key: 'solarized', label: 'Solarized', description: 'Warm amber tones' },
  { key: 'minimal',   label: 'Minimal',   description: 'Clean black & white' },
  { key: 'bailly',    label: 'Bailly',    description: 'Rose & sage' },
]

const EXIT_MS = 200

export function AboutModal({ mode, onClose }) {
  const [closing, setClosing] = React.useState(false)
  function close() { if (closing) return; setClosing(true); setTimeout(onClose, EXIT_MS) }
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      onClick={close}
      style={closing ? { opacity: 0, transition: `opacity ${EXIT_MS}ms ease` } : { animation: 'scrimIn 0.2s ease' }}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: modalScrimBackground({ mode, variant: 'dialog' }), pointerEvents: 'none' }} />
      <ChamferedSurface
        shadow="dialog"
        bg="var(--color-bg)"
        className="mx-4"
        style={{ position: 'relative', zIndex: 1, ...(closing ? { opacity: 0, transform: 'scale(0.95) translateY(6px)', transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease` } : {}) }}
        innerClassName={`w-full max-w-sm p-6${closing ? '' : ' dialog-enter'}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text-strong)' }}>
            About & Privacy
          </span>
          <button
            onClick={close}
            className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-text-faint)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <p className="text-sm leading-relaxed mb-3" style={{ color: 'var(--color-text)' }}>
          <strong>Guesstory</strong> is a daily ranking puzzle — place items in their correct order to score points and unlock hints.
        </p>

        <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
          Data & Privacy
        </p>
        <p className="text-sm leading-relaxed mb-2" style={{ color: 'var(--color-text)' }}>
          When you use category hints or request a game recap, your guesses are sent to the <strong>Anthropic API</strong> (Claude) to generate responses. No account is required and no personal data is collected or stored.
        </p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-faint)' }}>
          Appearance preferences are saved locally on your device only.
        </p>
      </ChamferedSurface>
    </div>
  )
}

const CHAMFER_6 = 'polygon(0% 6px, 2px 4px, 4px 2px, 6px 0%, calc(100% - 6px) 0%, calc(100% - 4px) 2px, calc(100% - 2px) 4px, 100% 6px, 100% calc(100% - 6px), calc(100% - 2px) calc(100% - 4px), calc(100% - 4px) calc(100% - 2px), calc(100% - 6px) 100%, 6px 100%, 4px calc(100% - 2px), 2px calc(100% - 4px), 0% calc(100% - 6px))'
const CHAMFER_4 = 'polygon(0% 4px, 2px 2px, 4px 0%, calc(100% - 4px) 0%, calc(100% - 2px) 2px, 100% 4px, 100% calc(100% - 4px), calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) 100%, 4px 100%, 2px calc(100% - 2px), 0% calc(100% - 4px))'

export default function SettingsModal({ scheme, mode, onScheme, onMode, onClose }) {
  const [changed, setChanged] = React.useState(false)
  const [closing, setClosing] = React.useState(false)
  const scrim = modalScrimBackground({ mode, variant: 'sheet' })

  function close() { if (closing) return; setClosing(true); setTimeout(onClose, EXIT_MS) }
  function handleScheme(s) { onScheme(s); setChanged(true) }
  function handleMode(m) { onMode(m); setChanged(true) }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={close}
    >
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, background: scrim, pointerEvents: 'none', ...(closing ? { opacity: 0, transition: `opacity ${EXIT_MS}ms ease` } : { animation: 'scrimIn 0.2s ease' }) }} />
      <ChamferedSurface
        shadow="sheet"
        variant="top"
        bg="var(--color-bg)"
        className="w-full max-w-[430px]"
        style={{ position: 'relative', zIndex: 1, ...(closing ? { opacity: 0, transform: 'translateY(24px)', transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease` } : {}) }}
        innerClassName={`px-5 pt-4 pb-7${closing ? '' : ' sheet-enter'}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-strong)' }}>
            Appearance
          </span>
          <button
            onClick={close}
            className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
            style={{ color: 'var(--color-text-faint)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Mode picker */}
        <div
          className="flex p-1 mb-4"
          style={{ background: 'var(--color-bg-elevated)', clipPath: CHAMFER_6 }}
        >
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleMode(key)}
              className="flex-1 py-1.5 text-xs font-medium transition-colors"
              style={{
                clipPath: mode === key ? CHAMFER_4 : 'none',
                background: mode === key ? 'var(--color-bg)' : 'transparent',
                color: mode === key ? 'var(--color-text-strong)' : 'var(--color-text-faint)',
                boxShadow: mode === key ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Theme picker — horizontal grid of swatch cards */}
        <div className="grid grid-cols-5 gap-2">
          {SCHEMES.map(({ key, label }) => (
            // Outer wrapper acts as chamfered border when selected
            <div
              key={key}
              style={{
                clipPath: CHAMFER_6,
                background: scheme === key ? 'var(--color-text-strong)' : 'transparent',
                padding: '1.5px',
              }}
            >
              <button
                onClick={() => handleScheme(key)}
                className="flex flex-col items-center gap-1.5 py-2.5 px-1 w-full"
                style={{
                  clipPath: CHAMFER_6,
                  background: 'var(--color-bg-elevated)',
                }}
              >
                <div className="flex gap-1">
                  {SWATCHES[key].map((color, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ background: color, boxShadow: '0 0 0 1px rgba(0,0,0,0.08)' }}
                    />
                  ))}
                </div>
                <span className="text-[10px] leading-none font-medium" style={{ color: 'var(--color-text-faint)' }}>
                  {label}
                </span>
              </button>
            </div>
          ))}
        </div>

        {changed && (
          <p className="mt-3 text-center text-[10px] leading-snug" style={{ color: 'var(--color-text-faint)' }}>
            Refresh page to fully apply.
          </p>
        )}

      </ChamferedSurface>
    </div>
  )
}

// Representative swatches: [background, distinctive accent]
const SWATCHES = {
  guesstory: ['#fdf6e3', '#582f0e'],
  gruvbox:   ['#F2EAD5', '#3C3836'],
  solarized: ['#FDF6E3', '#2aa198'],
  minimal:   ['#FFFFFF', '#111111'],
  bailly:    ['#FEF2F5', '#b5547a'],
}
