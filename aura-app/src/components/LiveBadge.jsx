import { useState, useEffect } from 'react';

function LiveBadge({ connected }) {
  const [prevConnected, setPrevConnected] = useState(connected);

  useEffect(() => {
    setPrevConnected(connected);
  }, [connected]);

  return (
    <div style={{
      ...styles.wrapper,
      borderColor: connected ? 'rgba(46,213,115,0.2)' : 'var(--border-mid)',
      transition: 'var(--transition)',
    }}>
      {/* Dot with ripple */}
      <span style={styles.dotContainer}>
        <span
          style={{
            ...styles.dot,
            backgroundColor: connected ? 'var(--green)' : 'var(--red)',
          }}
        />
        {connected && <span style={styles.ripple} />}
      </span>
      <span style={{
        ...styles.label,
        color: connected ? 'var(--green)' : 'var(--red)',
      }} className="mono">
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  );
}

const styles = {
  wrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border-mid)',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  dotContainer: {
    position: 'relative',
    width: '7px',
    height: '7px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
    position: 'relative',
    zIndex: 1,
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    background: 'var(--green)',
    transform: 'translate(-50%, -50%)',
    animation: 'ripplePing 2s ease-out infinite',
    zIndex: 0,
  },
  label: {
    fontSize: '9px',
    letterSpacing: '1.5px',
    fontWeight: 500,
  },
};

export default LiveBadge;
