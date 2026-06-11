// Pixel art menu icons — 12×12 grid, theme-aware via CSS variables

function PixelSvg({ pixels, colors, size = 16 }) {
  const s = size / 12
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 12 12"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'inline-block', imageRendering: 'pixelated', flexShrink: 0 }}
      aria-hidden="true"
    >
      {pixels.map(([col, row, key], i) => (
        <rect key={i} x={col} y={row} width={1} height={1} style={{ fill: colors[key] }} />
      ))}
    </svg>
  )
}

// Today's Puzzle — home icon
export function PixelCalendar({ size = 16 }) {
  const pixels = [
    // roof — solid filled triangle (action color)
    [5,1,'roof'],[6,1,'roof'],
    [4,2,'roof'],[5,2,'roof'],[6,2,'roof'],[7,2,'roof'],
    [3,3,'roof'],[4,3,'roof'],[5,3,'roof'],[6,3,'roof'],[7,3,'roof'],[8,3,'roof'],
    [2,4,'roof'],[3,4,'roof'],[4,4,'roof'],[5,4,'roof'],[6,4,'roof'],[7,4,'roof'],[8,4,'roof'],[9,4,'roof'],
    [1,5,'roof'],[2,5,'roof'],[3,5,'roof'],[4,5,'roof'],[5,5,'roof'],[6,5,'roof'],[7,5,'roof'],[8,5,'roof'],[9,5,'roof'],[10,5,'roof'],
    // walls — left post, right post
    [1,6,'rim'],[2,6,'rim'],[9,6,'rim'],[10,6,'rim'],
    [1,7,'rim'],[2,7,'rim'],[9,7,'rim'],[10,7,'rim'],
    [1,8,'rim'],[2,8,'rim'],[9,8,'rim'],[10,8,'rim'],
    // floor
    [1,9,'rim'],[2,9,'rim'],[3,9,'rim'],[4,9,'rim'],[5,9,'rim'],[6,9,'rim'],[7,9,'rim'],[8,9,'rim'],[9,9,'rim'],[10,9,'rim'],
  ]
  const colors = {
    roof: 'var(--color-action)',
    rim:  'var(--color-text-strong)',
  }
  return <PixelSvg pixels={pixels} colors={colors} size={size} />
}

// The Archives — stacked pages
export function PixelArchive({ size = 16 }) {
  const pixels = [
    // back page (offset top-right)
    [3,1,'faint'],[4,1,'faint'],[5,1,'faint'],[6,1,'faint'],[7,1,'faint'],[8,1,'faint'],[9,1,'faint'],
    [9,2,'faint'],[9,3,'faint'],
    // mid page
    [2,2,'mid'],[3,2,'mid'],[4,2,'mid'],[5,2,'mid'],[6,2,'mid'],[7,2,'mid'],[8,2,'mid'],
    [2,3,'mid'],[8,3,'mid'],
    [2,4,'mid'],[8,4,'mid'],
    // front page
    [1,3,'rim'],[2,3,'rim'],[3,3,'rim'],[4,3,'rim'],[5,3,'rim'],[6,3,'rim'],[7,3,'rim'],
    [1,4,'rim'],[7,4,'rim'],
    [1,5,'rim'],[7,5,'rim'],
    [1,6,'rim'],[7,6,'rim'],
    [1,7,'rim'],[7,7,'rim'],
    [1,8,'rim'],[2,8,'rim'],[3,8,'rim'],[4,8,'rim'],[5,8,'rim'],[6,8,'rim'],[7,8,'rim'],
    // ruled lines on front page
    [2,5,'line'],[3,5,'line'],[4,5,'line'],[5,5,'line'],[6,5,'line'],
    [2,7,'line'],[3,7,'line'],[4,7,'line'],[5,7,'line'],[6,7,'line'],
  ]
  const colors = {
    rim:   'var(--color-text-strong)',
    mid:   'color-mix(in srgb, var(--color-text-strong) 55%, var(--color-bg))',
    faint: 'color-mix(in srgb, var(--color-text-strong) 30%, var(--color-bg))',
    line:  'color-mix(in srgb, var(--color-text-strong) 25%, var(--color-bg))',
  }
  return <PixelSvg pixels={pixels} colors={colors} size={size} />
}

// How to play — block pixel question mark
export function PixelHelp({ size = 16 }) {
  const pixels = [
    // curve top
    [4,1,'rim'],[5,1,'rim'],[6,1,'rim'],[7,1,'rim'],
    [3,2,'rim'],[8,2,'rim'],
    [3,3,'rim'],[8,3,'rim'],
    // right side drop
    [7,4,'rim'],[8,4,'rim'],
    // hook left
    [6,5,'rim'],[7,5,'rim'],
    [5,6,'rim'],[6,6,'rim'],
    // gap row 7 empty
    // dot
    [5,8,'rim'],[6,8,'rim'],
    [5,9,'rim'],[6,9,'rim'],
  ]
  const colors = { rim: 'var(--color-text-strong)' }
  return <PixelSvg pixels={pixels} colors={colors} size={size} />
}

// Appearance — split circle, left=action, right=bg with rim
export function PixelAppearance({ size = 16 }) {
  const pixels = [
    // top arc
    [4,1,'rim'],[5,1,'rim'],[6,1,'rim'],[7,1,'rim'],
    // row 2
    [3,2,'rim'],[4,2,'left'],[5,2,'left'],[6,2,'right'],[7,2,'right'],[8,2,'rim'],
    // row 3
    [2,3,'rim'],[3,3,'left'],[4,3,'left'],[5,3,'left'],[6,3,'right'],[7,3,'right'],[8,3,'right'],[9,3,'rim'],
    // row 4
    [2,4,'rim'],[3,4,'left'],[4,4,'left'],[5,4,'left'],[6,4,'right'],[7,4,'right'],[8,4,'right'],[9,4,'rim'],
    // row 5
    [2,5,'rim'],[3,5,'left'],[4,5,'left'],[5,5,'left'],[6,5,'right'],[7,5,'right'],[8,5,'right'],[9,5,'rim'],
    // row 6
    [2,6,'rim'],[3,6,'left'],[4,6,'left'],[5,6,'left'],[6,6,'right'],[7,6,'right'],[8,6,'right'],[9,6,'rim'],
    // row 7
    [3,7,'rim'],[4,7,'left'],[5,7,'left'],[6,7,'right'],[7,7,'right'],[8,7,'rim'],
    // divider
    [6,2,'div'],[6,3,'div'],[6,4,'div'],[6,5,'div'],[6,6,'div'],[6,7,'div'],
    // bottom arc
    [4,8,'rim'],[5,8,'rim'],[6,8,'rim'],[7,8,'rim'],
  ]
  const colors = {
    rim:   'var(--color-text-strong)',
    left:  'var(--color-action)',
    right: 'var(--color-bg)',
    div:   'var(--color-text-strong)',
  }
  return <PixelSvg pixels={pixels} colors={colors} size={size} />
}

// About & Privacy — bordered lowercase i
export function PixelAbout({ size = 16 }) {
  const pixels = [
    // rounded square border
    [2,1,'rim'],[3,1,'rim'],[4,1,'rim'],[5,1,'rim'],[6,1,'rim'],[7,1,'rim'],[8,1,'rim'],[9,1,'rim'],
    [1,2,'rim'],[10,2,'rim'],
    [1,3,'rim'],[10,3,'rim'],
    [1,4,'rim'],[10,4,'rim'],
    [1,5,'rim'],[10,5,'rim'],
    [1,6,'rim'],[10,6,'rim'],
    [1,7,'rim'],[10,7,'rim'],
    [1,8,'rim'],[10,8,'rim'],
    [2,9,'rim'],[3,9,'rim'],[4,9,'rim'],[5,9,'rim'],[6,9,'rim'],[7,9,'rim'],[8,9,'rim'],[9,9,'rim'],
    // dot
    [5,3,'glyph'],[6,3,'glyph'],
    [5,4,'glyph'],[6,4,'glyph'],
    // stem
    [5,6,'glyph'],[6,6,'glyph'],
    [5,7,'glyph'],[6,7,'glyph'],
  ]
  const colors = {
    rim:   'var(--color-text-strong)',
    glyph: 'var(--color-text-strong)',
  }
  return <PixelSvg pixels={pixels} colors={colors} size={size} />
}

// Difficulty — ascending bar chart
export function PixelDifficulty({ size = 16 }) {
  const pixels = [
    // baseline
    [1,9,'rim'],[2,9,'rim'],[3,9,'rim'],[4,9,'rim'],[5,9,'rim'],[6,9,'rim'],[7,9,'rim'],[8,9,'rim'],[9,9,'rim'],[10,9,'rim'],
    // bar 1 (short, left) h=2
    [2,7,'bar1'],[3,7,'bar1'],
    [2,8,'bar1'],[3,8,'bar1'],
    // bar 2 (mid) h=4
    [5,5,'bar2'],[6,5,'bar2'],
    [5,6,'bar2'],[6,6,'bar2'],
    [5,7,'bar2'],[6,7,'bar2'],
    [5,8,'bar2'],[6,8,'bar2'],
    // bar 3 (tall, right) h=6
    [8,3,'bar3'],[9,3,'bar3'],
    [8,4,'bar3'],[9,4,'bar3'],
    [8,5,'bar3'],[9,5,'bar3'],
    [8,6,'bar3'],[9,6,'bar3'],
    [8,7,'bar3'],[9,7,'bar3'],
    [8,8,'bar3'],[9,8,'bar3'],
  ]
  const colors = {
    rim:  'var(--color-text-strong)',
    bar1: 'color-mix(in srgb, var(--color-action) 40%, var(--color-bg))',
    bar2: 'color-mix(in srgb, var(--color-action) 70%, var(--color-bg))',
    bar3: 'var(--color-action)',
  }
  return <PixelSvg pixels={pixels} colors={colors} size={size} />
}

// Reset game — left-pointing arrow (←): triangle arrowhead + rectangular shaft
export function PixelReset({ size = 16 }) {
  const pixels = [
    // arrowhead — triangle pointing left, tip at col 1 row 5
    [4,2,'a'],
    [3,3,'a'],[4,3,'a'],
    [2,4,'a'],[3,4,'a'],[4,4,'a'],
    [1,5,'a'],[2,5,'a'],[3,5,'a'],[4,5,'a'],
    [2,6,'a'],[3,6,'a'],[4,6,'a'],
    [3,7,'a'],[4,7,'a'],
    [4,8,'a'],
    // shaft — 2px tall, cols 5–10
    [5,4,'a'],[6,4,'a'],[7,4,'a'],[8,4,'a'],[9,4,'a'],[10,4,'a'],
    [5,5,'a'],[6,5,'a'],[7,5,'a'],[8,5,'a'],[9,5,'a'],[10,5,'a'],
    [5,6,'a'],[6,6,'a'],[7,6,'a'],[8,6,'a'],[9,6,'a'],[10,6,'a'],
  ]
  const colors = { a: 'var(--color-text-strong)' }
  return <PixelSvg pixels={pixels} colors={colors} size={size} />
}
