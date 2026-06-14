
import React from 'react'
import { modalScrimBackground } from '../utils/modalScrim.js'
import ChamferedSurface from './primitives/ChamferedSurface.jsx'

const EXIT_MS = 180

export default function ConfirmModal({ title, message, confirmLabel, onConfirm, onClose, secondaryLabel, onSecondary }) {
  const [closing, setClosing] = React.useState(false)

  function close() {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, EXIT_MS)
  }

  function handleConfirm() {
    onConfirm()
    close()
  }

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-6"
      onClick={close}
    >
      <div 
        aria-hidden="true" 
        style={{ 
          position: 'absolute', 
          inset: 0, 
          background: modalScrimBackground({ variant: 'dialog' }), 
          pointerEvents: 'none',
          ...(closing ? { opacity: 0, transition: `opacity ${EXIT_MS}ms ease` } : { animation: 'scrimIn 0.2s ease' })
        }} 
      />
      <ChamferedSurface
        shadow="dialog"
        bg="var(--color-bg)"
        style={{ position: 'relative', zIndex: 1, ...(closing ? { opacity: 0, transform: 'scale(0.95) translateY(6px)', transition: `opacity ${EXIT_MS}ms ease, transform ${EXIT_MS}ms ease` } : {}) }}
        innerClassName={`w-full max-w-xs p-6 text-center${closing ? '' : ' dialog-enter'}`}
        onClick={e => e.stopPropagation()}
      >
        <div 
          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text-strong)' }}
        >
          <span className="text-xl">↺</span>
        </div>

        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--color-text-strong)' }}>
          {title}
        </h3>
        <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--color-text)' }}>
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={secondaryLabel ? handleConfirm : close}
            className="flex-1 py-3 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--color-bg-elevated)', color: 'var(--color-text)' }}
          >
            {confirmLabel || (secondaryLabel ? 'Got it' : 'Cancel')}
          </button>
          {secondaryLabel ? (
            <button
              onClick={() => { onSecondary?.(); close() }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--color-action)', color: 'var(--color-action-text)' }}
            >
              {secondaryLabel}
            </button>
          ) : (
            <button
              onClick={handleConfirm}
              className="flex-1 py-3 rounded-xl text-sm font-semibold"
              style={{ background: 'var(--color-miss)', color: 'white' }}
            >
              {confirmLabel || 'Confirm'}
            </button>
          )}
        </div>
      </ChamferedSurface>
    </div>
  )
}
