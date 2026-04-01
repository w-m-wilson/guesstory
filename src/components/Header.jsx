export default function Header() {
  return (
    <header
      className="flex items-center px-4 py-3 shrink-0"
      style={{ borderBottom: '1px solid var(--color-border)' }}
    >
      <span
        className="font-black italic text-xl tracking-tight"
        style={{ color: 'var(--color-text-strong)' }}
      >
        Rankie
      </span>
    </header>
  )
}
