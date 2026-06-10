
import React, { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { modalScrimBackground } from '../utils/modalScrim.js'
import { AVAILABLE_DATES } from '../data/puzzles/available.js'

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
      <div
        className={`w-full max-w-[430px] rounded-t-3xl flex flex-col max-h-[85dvh]${closing ? '' : ' sheet-enter'}`}
        style={{ 
          background: 'var(--color-bg)', 
          position: 'relative', 
          zIndex: 1, 
          touchAction: 'pan-y',
          ...(closing ? { opacity: 0, transform: 'translateY(24px)', transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease` } : {}) 
        }}
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
              className="w-8 h-8 flex items-center justify-center rounded-full opacity-60 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--color-text)', background: 'var(--color-bg-elevated)' }}
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
              
              let bgColor = 'transparent'
              let borderColor = 'var(--color-border)'
              let textColor = 'var(--color-text)'
              let borderStyle = 'solid'
              let statusLabel = null

              if (p.status === 'unattempted') {
                textColor = 'var(--color-text-faint)'
                borderStyle = 'dashed'
              } else if (p.status === 'in-progress') {
                borderColor = 'var(--color-dot-present)'
                textColor = 'var(--color-dot-present)'
              } else if (p.status === 'completed') {
                bgColor = 'var(--color-dot-correct)'
                borderColor = 'var(--color-dot-correct)'
                textColor = 'var(--color-bg)'
              }

              return (
                <button
                  key={p.date}
                  onClick={() => { onSelect(p.date); close() }}
                  className={`relative flex flex-col items-center justify-center py-5 rounded-2xl transition-all active:scale-95 ${isActive ? 'ring-2 ring-offset-2' : ''}`}
                  style={{
                    background: bgColor,
                    border: `1.5px ${borderStyle} ${borderColor}`,
                    color: textColor,
                    boxShadow: isActive ? '0 0 0 2px var(--color-bg), 0 0 0 4px var(--color-action)' : 'none'
                  }}
                >
                  {isToday && (
                    <span 
                      className="absolute top-2 left-2 text-[9px] uppercase font-black tracking-widest px-1.5 py-0.5 rounded-md"
                      style={{ 
                        background: p.status === 'completed' ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-elevated)',
                        color: p.status === 'completed' ? 'var(--color-bg)' : 'var(--color-action)' 
                      }}
                    >
                      Today
                    </span>
                  )}
                  
                  <span className="text-lg font-bold">
                    {formatDate(p.date)}
                  </span>
                  <span 
                    className="text-[10px] uppercase tracking-tighter mt-1 opacity-70 font-medium"
                  >
                    {p.status === 'completed' ? 'Completed' : p.status === 'in-progress' ? 'In Progress' : 'Unattempted'}
                  </span>

                  {p.status === 'in-progress' && (
                    <span 
                      className="absolute top-2 right-2 w-2 h-2 rounded-full"
                      style={{ background: 'var(--color-dot-present)', animation: 'pulse 2s infinite' }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

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
