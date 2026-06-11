// Pixel art coin — 12×12 grid rendered at configurable size
// Colors adapt to theme via CSS variables
export default function PixelCoin({ size = 16 }) {
  const s = size / 12

  // Each entry: [col, row, colorKey]
  // colorKey: 'body' | 'hi' | 'shadow' | 'rim'
  const pixels = [
    // row 0 — top rim
    [3,0,'rim'],[4,0,'rim'],[5,0,'rim'],[6,0,'rim'],[7,0,'rim'],[8,0,'rim'],
    // row 1
    [2,1,'rim'],[3,1,'body'],[4,1,'body'],[5,1,'body'],[6,1,'body'],[7,1,'body'],[8,1,'body'],[9,1,'rim'],
    // row 2 — highlight top-left
    [1,2,'rim'],[2,2,'hi'],[3,2,'hi'],[4,2,'body'],[5,2,'body'],[6,2,'body'],[7,2,'body'],[8,2,'body'],[9,2,'body'],[10,2,'rim'],
    // row 3
    [1,3,'rim'],[2,3,'hi'],[3,3,'body'],[4,3,'body'],[5,3,'body'],[6,3,'body'],[7,3,'body'],[8,3,'body'],[9,3,'body'],[10,3,'rim'],
    // row 4 — C mark top
    [1,4,'rim'],[2,4,'body'],[3,4,'body'],[4,4,'rim'],[5,4,'rim'],[6,4,'body'],[7,4,'body'],[8,4,'body'],[9,4,'body'],[10,4,'rim'],
    // row 5 — C mark mid
    [1,5,'rim'],[2,5,'body'],[3,5,'body'],[4,5,'rim'],[5,5,'body'],[6,5,'body'],[7,5,'body'],[8,5,'body'],[9,5,'body'],[10,5,'rim'],
    // row 6 — C mark bottom
    [1,6,'rim'],[2,6,'body'],[3,6,'body'],[4,6,'rim'],[5,6,'rim'],[6,6,'body'],[7,6,'body'],[8,6,'body'],[9,6,'body'],[10,6,'rim'],
    // row 7
    [1,7,'rim'],[2,7,'body'],[3,7,'body'],[4,7,'body'],[5,7,'body'],[6,7,'body'],[7,7,'body'],[8,7,'shadow'],[9,7,'shadow'],[10,7,'rim'],
    // row 8
    [1,8,'rim'],[2,8,'body'],[3,8,'body'],[4,8,'body'],[5,8,'body'],[6,8,'body'],[7,8,'shadow'],[8,8,'shadow'],[9,8,'rim'],[10,8,'rim'],
    // row 9
    [2,9,'rim'],[3,9,'body'],[4,9,'body'],[5,9,'body'],[6,9,'body'],[7,9,'body'],[8,9,'rim'],[9,9,'rim'],
    // row 10 — bottom rim
    [3,10,'rim'],[4,10,'rim'],[5,10,'rim'],[6,10,'rim'],[7,10,'rim'],[8,10,'rim'],
  ]

  const colors = {
    rim:    'var(--color-text-strong)',
    body:   'var(--color-dot-present)',
    hi:     'color-mix(in srgb, white 40%, var(--color-dot-present))',
    shadow: 'color-mix(in srgb, black 30%, var(--color-dot-present))',
  }

  return (
    <svg
      width={size}
      height={size * (11/12)}
      viewBox="0 0 12 11"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', imageRendering: 'pixelated', flexShrink: 0 }}
      aria-hidden="true"
    >
      {pixels.map(([col, row, key], i) => (
        <rect
          key={i}
          x={col}
          y={row}
          width={1}
          height={1}
          style={{ fill: colors[key] }}
        />
      ))}
    </svg>
  )
}
