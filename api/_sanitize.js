export function sanitizeStr(s) {
  return s.replace(/[\x00-\x1F\x7F]/g, ' ').trim()
}

export function sanitizeItems(arr) {
  return arr
    .filter(item => typeof item === 'string')
    .slice(0, 20)
    .map(item => sanitizeStr(item.slice(0, 100)))
}
