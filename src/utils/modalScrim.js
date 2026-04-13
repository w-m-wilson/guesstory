/**
 * Modal backdrop scrim: near-black in dark UI, lighter gray in light UI.
 * Use `mode` when the appearance `mode` is in scope so the scrim updates
 * immediately when the user toggles light/dark inside Settings (before
 * `data-theme` updates on <html>).
 */

/** @param {'light' | 'dark' | 'system'} mode */
export function appearanceResolvesToDark(mode) {
  if (mode === 'dark') return true
  if (mode === 'light') return false
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function documentThemeIsDark() {
  if (typeof document === 'undefined') return false
  return (document.documentElement.dataset.theme ?? '').endsWith('-dark')
}

/**
 * @param {{ mode?: 'light' | 'dark' | 'system', variant?: 'sheet' | 'dialog' }} [opts]
 *   - `sheet`: bottom / top sheets (lighter veil in light mode)
 *   - `dialog`: centered modals (slightly stronger veil in light mode)
 */
export function modalScrimBackground(opts = {}) {
  const { mode, variant = 'sheet' } = opts
  const dark = mode !== undefined ? appearanceResolvesToDark(mode) : documentThemeIsDark()
  if (dark) return 'rgba(0,0,0,0.94)'
  return variant === 'dialog' ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.4)'
}
