import { useState, useRef } from 'react';
import { API } from '../hooks/useSocket';

export default function SilentWitness({ guestId, location, hotelId }) {
  const [taps, setTaps] = useState(0);
  const [success, setSuccess] = useState(false);
  const resetTimer = useRef(null);

  const handleTap = async (service) => {
    if (service === 'EXTRA TOWELS') {
      const newTaps = taps + 1;
      setTaps(newTaps);

      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setTaps(0), 8000); // 8 seconds window

      if (newTaps >= 3) {
        setTaps(0);
        clearTimeout(resetTimer.current);
        
        // Secret welfare check triggered
        try {
          await fetch(`${API}/api/alerts/silent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pattern: 'EXTRA TOWELS (3 taps)',
              location,
              guestId,
              hotelId
            })
          });
          setSuccess(true);
          setTimeout(() => setSuccess(false), 3000);
        } catch (e) {
          console.error('Silent alert failed');
        }
      }
    } else {
      // Normal hotel service behavior (mock)
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    }
  };

  const services = [
    { label: 'ROOM SERVICE', char: 'R' },
    { label: 'EXTRA TOWELS', char: 'T' },
    { label: 'HOUSEKEEPING', char: 'H' },
    { label: 'FRONT DESK', char: 'F' }
  ];

  return (
    <div style={{ width: '100%', marginTop: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        {services.map((svc) => (
          <button 
            key={svc.label}
            className="silent-btn"
            style={s.btn}
            onClick={() => handleTap(svc.label)}
          >
            <div className="font-body" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{svc.label}</div>
            <div className="font-mono" style={s.iconBox}>{svc.char}</div>
          </button>
        ))}
      </div>
      {success && (
        <div className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px' }}>
          Request received.
        </div>
      )}
    </div>
  );
}

const s = {
  btn: {
    background: 'var(--bg-surface)', border: '1px solid var(--border-void)', borderRadius: '8px',
    padding: '14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center',
    gap: '8px', transition: 'all 150ms', outline: 'none'
  },
  iconBox: {
    width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '10px', color: 'var(--text-muted)', border: '1px solid var(--border-dim)', borderRadius: '4px'
  }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .silent-btn:hover { border-color: var(--border-dim) !important; background: var(--bg-elevated) !important; }
    .silent-btn:active { background: var(--system-dim) !important; transition-duration: 0ms !important; }
  `;
  document.head.appendChild(style);
}
