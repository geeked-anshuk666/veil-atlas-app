interface CacheEntry<T> {
  value: T
  expiresAt: number
}

const memoryStore = new Map<string, CacheEntry<any>>()

export function getCache<T>(key: string): T | null {
  const entry = memoryStore.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key)
    return null
  }
  return entry.value as T
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  })
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    memoryStore.clear()
    return
  }
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key)
    }
  }
}
