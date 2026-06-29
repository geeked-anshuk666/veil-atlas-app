'use client'

export default function PrivacyPolicy() {
  return (
    <div className="space-y-4 text-xs md:text-sm leading-relaxed overflow-y-auto max-h-[60vh] pr-2">
      <h3 className="text-base font-semibold">Veil Atlas Privacy Policy</h3>
      <p className="text-zinc-400">Last Updated: June 2026</p>
      
      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">1. Zero-Surveillance Architecture</h4>
        <p className="text-zinc-400">
          Veil Atlas is built on a zero-surveillance design. We do not collect, process, or sell any Personally Identifiable Information (PII). No registration, usernames, email addresses, phone numbers, or social logins are ever required or stored.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">2. Geospatial Proximity Gating</h4>
        <p className="text-zinc-400">
          To facilitate hyper-local interactions on the NOW layer, we process geographic coordinates. Location data is analyzed strictly to calculate local proximity bounds and is never tracked across sessions. Active signals automatically expire and delete from our systems after 30 minutes.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">3. Anonymous Contributions</h4>
        <p className="text-zinc-400">
          Submissions to the FEEL, TRUTH, and MEMORY layers are anonymous. Ownership is verified via a local cryptographically salted identifier stored strictly on your device. Only you can delete your contributions.
        </p>
      </section>

      <section className="space-y-2">
        <h4 className="font-semibold text-zinc-300">4. Third-Party Maps Services</h4>
        <p className="text-zinc-400">
          Map tiles are served anonymously via CartoDB. Location queries on the search bar are resolved anonymously using Nominatim OpenStreetMap services.
        </p>
      </section>
    </div>
  )
}
