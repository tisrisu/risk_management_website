import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function WelcomePage() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(null);
  
  // Update browser tab title
  useEffect(() => { document.title = "Aura · Secure Portal"; }, []);

  return (
    <div style={s.page}>
      
      {/* LEFT SIDE — 45% */}
      <div style={s.leftPane}>
        <div style={s.topBranding}>
          <div style={s.logoMark}>◆</div>
          <h1 className="font-display" style={s.logoText}>AURA</h1>
          <div style={s.divider} />
          <p className="font-mono" style={s.subtitle}>HOTEL SAFETY INTELLIGENCE</p>
        </div>

        <div style={s.choiceCard}>
          <p className="font-mono" style={s.choiceLabel}>I AM A...</p>

          <button 
            style={{ ...s.btn, ...(hovered === 'guest' ? s.btnHover : {}) }}
            onMouseEnter={() => setHovered('guest')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate('/guest/login')}
          >
            <div style={{ ...s.iconBox, ...(hovered === 'guest' ? s.iconBoxHoverGuest : {}) }}>
              <span className="font-mono" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--system)' }}>G</span>
            </div>
            <div style={s.btnContent}>
              <div className="font-body" style={s.btnTitle}>Hotel Guest</div>
              <div className="font-mono" style={s.btnSub}>Check in to your room or report an emergency</div>
            </div>
            <div style={{ ...s.arrow, ...(hovered === 'guest' ? s.arrowHover : {}) }}>
              {hovered === 'guest' ? '→' : '›'}
            </div>
          </button>

          <div style={s.orDivider}>
            <div style={s.orLine} />
            <span className="font-mono" style={s.orText}>OR</span>
            <div style={s.orLine} />
          </div>

          <button 
            style={{ ...s.btn, ...(hovered === 'staff' ? s.btnHoverStaff : {}) }}
            onMouseEnter={() => setHovered('staff')}
            onMouseLeave={() => setHovered(null)}
            onClick={() => navigate('/staff/login')}
          >
            <div style={{ ...s.iconBoxStaff, ...(hovered === 'staff' ? s.iconBoxHoverStaff : {}) }}>
              <span className="font-mono" style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--red)' }}>S</span>
            </div>
            <div style={s.btnContent}>
              <div className="font-body" style={s.btnTitle}>Hotel Staff</div>
              <div className="font-mono" style={s.btnSub}>Access the command center and manage alerts</div>
            </div>
            <div style={{ ...s.arrow, ...(hovered === 'staff' ? s.arrowHover : {}) }}>
              {hovered === 'staff' ? '→' : '›'}
            </div>
          </button>
        </div>

        <div className="font-mono" style={s.helpText}>
          Emergency? Tap the guest button above.
        </div>

        <div style={s.bottomBar}>
          <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>AURA v2.1 · GSC 2026</span>
          <button onClick={() => navigate('/register')} className="font-mono hover-link" style={s.registerLink}>REGISTER PROPERTY</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', animation: 'blink 2s infinite' }} />
            <span className="font-mono" style={{ fontSize: '8px', color: 'var(--green)' }}>SYSTEM OPERATIONAL</span>
          </div>
        </div>
      </div>

      {/* RIGHT SIDE — 55% */}
      <div style={s.rightPane}>
        <svg style={s.blueprint} viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
          {/* A fake architectural blueprint drawn with crisp SVG lines */}
          <g stroke="rgba(99,120,255,0.15)" strokeWidth="1" fill="none">
            {/* Outer walls */}
            <rect x="100" y="100" width="600" height="600" />
            <rect x="110" y="110" width="580" height="580" />
            
            {/* Corridors */}
            <line x1="100" y1="400" x2="700" y2="400" />
            <line x1="100" y1="450" x2="700" y2="450" />
            <line x1="400" y1="100" x2="400" y2="400" />
            <line x1="450" y1="100" x2="450" y2="400" />
            
            {/* Rooms Left/Top */}
            <rect x="110" y="110" width="145" height="290" />
            <rect x="255" y="110" width="145" height="145" />
            <rect x="255" y="255" width="145" height="145" />
            
            {/* Rooms Right/Top */}
            <rect x="450" y="110" width="240" height="145" />
            <rect x="450" y="255" width="120" height="145" />
            <rect x="570" y="255" width="120" height="145" />

            {/* Bottom Rooms */}
            {Array.from({ length: 6 }).map((_, i) => (
              <rect key={i} x={110 + (i * 96.6)} y="450" width="96.6" height="240" />
            ))}
            
            {/* Elevator Core */}
            <rect x="350" y="450" width="100" height="100" strokeWidth="2" strokeDasharray="4 4" />
            <line x1="350" y1="450" x2="450" y2="550" />
            <line x1="450" y1="450" x2="350" y2="550" />

            {/* Micro Details */}
            <circle cx="400" cy="425" r="15" strokeDasharray="2 2" />
            <path d="M 150 400 A 20 20 0 0 1 170 420" />
            <path d="M 650 450 A 20 20 0 0 0 630 430" />
            
            {/* Text Labels */}
            <text x="180" y="250" fill="rgba(99,120,255,0.15)" fontSize="10" fontFamily="monospace" letterSpacing="4">CONFERENCE A</text>
            <text x="570" y="180" fill="rgba(99,120,255,0.15)" fontSize="10" fontFamily="monospace" letterSpacing="4">EXECUTIVE SUITE</text>
            <text x="140" y="580" fill="rgba(99,120,255,0.15)" fontSize="8" fontFamily="monospace" transform="rotate(-90 140 580)">RM 401</text>
            <text x="236" y="580" fill="rgba(99,120,255,0.15)" fontSize="8" fontFamily="monospace" transform="rotate(-90 236 580)">RM 402</text>
            <text x="332" y="580" fill="rgba(99,120,255,0.15)" fontSize="8" fontFamily="monospace" transform="rotate(-90 332 580)">RM 403</text>
          </g>
        </svg>
      </div>

    </div>
  );
}

const s = {
  page: { 
    position: 'relative', zIndex: 1, display: 'flex', minHeight: '100vh', width: '100%' 
  },
  leftPane: { 
    flex: '0 0 45%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', position: 'relative' 
  },
  topBranding: { 
    display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '40px', width: '100%', maxWidth: '380px' 
  },
  logoMark: { 
    color: 'var(--system)', fontSize: '14px', letterSpacing: '4px', marginBottom: '8px' 
  },
  logoText: { 
    fontSize: '72px', color: 'var(--text-primary)', letterSpacing: '12px', lineHeight: 1, margin: 0 
  },
  divider: { 
    height: '1px', width: '100%', background: 'var(--border-mid)', margin: '16px 0 12px 0' 
  },
  subtitle: { 
    fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '3px', margin: 0 
  },
  choiceCard: {
    background: 'var(--bg-glass)', backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid var(--border-dim)', borderRadius: '16px', padding: '32px',
    width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column'
  },
  choiceLabel: {
    fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '3px', marginBottom: '20px', textAlign: 'left'
  },
  btn: {
    height: '80px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '10px',
    cursor: 'pointer', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '20px',
    transition: 'all var(--normal) var(--ease-out)', width: '100%', textAlign: 'left', outline: 'none'
  },
  btnHover: {
    borderColor: 'var(--border-glow)', background: 'var(--blue-dim)', transform: 'translateX(4px)'
  },
  btnHoverStaff: {
    borderColor: 'var(--red-glow)', background: 'var(--red-dim)', transform: 'translateX(4px)'
  },
  iconBox: {
    width: '44px', height: '44px', background: 'var(--system-dim)', border: '1px solid var(--border-mid)',
    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'all var(--normal) var(--ease-out)'
  },
  iconBoxStaff: {
    width: '44px', height: '44px', background: 'var(--red-dim)', border: '1px solid var(--red-dim)',
    borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    transition: 'all var(--normal) var(--ease-out)'
  },
  iconBoxHoverGuest: {
    boxShadow: '0 0 12px var(--blue-glow)'
  },
  iconBoxHoverStaff: {
    boxShadow: '0 0 12px var(--red-glow)', borderColor: 'var(--red)'
  },
  btnContent: {
    flex: 1, display: 'flex', flexDirection: 'column'
  },
  btnTitle: {
    fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)'
  },
  btnSub: {
    fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px'
  },
  arrow: {
    color: 'var(--text-muted)', fontSize: '18px', transition: 'all var(--normal) var(--ease-out)'
  },
  arrowHover: {
    transform: 'translateX(6px)', color: 'var(--text-primary)'
  },
  orDivider: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0', gap: '12px'
  },
  orLine: {
    flex: 1, height: '1px', background: 'var(--border-void)'
  },
  orText: {
    fontSize: '8px', color: 'var(--text-muted)'
  },
  helpText: {
    fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px'
  },
  registerLink: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', color: 'var(--text-primary)', fontSize: '11px', letterSpacing: '2px', cursor: 'pointer', padding: '8px 16px', borderRadius: '6px', transition: 'all var(--fast)', outline: 'none'
  },
  bottomBar: {
    position: 'absolute', bottom: '24px', width: '100%', maxWidth: '380px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
  },
  rightPane: {
    flex: '0 0 55%', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  blueprint: {
    width: '150%', height: '150%', opacity: 0.8,
    animation: 'pan-svg 30s ease-in-out infinite alternate'
  }
};

// Add the pan animation via injected style since inline keyframes aren't standard
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    @keyframes pan-svg {
      0% { transform: translate(0px, 0px) scale(1); }
      100% { transform: translate(-30px, -20px) scale(1.05); }
    }
    @media (max-width: 768px) {
      .welcome-right-pane { display: none !important; }
      .welcome-left-pane { flex: 1 1 100% !important; }
    }
  `;
  document.head.appendChild(style);
  
  // Apply responsive classes
  s.rightPane.className = 'welcome-right-pane';
  s.leftPane.className = 'welcome-left-pane';
}
