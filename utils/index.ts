// Shared utility functions

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function daysUntil(dateString: string): number {
  const target = new Date(dateString).getTime()
  const today = new Date().getTime()
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}
