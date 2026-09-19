export function extractTitle(markdown: string): string {
  const lines = markdown.split(/\r?\n/)
  for (const line of lines) {
    const heading = line.match(/^#{1,6}\s+(.+)$/)
    if (heading) {
      return cleanTitle(heading[1])
    }
    const trimmed = line.trim()
    if (!trimmed) continue
    if (/^!\[/.test(trimmed)) continue
    if (/^[-*_]{3,}$/.test(trimmed)) continue
    return cleanTitle(trimmed)
  }
  return '無題'
}

function cleanTitle(text: string): string {
  const cleaned = text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/[*_`~#>]/g, '')
    .trim()
    .slice(0, 80)
  return cleaned || '無題'
}
