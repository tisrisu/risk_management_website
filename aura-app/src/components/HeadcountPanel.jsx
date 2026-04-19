import { useState } from 'react';

export default function HeadcountPanel({ safeGuests }) {
  const totalGuests = 48;
  const totalSafe = safeGuests.filter(g => g.status === 'SAFE').reduce((sum, g) => sum + parseInt(g.headcount || 1, 10), 0);
  const totalDanger = safeGuests.filter(g => g.status === 'DANGER').reduce((sum, g) => sum + parseInt(g.headcount || 1, 10), 0);
  const unaccounted = Math.max(0, totalGuests - totalSafe - totalDanger);
  const safePercent = totalGuests > 0 ? (totalSafe / totalGuests) * 100 : 0;

  return (
    <div style={styles.panel}>
      <h3 className="mono" style={styles.title}>GUEST HEADCOUNT</h3>

      {/* Donut chart */}
      <div style={styles.donutContainer}>
        <div style={{
          ...styles.donut,
          background: `conic-gradient(
            var(--green) 0% ${safePercent}%,
            var(--red) ${safePercent}% ${safePercent + (totalDanger / totalGuests * 100)}%,
            var(--border-dim) ${safePercent + (totalDanger / totalGuests * 100)}% 100%
          )`,
          transition: 'background 0.8s ease',
        }}>
          <div style={styles.donutCenter}>
            <span className="display" style={{ fontSize: '24px', color: 'var(--text-primary)', lineHeight: 1 }}>
              {totalSafe}
            </span>
            <span className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
              /{totalGuests}
            </span>
          </div>
        </div>
      </div>

      {/* Stat rows */}
      <div style={styles.statRow}>
        <div style={styles.statLeft}>
          <span style={{ ...styles.statDot, background: 'var(--green)' }} />
          <span className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>SAFE</span>
        </div>
        <span className="mono" style={{ fontSize: '14px', color: 'var(--green)', fontWeight: 'bold' }}>
          {totalSafe}
        </span>
      </div>

      <div style={{ height: '1px', background: 'var(--border-dim)', margin: '6px 0' }} />

      {totalDanger > 0 && (
        <>
          <div style={styles.statRow}>
            <div style={styles.statLeft}>
              <span style={{ ...styles.statDot, background: 'var(--red)' }} />
              <span className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>NEED HELP</span>
            </div>
            <span className="mono" style={{ fontSize: '14px', color: 'var(--red)', fontWeight: 'bold' }}>
              {totalDanger}
            </span>
          </div>
          <div style={{ height: '1px', background: 'var(--border-dim)', margin: '6px 0' }} />
        </>
      )}

      <div style={styles.statRow}>
        <div style={styles.statLeft}>
          <span style={{ ...styles.statDot, background: 'var(--amber)' }} />
          <span className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>UNACCOUNTED</span>
        </div>
        <span className="mono" style={{ fontSize: '14px', color: 'var(--amber)', fontWeight: 'bold' }}>
          {unaccounted}
        </span>
      </div>

      {/* Guest list */}
      <div style={styles.list}>
        {safeGuests.map((g, i) => {
          const isDanger = g.status === 'DANGER';
          return (
            <div key={i} style={{
              ...styles.item,
              animation: `fadeUp 0.3s ease ${i * 0.06}s both`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  ...styles.statDot,
                  background: isDanger ? 'var(--red)' : 'var(--green)',
                }} />
                <span className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  {g.guestId}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: '9px', color: isDanger ? 'var(--red)' : 'var(--text-muted)' }}>
                  {g.status} · HC:{g.headcount || 1}
                </span>
                <span className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                  {g.location}
                </span>
              </div>
            </div>
          );
        })}
        {safeGuests.length === 0 && (
          <div className="mono" style={{ fontSize: '9px', color: 'var(--text-muted)', padding: '12px 0', textAlign: 'center' }}>
            Awaiting guest check-ins...
          </div>
        )}
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
    marginBottom: '12px',
  },
  title: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '2px',
    marginBottom: '14px',
    fontWeight: 400,
  },
  donutContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '16px',
  },
  donut: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  donutCenter: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'var(--bg-elevated)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '4px 0',
  },
  statLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  statDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  list: {
    maxHeight: '140px',
    overflowY: 'auto',
    marginTop: '12px',
  },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 0',
    borderBottom: '1px solid var(--border-dim)',
  },
};
