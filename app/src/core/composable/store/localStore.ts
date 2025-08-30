// composables/useLocalStore.js
import { ref } from "vue";

export function useLocalStore(key: string, defaultValue: any = null) {
  const stored = localStorage.getItem(key);
  const state = ref(stored ? JSON.parse(stored) : defaultValue);

  function save() {
    localStorage.setItem(key, JSON.stringify(state.value));
  }

  function clear() {
    state.value = defaultValue;
    localStorage.removeItem(key);
  }

  return { state, save, clear };
}
