import {computed, ref} from "vue";

type ThemeName = 'light' | 'dark'

const THEME_STORAGE_KEY = 'pcm-helper-theme'
const DARK_THEME_CLASS = 'theme-dark'

const readInitialTheme = (): ThemeName => {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  if (storedTheme === 'dark' || storedTheme === 'light') {
    return storedTheme
  }

  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const theme = ref<ThemeName>(readInitialTheme())

const applyTheme = (): void => {
  document.documentElement.classList.toggle(DARK_THEME_CLASS, theme.value === 'dark')
  document.documentElement.dataset.theme = theme.value
  localStorage.setItem(THEME_STORAGE_KEY, theme.value)
}

export const useTheme = () => {
  const isDarkTheme = computed(() => theme.value === 'dark')

  const setTheme = (value: ThemeName): void => {
    theme.value = value
    applyTheme()
  }

  const toggleTheme = (): void => {
    setTheme(isDarkTheme.value ? 'light' : 'dark')
  }

  return {
    theme,
    isDarkTheme,
    applyTheme,
    setTheme,
    toggleTheme,
  }
}
