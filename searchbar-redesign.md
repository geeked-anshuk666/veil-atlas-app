# Plan: Search Bar Reposition & Glassmorphism Styling

Reposition the location search bar to the top-left corner (next to the Left Navigation sidebar) or bottom-left corner, enlarge it, and apply a rich glassmorphism styling effect (high backdrop blur, semi-transparent border, premium shadows).

## Proposed Changes

### Components

#### [MODIFY] [SearchBar.tsx](file:///d:/computer_science/hackathons/hack%20the%20zero%20with%20vercel%20v0%2520and%2520AWS/Veil-Atlas/components/SearchBar.tsx)
- **Positioning:** Update styling to position the search bar at the top-left (e.g. `top-4 left-18` or `left-[72px] md:left-[84px]`).
- **Sizing:** Increase width to `max-w-md` (up to `400px`) and increase input font size, icon size, and padding for a larger display presence.
- **Glassmorphism Design:**
  - Enhance backdrop filter to `backdrop-blur-xl`.
  - Use high-quality semi-transparent backgrounds: `bg-zinc-950/40` (dark mode) / `bg-white/45` (light mode).
  - Add soft glowing drop shadows matching the active layer or a generic premium drop-shadow.
  - Set a fine border: `border-white/10` (dark mode) / `border-black/5` (light mode).

#### [MODIFY] [MapContent.tsx](file:///d:/computer_science/hackathons/hack%20the%20zero%20with%20vercel%20v0%2520and%2520AWS/Veil-Atlas/components/MapContent.tsx)
- Wrap raw `map.flyTo` inside a `useEffect` dependency array hook `[selectedLocation, map]` to prevent zoom fight/stuck loops on map re-renders (triggered on manual user zoom-out due to the dynamic clustering zoom listener).

---

## Verification Plan

### Manual Verification
1. Load the site.
2. Confirm the search bar is located at the top-left, positioned clearly to the right of the closed/opened navigation bar.
3. Confirm the search bar has a premium glassmorphic appearance with clean reflections and micro-shadows.
4. Verify the geocoder dropdown lists matches the new wider layout seamlessly.
