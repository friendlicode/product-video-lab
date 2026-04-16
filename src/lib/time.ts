/**
 * Returns a human-readable relative time string for a given ISO timestamp.
 * Does not depend on any external library.
 */
export function relativeTime(iso: string | null): string {
  if (!iso) return ''
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = now - then
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return 'just now'
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
