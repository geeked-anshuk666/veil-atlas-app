'use client'

import { ThemeProvider } from '@/lib/theme-context'
import ServiceWorkerRegister from './ServiceWorkerRegister'
import ThemeToggle from './ThemeToggle'

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ServiceWorkerRegister />
      <ThemeToggle />
      {children}
    </ThemeProvider>
  )
}
