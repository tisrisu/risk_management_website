export default function AmbientBackground() {
  return (
    <>
      {/* LAYER 1 — The Grid */}
      <div style={styles.grid} />

      {/* LAYER 2 — Floating Orbs */}
      <div style={styles.orb1} />
      <div style={styles.orb2} />
      <div style={styles.orb3} />

      {/* LAYER 3 — Noise texture */}
      <div style={styles.noise} />
    </>
  );
}

// Data URI for a simple 100x100 SVG noise pattern
const noiseSvg = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.08'/%3E%3C/svg%3E`;

const styles = {
  grid: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    backgroundImage: `
      linear-gradient(to right, var(--border-void) 1px, transparent 1px),
      linear-gradient(to bottom, var(--border-void) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px'
  },
  orb1: {
    position: 'fixed',
    zIndex: 0,
    pointerEvents: 'none',
    top: '-10%',
    left: '-10%',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(99,120,255,0.08) 0%, transparent 70%)',
    animation: 'float-a 20s ease-in-out infinite'
  },
  orb2: {
    position: 'fixed',
    zIndex: 0,
    pointerEvents: 'none',
    bottom: '-15%',
    right: '-10%',
    width: '800px',
    height: '800px',
    background: 'radial-gradient(circle, rgba(255,58,74,0.05) 0%, transparent 70%)',
    animation: 'float-b 28s ease-in-out infinite'
  },
  orb3: {
    position: 'fixed',
    zIndex: 0,
    pointerEvents: 'none',
    top: '30%',
    right: '20%',
    width: '400px',
    height: '400px',
    background: 'radial-gradient(circle, rgba(0,230,118,0.04) 0%, transparent 70%)',
    animation: 'float-c 16s ease-in-out infinite'
  },
  noise: {
    position: 'fixed',
    inset: 0,
    zIndex: 0,
    pointerEvents: 'none',
    background: `url("${noiseSvg}")`,
    opacity: 0.15,
    mixBlendMode: 'overlay'
  }
};
