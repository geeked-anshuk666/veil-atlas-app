'use client'

export default function TermsOfService() {
  return (
    <div className="space-y-4 text-xs md:text-sm leading-relaxed overflow-y-auto max-h-[60vh] pr-2">
      <h3 className="text-base font-semibold">Veil Atlas Terms of Service</h3>
      <p className="text-zinc-400">Last Updated: June 2026</p>

      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">1. Acceptance of Terms</h4>
        <p className="text-zinc-400">
          By accessing or using Veil Atlas, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you may not access the mapping application.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">2. Permissible Use and Content Rules</h4>
        <p className="text-zinc-400">
          All submissions to our ephemeral and permanent layers must be honest and constructive. You agree not to post content that is harassing, contains personally identifiable information of others, constitutes hate speech, or promotes unlawful activity.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">3. Moderation and Deletion</h4>
        <p className="text-zinc-400">
          Veil Atlas reserves the right to review, hide, or delete any coordinates, confessions, incidents, or memories reported that violate these guidelines. Ephemeral NOW posts are automatically purged every 30 minutes.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">4. Disclaimer of Warranties</h4>
        <p className="text-zinc-400">
          This mapping tool is provided "as is" without warranties of any kind. Contributions are crowd-sourced and may not reflect verified facts.
        </p>
      </section>
    </div>
  )
}
