import { useState } from 'react';

const RISK_LEVELS = {
  normal:   { score: 12, label: 'LOW RISK',      color: 'var(--green)',  factors: [] },
  elevated: { score: 58, label: 'ELEVATED',       color: 'var(--amber)',  factors: ['Multiple alerts in 10 min window', 'IoT sensor anomaly detected', 'Guest density above threshold'] },
  critical: { score: 89, label: 'CRITICAL RISK',  color: 'var(--red)',    factors: ['Active fire reported', 'Staff unresponsive', '3+ corroborating reports', 'Evacuation recommended'] },
};

export default function PredictionPanel({ alerts }) {
  const [riskMode, setRiskMode] = useState('normal');
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [activeBtn, setActiveBtn] = useState('normal');

  const hasCritical = alerts.some(a => a.type === 'FIRE' || a.type === 'MEDICAL');

  // If real critical alerts exist, override to elevated
  const effectiveMode = hasCritical && riskMode === 'normal' ? 'elevated' : riskMode;
  const risk = RISK_LEVELS[effectiveMode];
  const showWarning = (effectiveMode === 'elevated' || effectiveMode === 'critical') && !warningDismissed;

  const handleModeChange = (mode) => {
    setRiskMode(mode);
    setActiveBtn(mode);
    setWarningDismissed(false);
  };

  return (
    <div>
      {/* Warning Banner */}
      {showWarning && (
        <div style={{
          ...styles.warningBanner,
          animation: 'slideDown 0.3s ease',
          borderColor: effectiveMode === 'critical' ? 'var(--red)' : 'var(--amber)',
          background: effectiveMode === 'critical' ? 'var(--red-bg)' : 'var(--amber-bg)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: effectiveMode === 'critical' ? 'var(--red)' : 'var(--amber)',
                animation: 'blink 1.5s infinite',
              }} />
              <span className="mono" style={{
                fontSize: '9px',
                color: effectiveMode === 'critical' ? 'var(--red)' : 'var(--amber)',
                letterSpacing: '2px',
              }}>
                PRE-CRISIS WARNING
              </span>
            </div>
            <button
              onClick={() => setWarningDismissed(true)}
              style={styles.dismissBtn}
            >
              ×
            </button>
          </div>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {effectiveMode === 'critical'
              ? 'Critical risk threshold exceeded. Immediate evacuation assessment recommended.'
              : 'Risk indicators elevated. Monitor situation closely and prepare response protocols.'}
          </p>
          {/* Scanline effect */}
          <div style={styles.scanlineContainer}>
            <div style={styles.scanlineBar} />
          </div>
        </div>
      )}

      {/* Main Panel */}
      <div style={styles.panel}>
        <h3 className="mono" style={styles.title}>RISK INTELLIGENCE</h3>

        {/* Risk bar */}
        <div style={styles.barContainer}>
          <div style={styles.barTrack}>
            <div style={{
              ...styles.barFill,
              width: `${risk.score}%`,
              transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
            }} />
            {/* Position indicator dot */}
            <div style={{
              position: 'absolute',
              left: `${risk.score}%`,
              top: '50%',
              transform: 'translate(-50%, -50%)',
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: risk.color,
              border: '2px solid var(--bg-elevated)',
              boxShadow: `0 0 8px ${risk.color}`,
              transition: 'left 0.8s cubic-bezier(0.4,0,0.2,1)',
              zIndex: 2,
            }} />
          </div>
          {/* Tick marks */}
          <div style={styles.ticks}>
            {[25, 50, 75].map(t => (
              <div key={t} style={{ ...styles.tick, left: `${t}%` }} />
            ))}
          </div>
        </div>

        {/* Score display */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span className="mono" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>
            {risk.score} / 100
          </span>
          <span className="mono" style={{
            fontSize: '9px',
            color: risk.color,
            fontWeight: 'bold',
            letterSpacing: '1px',
          }}>
            {risk.label}
          </span>
        </div>

        {/* Contributing factors */}
        {risk.score > 30 && risk.factors.length > 0 && (
          <div style={{ marginBottom: '14px' }}>
            {risk.factors.map((f, i) => (
              <div key={i} style={styles.factorRow}>
                <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>▸</span>
                <span className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>{f}</span>
              </div>
            ))}
          </div>
        )}

        {/* Demo trigger buttons */}
        <div style={styles.triggerRow}>
          {['normal', 'elevated', 'critical'].map(mode => (
            <button
              key={mode}
              onClick={() => handleModeChange(mode)}
              style={{
                ...styles.triggerBtn,
                background: activeBtn === mode ? 'var(--bg-hover)' : 'transparent',
                borderColor: activeBtn === mode ? 'var(--border-bright)' : 'var(--border-dim)',
                color: activeBtn === mode ? 'var(--text-primary)' : 'var(--text-muted)',
              }}
              className="mono"
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const styles = {
  panel: {
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px',
  },
  title: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '2px',
    marginBottom: '14px',
    fontWeight: 400,
  },
  barContainer: {
    position: 'relative',
    marginBottom: '10px',
  },
  barTrack: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: 'var(--bg-surface)',
    position: 'relative',
    overflow: 'visible',
  },
  barFill: {
    height: '100%',
    borderRadius: '4px',
    background: 'linear-gradient(90deg, var(--green) 0%, var(--amber) 50%, var(--red) 100%)',
    position: 'relative',
    zIndex: 1,
  },
  ticks: {
    position: 'relative',
    height: '4px',
  },
  tick: {
    position: 'absolute',
    top: '-10px',
    width: '1px',
    height: '14px',
    background: 'var(--border-mid)',
    transform: 'translateX(-50%)',
  },
  factorRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '3px 0',
  },
  triggerRow: {
    display: 'flex',
    gap: '6px',
    marginTop: '4px',
  },
  triggerBtn: {
    flex: 1,
    padding: '6px 8px',
    border: '1px solid var(--border-dim)',
    borderRadius: 'var(--radius)',
    background: 'transparent',
    cursor: 'pointer',
    fontSize: '9px',
    transition: 'var(--transition)',
  },
  warningBanner: {
    border: '1px solid',
    borderRadius: 'var(--radius)',
    padding: '12px 14px',
    marginBottom: '12px',
    position: 'relative',
    overflow: 'hidden',
  },
  dismissBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    fontSize: '16px',
    lineHeight: 1,
    padding: '0 4px',
  },
  scanlineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
    pointerEvents: 'none',
  },
  scanlineBar: {
    width: '40%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)',
    animation: 'scanline 3s linear infinite',
  },
};
