import type { Theme } from './theme-context'

export const themeColors = {
  dark: {
    bg: {
      primary: '#0a0a0a',
      secondary: '#1a1a1a',
      tertiary: '#2a2a2a',
    },
    text: {
      primary: '#ffffff',
      secondary: '#a3a3a3',
      muted: '#6b7280',
    },
    border: '#2a2a2a',
    card: '#1a1a1a',
    overlay: 'rgba(10, 10, 10, 0.8)',
  },
  light: {
    bg: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#eeeeee',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      muted: '#999999',
    },
    border: '#e0e0e0',
    card: '#f5f5f5',
    overlay: 'rgba(255, 255, 255, 0.9)',
  },
}

export const layerColors = {
  now: '#3b82f6',
  feel: '#fbbf24',
  truth: '#ef4444',
  memory: '#a855f7',
  rhythm: '#22c55e',
}

export function getThemeClasses(theme: Theme, baseClasses: string) {
  if (theme === 'dark') return baseClasses
  // Return light mode versions of classes
  return baseClasses
}

export function getBgClass(theme: Theme, level: 'primary' | 'secondary' | 'tertiary' = 'primary') {
  if (theme === 'dark') {
    return level === 'primary' ? 'bg-[#0a0a0a]' : level === 'secondary' ? 'bg-[#1a1a1a]' : 'bg-[#2a2a2a]'
  }
  return level === 'primary' ? 'bg-white' : level === 'secondary' ? 'bg-[#f5f5f5]' : 'bg-[#eeeeee]'
}

export function getTextClass(theme: Theme, level: 'primary' | 'secondary' | 'muted' = 'primary') {
  if (theme === 'dark') {
    return level === 'primary' ? 'text-white' : level === 'secondary' ? 'text-[#a3a3a3]' : 'text-[#6b7280]'
  }
  return level === 'primary' ? 'text-[#1a1a1a]' : level === 'secondary' ? 'text-[#666666]' : 'text-[#999999]'
}

export function getBorderClass(theme: Theme) {
  return theme === 'dark' ? 'border-[#2a2a2a]' : 'border-[#e0e0e0]'
}

export function getCardClass(theme: Theme) {
  return theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-[#f5f5f5]'
}
