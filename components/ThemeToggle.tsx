'use client'

import { useTheme } from '@/lib/theme-context'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`fixed top-4 right-4 z-50 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 ${
        theme === 'dark'
          ? 'bg-[#1a1a1a] border border-[#2a2a2a] text-yellow-400 hover:bg-[#2a2a2a]'
          : 'bg-[#f5f5f5] border border-[#e0e0e0] text-blue-600 hover:bg-white'
      }`}
      aria-label="Toggle theme"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      ) : (
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zm2.828 2.829a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM10 7a3 3 0 110 6 3 3 0 010-6zm-4.22-1.78a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414L5.78 5.22a1 1 0 010-1.414zm-2.828 2.828a1 1 0 011.414 0l.707.707a1 1 0 01-1.414 1.414l-.707-.707a1 1 0 010-1.414zM3 10a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm0-4a1 1 0 011 1v1a1 1 0 11-2 0V7a1 1 0 011-1z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </button>
  )
}
