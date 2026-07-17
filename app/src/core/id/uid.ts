export function createUid(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `uid-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}

