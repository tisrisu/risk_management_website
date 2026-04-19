const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const db = require('./database'); // Import our SQLite database module

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Initialize the Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: '*', // Allow connections from frontend
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Socket connection listener
io.on('connection', (socket) => {
    console.log('✅ A client connected:', socket.id);

    socket.on('join_hotel', (hotelId) => {
        socket.join(hotelId);
        console.log(`🔌 Client ${socket.id} joined hotel room: ${hotelId}`);
    });

    socket.on('disconnect', () => {
        console.log('❌ A client disconnected:', socket.id);
    });
});

// --- ROUTES ---

app.get('/', (req, res) => {
    res.send('Aura Backend is ALIVE and running with SQLite persistence!');
});

app.get('/api/health', (req, res) => {
    res.json({ status: "Aura Backend is ALIVE and running with SQLite persistence!" });
});

// Register a new hotel
app.post('/api/hotels/register', (req, res) => {
    const { hotelId, name, passcode, mapBase64 } = req.body;
    if (!hotelId || !name || !passcode) {
        return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const existing = db.getHotel(hotelId);
    if (existing) {
        return res.status(400).json({ success: false, message: 'Hotel ID already exists' });
    }
    
    try {
        db.insertHotel(hotelId, name, passcode, mapBase64);
        console.log(`🏨 New Hotel Registered: ${name} [${hotelId}]`);
        res.json({ success: true, message: 'Hotel registered successfully' });
    } catch (e) {
        console.error("DB Error on register:", e);
        res.status(500).json({ success: false, message: 'Database error' });
    }
});

app.post('/api/alerts/report', async (req, res) => {
    const alertData = req.body;

    if (!alertData.hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });

    const newAlert = {
        id: Date.now().toString(),
        type: alertData.emergencyType || 'UNKNOWN',
        time: new Date().toLocaleTimeString(),
        createdAt: Date.now(),
        acknowledgedBy: null,
        isSevere: false,
        status: 'active',
        location: alertData.location || 'Unknown Location',
        guestId: alertData.guestId || 'Unknown Guest',
        message: alertData.rawMessage || '',
        hotelId: alertData.hotelId,
        resolvedAt: null,
        resolvedBy: null,
        dispatchedTo: null,
        lastPingTime: null,
        unresponsive: false,
        survivalWindowSeconds: null,
        triangulation: null
    };

    // Criticality Check
    const sameTypeAlerts = db.getActiveAlertsByHotelAndType(newAlert.hotelId, newAlert.type);
    if (sameTypeAlerts.length >= 3) {
        // 3 existing + 1 new = 4 total
        newAlert.isSevere = true;
        sameTypeAlerts.forEach(a => {
            a.isSevere = true;
            db.updateAlert(a);
        });
        console.log(`⚠️ CRITICALITY ESCALATED for type ${newAlert.type} at ${newAlert.hotelId}!`);
        io.to(newAlert.hotelId).emit('criticality_escalated', { type: newAlert.type, count: sameTypeAlerts.length + 1 });
    }

    db.insertAlert(newAlert);
    console.log(`🚨 INCOMING ALERT [${newAlert.hotelId}]:`, newAlert.message);

    // Broadcast the new alert to the specific hotel room for staff dashboard
    io.to(newAlert.hotelId).emit('new_alert', newAlert);

    let guestInstruction = `Your ${newAlert.type} alert has been received. Please stay safe.`;

    const hotel = db.getHotel(alertData.hotelId);
    try {
        let contents = [];
        const prompt = `You are a strict emergency response AI. 
The current emergency is a ${newAlert.type} located at ${newAlert.location}. 
If the emergency is MEDICAL or does not require evacuation, DO NOT tell the guest to evacuate. Instead, provide instructions on how to stay safe, apply basic first aid, and wait for emergency responders. 
If the emergency requires evacuation (like FIRE, ACTIVE SHOOTER), determine the safest evacuation instructions for the guest located at ${newAlert.location}. If a floorplan map is provided, explicitly analyze it to identify the best specific route out of the crisis area, telling them exactly which stairwells, wings, or exits to take. If no map is provided, give general safe evacuation instructions.
Maximum 2 extremely clear sentences.`;

        contents.push(prompt);

        if (hotel && hotel.mapBase64) {
            let mimeType = 'image/jpeg';
            let base64Data = hotel.mapBase64;
            const matches = hotel.mapBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
            }
            contents.push({ inlineData: { data: base64Data, mimeType: mimeType } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents
        });
        guestInstruction = response.text.trim();
    } catch (err) {
        console.error('Gemini error on SOS report:', err.message);
    }

    res.json({
        success: true,
        guestInstruction,
        estimatedResponse: "2",
        alertId: newAlert.id
    });

    // 🧠 ADVANCED AI: Start Triangulation & Survival Hooks asynchronously
    (async () => {
        try {
            let didUpdate = false;

            // 0. THREAT ANALYSIS & MASS BROADCAST DECISION
            try {
                let taContents = [];
                const threatPrompt = `You are an Emergency Triage AI. A guest reported: "${newAlert.message}" (Type: ${newAlert.type}, Location: ${newAlert.location}).
Analyze this threat. Does it require an immediate hotel-wide mass evacuation/broadcast (e.g., active fire, earthquake, active shooter, gas leak)? Or is it localized/isolated (e.g., medical, minor issue, false alarm)?
If it requires a mass broadcast, explicitly analyze the provided floorplan map (if any) to determine the safest general evacuation instructions for ALL guests away from the crisis area.
Return ONLY a valid JSON object matching exactly this format:
{
  "requiresMassBroadcast": boolean,
  "broadcastMessage": "If true, provide a 2-3 sentence evacuation instruction for all guests. If false, leave empty string."
}`;
                taContents.push(threatPrompt);
                if (hotel && hotel.mapBase64) {
                    let mimeType = 'image/jpeg';
                    let base64Data = hotel.mapBase64;
                    const matches = hotel.mapBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                    if (matches && matches.length === 3) { mimeType = matches[1]; base64Data = matches[2]; }
                    taContents.push({ inlineData: { data: base64Data, mimeType: mimeType } });
                }

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: taContents
                });
                
                let text = response.text.trim();
                if (text.startsWith('\`\`\`json')) text = text.substring(7, text.length - 3).trim();
                else if (text.startsWith('\`\`\`')) text = text.substring(3, text.length - 3).trim();
                
                const data = JSON.parse(text);
                if (data.requiresMassBroadcast && data.broadcastMessage) {
                    console.log(`📢 AI INITIATED MASS BROADCAST [${newAlert.hotelId}]: ${data.broadcastMessage}`);
                    io.to(newAlert.hotelId).emit('mass_safety_prompt', { message: data.broadcastMessage, timestamp: new Date().toISOString() });
                }
            } catch (e) { console.error("Threat Analysis Error:", e.message); }

            // 1. SURVIVAL WINDOW ESTIMATOR (For FIRE)
            if (newAlert.type === 'FIRE') {
                try {
                    const prompt = `You are an expert fire spread behavioral modeler. The building has reported a FIRE emergency at location: "${newAlert.location}".
Using standard fire spread rates (roughly 1 floor per 3 minutes), estimate how many seconds the guests in this exact location have until evacuation becomes life-threatening.
Return ONLY a valid JSON object matching exactly this format: {"windowSeconds": number}. Do not include markdown or other text.`;
                    
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt
                    });
                    
                    let text = response.text.trim();
                    if (text.startsWith('\`\`\`json')) text = text.substring(7, text.length - 3).trim();
                    else if (text.startsWith('\`\`\`')) text = text.substring(3, text.length - 3).trim();
                    
                    const data = JSON.parse(text);
                    if (data.windowSeconds) {
                        newAlert.survivalWindowSeconds = data.windowSeconds;
                        didUpdate = true;
                    }
                } catch(e) { console.error("Survival Window Error:", e.message); }
            }

            // 2. CROSS-REPORT TRIANGULATION
            const sixtySecondsAgo = Date.now() - 60000;
            const recentSimilarAlerts = db.getRecentAlertsByHotel(newAlert.hotelId, sixtySecondsAgo);
            
            if (recentSimilarAlerts.length >= 2) {
                try {
                    const reportsText = recentSimilarAlerts.map(a => `- Location: ${a.location}, Message: "${a.message}"`).join('\\n');
                    const prompt = `You are an Emergency Triage AI analyzing multiple incoming guest reports within a 60-second window to detect contradictions or false alarms.
Recent reports:
${reportsText}

Analyze if these reports are consistent or if there is a stark contradiction (e.g., one says fire, another says prank, or drastically different locations). 
Return ONLY a valid JSON object matching exactly this format:
{
  "confidenceScore": number (0-100),
  "isContradictory": boolean,
  "analysis": "1 sentence reasoning"
}`;
                    const response = await ai.models.generateContent({
                        model: 'gemini-2.5-flash',
                        contents: prompt
                    });
                    
                    let text = response.text.trim();
                    if (text.startsWith('\`\`\`json')) text = text.substring(7, text.length - 3).trim();
                    else if (text.startsWith('\`\`\`')) text = text.substring(3, text.length - 3).trim();
                    
                    const data = JSON.parse(text);
                    if (data.confidenceScore !== undefined) {
                        newAlert.triangulation = {
                            confidenceScore: data.confidenceScore,
                            isContradictory: data.isContradictory,
                            analysis: data.analysis
                        };
                        didUpdate = true;
                    }
                } catch(e) { console.error("Triangulation Error:", e.message); }
            }

            if (didUpdate) {
                const target = db.getAlert(newAlert.id);
                if (target) {
                    target.survivalWindowSeconds = newAlert.survivalWindowSeconds;
                    target.triangulation = newAlert.triangulation;
                    db.updateAlert(target);
                    io.to(newAlert.hotelId).emit('alert_updated', target);
                }
            }

        } catch (err) {
            console.error("Async AI operations failed", err);
        }
    })();
});

app.post('/api/alerts/silent', (req, res) => {
    const { guestId, location, pattern, hotelId } = req.body;
    if (!hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });

    const newAlert = {
        id: Date.now().toString(),
        type: 'SECURITY (SILENT)',
        time: new Date().toLocaleTimeString(),
        createdAt: Date.now(),
        acknowledgedBy: null,
        isSevere: false,
        status: 'active',
        location: location || 'Unknown',
        guestId: guestId,
        message: `Silent covert request: ${pattern}`,
        hotelId: hotelId,
        resolvedAt: null,
        resolvedBy: null,
        dispatchedTo: null,
        lastPingTime: null,
        unresponsive: false,
        survivalWindowSeconds: null,
        triangulation: null
    };

    db.insertAlert(newAlert);
    console.log(`🤫 SILENT ALERT [${hotelId}]:`, newAlert.message);

    io.to(hotelId).emit('new_alert', newAlert);
    res.json({ success: true });
});

app.post('/api/iot/sensor', async (req, res) => {
    const { hotelId, sensorType, reading, threshold, location } = req.body;

    if (!hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });

    let isEmergency = false;
    let message = '';

    // Check if reading breaches threshold
    if (reading > threshold) {
        isEmergency = true;
        message = `${sensorType} sensor threshold breached! Reading: ${reading} (Threshold: ${threshold})`;
    }

    if (isEmergency) {
        const newAlert = {
            id: Date.now().toString(),
            type: 'IOT_SENSOR',
            time: new Date().toLocaleTimeString(),
            createdAt: Date.now(),
            acknowledgedBy: null,
            isSevere: true, // IoT triggers might be severe by default
            status: 'active',
            location: location || 'Unknown Zone',
            guestId: 'SYSTEM',
            message: message,
            hotelId: hotelId,
            resolvedAt: null,
            resolvedBy: null,
            dispatchedTo: null,
            lastPingTime: null,
            unresponsive: false,
            survivalWindowSeconds: null,
            triangulation: null
        };

        db.insertAlert(newAlert);
        console.log(`🤖 IOT SENSOR ALERT [${hotelId}]:`, newAlert.message);
        io.to(hotelId).emit('new_alert', newAlert);

        // Async AI Threat Analysis for IoT
        (async () => {
            const hotel = db.getHotel(hotelId);
            try {
                let taContents = [];
                const threatPrompt = `You are an Emergency Triage AI. An IoT sensor triggered an alert: "${message}" (Type: ${sensorType}, Location: ${location}).
Analyze this threat. Does it require an immediate hotel-wide mass evacuation/broadcast (e.g., active fire, earthquake, gas leak)? Or is it localized?
If it requires a mass broadcast, explicitly analyze the provided floorplan map (if any) to determine the safest general evacuation instructions for ALL guests away from the crisis area.
Return ONLY a valid JSON object matching exactly this format:
{
  "requiresMassBroadcast": boolean,
  "broadcastMessage": "If true, provide a 2-3 sentence evacuation instruction for all guests. If false, leave empty string."
}`;
                taContents.push(threatPrompt);
                if (hotel && hotel.mapBase64) {
                    let mimeType = 'image/jpeg';
                    let base64Data = hotel.mapBase64;
                    const matches = hotel.mapBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
                    if (matches && matches.length === 3) { mimeType = matches[1]; base64Data = matches[2]; }
                    taContents.push({ inlineData: { data: base64Data, mimeType: mimeType } });
                }

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: taContents
                });
                
                let text = response.text.trim();
                if (text.startsWith('\`\`\`json')) text = text.substring(7, text.length - 3).trim();
                else if (text.startsWith('\`\`\`')) text = text.substring(3, text.length - 3).trim();
                
                const data = JSON.parse(text);
                if (data.requiresMassBroadcast && data.broadcastMessage) {
                    console.log(`📢 AI INITIATED MASS BROADCAST (IoT) [${hotelId}]: ${data.broadcastMessage}`);
                    io.to(hotelId).emit('mass_safety_prompt', { message: data.broadcastMessage, timestamp: new Date().toISOString() });
                }
            } catch (e) { console.error("IoT Threat Analysis Error:", e.message); }
        })();
    }

    res.json({ success: true, triggered: isEmergency });
});

app.post('/api/intelligence/evacuation', async (req, res) => {
    const { hotelId, incidentDetails } = req.body;

    if (!hotelId || !incidentDetails) {
        return res.status(400).json({ success: false, message: 'Missing hotelId or incidentDetails' });
    }

    const hotel = db.getHotel(hotelId);
    if (!hotel) return res.status(404).json({ success: false, message: 'Hotel not found' });

    try {
        let contents = [];
        const prompt = `You are a strict emergency response AI. You have been provided with a hotel floorplan/map document. 
The current emergency is: ${incidentDetails}. 
Based strictly on the map (if provided), determine the safest general evacuation instructions for all guests. 
Identify areas, wings, or stairwells to avoid, and point them towards the safest exits. If no map is provided, give general best-practice instructions based on the incident.
Keep your response to a maximum of 3 extremely clear, actionable, life-saving sentences. Do not use markdown format.`;

        contents.push(prompt);

        if (hotel.mapBase64) {
            let mimeType = 'image/jpeg';
            let base64Data = hotel.mapBase64;

            const matches = hotel.mapBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                mimeType = matches[1];
                base64Data = matches[2];
            }
            contents.push({ inlineData: { data: base64Data, mimeType: mimeType } });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contents
        });

        res.json({ success: true, instruction: response.text.trim() });
    } catch (err) {
        console.error('Gemini error:', err.message);
        // FALLBACK: If AI generation fails (e.g. Rate Limits), use a hardcoded fallback plan so the user can still proceed with evacuation testing
        const fallbackInstruction = `EMERGENCY EVACUATION PLAN:
1. Remain calm and proceed to the nearest emergency exit immediately.
2. Do NOT use elevators. Use the stairwells to evacuate to the ground floor.
3. Gather at the designated safe assembly point outside the building.
Note: AI routing unavailable due to network issues. Proceed with standard evacuation procedures.`;
        res.json({ success: true, instruction: fallbackInstruction });
    }
});

app.post('/api/alerts/mass-prompt', (req, res) => {
    const { hotelId, message } = req.body;
    if (!hotelId || !message) return res.status(400).json({ success: false, message: 'Missing fields' });

    console.log(`📢 MASS BROADCAST [${hotelId}]: ${message}`);
    io.to(hotelId).emit('mass_safety_prompt', { message, timestamp: new Date().toISOString() });
    res.json({ success: true });
});

app.post('/api/safety/checkin', (req, res) => {
    const { guestId, location, hotelId, headcount, status } = req.body;
    console.log(`✅ Guest ${guestId} checked in at ${location} [${hotelId}] | Headcount: ${headcount} | Status: ${status}`);
    io.to(hotelId).emit('guest_safe', { guestId, location, headcount: headcount || 1, status: status || 'SAFE' });
    res.json({ success: true });
});

// Route for the Staff Dashboard to fetch all current alerts FOR THEIR HOTEL
app.get('/api/alerts', (req, res) => {
    const { hotelId } = req.query;
    if (!hotelId) return res.status(400).json({ success: false, message: 'Missing hotelId' });

    const hotelAlerts = db.getAlertsByHotel(hotelId, false);
    res.json(hotelAlerts);
});

// Route to resolve/clear an alert from the dashboard
app.post('/api/resolve-alert', (req, res) => {
    const { id, staffName } = req.body;
    const alert = db.getAlert(id);
    if (alert) {
        alert.status = 'resolved';
        alert.resolvedAt = Date.now();
        alert.resolvedBy = staffName || 'Staff';
        db.updateAlert(alert);
        io.to(alert.hotelId).emit('alert_updated', alert);
    }
    res.json({ success: true, message: "Alert resolved" });
});

app.post('/api/alerts/acknowledge', (req, res) => {
    const { id, staffName } = req.body;
    const alert = db.getAlert(id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    alert.acknowledgedBy = staffName || 'Staff';
    alert.isSevere = false; // Acknowledgement de-escalates severity
    db.updateAlert(alert);
    console.log(`👮 Alert ${id} acknowledged by ${staffName}`);

    io.to(alert.hotelId).emit('alert_updated', alert);
    res.json({ success: true, message: "Alert acknowledged", alert });
});

app.post('/api/alerts/dispatch', (req, res) => {
    const { id, staffName } = req.body;
    const alert = db.getAlert(id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    
    alert.dispatchedTo = staffName;
    alert.lastPingTime = Date.now();
    alert.unresponsive = false;
    db.updateAlert(alert);
    console.log(`🛡️ Staff ${staffName} dispatched to alert ${id}`);
    
    io.to(alert.hotelId).emit('alert_updated', alert);
    res.json({ success: true, alert });
});

app.post('/api/alerts/ping', (req, res) => {
    const { id, staffName } = req.body;
    const alert = db.getAlert(id);
    if (!alert || alert.dispatchedTo !== staffName) {
        return res.status(404).json({ success: false, message: 'Alert mapping not found' });
    }

    alert.lastPingTime = Date.now();
    alert.unresponsive = false;
    db.updateAlert(alert);
    io.to(alert.hotelId).emit('alert_updated', alert);
    res.json({ success: true });
});

// AUTH ROUTES
app.post('/api/auth/staff', (req, res) => {
    const { hotelId, passcode, staffName } = req.body;
    const hotel = db.getHotel(hotelId);

    if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel Environment Not Found' });
    }

    if (hotel.passcode === passcode) {
        res.json({ success: true, token: 'staff-token-1234', hotelName: hotel.name, hotelId, name: staffName || 'Staff' });
    } else {
        res.status(401).json({ success: false, message: 'Invalid Clearance Code' });
    }
});

app.post('/api/auth/guest', (req, res) => {
    const { hotelId, name, room } = req.body;
    if (!name || !room || !hotelId) {
        return res.status(400).json({ success: false, message: 'Hotel ID, Name and Room required' });
    }

    const hotel = db.getHotel(hotelId);
    if (!hotel) {
        return res.status(404).json({ success: false, message: 'Hotel Environment Not Found' });
    }

    const guestId = `G-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
    res.json({ success: true, token: 'guest-temp-token', guestId, name, room, hotelId, hotelName: hotel.name, mapBase64: hotel.mapBase64 });
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

// START DEAD MAN'S SWITCH MONITOR
setInterval(() => {
    const now = Date.now();
    const dispatchedAlerts = db.getAllActiveDispatchedAlerts();
    
    dispatchedAlerts.forEach(alert => {
        // Staff has 90 seconds to tap "I'm OK", otherwise escalating
        if (now - alert.lastPingTime > 90000) {
            alert.unresponsive = true;
            alert.isSevere = true;
            
            db.updateAlert(alert);
            
            console.log(`☠️ DEAD MAN'S SWITCH TRIGGERED: ${alert.dispatchedTo} is unresponsive for alert ${alert.id}`);
            
            // Broadcast backup request
            io.to(alert.hotelId).emit('mass_safety_prompt', { 
                message: `CRITICAL STAFF ALERT: Responder ${alert.dispatchedTo} is unresponsive near ${alert.location}. Backup required immediately.`, 
                timestamp: new Date().toISOString(),
                type: 'EMERGENCY'
            });
            io.to(alert.hotelId).emit('alert_updated', alert);
        }
    });
}, 5000);