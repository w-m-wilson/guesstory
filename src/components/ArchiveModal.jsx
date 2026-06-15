
import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { modalScrimBackground } from '../utils/modalScrim.js'
import { AVAILABLE_DATES } from '../data/puzzles/available.js'
import ChamferedSurface from './primitives/ChamferedSurface.jsx'

const EXIT_MS = 200

function getPuzzleStatus(dateKey) {
  try {
    const raw = localStorage.getItem(`guesstory-state-${dateKey}`)
    if (!raw) return 'unattempted'
    const state = JSON.parse(raw)
    if (state.gameStatus === 'playing') return 'in-progress'
    if (state.gameStatus === 'won' || state.gameStatus === 'abandoned') return 'completed'
    return 'unattempted'
  } catch {
    return 'unattempted'
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T12:00:00') // Use noon to avoid TZ shifts
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ArchiveModal({ activeDate, onSelect, onClose }) {
  const [closing, setClosing] = React.useState(false)
  const scrollRef = React.useRef(null)
  
  function close() { 
    if (closing) return
    setClosing(true)
    setTimeout(onClose, EXIT_MS) 
  }

  const today = new Date().toISOString().split('T')[0]
  const todayAvailable = AVAILABLE_DATES.includes(today)

  const puzzles = useMemo(() => {
    // Chronological order: Oldest at top, Newest at bottom
    return [...AVAILABLE_DATES].map(date => ({
      date,
      year: date.split('-')[0],
      status: getPuzzleStatus(date),
      isToday: date === today
    }))
  }, [today])

  const currentYear = puzzles.length > 0 ? puzzles[puzzles.length - 1].year : ''

  // Scroll to bottom (most recent) on mount
  React.useLayoutEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [])

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={close}
    >
      <div 
        aria-hidden="true" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: modalScrimBackground({ variant: 'sheet' }), 
          pointerEvents: 'none', 
          ...(closing ? { opacity: 0, transition: `opacity ${EXIT_MS}ms ease` } : { animation: 'scrimIn 0.2s ease' }) 
        }} 
      />
      <ChamferedSurface
        shadow="sheet"
        variant="top"
        bg="var(--color-bg)"
        className="w-full max-w-[430px]"
        style={{ position: 'relative', zIndex: 1, ...(closing ? { opacity: 0, transform: 'translateY(24px)', transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease` } : {}) }}
        innerClassName={`flex flex-col max-h-[85dvh] overflow-hidden${closing ? '' : ' sheet-enter'}`}
        innerStyle={{ touchAction: 'pan-y' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Sticky Header with Fade */}
        <div 
          className="sticky top-0 z-20 px-6 pt-5 pb-10 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, var(--color-bg) 75%, transparent)',
          }}
        >
          <div className="flex items-center justify-between pointer-events-auto">
            <div className="flex items-baseline gap-2">
              <span 
                className="text-2xl" 
                style={{ fontFamily: "'Grenze Gotisch', serif", color: 'var(--color-action)' }}
              >
                The Archives
              </span>
              <span className="text-xs opacity-40 font-bold tracking-widest uppercase">
                {currentYear}
              </span>
            </div>
            <button
              onClick={close}
              className="text-lg leading-none opacity-50 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-text-faint)' }}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scrollable Grid */}
        <div 
          ref={scrollRef}
          className="overflow-y-auto flex-1 px-6 pb-12 -mt-4 fade-in"
          style={{ touchAction: 'pan-y' }}
        >
          <div className="grid grid-cols-2 gap-3">
            {puzzles.map((p) => {
              const isActive = p.date === activeDate
              const isToday = p.isToday
              
              const CHAMFER = 'var(--chamfer-8)'

              let cardBg, cardBorder, cardShadow, textColor, subColor, wrapFilter

              if (p.status === 'unattempted') {
                cardBg = 'var(--elev-empty-bg)'
                cardBorder = 'none'
                cardShadow = 'var(--inset-empty)'
                textColor = 'var(--color-text-faint)'
                subColor = 'var(--color-text-faint)'
                wrapFilter = 'none'
              } else if (p.status === 'in-progress') {
                cardBg = 'var(--elev-raised-bg)'
                cardBorder = 'none'
                cardShadow = 'none'
                textColor = 'var(--color-text-strong)'
                subColor = 'var(--color-text-faint)'
                wrapFilter = 'var(--shadow-raised)'
              } else {
                cardBg = 'var(--elev-pressed-bg)'
                cardBorder = 'none'
                cardShadow = 'var(--inset-pressed)'
                textColor = 'var(--color-action-text)'
                subColor = 'var(--color-action-text)'
                wrapFilter = 'none'
              }

              const card = (
                <button
                  key={p.date}
                  onClick={() => { onSelect(p.date); close() }}
                  className="relative w-full flex flex-col items-center justify-center py-5 transition-all active:scale-95"
                  style={{
                    '--surface-tint': 'var(--color-action)',
                    background: cardBg,
                    border: cardBorder,
                    boxShadow: cardShadow,
                    color: textColor,
                    clipPath: CHAMFER,
                  }}
                >
                  {isToday && (
                    <span
                      className="absolute top-2 left-2 text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5"
                      style={{
                        background: p.status === 'completed' ? 'rgba(255,255,255,0.2)' : 'var(--color-bg)',
                        color: p.status === 'completed' ? 'var(--color-action-text)' : 'var(--color-action)',
                        clipPath: CHAMFER,
                      }}
                    >
                      Today
                    </span>
                  )}

                  <span className="text-lg font-bold">{formatDate(p.date)}</span>
                  <span className="text-[10px] uppercase tracking-tighter mt-1 opacity-70 font-medium" style={{ color: subColor }}>
                    {p.status === 'completed' ? 'Completed' : p.status === 'in-progress' ? 'In Progress' : 'Unattempted'}
                  </span>

                  {isActive && (
                    <span
                      className="absolute top-2 right-2 w-2 h-2 rounded-full"
                      style={{ background: p.status === 'completed' ? 'var(--color-action-text)' : 'var(--color-action)', opacity: 0.7, animation: 'pulse 2s infinite' }}
                    />
                  )}
                </button>
              )

              const activeGlow = isActive ? 'drop-shadow(0 0 4px color-mix(in srgb, var(--color-action) 50%, transparent))' : ''
              const combinedFilter = [wrapFilter !== 'none' ? wrapFilter : '', activeGlow].filter(Boolean).join(' ') || 'none'
              return (
                <div key={p.date} style={{ filter: combinedFilter, width: '100%' }}>{card}</div>
              )
            })}
          </div>
        </div>
      </ChamferedSurface>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pulse {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 1; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
      `}} />
    </div>,
    document.body
  )
}
