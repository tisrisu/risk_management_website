import { useState, useRef, useEffect } from 'react';

const EMERGENCY_TYPES = [
  {
    type: 'FIRE',
    letter: 'F',
    label: 'FIRE',
    sub: 'Smoke, flames, burning smell',
    color: 'var(--red)',
    colorRaw: '#FF4757',
    bg: 'var(--red-bg)',
    glow: 'var(--red-glow)',
  },
  {
    type: 'MEDICAL',
    letter: 'M',
    label: 'MEDICAL',
    sub: 'Injury, illness, unconscious',
    color: 'var(--amber)',
    colorRaw: '#FFA502',
    bg: 'var(--amber-bg)',
    glow: 'var(--amber-glow)',
  },
  {
    type: 'SECURITY',
    letter: 'S',
    label: 'SECURITY',
    sub: 'Intruder, threat, suspicious',
    color: 'var(--blue)',
    colorRaw: '#1E90FF',
    bg: 'var(--blue-bg)',
    glow: 'var(--blue-glow)',
  },
  {
    type: 'OTHER',
    letter: '?',
    label: 'OTHER',
    sub: 'Any other urgent situation',
    color: 'var(--purple)',
    colorRaw: '#A78BFA',
    bg: 'var(--purple-bg)',
    glow: 'var(--purple-glow)',
  },
];

function SOSButtons({ onSOS, loading }) {
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const [pressedIdx, setPressedIdx] = useState(null);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef(null);
  const originalMessageRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          finalTranscript += event.results[i][0].transcript;
        }
        setMessage(originalMessageRef.current + finalTranscript);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        if (event.error === 'not-allowed') {
          alert('Mic access denied. Please click the mic icon in your browser address bar and allow access.');
        } else if (event.error !== 'no-speech') {
          alert('Mic error: ' + event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    try {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
      } else {
        originalMessageRef.current = message ? message + ' ' : '';
        recognitionRef.current?.start();
        setIsListening(true);
      }
    } catch (e) {
      console.error(e);
      alert('Microphone error: ' + e.message + '. Please ensure permissions are granted.');
      setIsListening(false);
    }
  };

  const handleSelect = (item) => {
    setSelected(item);
    setMessage('');
  };

  const handleSend = () => {
    if (!selected) return;
    onSOS(selected.type, message || `${selected.type} emergency`);
  };

  return (
    <div>
      {/* Instruction line */}
      <p style={styles.instruction} className="mono">
        SELECT EMERGENCY TYPE
      </p>

      {/* 2x2 button grid */}
      <div style={styles.grid}>
        {EMERGENCY_TYPES.map((item, i) => {
          const isSelected = selected?.type === item.type;
          const isHovered = hoveredIdx === i;
          const isPressed = pressedIdx === i;

          return (
            <button
              key={item.type}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => { setHoveredIdx(null); setPressedIdx(null); }}
              onMouseDown={() => setPressedIdx(i)}
              onMouseUp={() => setPressedIdx(null)}
              style={{
                ...styles.btn,
                borderColor: isSelected ? item.color : isHovered ? item.color : 'var(--border-mid)',
                background: isSelected ? item.bg : isHovered ? item.bg : 'var(--bg-elevated)',
                boxShadow: isSelected ? `0 0 20px ${item.glow}` : 'none',
                transform: isPressed ? 'scale(0.97) translateY(0)' : isHovered ? 'translateY(-2px)' : 'translateY(0)',
              }}
            >
              {/* Icon box */}
              <span style={{
                ...styles.iconBox,
                background: `${item.colorRaw}15`,
                borderColor: item.color,
                color: item.color,
              }}>
                <span className="mono" style={{ fontSize: '14px', fontWeight: 'bold' }}>{item.letter}</span>
              </span>
              {/* Label */}
              <span style={{
                ...styles.btnLabel,
                color: isSelected ? item.color : 'var(--text-primary)',
              }}>
                {item.label}
              </span>
              {/* Sub */}
              <span style={styles.btnSub}>{item.sub}</span>
            </button>
          );
        })}
      </div>

      {/* Detail box — slides in after selection */}
      {selected && (
        <div style={{
          ...styles.detailBox,
          borderColor: selected.color,
          animation: 'fadeUp 0.28s ease',
        }}>
          <p style={{ ...styles.detailLabel, color: selected.color }} className="mono">
            DESCRIBE THE SITUATION
          </p>
          <div style={{ position: 'relative' }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Any language is fine..."
              rows={3}
              style={styles.textarea}
              autoFocus
            />
            {isSupported && (
              <button
                onClick={toggleListening}
                style={{
                  ...styles.micBtn,
                  background: isListening ? 'var(--red)' : 'var(--bg-surface)',
                  color: isListening ? 'white' : 'var(--text-secondary)',
                  borderColor: isListening ? 'var(--red)' : 'var(--border-mid)',
                  animation: isListening ? 'pulse-ring 1.5s infinite' : 'none',
                }}
                title={isListening ? "Stop listening" : "Start voice input"}
              >
                <span className="mono" style={{ fontSize: '10px', fontWeight: 'bold' }}>M</span>
              </button>
            )}
          </div>
          <button
            onClick={handleSend}
            disabled={loading}
            style={{
              ...styles.sendBtn,
              background: loading ? 'var(--bg-elevated)' : selected.color,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '13px', fontWeight: 600, letterSpacing: '1.5px' }}>
              {loading ? 'TRANSMITTING...' : `SEND ${selected.label} ALERT`}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  instruction: {
    fontSize: '9px',
    color: 'var(--text-muted)',
    letterSpacing: '3px',
    marginBottom: '14px',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  btn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '8px',
    padding: '18px 14px',
    border: '1px solid',
    borderRadius: 'var(--radius-lg)',
    cursor: 'pointer',
    transition: 'var(--transition)',
    textAlign: 'left',
    background: 'var(--bg-elevated)',
    position: 'relative',
    overflow: 'hidden',
  },
  iconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    border: '1px solid',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontFamily: 'var(--font-body)',
    fontSize: '13px',
    fontWeight: 'bold',
    letterSpacing: '0.5px',
  },
  btnSub: {
    fontFamily: 'var(--font-mono)',
    fontSize: '10px',
    color: 'var(--text-muted)',
    lineHeight: 1.3,
  },
  detailBox: {
    marginTop: '14px',
    padding: '16px',
    border: '1px solid',
    borderRadius: 'var(--radius-lg)',
    background: 'var(--bg-elevated)',
  },
  detailLabel: {
    fontSize: '9px',
    letterSpacing: '2px',
    marginBottom: '10px',
    fontFamily: 'var(--font-mono)',
  },
  textarea: {
    width: '100%',
    background: 'var(--bg-surface)',
    border: 'none',
    borderBottom: '1px solid var(--border-mid)',
    borderRadius: '0',
    color: 'var(--text-primary)',
    fontFamily: 'var(--font-body)',
    fontSize: '14px',
    padding: '10px 40px 10px 0',
    resize: 'none',
    outline: 'none',
    lineHeight: 1.6,
    transition: 'border-color 0.2s ease',
  },
  micBtn: {
    position: 'absolute',
    bottom: '8px',
    right: '4px',
    width: '28px',
    height: '28px',
    border: '1px solid',
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    transition: 'var(--transition)',
    background: 'var(--bg-surface)',
  },
  sendBtn: {
    marginTop: '14px',
    width: '100%',
    padding: '14px',
    border: 'none',
    borderRadius: 'var(--radius)',
    color: 'white',
    cursor: 'pointer',
    transition: 'var(--transition)',
    height: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
};

export default SOSButtons;
