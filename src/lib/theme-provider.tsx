'use client'

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  actualTheme: 'light' | 'dark'
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  setTheme: () => {},
  actualTheme: 'light',
  mounted: false,
})

const STORAGE_KEY = 'akuit-theme'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [actualTheme, setActualTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Component mounted on client
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)

    // Load theme from localStorage
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (stored) {
      setThemeState(() => stored)
    }
  }, [])

  // Apply theme whenever theme changes
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement
    root.classList.remove('light', 'dark')

    let resolved: 'light' | 'dark' = 'light'

    if (theme === 'system') {
      resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    } else {
      resolved = theme
    }

    root.classList.add(resolved)
    if (actualTheme !== resolved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActualTheme(() => resolved)
    }
  }, [theme, mounted])

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== 'system' || !mounted) return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => {
      const root = document.documentElement
      root.classList.remove('light', 'dark')
      const newTheme = e.matches ? 'dark' : 'light'
      root.classList.add(newTheme)
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActualTheme(() => newTheme)
    }

    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [theme, mounted])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(STORAGE_KEY, newTheme)
  }, [])

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    actualTheme,
    mounted,
  }), [theme, setTheme, actualTheme, mounted])

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
