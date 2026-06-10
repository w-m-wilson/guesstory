import { useState, useEffect } from 'react'

const STORAGE_KEY = 'guesstory-appearance'

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function getSystemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function applyTheme(scheme, mode) {
  const dark = mode === 'dark' || (mode === 'system' && getSystemDark())
  document.documentElement.dataset.theme = `${scheme}-${dark ? 'dark' : 'light'}`

  // Defer so the browser flushes style recalculation before we read the new value
  requestAnimationFrame(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-bg').trim()
    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = color
  })
}

export function useAppearance() {
  const saved = loadSaved()
  const [scheme, setSchemeState] = useState(saved.scheme ?? 'guesstory')
  const [mode, setModeState] = useState(saved.mode ?? 'system')

  useEffect(() => {
    applyTheme(scheme, mode)

    if (mode === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      const handler = () => applyTheme(scheme, mode)
      mq.addEventListener('change', handler)
      return () => mq.removeEventListener('change', handler)
    }
  }, [scheme, mode])

  function setScheme(s) {
    setSchemeState(s)
    const prev = loadSaved()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, scheme: s }))
  }

  function setMode(m) {
    setModeState(m)
    const prev = loadSaved()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...prev, mode: m }))
  }

  return { scheme, mode, setScheme, setMode }
}
