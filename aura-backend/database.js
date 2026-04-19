const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS hotels (
    hotelId TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    passcode TEXT NOT NULL,
    mapBase64 TEXT
  );

  CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    time TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    acknowledgedBy TEXT,
    isSevere INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    location TEXT,
    guestId TEXT,
    message TEXT,
    hotelId TEXT NOT NULL,
    resolvedAt INTEGER,
    resolvedBy TEXT,
    dispatchedTo TEXT,
    lastPingTime INTEGER,
    unresponsive INTEGER DEFAULT 0,
    survivalWindowSeconds INTEGER,
    triangulation TEXT
  );
`);

// ----------------- HOTEL QUERIES -----------------

function insertHotel(hotelId, name, passcode, mapBase64) {
  const stmt = db.prepare('INSERT INTO hotels (hotelId, name, passcode, mapBase64) VALUES (?, ?, ?, ?)');
  return stmt.run(hotelId, name, passcode, mapBase64 || null);
}

function getHotel(hotelId) {
  const stmt = db.prepare('SELECT * FROM hotels WHERE hotelId = ?');
  return stmt.get(hotelId);
}

// ----------------- ALERT QUERIES -----------------

function insertAlert(alert) {
  const stmt = db.prepare(`
    INSERT INTO alerts (
      id, type, time, createdAt, acknowledgedBy, isSevere, status, location, 
      guestId, message, hotelId, resolvedAt, resolvedBy, dispatchedTo, 
      lastPingTime, unresponsive, survivalWindowSeconds, triangulation
    ) VALUES (
      @id, @type, @time, @createdAt, @acknowledgedBy, @isSevere, @status, @location, 
      @guestId, @message, @hotelId, @resolvedAt, @resolvedBy, @dispatchedTo, 
      @lastPingTime, @unresponsive, @survivalWindowSeconds, @triangulation
    )
  `);
  
  return stmt.run({
    ...alert,
    isSevere: alert.isSevere ? 1 : 0,
    unresponsive: alert.unresponsive ? 1 : 0,
    triangulation: alert.triangulation ? JSON.stringify(alert.triangulation) : null
  });
}

function updateAlert(alert) {
  const stmt = db.prepare(`
    UPDATE alerts SET
      type = @type, time = @time, createdAt = @createdAt, acknowledgedBy = @acknowledgedBy, 
      isSevere = @isSevere, status = @status, location = @location, guestId = @guestId, 
      message = @message, hotelId = @hotelId, resolvedAt = @resolvedAt, resolvedBy = @resolvedBy, 
      dispatchedTo = @dispatchedTo, lastPingTime = @lastPingTime, unresponsive = @unresponsive, 
      survivalWindowSeconds = @survivalWindowSeconds, triangulation = @triangulation
    WHERE id = @id
  `);
  
  return stmt.run({
    ...alert,
    isSevere: alert.isSevere ? 1 : 0,
    unresponsive: alert.unresponsive ? 1 : 0,
    triangulation: alert.triangulation ? JSON.stringify(alert.triangulation) : null
  });
}

function getAlert(id) {
  const stmt = db.prepare('SELECT * FROM alerts WHERE id = ?');
  const alert = stmt.get(id);
  if (!alert) return null;
  
  return {
    ...alert,
    isSevere: alert.isSevere === 1,
    unresponsive: alert.unresponsive === 1,
    triangulation: alert.triangulation ? JSON.parse(alert.triangulation) : null
  };
}

function getActiveAlertsByHotelAndType(hotelId, type) {
  const stmt = db.prepare("SELECT * FROM alerts WHERE hotelId = ? AND type = ? AND status = 'active' AND acknowledgedBy IS NULL");
  const rows = stmt.all(hotelId, type);
  return rows.map(a => ({
    ...a,
    isSevere: a.isSevere === 1,
    unresponsive: a.unresponsive === 1,
    triangulation: a.triangulation ? JSON.parse(a.triangulation) : null
  }));
}

function getRecentAlertsByHotel(hotelId, sinceTime) {
  const stmt = db.prepare('SELECT * FROM alerts WHERE hotelId = ? AND createdAt >= ?');
  const rows = stmt.all(hotelId, sinceTime);
  return rows.map(a => ({
    ...a,
    isSevere: a.isSevere === 1,
    unresponsive: a.unresponsive === 1,
    triangulation: a.triangulation ? JSON.parse(a.triangulation) : null
  }));
}

function getAlertsByHotel(hotelId, activeOnly = false) {
  let query = 'SELECT * FROM alerts WHERE hotelId = ?';
  if (activeOnly) {
    query += " AND status != 'resolved'";
  } else {
    // Optionally exclude very old resolved alerts as per original code logic (e.g. 2 hours)
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    const cutoff = Date.now() - TWO_HOURS;
    query += ` AND (status != 'resolved' OR resolvedAt > ${cutoff})`;
  }
  // Sort by createdAt descending
  query += ' ORDER BY createdAt DESC';
  
  const stmt = db.prepare(query);
  const rows = stmt.all(hotelId);
  return rows.map(a => ({
    ...a,
    isSevere: a.isSevere === 1,
    unresponsive: a.unresponsive === 1,
    triangulation: a.triangulation ? JSON.parse(a.triangulation) : null
  }));
}

function getAllActiveDispatchedAlerts() {
  const stmt = db.prepare("SELECT * FROM alerts WHERE status != 'resolved' AND dispatchedTo IS NOT NULL AND unresponsive = 0");
  const rows = stmt.all();
  return rows.map(a => ({
    ...a,
    isSevere: a.isSevere === 1,
    unresponsive: a.unresponsive === 1,
    triangulation: a.triangulation ? JSON.parse(a.triangulation) : null
  }));
}

module.exports = {
  db,
  insertHotel,
  getHotel,
  insertAlert,
  updateAlert,
  getAlert,
  getActiveAlertsByHotelAndType,
  getRecentAlertsByHotel,
  getAlertsByHotel,
  getAllActiveDispatchedAlerts
};
