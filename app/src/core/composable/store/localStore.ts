import { ref } from "vue";
import {parseJsonOrFallback} from "@/core/json/safeJson";

export type LocalStoreSaveResult =
  | {success: true}
  | {
      success: false;
      reason: 'quota_exceeded' | 'storage_unavailable' | 'serialization_failed' | 'recovery_required';
    }

const getStoredValue = (key: string): string | null => {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

const isQuotaError = (error: unknown): boolean => {
  return error instanceof DOMException
    && (error.name === 'QuotaExceededError' || error.code === 22 || error.code === 1014)
}

export function useLocalStore(key: string, defaultValue: any = null) {
  const stored = getStoredValue(key);
  const state = ref(parseJsonOrFallback(stored, defaultValue));

  function save(): LocalStoreSaveResult {
    let serialized: string

    try {
      serialized = JSON.stringify(state.value)
    } catch {
      return {success: false, reason: 'serialization_failed'}
    }

    try {
      localStorage.setItem(key, serialized)
      return {success: true}
    } catch (error) {
      return {
        success: false,
        reason: isQuotaError(error) ? 'quota_exceeded' : 'storage_unavailable',
      }
    }
  }

  function clear() {
    state.value = defaultValue;
    localStorage.removeItem(key);
  }

  return { state, save, clear };
}
