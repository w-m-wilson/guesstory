import React from 'react'

/**
 * Pressed tactile surface — dark-band gradient with an inset shadow.
 * No outer drop-shadow; the inset is the entire visual.
 */
const CHAMFER_CLASS = { pill: 'bit-pill', btn: 'bit-btn' }

export default function PressedPill({
  as = 'button',
  chamfer = 'btn',
  className = '',
  style,
  children,
  ...rest
}) {
  const Inner = as
  const innerClass = `${CHAMFER_CLASS[chamfer] ?? CHAMFER_CLASS.btn} ${className}`.trim()
  return (
    <Inner
      className={innerClass}
      style={{ background: 'var(--elev-pressed-bg)', boxShadow: 'var(--inset-pressed)', border: 'none', ...style }}
      {...rest}
    >
      {children}
    </Inner>
  )
}
