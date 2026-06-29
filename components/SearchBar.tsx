'use client'

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/lib/theme-context'

interface SearchResult {
  display_name: string
  lat: string
  lon: string
}

interface SearchBarProps {
  onLocationSelect: (lat: number, lng: number, name: string) => void
  onDropdownOpen?: (isOpen: boolean) => void
}

export default function SearchBar({ onLocationSelect, onDropdownOpen }: SearchBarProps) {
  const { theme } = useTheme()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  // Debounced search function
  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=5`,
        {
          headers: {
            'User-Agent': 'VeilAtlas/1.0',
          },
        }
      )
      const data = await response.json()
      setResults(data)
      setIsOpen(true)
      onDropdownOpen?.(true)
    } catch (error) {
      console.error('[v0] Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input change with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setQuery(value)

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (!value.trim()) {
      setResults([])
      setIsOpen(false)
      onDropdownOpen?.(false)
      return
    }

    debounceTimer.current = setTimeout(() => {
      performSearch(value)
    }, 400)
  }

  // Handle result selection
  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat)
    const lng = parseFloat(result.lon)
    onLocationSelect(lat, lng, result.display_name)
    setQuery('')
    setResults([])
    setIsOpen(false)
    onDropdownOpen?.(false)
  }

  // Handle clear button
  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    onDropdownOpen?.(false)
  }

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
        onDropdownOpen?.(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onDropdownOpen])

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        onDropdownOpen?.(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onDropdownOpen])

  return (
    <div
      ref={searchRef}
      className="fixed top-3 z-40"
      style={{
        right: '16px',
        maxWidth: '340px',
      }}
    >
      {/* Search Input */}
      <div
        className={`rounded-full px-3 py-2 border transition-all duration-300 flex items-center gap-2 ${
          theme === 'dark'
            ? 'bg-black/60 border-white/10 hover:border-white/20 focus-within:border-white/25'
            : 'bg-white/70 border-black/10 hover:border-black/20 focus-within:border-black/25'
        }`}
        style={{
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        {/* SVG Search Icon */}
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
        </svg>

        {/* Input */}
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Search locations..."
          className={`flex-1 bg-transparent outline-none text-xs font-medium ${
            theme === 'dark'
              ? 'text-white placeholder-gray-600'
              : 'text-black placeholder-gray-400'
          }`}
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] transition-opacity hover:opacity-70 flex-shrink-0 ${
              theme === 'dark' ? 'bg-white/20 text-white' : 'bg-black/15 text-black'
            }`}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className={`w-3 h-3 border border-t-transparent rounded-full animate-spin flex-shrink-0 ${
            theme === 'dark' ? 'border-gray-400' : 'border-gray-500'
          }`} />
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div
          className={`absolute top-full mt-2 left-0 right-0 rounded-2xl border max-h-80 overflow-y-auto z-50 ${
            theme === 'dark'
              ? 'bg-black/85 border-white/10'
              : 'bg-white/90 border-black/10'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          {results.map((result, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectResult(result)}
              className={`w-full px-3.5 py-2.5 text-left border-b transition-colors last:border-b-0 ${
                theme === 'dark'
                  ? 'border-white/5 hover:bg-white/8 text-white'
                  : 'border-black/5 hover:bg-black/5 text-black'
              }`}
            >
              <div className="text-xs font-medium line-clamp-2 leading-snug">
                {result.display_name}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No Results */}
      {isOpen && query && results.length === 0 && !isLoading && (
        <div
          className={`absolute top-full mt-2 left-0 right-0 rounded-2xl border p-3 text-center text-xs ${
            theme === 'dark'
              ? 'bg-black/85 border-white/10 text-gray-500'
              : 'bg-white/90 border-black/10 text-gray-400'
          }`}
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
          }}
        >
          No locations found
        </div>
      )}
    </div>
  )
}
