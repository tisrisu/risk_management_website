import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../hooks/useSocket';

export default function GuestLogin() {
  const [searchParams] = useSearchParams();
  const [hotelId, setHotelId] = useState(searchParams.get('hotel') || '');
  const [room, setRoom] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const { loginGuest } = useAuth();
  
  useEffect(() => { document.title = "Aura · Guest Check-in"; }, []);

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    if (room.length < 3) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API}/api/auth/guest`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ hotelId: hotelId.toLowerCase(), name: name || 'Guest', room }) 
      });
      const data = await res.json();
      if (data.success) { 
        loginGuest({ 
          guestId: data.guestId, name: data.name, room: data.room, 
          token: data.token, hotelId: data.hotelId, hotelName: data.hotelName, 
          mapBase64: data.mapBase64 
        }); 
        navigate('/guest'); 
      } else { 
        setError(data.message || 'Check-in failed'); 
      }
    } catch (err) { 
      setError('Cannot connect to command server'); 
    }
    setLoading(false);
  };

  const isValid = room.length >= 3 && hotelId.length > 2;

  return (
    <div style={s.page}>
      
      {/* Top Branding */}
      <div style={s.header}>
        <div style={s.logoMark}>◆</div>
        <h1 className="font-display" style={s.logoText}>AURA</h1>
        <p className="font-mono" style={s.subtitle}>GUEST CHECK-IN</p>
      </div>

      <div style={s.content}>
        {error && <div className="font-mono" style={s.error}>{error}</div>}

        <form onSubmit={handleFinalSubmit} style={s.formCard}>
          
          <div style={{ marginBottom: '32px' }}>
            <h2 className="font-display" style={s.title}>Property ID</h2>
            <p className="font-body" style={s.subtext}>Enter the unique ID for this hotel.</p>
            <input 
              type="text" 
              className="font-mono standard-input" 
              style={{...s.standardInput, textTransform: 'lowercase'}}
              placeholder="e.g. ritz-123" 
              value={hotelId} 
              onChange={e => setHotelId(e.target.value.replace(/\s+/g, '-').toLowerCase())} 
              required
              autoFocus={!hotelId}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 className="font-display" style={s.title}>Which room are you in?</h2>
            <p className="font-body" style={s.subtext}>This links your device to your room for emergency routing.</p>
            
            <div style={s.giantInputWrapper}>
              <input 
                type="text" 
                autoFocus={!!hotelId}
                required
                className="font-display giant-input" 
                style={{...s.giantInput, borderBottomColor: room.length >= 3 ? 'var(--green)' : 'var(--border-mid)'}}
                placeholder="402" 
                value={room} 
                onChange={e => setRoom(e.target.value.replace(/[^0-9A-Za-z-]/g, '').substring(0, 5))} 
              />
              {room.length >= 3 && <span style={s.checkMark}>✓</span>}
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <h2 className="font-display" style={s.title}>What should we call you?</h2>
            <p className="font-body" style={s.subtext}>Optional. Used only to identify you on the safety dashboard.</p>
            
            <input 
              type="text" 
              className="font-body standard-input" 
              style={s.standardInput}
              placeholder="e.g. Alex" 
              value={name} 
              onChange={e => setName(e.target.value)} 
            />
          </div>

          <button 
            type="submit" 
            disabled={!isValid || loading}
            className="font-mono enter-btn" 
            style={{...s.enterBtn, opacity: isValid && !loading ? 1 : 0.5}}
          >
            {loading ? 'AUTHENTICATING...' : 'ENTER AURA'}
          </button>
        </form>

        <div className="font-mono" style={s.infoText}>
          ◆ Your data is never stored beyond this session
        </div>

      </div>
    </div>
  );
}

const s = {
  page: { 
    position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center', width: '100%', maxWidth: '480px', margin: '0 auto', padding: '40px 24px'
  },
  header: { 
    textAlign: 'center', marginBottom: '32px' 
  },
  logoMark: { color: 'var(--system)', fontSize: '12px', marginBottom: '8px' },
  logoText: { fontSize: '48px', color: 'var(--text-primary)', letterSpacing: '8px', lineHeight: 1 },
  subtitle: { fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '3px', marginTop: '8px' },
  content: {
    width: '100%', display: 'flex', flexDirection: 'column'
  },
  formCard: {
    background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-mid)',
    borderRadius: '20px', padding: '40px 32px', width: '100%'
  },
  title: {
    fontSize: '32px', color: 'var(--text-primary)', lineHeight: 1.1, margin: '0 0 6px 0'
  },
  subtext: {
    fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px'
  },
  giantInputWrapper: {
    position: 'relative', width: '100%'
  },
  giantInput: {
    fontSize: '64px', textAlign: 'center', color: 'var(--system)', background: 'transparent',
    border: 'none', borderBottom: '2px solid var(--border-mid)', padding: '0 0 12px 0',
    width: '100%', letterSpacing: '12px', outline: 'none', transition: 'border-color var(--fast)'
  },
  checkMark: {
    position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
    color: 'var(--green)', fontSize: '24px', animation: 'fadeUp 0.3s ease-out'
  },
  standardInput: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '8px',
    padding: '16px 20px', fontSize: '16px', color: 'var(--text-primary)', width: '100%',
    outline: 'none', transition: 'all var(--fast)'
  },
  enterBtn: {
    width: '100%', height: '56px', background: 'linear-gradient(135deg, var(--system), #4D7CFF)',
    color: 'white', fontSize: '13px', letterSpacing: '3px', borderRadius: '10px', border: 'none',
    cursor: 'pointer', boxShadow: '0 4px 24px var(--system-glow)', transition: 'all var(--fast)'
  },
  error: {
    background: 'var(--red-dim)', color: 'var(--red)', padding: '12px', borderRadius: '8px',
    fontSize: '11px', border: '1px solid var(--red-glow)', marginBottom: '16px', textAlign: 'center'
  },
  infoText: {
    fontSize: '9px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '24px', letterSpacing: '0.5px'
  }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .giant-input:focus {
      border-bottom-color: var(--system) !important;
      box-shadow: 0 2px 20px var(--system-glow) !important;
    }
    .giant-input::placeholder {
      color: var(--border-mid);
    }
    .standard-input:focus {
      border-color: var(--border-glow) !important;
      box-shadow: 0 0 0 3px var(--system-dim) !important;
    }
    .enter-btn:hover:not(:disabled) {
      box-shadow: 0 8px 32px var(--system-glow) !important;
      transform: translateY(-2px);
    }
    .enter-btn:active:not(:disabled) {
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);
}
