'use client'

import { useTheme } from '@/lib/theme-context'

interface OnboardingModalProps {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const { theme } = useTheme()

  const layerInfo = [
    { name: 'Now', icon: '⚡', desc: 'Real-time ephemeral signals from people within 500m. Expire in 30 minutes.', color: 'text-blue-400' },
    { name: 'Feel', icon: '🌡', desc: 'Collective emotional weather of this location and anonymous confessions.', color: 'text-amber-400' },
    { name: 'Truth', icon: '👁', desc: 'Aggregated, anonymous incident reports highlighting urban exclusion and safety.', color: 'text-red-400' },
    { name: 'Memory', icon: '🕰', desc: 'A deck of user memories across time, alongside physically locked Echoes.', color: 'text-purple-400' },
    { name: 'Rhythm', icon: '〜', desc: 'Activity heatmaps showing how this specific neighborhood breathes across the week.', color: 'text-green-400' },
  ]

  const handleDismiss = () => {
    localStorage.setItem('veil_onboarded', 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-zinc-950/80 border-zinc-800 text-white' 
            : 'bg-white/80 border-zinc-200 text-zinc-900'
        }`}
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)'
        }}
      >
        <div className="text-center mb-6">
          <div className="inline-block bg-blue-500/10 text-blue-400 text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider mb-2">
            Welcome to Veil Atlas
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Lift the Veil on the City</h2>
          <p className="text-sm text-zinc-400 mt-1.5">
            Reveal the 5 invisible dimensions of any physical location around you.
          </p>
        </div>

        <div className="space-y-4 my-6">
          {layerInfo.map((l) => (
            <div key={l.name} className="flex gap-4 items-start">
              <span className={`text-2xl flex-shrink-0 w-8 h-8 rounded-lg bg-zinc-800/50 flex items-center justify-center ${l.color}`}>
                {l.icon}
              </span>
              <div>
                <h4 className={`text-sm font-semibold ${l.color}`}>{l.name} Layer</h4>
                <p className="text-xs text-zinc-400 leading-relaxed mt-0.5">{l.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-zinc-500 bg-zinc-900/40 border border-zinc-800/50 rounded-xl p-3 text-center mb-6">
          📍 Tap anywhere on the map to explore details for that location, or use navigation sidebar to switch layers.
        </div>

        <button
          onClick={handleDismiss}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98]"
        >
          Begin Exploring
        </button>
      </div>
    </div>
  )
}
