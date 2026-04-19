import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API } from '../hooks/useSocket';
export default function StaffLogin() {
  const [hotelId, setHotelId] = useState('');
  const [staffName, setStaffName] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { loginStaff } = useAuth();

  useEffect(() => { document.title = "Aura · Staff Access Portal"; }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const res = await fetch(`${API}/api/auth/staff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: hotelId.toLowerCase(), passcode: accessCode, staffName: staffName || 'Officer' })
      });
      const data = await res.json();
      
      if (data.success) {
        loginStaff({
          id: staffName || 'STAFF-001',
          name: staffName || 'Officer',
          hotelId: data.hotelId,
          hotelName: data.hotelName,
          token: data.token
        });
        navigate('/staff');
      } else {
        alert(data.message || 'Invalid Access Code or Property ID');
      }
    } catch (err) {
      alert('Cannot connect to server');
    }
    setLoading(false);
  };

  return (
    <div style={s.page}>
      
      {/* Scanning Laser Line Background Layer */}
      <div style={s.scanLine} />

      <div style={s.centerCard}>
        
        {/* Top of card */}
        <div style={s.header}>
          <div style={s.logoMark}>◆</div>
          <h1 className="font-display" style={s.logoText}>AURA</h1>
          <p className="font-mono" style={s.subtitle}>STAFF ACCESS PORTAL</p>
        </div>

        <div style={s.divider} />

        {/* Form fields */}
        <form onSubmit={handleLogin} style={{ width: '100%' }}>
          
          <div style={{ marginBottom: '20px' }}>
            <label className="font-mono" style={s.label}>PROPERTY ID</label>
            <input 
              type="text"
              required
              className="font-mono staff-input"
              style={{...s.input, textTransform: 'lowercase'}}
              placeholder="e.g. ritz-123"
              value={hotelId}
              onChange={e => setHotelId(e.target.value.replace(/\s+/g, '-').toLowerCase())}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="font-mono" style={s.label}>STAFF NAME OR ID</label>
            <input 
              type="text"
              className="font-mono staff-input"
              style={s.input}
              placeholder="e.g. John Doe / Security-01"
              value={staffName}
              onChange={e => setStaffName(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label className="font-mono" style={s.label}>ACCESS CODE</label>
            <div style={{ position: 'relative' }}>
              <input 
                type={showPassword ? "text" : "password"}
                required
                className="font-mono staff-input"
                style={s.input}
                placeholder="••••••••"
                value={accessCode}
                onChange={e => setAccessCode(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                style={s.eyeToggle}
              >
                {showPassword ? '👁' : '◎'}
              </button>
            </div>
          </div>

          {/* Remember this device toggle */}
          <div style={s.toggleRow} onClick={() => setRemember(!remember)}>
            <div style={{...s.toggleTrack, background: remember ? 'var(--system)' : 'var(--bg-deep)'}}>
              <div style={{...s.toggleKnob, transform: remember ? 'translateX(18px)' : 'translateX(0)'}} />
            </div>
            <span className="font-body" style={s.toggleLabel}>Remember this device</span>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="font-mono staff-btn" 
            style={s.submitBtn}
            disabled={loading}
          >
            <div className="shimmer-sweep" />
            {loading ? (
              <div style={s.spinner} />
            ) : (
              'ACCESS SYSTEM'
            )}
          </button>
        </form>

        <button onClick={() => navigate('/guest/login')} className="font-mono" style={s.guestLink}>
          Guest? →
        </button>

      </div>
    </div>
  );
}

const s = {
  page: { position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' },
  scanLine: { position: 'fixed', left: 0, width: '100%', height: '2px', background: 'linear-gradient(90deg, transparent 0%, var(--system) 40%, rgba(99,120,255,0.8) 50%, var(--system) 60%, transparent 100%)', pointerEvents: 'none', animation: 'scan-down 8s linear infinite' },
  centerCard: { width: '420px', background: 'var(--bg-glass)', backdropFilter: 'blur(24px) saturate(160%)', border: '1px solid var(--border-dim)', borderRadius: '20px', padding: '48px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 },
  header: { textAlign: 'center', width: '100%' },
  logoMark: { color: 'var(--system)', fontSize: '12px', marginBottom: '8px' },
  logoText: { fontSize: '48px', color: 'var(--text-primary)', letterSpacing: '8px', lineHeight: 1 },
  subtitle: { fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '3px', marginTop: '4px' },
  divider: { width: '100%', height: '1px', background: 'var(--border-dim)', margin: '28px 0' },
  label: { display: 'block', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' },
  input: { width: '100%', height: '48px', background: 'var(--bg-deep)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '0 16px', fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '2px', outline: 'none', transition: 'all var(--fast)' },
  eyeToggle: { position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '14px', outline: 'none' },
  toggleRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '16px', cursor: 'pointer' },
  toggleTrack: { width: '40px', height: '22px', borderRadius: '11px', transition: 'background 200ms', display: 'flex', alignItems: 'center', padding: '2px' },
  toggleKnob: { width: '16px', height: '16px', background: 'white', borderRadius: '50%', transition: 'transform 200ms var(--ease-out)' },
  toggleLabel: { fontSize: '13px', color: 'var(--text-secondary)' },
  submitBtn: { width: '100%', height: '52px', background: 'linear-gradient(135deg, #4D7CFF, var(--system))', border: 'none', borderRadius: '10px', color: 'white', fontSize: '12px', letterSpacing: '3px', cursor: 'pointer', position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px var(--system-glow)', marginTop: '28px', transition: 'all var(--fast)', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' },
  spinner: { width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'rotate 1s linear infinite' },
  guestLink: { marginTop: '32px', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '10px', cursor: 'pointer', textDecoration: 'none', transition: 'color var(--fast)' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .staff-input:focus { border-color: var(--border-glow) !important; box-shadow: 0 0 0 3px var(--system-dim), inset 0 1px 0 rgba(99,120,255,0.1) !important; }
    .staff-input::placeholder { color: var(--text-muted); }
    .staff-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px var(--system-glow) !important; }
    .staff-btn:active { transform: translateY(0) scale(0.99); }
    .staff-btn:disabled { opacity: 0.8; }
    .shimmer-sweep { position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%); transform: translateX(-100%); transition: transform 500ms; pointer-events: none; }
    .staff-btn:hover .shimmer-sweep { transform: translateX(100%); }
    .guest-link:hover { color: var(--text-secondary); text-decoration: underline; }
  `;
  document.head.appendChild(style);
  s.guestLink.className += " guest-link";
}
