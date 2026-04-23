/**
 * ConfirmMatch — inline "did you mean X?" prompt.
 * Appears when state.pendingMatch is non-null.
 * No coins are deducted until the player confirms.
 */
export default function ConfirmMatch({ item, onConfirm, onCancel }) {
  return (
    <div
      className="flex items-center gap-2 px-1 py-1 text-sm"
      style={{ color: 'var(--color-text)' }}
    >
      <span>
        Did you mean{' '}
        <span style={{ color: 'var(--color-text-strong)' }} className="font-medium">
          {item.display ?? item.name}
        </span>
        ?
      </span>
      <button
        onClick={onConfirm}
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{
          background: 'var(--color-action)',
          color: 'var(--color-action-text)',
        }}
      >
        Yes
      </button>
      <button
        onClick={onCancel}
        className="px-2 py-0.5 rounded text-xs font-medium"
        style={{
          background: 'var(--color-bg-elevated)',
          color: 'var(--color-text-faint)',
        }}
      >
        No
      </button>
    </div>
  )
}
