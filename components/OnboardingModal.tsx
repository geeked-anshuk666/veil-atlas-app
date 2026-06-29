'use client'

import { useState } from 'react'
import { useTheme } from '@/lib/theme-context'
import PrivacyPolicy from './legal/PrivacyPolicy'
import TermsOfService from './legal/TermsOfService'

interface OnboardingModalProps {
  onClose: () => void
}

export default function OnboardingModal({ onClose }: OnboardingModalProps) {
  const { theme } = useTheme()
  const [agreed, setAgreed] = useState(false)
  const [activeDoc, setActiveDoc] = useState<'privacy' | 'terms' | null>(null)

  const layerInfo = [
    { name: 'Now', icon: '⚡', desc: 'Real-time ephemeral signals from people within 500m. Expire in 30 minutes.', color: 'text-blue-400' },
    { name: 'Feel', icon: '🌡', desc: 'Collective emotional weather of this location and anonymous confessions.', color: 'text-amber-400' },
    { name: 'Truth', icon: '👁', desc: 'Aggregated, anonymous incident reports highlighting urban exclusion and safety.', color: 'text-red-400' },
    { name: 'Memory', icon: '🕰', desc: 'A deck of user memories across time, alongside physically locked Echoes.', color: 'text-purple-400' },
    { name: 'Rhythm', icon: '〜', desc: 'Activity heatmaps showing how this specific neighborhood breathes across the week.', color: 'text-green-400' },
  ]

  const handleDismiss = () => {
    if (!agreed) return
    localStorage.setItem('veil_onboarded', 'true')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div 
        className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl border transition-all duration-300 ${
          theme === 'dark' 
            ? 'bg-zinc-950/85 border-zinc-800 text-white' 
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

        {/* Legal Consent Checkbox */}
        <div className="my-5 p-3 rounded-xl bg-zinc-900/20 border border-zinc-800/40 flex items-start gap-3">
          <input
            id="legal-consent"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 text-blue-500 focus:ring-blue-500 focus:ring-offset-zinc-950 mt-0.5 cursor-pointer accent-blue-500"
          />
          <label htmlFor="legal-consent" className="text-xs text-zinc-400 leading-normal cursor-pointer select-none">
            I confirm that I am at least 13 years of age, and I agree to the{' '}
            <button
              type="button"
              onClick={() => setActiveDoc('terms')}
              className="text-blue-400 hover:underline font-medium inline"
            >
              Terms of Service
            </button>{' '}
            and{' '}
            <button
              type="button"
              onClick={() => setActiveDoc('privacy')}
              className="text-blue-400 hover:underline font-medium inline"
            >
              Privacy Policy
            </button>.
          </label>
        </div>

        <button
          onClick={handleDismiss}
          disabled={!agreed}
          className={`w-full font-semibold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg active:scale-[0.98] ${
            agreed 
              ? 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer shadow-blue-500/20' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none'
          }`}
        >
          Begin Exploring
        </button>
      </div>

      {/* Legal Overlay Modal */}
      {activeDoc && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div 
            className={`w-full max-w-xl rounded-3xl p-6 shadow-2xl border ${
              theme === 'dark' 
                ? 'bg-zinc-950 border-zinc-800 text-white' 
                : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <div className="flex justify-between items-center mb-4 border-b border-zinc-800/50 pb-3">
              <h3 className="text-lg font-semibold uppercase tracking-wider">
                {activeDoc === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
              </h3>
              <button
                onClick={() => setActiveDoc(null)}
                className="w-7 h-7 rounded-full flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="py-2">
              {activeDoc === 'privacy' ? <PrivacyPolicy /> : <TermsOfService />}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setActiveDoc(null)}
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-colors"
              >
                Accept and Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
