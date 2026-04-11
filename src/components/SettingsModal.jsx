const MODES = [
  { key: 'light',  label: 'Light' },
  { key: 'system', label: 'System' },
  { key: 'dark',   label: 'Dark' },
]

const SCHEMES = [
  { key: 'guesstory',          label: 'Guesstory',          description: 'Warm neutral' },
  { key: 'guesstory-colorful', label: 'Guesstory Colorful', description: 'Forest green' },
  { key: 'gruvbox',            label: 'Gruvbox',            description: 'Retro earthy tones' },
  { key: 'solarized', label: 'Solarized', description: 'Warm amber tones' },
  { key: 'minimal',   label: 'Minimal',   description: 'Clean black & white' },
  { key: 'bailly',    label: 'Bailly',    description: 'Rose & sage' },
]

export default function SettingsModal({ scheme, mode, onScheme, onMode, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-[430px] rounded-t-2xl p-5 pb-8"
        style={{ background: 'var(--color-bg)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <span className="font-semibold text-base" style={{ color: 'var(--color-text-strong)' }}>
            Appearance
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

        {/* Mode picker */}
        <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
          Mode
        </p>
        <div
          className="flex rounded-xl p-1 mb-5"
          style={{ background: 'var(--color-bg-elevated)' }}
        >
          {MODES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => onMode(key)}
              className="flex-1 py-1.5 rounded-lg text-sm font-medium transition-colors"
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

        {/* Scheme picker */}
        <p className="text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--color-text-faint)' }}>
          Theme
        </p>
        <div className="flex flex-col gap-2">
          {SCHEMES.map(({ key, label, description }) => (
            <button
              key={key}
              onClick={() => onScheme(key)}
              className="flex items-center justify-between w-full rounded-xl px-4 py-3 text-left"
              style={{
                background: 'var(--color-bg-elevated)',
                border: scheme === key
                  ? '1.5px solid var(--color-text-strong)'
                  : '1.5px solid transparent',
              }}
            >
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-text-strong)' }}>
                  {label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                  {description}
                </p>
              </div>
              {/* Color swatch */}
              <div className="flex gap-1 ml-3 shrink-0">
                {SWATCHES[key].map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 rounded-full"
                    style={{ background: color }}
                  />
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// Representative swatches (always shown in their fixed colors, not theme-aware)
const SWATCHES = {
  guesstory:          ['#fdf6e3', '#ece5ce', '#582f0e'],
  'guesstory-colorful': ['#c2c5aa', '#a4ac86', '#414833'],
  gruvbox:   ['#F2EAD5', '#E4D9C3', '#3C3836'],
  solarized: ['#FDF6E3', '#EEE8D5', '#586E75'],
  minimal:   ['#FFFFFF', '#F0F0F0', '#111111'],
  bailly:    ['#FEF2F5', '#FBDFE8', '#4A1F35'],
}
