import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API, useSocket } from '../hooks/useSocket';
import AlertCard from '../components/AlertCard';

export default function StaffPage() {
  const { user } = useAuth();
  const { socket, connected } = useSocket(user?.hotelId);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('All');
  
  const [totalGuests] = useState(142); // Hardcoded mock capacity
  const [safeGuests, setSafeGuests] = useState([]);
  
  const safeCount = safeGuests.length;
  // Calculate unique in-danger guests by active alerts
  const inDangerCount = new Set(alerts.filter(a => a.status !== 'resolved').map(a => a.guestId || a.id)).size;
  const unaccountedCount = Math.max(0, totalGuests - safeCount - inDangerCount);


  const fetchAlerts = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API}/api/alerts?hotelId=${user.hotelId}`);
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAlerts();
    if (!socket) return;
    
    const handleGuestSafe = (data) => {
      setSafeGuests(prev => {
        if (!prev.find(g => g.guestId === data.guestId)) return [...prev, data];
        return prev;
      });
    };

    socket.on('new_alert', fetchAlerts);
    socket.on('alert_updated', fetchAlerts);
    socket.on('guest_safe', handleGuestSafe);
    
    return () => { 
      socket.off('new_alert', fetchAlerts);
      socket.off('alert_updated', fetchAlerts); 
      socket.off('guest_safe', handleGuestSafe); 
    };
  }, [socket]);

  // Tab Title
  useEffect(() => {
    if (!connected) document.title = "⚠ Offline — Aura";
    else if (alerts.filter(a => a.status !== 'resolved').length > 0) document.title = `🔴 [${alerts.filter(a => a.status !== 'resolved').length}] Alert — Aura Command`;
    else document.title = "Aura · Monitoring";
  }, [alerts, connected]);

  const activeAlerts = alerts.filter(a => filter === 'All' || a.type === filter);
  const realActiveAlertsCount = alerts.filter(a => a.status !== 'resolved').length;
  const hasAlerts = activeAlerts.length > 0;
  
  // Dynamic Risk Score
  let riskScore = 12; // Base
  if (realActiveAlertsCount > 0) riskScore += 25 * realActiveAlertsCount;
  if (unaccountedCount > 0 && realActiveAlertsCount > 0) riskScore += Math.min(8 * unaccountedCount, 40);
  riskScore = Math.min(riskScore, 98); // Max cap
  const isElevated = riskScore > 12;

  return (
    <div style={s.page}>
      
      {/* FIXED NAVBAR */}
      <div style={s.navbar}>
        {/* Left Zone */}
        <div style={s.navLeft}>
          <span style={{ color: 'var(--system)', fontSize: '10px' }}>◆</span>
          <span className="font-display" style={{ fontSize: '20px', color: 'var(--text-primary)', letterSpacing: '4px' }}>AURA</span>
          <div style={s.navDivider} />
          <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px' }}>COMMAND CENTER</span>
          <div style={s.navDivider} />
          <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>GRAND AURA HOTEL · FLOOR 4</span>
        </div>

        {/* Center Zone */}
        <div style={s.navCenter}>
          <div style={s.statPill}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--text-muted)' }} />
            <span className="font-mono stat-num" style={{ color: 'var(--text-muted)' }}>142</span>
            <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '1px' }}>GUESTS</span>
          </div>
          <div style={s.statPill}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)', animation: safeCount > 0 ? 'blink 1s infinite' : 'none' }} />
            <span className="font-mono stat-num" style={{ color: 'var(--green)' }} key={safeCount}>{safeCount}</span>
            <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '1px' }}>SAFE</span>
          </div>
          <div style={s.statPill}>
            <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--red)', animation: alerts.length > 0 ? 'blink 1s infinite' : 'none' }} />
            <span className="font-mono stat-num" style={{ color: 'var(--red)' }} key={alerts.length}>{alerts.length}</span>
            <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '1px' }}>ALERTS</span>
          </div>
        </div>

        {/* Right Zone */}
        <div style={s.navRight}>
          <Clock />
          <div style={s.navDivider} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)', animation: 'blink 2s infinite' }} />
            <span className="font-mono" style={{ fontSize: '9px', color: connected ? 'var(--green)' : 'var(--red)' }}>
              {connected ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* MAIN 3-COLUMN LAYOUT */}
      <div style={s.mainLayout}>
        
        {/* LEFT COLUMN: CONTEXT */}
        <div style={s.leftCol}>
          <div className="font-mono" style={s.sectionLabel}>BUILDING STATUS</div>
          <div style={s.buildingStatus}>
            {['F5', 'F4', 'F3', 'F2', 'F1'].map((floor) => {
              const isAlert = alerts.some(a => a.location?.includes(floor));
              const isCurrent = floor === 'F4';
              return (
                <div key={floor} style={{...s.floorBar, ...(isAlert ? s.floorAlert : {}), ...(isCurrent && !isAlert ? s.floorCurrent : {})}}>
                  <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{floor}</span>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAlert ? 'var(--red)' : 'var(--green)', opacity: isAlert ? 1 : 0.4, animation: isAlert ? 'blink 1s infinite' : 'none' }} />
                </div>
              );
            })}
            <div className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', marginTop: '8px' }}>◉ ALERT  ○ CLEAR</div>
          </div>

          <div style={s.colDivider} />

          <div className="font-mono" style={s.sectionLabel}>ACTIVE STAFF</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '0 16px' }}>
            <StaffMember initials="AK" name="Aditya K." role="Security" status="amber" />
            <StaffMember initials="SR" name="Sarah R." role="Medical" status="green" />
            <StaffMember initials="MJ" name="Mark J." role="Manager" status="green" />
          </div>

          <div style={s.colDivider} />

          <div className="font-mono" style={s.sectionLabel}>QUICK SIMULATE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '0 16px' }}>
            <SimulateBtn icon="F" label="Fire Alert" color="var(--red)" onTrigger={() => simulateAlert('FIRE', 'Simulated fire reported')} />
            <SimulateBtn icon="M" label="Medical" color="var(--amber)" onTrigger={() => simulateAlert('MEDICAL', 'Simulated medical emergency')} />
            <SimulateBtn icon="S" label="Security" color="var(--blue)" onTrigger={() => simulateAlert('SECURITY', 'Simulated security threat')} />
          </div>
        </div>

        {/* CENTER COLUMN: FEED */}
        <div style={s.centerCol}>
          <div style={s.feedTopBar}>
            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '2px' }}>ACTIVE INCIDENTS</span>
            <div style={{ display: 'flex', gap: '12px' }}>
              {['All', 'FIRE', 'MEDICAL', 'SECURITY'].map(f => (
                <button key={f} onClick={() => setFilter(f)} className="font-mono filter-tab" style={{...s.filterTab, ...(filter === f ? s.filterTabActive : {})}}>
                  {f === 'All' ? 'All' : f.charAt(0) + f.substring(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={s.feedContent}>
            {!hasAlerts ? (
              <div style={s.emptyState}>
                <div style={s.radarContainer}>
                  <div style={{...s.radarRing, width: '120px', height: '120px', border: '1px solid var(--border-dim)'}} />
                  <div style={{...s.radarRing, width: '80px', height: '80px', border: '1px solid var(--border-void)'}} />
                  <div style={{...s.radarRing, width: '40px', height: '40px', border: '1px solid var(--border-void)'}} />
                  <div className="radar-sweep" style={s.radarSweep} />
                  <div className="radar-ping" style={s.radarPing} />
                </div>
                <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '20px' }}>Monitoring · No active incidents</div>
                <div className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', opacity: 0.5, marginTop: '4px' }}>System is live and scanning</div>
              </div>
            ) : (
              activeAlerts.map(alert => <AlertCard key={alert.id} alert={alert} staffName={user?.name} onResolve={fetchAlerts} />)
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: INTELLIGENCE */}
        <div style={s.rightCol}>
          {/* Headcount Panel built directly here to control animations */}
          <div style={s.panelCard}>
            <div className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '16px' }}>GUEST HEADCOUNT</div>
            
            <div style={s.donutContainer}>
              <div style={{...s.donutChart, '--safe-pct': totalGuests > 0 ? (safeCount / totalGuests) * 100 : 0}} />
              <div style={s.donutInner}>
                <div className="font-display" style={{ fontSize: '28px', color: 'var(--green)', lineHeight: 1 }}>{safeCount}</div>
                <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>/ {totalGuests}</div>
              </div>
            </div>

            <div style={s.statRow}>
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1px' }}>SAFE</span>
              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--green)' }}>{safeCount}</span>
            </div>
            <div style={s.statRow}>
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1px' }}>IN DANGER</span>
              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--red)' }}>{inDangerCount}</span>
            </div>
            <div style={s.statRow}>
              <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)', letterSpacing: '1px' }}>UNACCOUNTED</span>
              <span className="font-mono" style={{ fontSize: '16px', fontWeight: 500, color: 'var(--amber)' }}>{unaccountedCount}</span>
            </div>
            
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {/* Real safe guests list */}
              {safeGuests.slice(-5).reverse().map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', animation: 'slideInRight 0.4s ease' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)' }} />
                  <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-secondary)', flex: 1 }}>{g.guestId}</span>
                  <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)' }}>{g.location || 'Unknown'}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Prediction Panel */}
          <div style={s.panelCard}>
            <div className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '14px' }}>RISK INTELLIGENCE</div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>BUILDING RISK SCORE</span>
              <span className="font-mono" style={{ fontSize: '18px', fontWeight: 500, color: isElevated ? 'var(--amber)' : 'var(--green)', transition: 'color 600ms' }}>
                {riskScore}
              </span>
            </div>

            <div style={{ height: '8px', background: 'var(--bg-surface)', borderRadius: '4px', margin: '8px 0', position: 'relative' }}>
              <div style={{ height: '100%', borderRadius: '4px', background: isElevated ? 'var(--amber)' : 'var(--green)', width: `${riskScore}%`, transition: 'all 600ms ease-out', boxShadow: `0 0 8px ${isElevated ? 'var(--amber-glow)' : 'var(--green-glow)'}` }} />
            </div>

            <div style={{ background: isElevated ? 'var(--amber-dim)' : 'var(--green-dim)', border: `1px solid ${isElevated ? 'var(--amber)' : 'var(--green)'}`, borderRadius: '20px', padding: '3px 10px', display: 'inline-block', marginTop: '4px' }}>
              <span className="font-mono" style={{ fontSize: '9px', color: isElevated ? 'var(--amber)' : 'var(--green)' }}>{isElevated ? 'ELEVATED' : 'LOW RISK'}</span>
            </div>

            {isElevated && (
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {realActiveAlertsCount > 0 && <div className="font-mono slide-in-delay-1" style={{ fontSize: '8px', color: 'var(--text-muted)', padding: '4px 0' }}>▸ Active incident detected · +{25 * realActiveAlertsCount}pts</div>}
                {unaccountedCount > 0 && <div className="font-mono slide-in-delay-2" style={{ fontSize: '8px', color: 'var(--text-muted)', padding: '4px 0' }}>▸ Unaccounted guests in sector · +{Math.min(8 * unaccountedCount, 40)}pts</div>}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );

  async function simulateAlert(type, message) {
    if(!user) return;
    await fetch(`${API}/api/alerts/report`, { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ emergencyType: type, rawMessage: message, location: 'Room 405', guestId: 'G-SIM', hotelId: user.hotelId }) });
  }
}

function StaffMember({ initials, name, role, status }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 0' }}>
      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid var(--border-mid)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>{initials}</span>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <span className="font-body" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>{name}</span>
        <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{role}</span>
      </div>
      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: `var(--${status})` }} />
    </div>
  );
}

function SimulateBtn({ icon, label, color, onTrigger }) {
  return (
    <button className="font-mono sim-btn" onClick={onTrigger} style={{ width: '100%', height: '32px', background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', cursor: 'pointer', transition: 'all var(--fast)', color: 'var(--text-secondary)', '--hover-color': color, '--hover-border': color, outline: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', border: '1px solid currentColor', borderRadius: '2px', fontSize: '10px' }}>{icon}</div>
      <span style={{ fontSize: '10px' }}>{label}</span>
    </button>
  );
}

function Clock() {
  const [time, setTime] = useState(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  return <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)', letterSpacing: '2px' }}>{time}</span>;
}

const s = {
  page: { position: 'relative', zIndex: 1, height: '100vh', width: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  navbar: { width: '100%', height: '58px', background: 'rgba(9,12,20,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border-void)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 100 },
  navLeft: { display: 'flex', alignItems: 'center', gap: '16px' },
  navDivider: { width: '1px', height: '24px', background: 'var(--border-dim)' },
  navCenter: { display: 'flex', alignItems: 'center', gap: '12px' },
  statPill: { background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '20px', padding: '4px 16px', display: 'flex', alignItems: 'center', gap: '8px' },
  navRight: { display: 'flex', alignItems: 'center', gap: '16px' },
  mainLayout: { flex: 1, display: 'flex', width: '100%', overflow: 'hidden' },
  leftCol: { width: '260px', height: '100%', overflowY: 'auto', borderRight: '1px solid var(--border-void)', paddingBottom: '40px' },
  centerCol: { flex: 1, height: '100%', overflowY: 'auto', borderRight: '1px solid var(--border-void)', position: 'relative', display: 'flex', flexDirection: 'column' },
  rightCol: { width: '300px', height: '100%', overflowY: 'auto', padding: '20px' },
  sectionLabel: { fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '2px', padding: '20px 16px 10px' },
  buildingStatus: { padding: '0 16px', display: 'flex', flexDirection: 'column', gap: '8px' },
  floorBar: { background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '4px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px', transition: 'all 300ms' },
  floorCurrent: { borderColor: 'var(--border-mid)' },
  floorAlert: { background: 'var(--red-dim)', borderColor: 'var(--red)' },
  colDivider: { width: '100%', height: '1px', background: 'var(--border-void)', margin: '16px 0' },
  feedTopBar: { position: 'sticky', top: 0, zIndex: 10, background: 'rgba(6,8,16,0.95)', backdropFilter: 'blur(10px)', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-void)' },
  filterTab: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '9px', cursor: 'pointer', paddingBottom: '4px', borderBottom: '2px solid transparent', transition: 'all var(--fast)' },
  filterTabActive: { color: 'var(--text-primary)', borderBottomColor: 'var(--system)' },
  feedContent: { padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' },
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px' },
  radarContainer: { position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  radarRing: { position: 'absolute', borderRadius: '50%' },
  radarSweep: { position: 'absolute', left: '50%', top: '50%', width: '60px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--system) 60%, rgba(99,120,255,0.6))', transformOrigin: 'left center', animation: 'rotate 4s linear infinite' },
  radarPing: { position: 'absolute', width: '6px', height: '6px', background: 'var(--system)', borderRadius: '50%', top: '30px', right: '30px', animation: 'radar-ping 4s linear infinite', animationDelay: '1s' },
  panelCard: { background: 'var(--bg-elevated)', border: '1px solid var(--border-dim)', borderRadius: '14px', padding: '20px', marginBottom: '12px' },
  donutContainer: { width: '100px', height: '100px', position: 'relative', margin: '0 auto 16px' },
  donutChart: { position: 'absolute', inset: 0, borderRadius: '50%', background: 'conic-gradient(var(--green) 0deg, var(--green) calc(var(--safe-pct) * 3.6deg), var(--border-dim) calc(var(--safe-pct) * 3.6deg), var(--border-dim) 360deg)', transition: 'background 1s ease-out' },
  donutInner: { position: 'absolute', inset: '14px', background: 'var(--bg-elevated)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  statRow: { display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-void)' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .stat-num { animation: number-pop 0.3s ease-out; }
    .sim-btn:hover { border-color: var(--hover-border) !important; color: var(--hover-color) !important; }
    .slide-in-delay-1 { animation: slideInRight 0.4s ease 0.1s backwards; }
    .slide-in-delay-2 { animation: slideInRight 0.4s ease 0.2s backwards; }
    @keyframes slideInRight { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
  `;
  document.head.appendChild(style);
}
