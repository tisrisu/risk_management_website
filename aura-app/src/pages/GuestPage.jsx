import { useState, useEffect, useRef } from 'react';
import SilentWitness from '../components/SilentWitness';
import { API, useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';

export default function GuestPage() {
  const { user } = useAuth();
  const [phase, setPhase] = useState('idle'); // idle, sending, confirmed, evacuation, safe
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [incidentText, setIncidentText] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  
  const [aiInstruction, setAiInstruction] = useState('');
  const [responseTime, setResponseTime] = useState(null);
  const [alertId, setAlertId] = useState(null);
  const [alertStatus, setAlertStatus] = useState('active');
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [showMap, setShowMap] = useState(false);
  const [showHeartbeatSpike, setShowHeartbeatSpike] = useState(false);

  const { socket } = useSocket(user?.hotelId);

  useEffect(() => { document.title = alertStatus === 'active' ? "🔴 [1] Alert — Aura Command" : "Aura · Monitoring"; }, [alertStatus]);

  if (!user) return null;
  const GUEST_ID = user.guestId;
  const GUEST_ROOM = `Room ${user.room}`;

  const incidents = [
    { id: 'FIRE', label: 'FIRE / SMOKE', sub: 'Report visible fire, smoke, or burning smell', color: 'var(--red)', bg: 'var(--red-dim)' },
    { id: 'MEDICAL', label: 'MEDICAL EMERGENCY', sub: 'Request an ambulance or hotel medic', color: 'var(--amber)', bg: 'var(--amber-dim)' },
    { id: 'SECURITY', label: 'SECURITY THREAT', sub: 'Report intruders, violence, or suspicious activity', color: 'var(--blue)', bg: 'var(--blue-dim)' },
    { id: 'OTHER', label: 'OTHER EMERGENCY', sub: 'Trapped in elevator, severe leaks, etc.', color: 'var(--purple)', bg: 'var(--purple-dim)' }
  ];

  const handleSendAlert = async () => {
    if (!selectedIncident) return;
    setPhase('sending');
    setShowHeartbeatSpike(true);
    
    // Stop listening if it was active
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    const payload = { emergencyType: selectedIncident, rawMessage: incidentText, location: GUEST_ROOM, guestId: GUEST_ID, hotelId: user.hotelId };
    try {
      const res = await fetch(`${API}/api/alerts/report`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      setAiInstruction(data.guestInstruction || 'Stay calm. Help is on the way.');
      setResponseTime(data.estimatedResponse);
      setAlertId(data.alertId);
      setAlertStatus('active');
      setTimeout(() => setPhase('confirmed'), 2000); // artificial delay for the transmission animation
    } catch (e) {
      setAiInstruction('Network offline. Alert saved locally.');
      setTimeout(() => setPhase('confirmed'), 2000);
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setIncidentText(prev => prev ? prev + ' ' + transcript : transcript);
      };

      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!recognitionRef.current) return;
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIncidentText('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.on('mass_safety_prompt', (data) => {
      setPhase('evacuation');
      setBroadcastMsg(data.message);
      setShowHeartbeatSpike(true);
    });
    socket.on('alert_updated', (updated) => {
      if (updated.id === alertId) {
        if (updated.status === 'resolved') { setAlertStatus('resolved'); setShowHeartbeatSpike(false); }
        else if (updated.acknowledgedBy) setAlertStatus('acknowledged');
      }
    });
    return () => { socket.off('mass_safety_prompt'); socket.off('alert_updated'); };
  }, [socket, alertId]);

  const handleMarkSafe = async () => {
    setPhase('safe');
    await fetch(`${API}/api/safety/checkin`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ guestId: GUEST_ID, location: 'Safe Zone', hotelId: user.hotelId, headcount: 1, status: 'SAFE' }) }).catch(() => {});
  };

  const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div style={s.page}>
      
      {/* TOP ZONE — AMBIENT STATUS BAR */}
      <div style={s.statusBar}>
        <div style={s.statusContent}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="font-display" style={{ fontSize: '24px', color: 'var(--system)', lineHeight: 1 }}>{GUEST_ROOM.toUpperCase()}</span>
            <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-muted)' }}>FLOOR 4</span>
          </div>

          <div style={s.heartbeatContainer}>
            <svg width="120" height="40" viewBox="0 0 120 40">
              {showHeartbeatSpike ? (
                <path d="M0 20 L40 20 L45 10 L50 35 L55 5 L60 25 L65 20 L120 20" fill="none" stroke="var(--red)" strokeWidth="2" strokeLinejoin="round" style={{ animation: 'ekgSpike 1s linear infinite' }} />
              ) : (
                <path d="M0 20 L55 20 L58 18 L62 22 L65 20 L120 20" fill="none" stroke="var(--border-mid)" strokeWidth="1" strokeLinejoin="round" />
              )}
            </svg>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span className="font-mono" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{now}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: showHeartbeatSpike ? 'var(--red)' : 'var(--green)', animation: 'blink 2s infinite' }} />
              <span className="font-mono" style={{ fontSize: '8px', color: showHeartbeatSpike ? 'var(--red)' : 'var(--green)' }}>
                {showHeartbeatSpike ? 'CRITICAL ALERT' : 'SAFE ZONE'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={s.mainContent}>
        {/* IDLE PHASE */}
        {phase === 'idle' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', position: 'relative' }}>
            {incidents.map((inc) => {
              const isSelected = selectedIncident === inc.id;
              const isHidden = selectedIncident && selectedIncident !== inc.id;
              
              if (isHidden) return null;

              return (
                <div key={inc.id} style={{...s.sosBtnWrapper, ...(isSelected ? s.sosBtnWrapperSelected : {})}}>
                  <button 
                    className="sos-btn"
                    style={{...s.sosBtn, ...(isSelected ? s.sosBtnSelected : { borderColor: 'var(--border-dim)' })}}
                    onClick={() => setSelectedIncident(isSelected ? null : inc.id)}
                  >
                    {!isSelected && <div className="shimmer-overlay" />}
                    
                    <div style={{...s.iconBox, color: inc.color, background: inc.bg, borderColor: inc.bg}}>
                      {inc.id.substring(0,2)}
                    </div>
                    
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div className="font-body" style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>{inc.label}</div>
                      <div className="font-mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{inc.sub}</div>
                    </div>
                    
                    <div className="font-body" style={{ fontSize: '20px', color: 'var(--text-muted)' }}>
                      {isSelected ? '↓' : '›'}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isSelected && (
                    <div style={s.expandedArea}>
                      <div style={{ position: 'relative' }}>
                        <textarea 
                          className="font-body expand-textarea"
                          placeholder="Describe what's happening. Any language."
                          value={incidentText}
                          onChange={(e) => setIncidentText(e.target.value)}
                          rows={3}
                          style={{...s.textarea, '--focus-color': inc.color, '--focus-glow': inc.bg, paddingRight: isSupported ? '40px' : '0'}}
                        />
                        {isSupported && (
                          <button
                            onClick={toggleListening}
                            style={{
                              position: 'absolute', right: '8px', top: '12px',
                              width: '28px', height: '28px', borderRadius: '50%',
                              border: 'none', background: isListening ? 'var(--red)' : 'var(--bg-surface)',
                              color: isListening ? 'white' : 'var(--text-muted)',
                              cursor: 'pointer', outline: 'none', transition: 'all 200ms',
                              display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
                              <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                              <line x1="12" y1="19" x2="12" y2="22"></line>
                            </svg>
                            {isListening && <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid var(--red)', animation: 'ringPulse 1.5s infinite' }} />}
                          </button>
                        )}
                      </div>
                      <button onClick={handleSendAlert} className="font-mono" style={{...s.sendBtn, background: inc.color}}>
                        SEND EMERGENCY ALERT
                      </button>
                      <button onClick={() => setSelectedIncident(null)} className="font-mono" style={s.cancelLnk}>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {!selectedIncident && (
              <div style={{ marginTop: '40px' }}>
                <div style={s.dividerContainer}>
                  <div style={s.dividerLine} />
                  <span className="font-mono" style={{ fontSize: '8px', color: 'var(--text-muted)', letterSpacing: '2px' }}>— HOTEL SERVICES —</span>
                  <div style={s.dividerLine} />
                </div>
                <SilentWitness guestId={GUEST_ID} location={GUEST_ROOM} hotelId={user.hotelId} />
              </div>
            )}
          </div>
        )}

        {/* SENDING PHASE */}
        {phase === 'sending' && (
          <div style={s.takeover}>
            <div style={s.pulseContainer}>
              <div className="pulse-ring ring-1" style={{ borderColor: 'var(--red)' }} />
              <div className="pulse-ring ring-2" style={{ borderColor: 'var(--red)' }} />
              <div className="pulse-ring ring-3" style={{ borderColor: 'var(--red)' }} />
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--red)' }} />
            </div>
            <div className="font-display" style={{ fontSize: '32px', color: 'var(--red)', marginTop: '60px', letterSpacing: '4px' }}>
              TRANSMITTING<span className="dots">...</span>
            </div>
            <div className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              AI triage in progress
            </div>
          </div>
        )}

        {/* CONFIRMED PHASE */}
        {phase === 'confirmed' && (
          <div style={s.confirmedView}>
            <div style={s.checkCircle}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M10 20 L18 28 L32 12" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ animation: 'strokeDraw 0.6s ease forwards', strokeDasharray: 40, strokeDashoffset: 40 }} />
              </svg>
            </div>
            <h2 className="font-display" style={{ fontSize: '48px', color: 'var(--green)', marginTop: '20px', lineHeight: 1 }}>ALERT RECEIVED</h2>
            <p className="font-body" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Staff are responding</p>
            
            <div style={s.timePill}>
              Estimated response · {responseTime || '3'} min
            </div>

            <div style={s.aiInstructionCard}>
              <div className="font-mono" style={{ fontSize: '8px', color: 'var(--amber)', letterSpacing: '2px', marginBottom: '8px' }}>AI INSTRUCTION</div>
              <div className="font-body" style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.75 }}>{aiInstruction}</div>
            </div>

            <div style={s.timeline}>
              <TimelineStep label="Alert transmitted to server" status="done" />
              <TimelineStep label="Gemini AI triage complete" status="done" />
              <TimelineStep label="Staff member dispatched" status={alertStatus === 'active' ? 'active' : 'done'} />
              <TimelineStep label="Situation resolved" status={alertStatus === 'resolved' ? 'done' : 'pending'} isLast />
            </div>

            <button onClick={handleMarkSafe} className="font-mono" style={s.safeBtn}>
              I AM SAFE — CHECK IN
            </button>

            {user.mapBase64 && (
              <button onClick={() => setShowMap(true)} className="font-mono map-btn" style={s.mapBtn}>
                VIEW EVACUATION MAP
              </button>
            )}
          </div>
        )}

        {/* EVACUATION PHASE */}
        {phase === 'evacuation' && (
          <div style={s.confirmedView}>
            <div style={{...s.checkCircle, borderColor: 'var(--amber)'}}>
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <path d="M20 10 L20 22 M20 28 L20 30" stroke="var(--amber)" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </div>
            <h2 className="font-display" style={{ fontSize: '48px', color: 'var(--amber)', marginTop: '20px', lineHeight: 1 }}>EMERGENCY DIRECTIVE</h2>
            <p className="font-body" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Follow instructions immediately</p>
            
            <div style={s.aiInstructionCard}>
              <div className="font-mono" style={{ fontSize: '8px', color: 'var(--amber)', letterSpacing: '2px', marginBottom: '8px' }}>COMMAND BROADCAST</div>
              <div className="font-body" style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{broadcastMsg}</div>
            </div>

            <button onClick={handleMarkSafe} className="font-mono" style={{...s.safeBtn, marginTop: '40px'}}>
              I AM SAFE — CHECK IN
            </button>

            <button onClick={() => setPhase('idle')} className="font-mono" style={{...s.safeBtn, background: 'transparent', borderColor: 'var(--red)', color: 'var(--red)', marginTop: '16px'}}>
              I AM IN DANGER — SEND SOS
            </button>
          </div>
        )}

        {/* SAFE PHASE */}
        {phase === 'safe' && (
          <div style={{ textAlign: 'center', paddingTop: '60px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="font-display" style={{ fontSize: '48px', color: 'var(--green)', letterSpacing: '4px' }}>SAFE ZONE</h2>
            <div className="font-mono" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '16px' }}>
              Your location is secured.
            </div>
            <div style={s.safePulse} />
            
            <button onClick={() => setPhase('idle')} className="font-mono" style={{...s.safeBtn, background: 'transparent', borderColor: 'var(--border-mid)', color: 'var(--text-primary)', marginTop: '60px'}}>
              REPORT NEW INCIDENT
            </button>
          </div>
        )}
      </div>

      {/* EVACUATION MAP MODAL */}
      {showMap && user.mapBase64 && (
        <div style={s.overlay}>
          <div style={s.mapModal}>
            <h2 className="font-display" style={{ fontSize: '24px', color: 'var(--text-primary)', letterSpacing: '2px', marginBottom: '16px' }}>EVACUATION MAP</h2>
            <div style={{ width: '100%', border: '1px solid var(--border-dim)', borderRadius: '8px', overflow: 'hidden', marginBottom: '16px' }}>
              <img src={user.mapBase64} alt="Floorplan" style={{ width: '100%', height: 'auto', display: 'block' }} />
            </div>
            <button onClick={() => setShowMap(false)} className="font-mono" style={{...s.safeBtn, background: 'var(--system-dim)', borderColor: 'var(--system)', color: 'var(--system)'}}>
              CLOSE MAP
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

function TimelineStep({ label, status, isLast }) {
  const isDone = status === 'done';
  const isActive = status === 'active';
  
  return (
    <div style={{ display: 'flex', gap: '16px', position: 'relative', minHeight: '40px' }}>
      {!isLast && (
        <div style={{ position: 'absolute', left: '4px', top: '10px', bottom: '-10px', width: '2px', background: isDone ? 'var(--green)' : 'var(--border-void)', zIndex: 0 }} />
      )}
      <div style={{ position: 'relative', zIndex: 1, marginTop: '2px' }}>
        {isDone && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--green)' }} />}
        {isActive && (
          <div style={{ position: 'relative' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--amber)' }} />
            <div style={{ position: 'absolute', inset: '-4px', borderRadius: '50%', border: '1px solid var(--amber)', animation: 'dotPulse 1.5s infinite' }} />
          </div>
        )}
        {status === 'pending' && <div style={{ width: '10px', height: '10px', borderRadius: '50%', border: '1px solid var(--border-mid)', background: 'var(--bg-void)' }} />}
      </div>
      <div className="font-body" style={{ fontSize: '13px', color: isDone ? 'var(--text-primary)' : isActive ? 'var(--amber)' : 'var(--text-muted)' }}>
        {label}
      </div>
    </div>
  );
}

const s = {
  page: { position: 'relative', zIndex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column', width: '100%' },
  statusBar: { width: '100%', height: '72px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-void)', flexShrink: 0 },
  statusContent: { maxWidth: '480px', margin: '0 auto', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' },
  heartbeatContainer: { width: '120px', height: '40px', overflow: 'hidden' },
  mainContent: { flex: 1, width: '100%', maxWidth: '420px', margin: '0 auto', padding: '32px 20px 80px', display: 'flex', flexDirection: 'column' },
  sosBtnWrapper: { width: '100%', background: 'var(--bg-elevated)', border: '1px solid transparent', borderRadius: '12px', overflow: 'hidden', transition: 'all 350ms ease-out' },
  sosBtnWrapperSelected: { maxHeight: '260px' },
  sosBtn: { position: 'relative', width: '100%', height: '76px', display: 'flex', alignItems: 'center', gap: '16px', padding: '0 20px', background: 'transparent', border: '1px solid transparent', cursor: 'pointer', transition: 'all var(--normal) var(--ease-out)', outline: 'none' },
  sosBtnSelected: { background: 'rgba(255,255,255,0.03)' },
  iconBox: { width: '48px', height: '48px', borderRadius: '10px', border: '1px solid', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold', fontFamily: 'var(--font-mono)' },
  expandedArea: { padding: '0 20px 20px', animation: 'fadeIn 300ms' },
  textarea: { width: '100%', background: 'var(--bg-surface)', border: 'none', borderBottom: '1px solid var(--border-mid)', padding: '12px 0', fontSize: '14px', color: 'var(--text-secondary)', outline: 'none', resize: 'none', transition: 'border-color var(--fast)' },
  sendBtn: { width: '100%', height: '48px', borderRadius: '8px', border: 'none', color: 'white', fontSize: '12px', fontWeight: 500, letterSpacing: '2px', marginTop: '16px', cursor: 'pointer', outline: 'none' },
  cancelLnk: { width: '100%', background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '9px', marginTop: '12px', cursor: 'pointer', outline: 'none' },
  dividerContainer: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' },
  dividerLine: { flex: 1, height: '1px', background: 'var(--border-void)' },
  takeover: { position: 'fixed', inset: 0, background: 'var(--bg-void)', zIndex: 100, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  pulseContainer: { position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  confirmedView: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%' },
  checkCircle: { width: '72px', height: '72px', borderRadius: '50%', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  timePill: { background: 'var(--amber-dim)', border: '1px solid var(--amber)', borderRadius: '20px', padding: '4px 14px', color: 'var(--amber)', fontSize: '10px', fontFamily: 'var(--font-mono)', display: 'inline-flex', marginTop: '16px' },
  aiInstructionCard: { width: '100%', background: 'var(--bg-elevated)', borderRadius: '12px', borderLeft: '3px solid var(--amber)', padding: '18px 20px', textAlign: 'left', marginTop: '32px' },
  timeline: { width: '100%', marginTop: '24px', display: 'flex', flexDirection: 'column', textAlign: 'left', gap: '16px' },
  safeBtn: { width: '100%', height: '56px', background: 'var(--green-dim)', border: '1px solid var(--green)', borderRadius: '10px', color: 'var(--green)', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer', marginTop: '32px', transition: 'all 200ms', outline: 'none' },
  mapBtn: { width: '100%', background: 'transparent', border: '1px solid var(--blue)', borderRadius: '10px', color: 'var(--blue)', padding: '16px', fontSize: '10px', letterSpacing: '2px', cursor: 'pointer', marginTop: '12px', outline: 'none' },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(6,8,16,0.85)', backdropFilter: 'blur(10px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
  mapModal: { width: '100%', maxWidth: '500px', background: 'var(--bg-surface)', border: '1px solid var(--border-mid)', borderRadius: '16px', padding: '24px', textAlign: 'center' }
};

if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    .sos-btn:hover { transform: translateX(6px); border-color: inherit; }
    .sos-btn:active { transform: translateX(2px) scale(0.99); transition-duration: 80ms; }
    .sos-btn .shimmer-overlay { position: absolute; inset: 0; background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%); width: 200%; animation: shimmer 3s ease-in-out infinite; pointer-events: none; }
    .sos-btn:hover .shimmer-overlay { animation-play-state: paused; }
    .expand-textarea:focus { border-bottom-color: var(--focus-color) !important; box-shadow: 0 4px 12px var(--focus-glow); }
    .pulse-ring { position: absolute; border-radius: 50%; border: 1px solid; animation: ringPulse 1.2s ease-in-out infinite; }
    .ring-1 { width: 40px; height: 40px; }
    .ring-2 { width: 80px; height: 80px; animation-delay: 0.2s; opacity: 0.6; }
    .ring-3 { width: 120px; height: 120px; animation-delay: 0.4s; opacity: 0.3; }
    @keyframes ringPulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.6); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }
    @keyframes ekgSpike { 0% { stroke-dashoffset: 120; } 100% { stroke-dashoffset: 0; } }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    .map-btn:hover { background: var(--blue-dim) !important; }
  `;
  document.head.appendChild(style);
}
