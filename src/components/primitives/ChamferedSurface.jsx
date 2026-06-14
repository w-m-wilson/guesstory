import React from 'react'

/**
 * Chamfered surface primitive.
 *
 * Pattern: outer wrapper carries the drop-shadow filter (and a stable compositor
 * layer via will-change); inner element carries the clip-path that draws the
 * pixel-stair chamfer. Per CLAUDE.md, clip-path clips box-shadow, so shadows
 * MUST live on a wrapper without clip-path.
 *
 * Important: do not toggle the wrapper's filter between a value and 'none' on
 * open/close — that creates/destroys a filter layer mid-animation and causes
 * mobile flicker plus a vestigial-shadow ghost on dismissal. Fade with opacity
 * on a parent instead; this component keeps `filter` constant.
 */
const SHADOW_CLASS = {
  popover: 'shadow-popover',
  'popover-up': 'shadow-popover-up',
  dialog: 'shadow-dialog',
  sheet: 'shadow-sheet',
  none: '',
}

const VARIANT_CLASS = {
  full: 'bit-surface',
  top: 'bit-surface-top',
}

export default function ChamferedSurface({
  shadow = 'popover',
  variant = 'full',
  bg,
  className = '',
  innerClassName = '',
  style,
  innerStyle,
  children,
  onClick,
  ...rest
}) {
  const shadowClass = SHADOW_CLASS[shadow] ?? ''
  const variantClass = VARIANT_CLASS[variant] ?? VARIANT_CLASS.full
  const mergedInnerStyle = bg ? { background: bg, ...innerStyle } : innerStyle

  return (
    <div className={`${shadowClass} ${className}`.trim()} style={style} {...rest}>
      <div className={`${variantClass} ${innerClassName}`.trim()} style={mergedInnerStyle} onClick={onClick}>
        {children}
      </div>
    </div>
  )
}
