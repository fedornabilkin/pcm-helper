export const BACKUP_REMINDER_AFTER_DAYS = 3

const backupStatusKey = (networkId: number): string => `pcm-helper-network-${networkId}-last-exported-at`

export const readNetworkBackupDate = (networkId: number): Date | null => {
  try {
    const value = localStorage.getItem(backupStatusKey(networkId))
    if (!value) {
      return null
    }

    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date
  } catch {
    return null
  }
}

export const recordNetworkBackupDownload = (networkId: number, date = new Date()): void => {
  try {
    localStorage.setItem(backupStatusKey(networkId), date.toISOString())
  } catch {
    // Резервная копия остаётся доступной, даже если браузер запретил localStorage.
  }
}

export const isNetworkBackupOverdue = (
  lastDownloadedAt: Date | null,
  now = new Date(),
): boolean => {
  if (!lastDownloadedAt) {
    return true
  }

  const elapsed = now.getTime() - lastDownloadedAt.getTime()
  return elapsed >= BACKUP_REMINDER_AFTER_DAYS * 24 * 60 * 60 * 1000
}

export const formatNetworkBackupDate = (date: Date): string => date.toLocaleString('ru-RU', {
  dateStyle: 'medium',
  timeStyle: 'short',
})
