import { useEffect } from 'react'

/**
 * Closes a popover/menu when a pointerdown happens outside the referenced element.
 * Listener is only attached while `active` is true.
 */
export default function useClickOutside(ref, active, onOutside) {
  useEffect(() => {
    if (!active) return
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('pointerdown', handle)
    return () => document.removeEventListener('pointerdown', handle)
  }, [ref, active, onOutside])
}
