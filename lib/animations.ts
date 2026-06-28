// Animation utility types and helpers
export const animations = {
  breathing: `
    @keyframes breathing {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
  `,
  pulse: `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
  `,
  slideUp: `
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  slideDown: `
    @keyframes slideDown {
      from { transform: translateY(-20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `,
  fadeIn: `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `,
  scaleIn: `
    @keyframes scaleIn {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
  `,
  glow: `
    @keyframes glow {
      0%, 100% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
      50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.8); }
    }
  `,
}

export const animationClasses = {
  breathing: 'animate-breathing',
  pulse: 'animate-pulse',
  shimmer: 'animate-shimmer',
  slideUp: 'animate-slideUp',
  slideDown: 'animate-slideDown',
  fadeIn: 'animate-fadeIn',
  scaleIn: 'animate-scaleIn',
  glow: 'animate-glow',
}
