import React from 'react'

/**
 * Raised tactile surface — bright-band gradient with a hard drop shadow.
 *
 * Pairs an outer wrapper (carries `--shadow-raised`) with an inner element
 * (carries `bit-pill`/`bit-btn` chamfer + `--elev-raised-bg` gradient).
 * Per CLAUDE.md, clip-path clips box-shadow, so the shadow MUST live on a
 * wrapper without clip-path.
 *
 * Use `as` to swap the inner element (default `button`). Use `chamfer="pill"`
 * for a 3px corner or `chamfer="btn"` (default) for 4px.
 */
const CHAMFER_CLASS = { pill: 'bit-pill', btn: 'bit-btn' }

export default function RaisedPill({
  as = 'button',
  chamfer = 'btn',
  className = '',
  style,
  wrapClassName = '',
  wrapStyle,
  children,
  ...rest
}) {
  const Inner = as
  const innerClass = `${CHAMFER_CLASS[chamfer] ?? CHAMFER_CLASS.btn} ${className}`.trim()
  return (
    <span className={`shadow-raised ${wrapClassName}`.trim()} style={{ display: 'inline-flex', ...wrapStyle }}>
      <Inner
        className={innerClass}
        style={{ background: 'var(--elev-raised-bg)', border: 'none', ...style }}
        {...rest}
      >
        {children}
      </Inner>
    </span>
  )
}
