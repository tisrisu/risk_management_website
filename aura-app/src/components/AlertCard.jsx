import { useState, useEffect } from 'react';
import { API } from '../hooks/useSocket';

export default function AlertCard({ alert, staffName, onResolve }) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [fadeAway, setFadeAway] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  const [evacPlan, setEvacPlan] = useState('');
  const [loadingEvac, setLoadingEvac] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);

  // Dead man switch timer
  useEffect(() => {
    if (alert.dispatchedTo && alert.lastPingTime) {
      const updateTimer = () => {
        const diffMs = Date.now() - new Date(alert.lastPingTime).getTime();
        setTimeLeft(Math.max(0, 90 - Math.floor(diffMs / 1000)));
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [alert.dispatchedTo, alert.lastPingTime]);

  // Calculate "2m ago" relative time
  useEffect(() => {
    const updateTime = () => {
      const diffMs = Date.now() - new Date(alert.timestamp).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) setTimeAgo('Just now');
      else if (diffMins < 60) setTimeAgo(`${diffMins}m ago`);
      else setTimeAgo(`${Math.floor(diffMins/60)}h ago`);
    };
    updateTime();
    const timer = setInterval(updateTime, 60000);
    return () => clearInterval(timer);
  }, [alert.timestamp]);

  const handleAcknowledge = async () => {
    try {
      await fetch(`${API}/api/resolve-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alert.id, staffName: staffName || 'Staff' })
      });
      setFadeAway(true);
      setTimeout(() => setAcknowledged(true), 200);
      onResolve();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDispatch = async () => {
    try {
      await fetch(`${API}/api/alerts/dispatch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alert.id, staffName: staffName || 'Staff' })
      });
      onResolve();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePing = async () => {
    try {
      await fetch(`${API}/api/alerts/ping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alert.id, staffName: staffName || 'Staff' })
      });
      onResolve();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAIEvacuation = async () => {
    setLoadingEvac(true);
    try {
      const res = await fetch(`${API}/api/intelligence/evacuation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: alert.hotelId, incidentDetails: `${alert.type} at ${alert.location}: ${alert.message || ''}` })
      });
      const data = await res.json();
      if (data.success) {
        setEvacPlan(data.instruction);
      }
    } catch (e) {
      console.error(e);
    }
    setLoadingEvac(false);
  };

  const handleBroadcast = async () => {
    try {
      await fetch(`${API}/api/alerts/mass-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hotelId: alert.hotelId, message: evacPlan, severity: 'critical' })
      });
      alert('Broadcast transmitted to all guests in the building.');
    } catch (e) {
      console.error(e);
    }
  };

  const isSilent = alert.type === 'SECURITY (SILENT)' || alert.isSilent;
  const isCritical = alert.isSevere;
  const isUnresponsive = alert.unresponsive || (alert.dispatchedTo && alert.lastPingTime && timeLeft === 0);
  const colorVar = `var(--${alert.type === 'FIRE' ? 'red' : alert.type === 'MEDICAL' ? 'amber' : alert.type === 'SECURITY' ? 'blue' : 'purple'})`;
  const dimVar = `var(--${alert.type === 'FIRE' ? 'red' : alert.type === 'MEDICAL' ? 'amber' : alert.type === 'SECURITY' ? 'blue' : 'purple'}-dim)`;

  if (isSilent) {
    return (
      <div style={s.silentCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
          <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--purple)' }} />
          <span className="font-mono" style={{ fontSize: '8px', color: 'var(--purple)', letterSpacing: '2px' }}>WELFARE CHECK</span>
        </div>
        <div className="font-body" style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          Silent alert triggered in {alert.location}. Please conduct a discreet welfare check.
        </div>
        {!acknowledged && (
          <button onClick={handleAcknowledge} style={{...s.ackBtn, marginTop: '12px'}}>
            Acknowledge
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="alert-card-entrance" style={{
      ...s.card, 
      ...(isCritical && !acknowledged ? s.criticalCard : {}),
      ...(isUnresponsive && !acknowledged ? s.unresponsiveCard : {}),
      ...(acknowledged ? s.ackedCard : {})
    }}>
      {isCritical && !acknowledged && <div className="shimmer-sweep" style={{ animationDuration: '3s', animationDelay: '5s' }} />}
      
      {/* Top Row */}
      <div style={s.topRow}>
        <div style={{...s.badgePill, background: dimVar, borderColor: colorVar}}>
          {isCritical && !acknowledged && <div className="badge-breathe" style={{ position: 'absolute', inset: 0, borderRadius: '20px' }} />}
          <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold', color: colorVar }}>LEVEL {isCritical ? '5' : '3'}</span>
          <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold', color: colorVar }}>·</span>
          <span className="font-mono" style={{ fontSize: '9px', fontWeight: 'bold', color: colorVar }}>{alert.type}</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
            {new Date(alert.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} ({timeAgo})
          </span>
          <div style={{ width: '1px', height: '10px', background: 'var(--border-dim)' }} />
          <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>{alert.location || 'Unknown Area'}</span>
        </div>
      </div>

      <div style={s.divider} />

      {/* Body */}
      <div>
        <div className="font-mono" style={{ fontSize: '7.5px', color: 'var(--text-muted)', letterSpacing: '2px', marginBottom: '6px' }}>
          TRANSLATED SUMMARY
        </div>
        <div className="font-body" style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.65 }}>
          {alert.aiSummary || alert.rawMessage}
          {alert.language && alert.language !== 'en' && (
            <span className="font-mono" style={s.transBadge}>
              {alert.language.toUpperCase()} → EN
            </span>
          )}
        </div>
      </div>

      {/* Staff Instruction */}
      {!acknowledged && alert.staffInstruction && (
        <div style={s.instructionBox}>
          <div className="font-mono" style={{ fontSize: '7.5px', color: 'var(--amber)', letterSpacing: '2px', marginBottom: '4px' }}>STAFF ACTION</div>
          <div className="font-body" style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {alert.staffInstruction}
          </div>
        </div>
      )}

      {/* AI Evacuation Plan */}
      {evacPlan && (
        <div style={{ marginTop: '12px', background: 'var(--blue-dim)', borderLeft: '2px solid var(--blue)', padding: '10px 14px', borderRadius: '0 8px 8px 0' }}>
          <div className="font-mono" style={{ fontSize: '7.5px', color: 'var(--blue)', letterSpacing: '2px', marginBottom: '4px' }}>AI EVACUATION PLAN</div>
          <div className="font-body" style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {evacPlan}
          </div>
          <button 
            className="font-mono hover-link" 
            onClick={handleBroadcast}
            style={{ background: 'transparent', border: '1px solid var(--blue)', borderRadius: '6px', fontSize: '9px', color: 'var(--blue)', padding: '6px 12px', marginTop: '10px', cursor: 'pointer' }}
          >
            BROADCAST TO ALL GUESTS
          </button>
        </div>
      )}

      {/* Bottom Row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ height: '28px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {!acknowledged ? (
            <button 
              className="font-mono ack-btn" 
              onClick={handleAcknowledge}
              style={{...s.ackBtn, ...(fadeAway ? s.ackBtnFade : {})}}
            >
              Resolve
            </button>
          ) : (
            <div className="font-mono fade-in-text" style={{ fontSize: '10px', color: 'var(--green)' }}>✓ Resolved</div>
          )}

          {!acknowledged && !alert.dispatchedTo && (
            <button 
              className="font-mono ack-btn" 
              onClick={handleDispatch}
              style={{...s.ackBtn, borderColor: 'var(--amber)', color: 'var(--amber)'}}
            >
              Dispatch Me
            </button>
          )}

          {!acknowledged && isUnresponsive && (
            <div className="font-mono" style={{ color: 'var(--red)', fontSize: '10px', padding: '6px 12px', background: 'var(--red-dim)', border: '1px solid var(--red)', borderRadius: '6px', fontWeight: 'bold' }}>
              STAFF INACTIVE — SEND BACKUP
            </div>
          )}

          {!acknowledged && alert.dispatchedTo === staffName && !isUnresponsive && (
            <button 
              className="font-mono ack-btn" 
              onClick={handlePing}
              style={{...s.ackBtn, background: timeLeft < 15 ? 'var(--red-dim)' : 'var(--amber-dim)', borderColor: timeLeft < 15 ? 'var(--red)' : 'var(--amber)', color: timeLeft < 15 ? 'var(--red)' : 'var(--amber)'}}
            >
              PING OK ({timeLeft}s)
            </button>
          )}

          {!acknowledged && alert.dispatchedTo && alert.dispatchedTo !== staffName && !isUnresponsive && (
            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              Dispatched: {alert.dispatchedTo}
            </span>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {!evacPlan && (
            <button 
              className="font-mono hover-link" 
              onClick={handleAIEvacuation}
              disabled={loadingEvac}
              style={{ background: 'transparent', border: 'none', fontSize: '9px', color: 'var(--blue)', cursor: loadingEvac ? 'not-allowed' : 'pointer', opacity: loadingEvac ? 0.5 : 1 }}
            >
              {loadingEvac ? 'Generating...' : 'AI Evac Plan ✨'}
            </button>
          )}
          <span className="font-mono hover-link" style={{ fontSize: '9px', color: 'var(--text-muted)', cursor: 'pointer' }}>
            View on map →
          </span>
        </div>
      </div>
    </div>
  );
}

const s = {
  card: { position: 'relative', overflow: 'hidden', background: 'var(--bg-elevated)', borderRadius: '14px', border: '1px solid var(--border-dim)', padding: '18px', marginBottom: '12px', transition: 'all 300ms ease' },
  criticalCard: { borderColor: 'var(--red)', boxShadow: '0 0 0 1px var(--red-dim), 0 8px 32px rgba(255,58,74,0.12)' },
  unresponsiveCard: { borderColor: 'var(--red)', boxShadow: '0 0 0 2px var(--red)', animation: 'cardFlash 1.5s ease-in-out infinite' },
  ackedCard: { opacity: 0.65, borderColor: 'var(--border-dim)', boxShadow: 'none' },
  topRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  badgePill: { position: 'relative', border: '1px solid', borderRadius: '20px', padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '6px' },
  divider: { width: '100%', height: '1px', background: 'var(--border-void)', margin: '12px 0' },
  transBadge: { background: 'var(--purple-dim)', border: '1px solid var(--purple)', borderRadius: '4px', padding: '1px 6px', color: 'var(--purple)', fontSize: '8px', marginLeft: '8px', display: 'inline-block', verticalAlign: 'middle' },
  instructionBox: { marginTop: '12px', background: 'var(--bg-surface)', borderLeft: '2px solid var(--amber)', borderRadius: '0 8px 8px 0', padding: '10px 14px' },
  ackBtn: { background: 'transparent', border: '1px solid var(--border-mid)', borderRadius: '6px', padding: '6px 16px', color: 'var(--text-muted)', fontSize: '10px', letterSpacing: '1.5px', cursor: 'pointer', transition: 'all var(--fast)', outline: 'none' },
  ackBtnFade: { opacity: 0, transform: 'scale(0.8)' },
  silentCard: { background: 'var(--bg-surface)', border: '1px solid var(--purple)', borderRadius: '12px', padding: '14px 18px', marginBottom: '12px' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .alert-card-entrance { animation: cardEntrance 400ms var(--ease-out) backwards; }
    @keyframes cardEntrance { from { opacity: 0; transform: translateY(-16px) scale(0.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
    @keyframes cardFlash { 0% { box-shadow: 0 0 0 2px var(--red), 0 8px 32px rgba(255,58,74,0.12); } 50% { box-shadow: 0 0 0 6px rgba(255,58,74,0.4), 0 8px 32px rgba(255,58,74,0.3); } 100% { box-shadow: 0 0 0 2px var(--red), 0 8px 32px rgba(255,58,74,0.12); } }
    .ack-btn:hover { border-color: var(--green) !important; color: var(--green) !important; background: var(--green-dim) !important; }
    .badge-breathe { animation: badge-breathe 2s ease-in-out infinite; }
    .fade-in-text { animation: fadeIn 300ms ease-out forwards; }
    .hover-link:hover { color: var(--blue) !important; }
  `;
  document.head.appendChild(style);
}
