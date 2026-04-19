import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API } from '../hooks/useSocket';

export default function HotelRegistration() {
  const [hotelId, setHotelId] = useState('');
  const [name, setName] = useState('');
  const [passcode, setPasscode] = useState('');
  const [mapBase64, setMapBase64] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { document.title = "Aura · Register Property"; }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError('Map file must be smaller than 5MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      setMapBase64(reader.result);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!hotelId || !name || !passcode || !mapBase64) { 
      setError('Please complete all fields and upload a floorplan.'); 
      return; 
    }
    setLoading(true); 
    setError('');
    
    try {
      const res = await fetch(`${API}/api/hotels/register`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ hotelId, name, passcode, mapBase64 }) 
      });
      const data = await res.json();
      
      if (data.success) { 
        setSuccess(true); 
        setTimeout(() => navigate('/staff/login'), 2000); 
      } else { 
        setError(data.message || 'Registration failed'); 
      }
    } catch (err) { 
      console.error(err);
      setError('Cannot connect to server. Ensure backend is running.'); 
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div style={s.page}>
        <div style={s.successCard}>
          <div style={s.checkCircle}>
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <path d="M10 20 L18 28 L32 12" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'strokeDraw 0.6s ease forwards', strokeDasharray: 40, strokeDashoffset: 40 }} />
            </svg>
          </div>
          <h2 className="font-display" style={{ fontSize: '36px', color: 'var(--green)', letterSpacing: '4px', margin: '20px 0 8px' }}>PROPERTY REGISTERED</h2>
          <p className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', letterSpacing: '2px' }}>
            System initialized. Redirecting to Staff Command...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={s.page}>
      <button style={s.backBtn} className="font-mono back-btn" onClick={() => navigate('/')}>← BACK</button>
      
      <div style={s.formCard}>
        <div style={s.header}>
          <div style={s.logoMark}>◆</div>
          <h2 className="font-display" style={s.title}>NEW PROPERTY</h2>
          <p className="font-mono" style={s.subtitle}>INITIALIZE AURA DEPLOYMENT</p>
        </div>

        <form onSubmit={handleRegister} style={{ width: '100%', marginTop: '32px' }}>
          {error && <div className="font-mono" style={s.error}>{error}</div>}
          
          <div style={{ marginBottom: '20px' }}>
            <label className="font-mono" style={s.label}>PROPERTY NAME</label>
            <input 
              style={s.input} 
              className="font-body standard-input" 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. The Ritz-Carlton" 
              autoFocus 
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label className="font-mono" style={s.label}>UNIQUE HOTEL ID</label>
            <input 
              style={{ ...s.input, textTransform: 'lowercase', fontFamily: 'var(--font-mono)' }} 
              className="font-mono standard-input" 
              type="text" 
              value={hotelId} 
              onChange={e => setHotelId(e.target.value.replace(/\s+/g, '-').toLowerCase())} 
              placeholder="e.g. ritz-123" 
            />
            <div className="font-mono" style={s.hint}>Guests will use this ID to connect.</div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label className="font-mono" style={s.label}>STAFF CLEARANCE CODE</label>
            <input 
              style={s.input} 
              className="font-mono standard-input" 
              type="password" 
              value={passcode} 
              onChange={e => setPasscode(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label className="font-mono" style={s.label}>HOTEL EVACUATION MAP</label>
            <div style={{ position: 'relative' }}>
              <input 
                className="font-mono file-input"
                style={s.fileInput} 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange} 
              />
            </div>
            {mapBase64 && <div className="font-mono" style={{ color: 'var(--green)', fontSize: '9px', marginTop: '8px', letterSpacing: '1px' }}>● Map loaded successfully</div>}
          </div>

          <button 
            type="submit" 
            style={s.btn} 
            className="font-mono enter-btn" 
            disabled={loading}
          >
            {loading ? 'INITIALIZING...' : 'DEPLOY AURA SYSTEM'}
          </button>
        </form>
      </div>
    </div>
  );
}

const s = {
  page: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', zIndex: 1, padding: '40px 24px' },
  backBtn: { position: 'absolute', top: '32px', left: '32px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '10px', letterSpacing: '2px', outline: 'none' },
  formCard: { background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', border: '1px solid var(--border-mid)', borderRadius: '20px', padding: '40px', width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' },
  successCard: { background: 'var(--bg-glass)', backdropFilter: 'blur(16px)', border: '1px solid var(--green)', borderRadius: '20px', padding: '60px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  checkCircle: { width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  header: { textAlign: 'center', width: '100%' },
  logoMark: { color: 'var(--system)', fontSize: '12px', marginBottom: '8px' },
  title: { fontSize: '36px', color: 'var(--text-primary)', letterSpacing: '4px', lineHeight: 1 },
  subtitle: { fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '3px', marginTop: '8px' },
  error: { color: 'var(--red)', fontSize: '10px', background: 'var(--red-dim)', padding: '12px', borderRadius: '8px', border: '1px solid var(--red)', marginBottom: '24px', textAlign: 'center', letterSpacing: '1px' },
  label: { display: 'block', fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '8px' },
  hint: { fontSize: '9px', color: 'var(--text-muted)', marginTop: '6px' },
  input: { width: '100%', height: '48px', background: 'var(--bg-deep)', border: '1px solid var(--border-dim)', borderRadius: '8px', padding: '0 16px', fontSize: '14px', color: 'var(--text-primary)', letterSpacing: '1px', outline: 'none', transition: 'all var(--fast)' },
  fileInput: { width: '100%', background: 'var(--bg-deep)', border: '1px dashed var(--border-mid)', borderRadius: '8px', padding: '12px', color: 'var(--text-muted)', fontSize: '11px', cursor: 'pointer', outline: 'none', transition: 'border-color var(--fast)' },
  btn: { width: '100%', height: '56px', background: 'linear-gradient(135deg, var(--green), #00C853)', border: 'none', borderRadius: '10px', color: 'var(--bg-void)', fontSize: '13px', fontWeight: 'bold', letterSpacing: '3px', cursor: 'pointer', boxShadow: '0 4px 20px var(--green-glow)', transition: 'all var(--fast)', display: 'flex', alignItems: 'center', justifyContent: 'center', outline: 'none' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .back-btn:hover { color: var(--text-primary) !important; }
    .file-input:hover { border-color: var(--border-glow) !important; }
  `;
  document.head.appendChild(style);
}
