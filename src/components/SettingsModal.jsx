import React from 'react'

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

function AboutModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.55)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 mx-4"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text-strong)' }}>
            About & Privacy
          </span>
          <button
            onClick={onClose}
            className="text-lg leading-none"
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
      </div>
    </div>
  )
}

export default function SettingsModal({ scheme, mode, onScheme, onMode, onClose }) {
  const [showAbout, setShowAbout] = React.useState(false)
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-2xl px-5 pt-4 pb-7"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-4">
          <span className="font-semibold text-sm" style={{ color: 'var(--color-text-strong)' }}>
            Appearance
          </span>
          <button
            onClick={onClose}
            className="text-base leading-none"
            style={{ color: 'var(--color-text-faint)' }}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Mode picker */}
        <div
          className="flex rounded-xl p-1 mb-4"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onMode(key)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
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
            <button
              key={key}
              onClick={() => onScheme(key)}
              className="flex flex-col items-center gap-1.5 rounded-xl py-2.5 px-1"
              style={{
                background: 'var(--color-bg-elevated)',
                border: scheme === key
                  ? '1.5px solid var(--color-text-strong)'
                  : '1.5px solid transparent',
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
          ))}
        </div>

        {/* About & Privacy link */}
        <div className="mt-4 pt-3 flex justify-center" style={{ borderTop: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setShowAbout(true)}
            className="text-xs underline underline-offset-2"
            style={{ color: 'var(--color-text-faint)' }}
          >
            About & Privacy
          </button>
        </div>
      </div>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
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
