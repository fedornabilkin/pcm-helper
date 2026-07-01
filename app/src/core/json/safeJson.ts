export function parseJsonOrFallback<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function parseJsonOrThrow<T>(value: string, errorMessage: string): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    throw new Error(errorMessage);
  }
}
