import React from 'react'

/**
 * Empty ghost-slot — recessed faint gradient with a subtle inset shadow.
 * Used for unfilled rank slots and unattempted archive cards.
 */
const CHAMFER_CLASS = { pill: 'bit-pill', btn: 'bit-btn' }

export default function EmptySlot({
  as = 'div',
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
      style={{ background: 'var(--elev-empty-bg)', boxShadow: 'var(--inset-empty)', border: 'none', ...style }}
      {...rest}
    >
      {children}
    </Inner>
  )
}
