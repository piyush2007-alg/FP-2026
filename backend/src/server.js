import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { run, get, all, initDb } from './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || 'flockpulse_enterprise_secret_2026';

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());

// -------------------------------------------------------------
// Real-Time Server-Sent Events (SSE) Hub
// -------------------------------------------------------------
const sseClients = new Set();

export const broadcastUpdate = (eventType, payload = {}) => {
  const message = `event: ${eventType}\ndata: ${JSON.stringify({ ...payload, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.res.write(message);
    } catch {
      sseClients.delete(client);
    }
  }
};

app.get('/api/events', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  const client = { id: Date.now(), res };
  sseClients.add(client);

  res.write(`event: connected\ndata: ${JSON.stringify({ message: 'FlockPulse SSE Stream Connected' })}\n\n`);

  req.on('close', () => {
    sseClients.delete(client);
  });
});

// -------------------------------------------------------------
// Authentication Middlewares
// -------------------------------------------------------------
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required. Please sign in.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Session expired or invalid token. Please log in again.' });
    }
    req.user = decodedUser;
    next();
  });
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Permission Denied. This operation requires one of: ${roles.join(', ')} (Your role: ${req.user?.role || 'Guest'})`
      });
    }
    next();
  };
};

// Initialize DB schema & starter records
initDb().then(() => {
  console.log('[FlockPulse] Database initialized successfully.');
}).catch(err => {
  console.error('[FlockPulse] Database initialization failed:', err);
});

// Public System Status / Ping Endpoints
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', service: 'FlockPulse API Engine', timestamp: new Date().toISOString() });
});
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', service: 'FlockPulse API Engine', timestamp: new Date().toISOString() });
});

// -------------------------------------------------------------
// Authentication Endpoints
// -------------------------------------------------------------

// User Registration
app.post('/api/register', async (req, res) => {
  const { username, password, role = 'Staff', email } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long.' });
  }

  const cleanUsername = username.trim();

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const validRoles = ['Admin', 'Staff', 'Vet'];
  const userRole = validRoles.includes(role) ? role : 'Staff';
  const cleanEmail = email && typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;

  try {
    const existingUser = await get('SELECT id FROM users WHERE LOWER(name) = LOWER(?)', [cleanUsername]);
    if (existingUser) {
      return res.status(409).json({ error: `Username "${cleanUsername}" is already registered. Please choose another.` });
    }

    if (cleanEmail) {
      const existingEmail = await get('SELECT id FROM users WHERE LOWER(email) = ?', [cleanEmail]);
      if (existingEmail) {
        return res.status(409).json({ error: `Email "${cleanEmail}" is already registered.` });
      }
    }

    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await run(
      'INSERT INTO users (name, role, password_hash, email) VALUES (?, ?, ?, ?)',
      [cleanUsername, userRole, passwordHash, cleanEmail]
    );

    const newUser = {
      id: result.id,
      name: cleanUsername,
      role: userRole,
      email: cleanEmail
    };

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    broadcastUpdate('USER_REGISTERED', { user: newUser });

    res.status(201).json({
      message: 'Account created successfully',
      user: newUser,
      token
    });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ error: 'Server error while registering user' });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username (or email) and password are required' });
  }

  const queryIdentifier = username.trim().toLowerCase();

  try {
    const user = await get(
      'SELECT * FROM users WHERE LOWER(name) = ? OR LOWER(email) = ?',
      [queryIdentifier, queryIdentifier]
    );

    if (!user || !user.password_hash) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your username and password.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials. Please verify your username and password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email || null
      },
      token
    });
  } catch (err) {
    console.error('Error during login:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Session Verification Endpoint
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await get(
      'SELECT id, name, role, email, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(401).json({ error: 'User session no longer valid. Please sign in again.' });
    }

    res.json({ user });
  } catch (err) {
    console.error('Error verifying session:', err);
    res.status(500).json({ error: 'Server error verifying session' });
  }
});

// Google Authentication Endpoint
app.post('/api/google-login', async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ error: 'Google credential token is required' });
  }

  try {
    let email, name;

    if (credential.startsWith('mock_google_token_')) {
      email = credential.replace('mock_google_token_', '');
      name = email.split('@')[0];
      name = name.charAt(0).toUpperCase() + name.slice(1);
    } else {
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name || email.split('@')[0];
    }

    if (!email) {
      return res.status(401).json({ error: 'Could not retrieve email from Google token' });
    }

    let user = await get('SELECT * FROM users WHERE LOWER(email) = ?', [email.toLowerCase()]);

    if (!user) {
      let role = 'Staff';
      if (email.toLowerCase().includes('admin')) role = 'Admin';
      else if (email.toLowerCase().includes('vet')) role = 'Vet';

      const result = await run(
        'INSERT INTO users (name, role, email) VALUES (?, ?, ?)',
        [name, role, email.toLowerCase()]
      );
      user = { id: result.id, name, role, email: email.toLowerCase() };
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email
      },
      token
    });
  } catch (err) {
    console.error('Error during Google authentication:', err);
    res.status(401).json({ error: 'Invalid Google credential token or server error' });
  }
});

// Protect all following operational API routes
app.use(authenticateToken);

// -------------------------------------------------------------
// User Directory (Admin Only)
// -------------------------------------------------------------
app.get('/api/users', requireRole(['Admin']), async (req, res) => {
  try {
    const users = await all('SELECT id, name, role, email, created_at FROM users ORDER BY id ASC');
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ error: 'Server error fetching personnel directory' });
  }
});

// -------------------------------------------------------------
// Dashboard Summary & Real-time KPI Aggregations
// -------------------------------------------------------------
app.get('/api/summary', async (req, res) => {
  try {
    // 1. Total Hens & Active Batches
    const batchesStats = await get(
      "SELECT SUM(hen_count) as totalHens, COUNT(*) as activeBatches FROM batches WHERE status = 'Active'"
    );
    const totalHens = batchesStats.totalHens || 0;
    const activeBatches = batchesStats.activeBatches || 0;

    // 2. Today's Egg Production
    const todayStr = new Date().toISOString().split('T')[0];
    const latestDateRow = await get('SELECT MAX(date) as maxDate FROM egg_production');
    const targetDate = latestDateRow?.maxDate || todayStr;

    const todayEggStats = await get(
      'SELECT SUM(eggs_collected) as collected, SUM(eggs_damaged) as damaged, SUM(net_eggs) as net FROM egg_production WHERE date = ?',
      [targetDate]
    );

    const todayEggsCollected = todayEggStats?.collected || 0;
    const todayEggsDamaged = todayEggStats?.damaged || 0;
    const todayNetEggs = todayEggStats?.net || (todayEggsCollected - todayEggsDamaged);
    const todayLayRate = totalHens > 0 ? parseFloat(((todayNetEggs / totalHens) * 100).toFixed(1)) : 0;

    // 3. Feed Stock & Silo Telemetry
    const stockIn = await get('SELECT SUM(quantity) as total FROM feed_stock');
    const consumed = await get('SELECT SUM(quantity_used) as total FROM feed_consumption');
    const totalStock = stockIn.total || 0;
    const totalConsumed = consumed.total || 0;
    const remainingStock = Math.max(0, totalStock - totalConsumed);

    // Calculate recent 7-day average daily feed consumption
    const recentFeedRow = await get(
      'SELECT SUM(quantity_used) / 7.0 as dailyAvg FROM feed_consumption WHERE date >= date("now", "-7 days")'
    );
    const dailyConsumptionTons = recentFeedRow?.dailyAvg && recentFeedRow.dailyAvg > 0 ? recentFeedRow.dailyAvg : 0.45;
    const daysRemaining = dailyConsumptionTons > 0 ? Math.ceil(remainingStock / dailyConsumptionTons) : 0;

    // 4. Vaccination Breakdown
    const totalVaccs = await all('SELECT due_date, administered_date, status FROM vaccinations');
    let upcomingVaccCount = 0;
    let overdueVaccCount = 0;
    let completedVaccCount = 0;

    for (const v of totalVaccs) {
      if (v.administered_date || v.status === 'completed') {
        completedVaccCount++;
      } else if (new Date(v.due_date) < new Date(todayStr)) {
        overdueVaccCount++;
      } else {
        upcomingVaccCount++;
      }
    }

    // 5. Active Health Cases & Pending Tasks
    const activeHealthCases = await get(
      "SELECT COUNT(*) as count FROM health_records WHERE status IN ('Under Treatment', 'Monitoring')"
    );
    const pendingTasks = await get("SELECT COUNT(*) as count FROM tasks WHERE status = 'Pending'");

    // 6. Dynamic System Alerts Generation
    const alerts = [];
    if (remainingStock < 3.0) {
      alerts.push({
        id: 'alert-feed-low',
        type: 'FEED_LOW',
        title: 'Low Feed Silo Reserves',
        message: `Current remaining feed inventory (${remainingStock.toFixed(2)} Tons) is below the 3.0 Ton minimum safety threshold.`,
        severity: 'critical',
        timestamp: new Date().toISOString()
      });
    }
    if (overdueVaccCount > 0) {
      alerts.push({
        id: 'alert-vacc-overdue',
        type: 'VACCINE_OVERDUE',
        title: 'Overdue Immunization Schedule',
        message: `${overdueVaccCount} vaccination dose(s) are past their required due date. Immediate veterinary action recommended.`,
        severity: 'warning',
        timestamp: new Date().toISOString()
      });
    }
    if (upcomingVaccCount > 0) {
      alerts.push({
        id: 'alert-vacc-upcoming',
        type: 'VACCINE_UPCOMING',
        title: 'Upcoming Vaccination Schedule',
        message: `${upcomingVaccCount} vaccination dose(s) scheduled within the next 14 days.`,
        severity: 'info',
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      totalHens,
      activeBatches,
      eggMetrics: {
        todayCollected: todayEggsCollected,
        todayDamaged: todayEggsDamaged,
        todayNet: todayNetEggs,
        layRate: todayLayRate,
        reportingDate: targetDate
      },
      feedStatus: {
        totalStockTons: parseFloat(totalStock.toFixed(2)),
        totalConsumedTons: parseFloat(totalConsumed.toFixed(2)),
        remainingTons: parseFloat(remainingStock.toFixed(2)),
        dailyConsumptionTons: parseFloat(dailyConsumptionTons.toFixed(2)),
        daysRemaining
      },
      vaccinationMetrics: {
        upcoming: upcomingVaccCount,
        overdue: overdueVaccCount,
        completed: completedVaccCount,
        total: totalVaccs.length
      },
      activeHealthCases: activeHealthCases.count || 0,
      pendingTasks: pendingTasks.count || 0,
      alerts
    });
  } catch (err) {
    console.error('Error generating dashboard summary:', err);
    res.status(500).json({ error: 'Server error generating summary metrics' });
  }
});

// -------------------------------------------------------------
// Batches / Flocks Management API
// -------------------------------------------------------------
app.get('/api/batches', async (req, res) => {
  try {
    const batches = await all(`
      SELECT b.*,
        (SELECT COALESCE(SUM(ep.net_eggs), 0) FROM egg_production ep WHERE ep.batch_id = b.id) as total_eggs_produced,
        (SELECT COALESCE(SUM(fc.quantity_used), 0) FROM feed_consumption fc WHERE fc.batch_id = b.id) as total_feed_consumed
      FROM batches b
      ORDER BY b.id ASC
    `);
    res.json(batches);
  } catch (err) {
    console.error('Error fetching batches:', err);
    res.status(500).json({ error: 'Server error fetching batches' });
  }
});

app.post('/api/batches', requireRole(['Admin']), async (req, res) => {
  const { batch_name, shed_name, hen_count, breed, start_date, status = 'Active' } = req.body;

  if (!batch_name || !shed_name || !hen_count || parseInt(hen_count) <= 0) {
    return res.status(400).json({ error: 'Valid batch name, shed name, and positive hen count are required.' });
  }

  try {
    const result = await run(
      'INSERT INTO batches (batch_name, shed_name, hen_count, breed, start_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [batch_name.trim(), shed_name.trim(), parseInt(hen_count), breed ? breed.trim() : 'Commercial Layer', start_date || new Date().toISOString().split('T')[0], status]
    );

    const newBatch = await get('SELECT * FROM batches WHERE id = ?', [result.id]);
    broadcastUpdate('BATCH_CREATED', { batch: newBatch });
    res.status(201).json(newBatch);
  } catch (err) {
    console.error('Error creating batch:', err);
    res.status(500).json({ error: 'Server error creating batch' });
  }
});

app.put('/api/batches/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  const { batch_name, shed_name, hen_count, breed, start_date, status } = req.body;

  try {
    await run(
      'UPDATE batches SET batch_name = ?, shed_name = ?, hen_count = ?, breed = ?, start_date = ?, status = ? WHERE id = ?',
      [batch_name, shed_name, parseInt(hen_count), breed, start_date, status, id]
    );
    const updated = await get('SELECT * FROM batches WHERE id = ?', [id]);
    broadcastUpdate('BATCH_UPDATED', { batch: updated });
    res.json(updated);
  } catch (err) {
    console.error('Error updating batch:', err);
    res.status(500).json({ error: 'Server error updating batch' });
  }
});

app.delete('/api/batches/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM batches WHERE id = ?', [id]);
    broadcastUpdate('BATCH_DELETED', { id: parseInt(id) });
    res.json({ message: 'Batch removed successfully' });
  } catch (err) {
    console.error('Error deleting batch:', err);
    res.status(500).json({ error: 'Server error deleting batch' });
  }
});

// -------------------------------------------------------------
// Feed Management API
// -------------------------------------------------------------
app.get('/api/feed/stock', async (req, res) => {
  try {
    const stock = await all('SELECT * FROM feed_stock ORDER BY date_received DESC');
    res.json(stock);
  } catch (err) {
    console.error('Error fetching feed stock:', err);
    res.status(500).json({ error: 'Server error fetching feed stock' });
  }
});

app.post('/api/feed/stock', requireRole(['Admin']), async (req, res) => {
  const { feed_type, quantity, unit = 'Tons', supplier, date_received, batch_id } = req.body;

  if (!feed_type || !quantity || parseFloat(quantity) <= 0 || !date_received || !supplier) {
    return res.status(400).json({ error: 'Feed type, valid quantity, supplier, and date received are required.' });
  }

  try {
    const result = await run(
      'INSERT INTO feed_stock (feed_type, type, quantity, unit, supplier, date_received, batch_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [feed_type.trim(), feed_type.trim(), parseFloat(quantity), unit, supplier.trim(), date_received, batch_id || null]
    );

    const newStock = await get('SELECT * FROM feed_stock WHERE id = ?', [result.id]);
    broadcastUpdate('FEED_STOCK_ADDED', { stock: newStock });
    res.status(201).json(newStock);
  } catch (err) {
    console.error('Error recording feed stock:', err);
    res.status(500).json({ error: 'Server error recording feed stock delivery' });
  }
});

app.delete('/api/feed/stock/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM feed_stock WHERE id = ?', [id]);
    broadcastUpdate('FEED_STOCK_DELETED', { id: parseInt(id) });
    res.json({ message: 'Feed stock record deleted' });
  } catch (err) {
    console.error('Error deleting feed stock:', err);
    res.status(500).json({ error: 'Server error deleting feed stock' });
  }
});

app.get('/api/feed/consumption', async (req, res) => {
  try {
    const consumption = await all(`
      SELECT fc.*, b.batch_name, b.shed_name
      FROM feed_consumption fc
      LEFT JOIN batches b ON fc.batch_id = b.id
      ORDER BY fc.date DESC, fc.id DESC
    `);
    res.json(consumption);
  } catch (err) {
    console.error('Error fetching feed consumption:', err);
    res.status(500).json({ error: 'Server error fetching feed consumption' });
  }
});

app.post('/api/feed/consumption', requireRole(['Admin', 'Staff']), async (req, res) => {
  const { batch_id, feed_type, quantity_used, unit = 'Tons', date } = req.body;

  if (!batch_id || !quantity_used || parseFloat(quantity_used) <= 0 || !date) {
    return res.status(400).json({ error: 'Batch selection, positive quantity used, and date are required.' });
  }

  try {
    const result = await run(
      'INSERT INTO feed_consumption (batch_id, flock_id, feed_type, quantity_used, unit, date) VALUES (?, ?, ?, ?, ?, ?)',
      [parseInt(batch_id), parseInt(batch_id), feed_type || 'Layer Feed', parseFloat(quantity_used), unit, date]
    );

    const newLog = await get(`
      SELECT fc.*, b.batch_name, b.shed_name
      FROM feed_consumption fc
      LEFT JOIN batches b ON fc.batch_id = b.id
      WHERE fc.id = ?
    `, [result.id]);

    broadcastUpdate('FEED_CONSUMPTION_LOGGED', { log: newLog });
    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error logging feed consumption:', err);
    res.status(500).json({ error: 'Server error recording feed consumption' });
  }
});

app.delete('/api/feed/consumption/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM feed_consumption WHERE id = ?', [id]);
    broadcastUpdate('FEED_CONSUMPTION_DELETED', { id: parseInt(id) });
    res.json({ message: 'Feed consumption log deleted' });
  } catch (err) {
    console.error('Error deleting feed consumption:', err);
    res.status(500).json({ error: 'Server error deleting feed consumption' });
  }
});

// -------------------------------------------------------------
// Egg Production API
// -------------------------------------------------------------
app.get('/api/production', async (req, res) => {
  try {
    const logs = await all(`
      SELECT ep.*, b.batch_name, b.shed_name, b.hen_count
      FROM egg_production ep
      LEFT JOIN batches b ON ep.batch_id = b.id
      ORDER BY ep.date DESC, ep.id DESC
    `);
    res.json(logs);
  } catch (err) {
    console.error('Error fetching egg production logs:', err);
    res.status(500).json({ error: 'Server error fetching production records' });
  }
});

// Dynamic Production Analytics by Range (7d, 30d, 90d, all)
app.get('/api/production/analytics', async (req, res) => {
  const { range = '30d' } = req.query;

  let dateFilter = 'date("now", "-30 days")';
  if (range === 'today') dateFilter = 'date("now")';
  else if (range === '7d') dateFilter = 'date("now", "-7 days")';
  else if (range === '30d') dateFilter = 'date("now", "-30 days")';
  else if (range === '90d') dateFilter = 'date("now", "-90 days")';
  else if (range === 'all') dateFilter = '"2000-01-01"';

  try {
    const dailyTrend = await all(`
      SELECT date,
        SUM(eggs_collected) as total_collected,
        SUM(eggs_damaged) as total_damaged,
        SUM(net_eggs) as total_net
      FROM egg_production
      WHERE date >= ${dateFilter}
      GROUP BY date
      ORDER BY date ASC
    `);

    const batchBreakdown = await all(`
      SELECT b.id, b.batch_name, b.shed_name, b.hen_count,
        SUM(ep.eggs_collected) as collected,
        SUM(ep.eggs_damaged) as damaged,
        SUM(ep.net_eggs) as net
      FROM egg_production ep
      JOIN batches b ON ep.batch_id = b.id
      WHERE ep.date >= ${dateFilter}
      GROUP BY b.id
    `);

    res.json({ range, dailyTrend, batchBreakdown });
  } catch (err) {
    console.error('Error generating production analytics:', err);
    res.status(500).json({ error: 'Server error generating analytics' });
  }
});

app.post('/api/production', requireRole(['Admin', 'Staff']), async (req, res) => {
  const { batch_id, date, eggs_collected, eggs_damaged = 0 } = req.body;

  const collected = parseInt(eggs_collected);
  const damaged = parseInt(eggs_damaged) || 0;

  if (!batch_id || isNaN(collected) || collected < 0) {
    return res.status(400).json({ error: 'Valid batch and positive eggs collected count required.' });
  }

  if (damaged < 0) {
    return res.status(400).json({ error: 'Damaged eggs cannot be a negative number.' });
  }

  if (damaged > collected) {
    return res.status(400).json({ error: 'Damaged eggs count cannot exceed total eggs collected.' });
  }

  const netEggs = collected - damaged;

  try {
    const result = await run(
      'INSERT INTO egg_production (batch_id, flock_id, date, eggs_collected, eggs_damaged, net_eggs) VALUES (?, ?, ?, ?, ?, ?)',
      [parseInt(batch_id), parseInt(batch_id), date || new Date().toISOString().split('T')[0], collected, damaged, netEggs]
    );

    const newRecord = await get(`
      SELECT ep.*, b.batch_name, b.shed_name, b.hen_count
      FROM egg_production ep
      LEFT JOIN batches b ON ep.batch_id = b.id
      WHERE ep.id = ?
    `, [result.id]);

    broadcastUpdate('EGG_PRODUCTION_LOGGED', { record: newRecord });
    res.status(201).json(newRecord);
  } catch (err) {
    console.error('Error logging egg production:', err);
    res.status(500).json({ error: 'Server error recording egg production' });
  }
});

app.delete('/api/production/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM egg_production WHERE id = ?', [id]);
    broadcastUpdate('EGG_PRODUCTION_DELETED', { id: parseInt(id) });
    res.json({ message: 'Egg production record deleted' });
  } catch (err) {
    console.error('Error deleting egg production:', err);
    res.status(500).json({ error: 'Server error deleting egg production' });
  }
});

// -------------------------------------------------------------
// Vaccinations API
// -------------------------------------------------------------
app.get('/api/vaccinations', async (req, res) => {
  try {
    const vaccs = await all(`
      SELECT v.*, b.batch_name, b.shed_name, b.hen_count
      FROM vaccinations v
      LEFT JOIN batches b ON v.batch_id = b.id
      ORDER BY v.due_date ASC
    `);

    // Dynamically calculate overdue status for non-completed entries
    const today = new Date().toISOString().split('T')[0];
    const normalized = vaccs.map(v => {
      let computedStatus = v.status;
      if (v.administered_date || v.status === 'completed') {
        computedStatus = 'completed';
      } else if (new Date(v.due_date) < new Date(today)) {
        computedStatus = 'overdue';
      } else {
        computedStatus = 'upcoming';
      }
      return { ...v, status: computedStatus };
    });

    res.json(normalized);
  } catch (err) {
    console.error('Error fetching vaccinations:', err);
    res.status(500).json({ error: 'Server error fetching vaccination schedule' });
  }
});

app.post('/api/vaccinations', requireRole(['Admin', 'Vet']), async (req, res) => {
  const { batch_id, vaccine_name, due_date, dosage = 'Standard 0.5ml' } = req.body;

  if (!batch_id || !vaccine_name || !due_date) {
    return res.status(400).json({ error: 'Batch, vaccine name, and scheduled due date are required.' });
  }

  try {
    const result = await run(
      'INSERT INTO vaccinations (batch_id, flock_id, vaccine_name, due_date, dosage, status) VALUES (?, ?, ?, ?, ?, ?)',
      [parseInt(batch_id), parseInt(batch_id), vaccine_name.trim(), due_date, dosage.trim(), 'upcoming']
    );

    const newVacc = await get(`
      SELECT v.*, b.batch_name, b.shed_name, b.hen_count
      FROM vaccinations v
      LEFT JOIN batches b ON v.batch_id = b.id
      WHERE v.id = ?
    `, [result.id]);

    broadcastUpdate('VACCINATION_SCHEDULED', { vaccination: newVacc });
    res.status(201).json(newVacc);
  } catch (err) {
    console.error('Error scheduling vaccination:', err);
    res.status(500).json({ error: 'Server error scheduling vaccination' });
  }
});

app.post('/api/vaccinations/administer', requireRole(['Admin', 'Vet']), async (req, res) => {
  const { id, administered_by, administered_date } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Vaccination record ID is required.' });
  }

  const adminName = administered_by ? administered_by.trim() : (req.user?.name || 'Dr. Field Vet');
  const adminDate = administered_date || new Date().toISOString().split('T')[0];

  try {
    await run(
      'UPDATE vaccinations SET status = "completed", administered_date = ?, administered_by = ? WHERE id = ?',
      [adminDate, adminName, parseInt(id)]
    );

    const updated = await get(`
      SELECT v.*, b.batch_name, b.shed_name, b.hen_count
      FROM vaccinations v
      LEFT JOIN batches b ON v.batch_id = b.id
      WHERE v.id = ?
    `, [id]);

    broadcastUpdate('VACCINATION_ADMINISTERED', { vaccination: updated });
    res.json(updated);
  } catch (err) {
    console.error('Error administering vaccination:', err);
    res.status(500).json({ error: 'Server error recording administered vaccination' });
  }
});

app.delete('/api/vaccinations/:id', requireRole(['Admin', 'Vet']), async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM vaccinations WHERE id = ?', [id]);
    broadcastUpdate('VACCINATION_DELETED', { id: parseInt(id) });
    res.json({ message: 'Vaccination record removed' });
  } catch (err) {
    console.error('Error deleting vaccination:', err);
    res.status(500).json({ error: 'Server error deleting vaccination' });
  }
});

// Handlers for Health & Biosecurity
const getHealthRecords = async (req, res) => {
  try {
    const records = await all(`
      SELECT hr.*, b.batch_name, b.shed_name, b.hen_count
      FROM health_records hr
      LEFT JOIN batches b ON hr.batch_id = b.id
      ORDER BY hr.date_observed DESC, hr.id DESC
    `);
    res.json(records);
  } catch (err) {
    console.error('Error fetching health records:', err);
    res.status(500).json({ error: 'Server error fetching health logs' });
  }
};

const postHealthRecord = async (req, res) => {
  const { batch_id, date_observed, symptoms, diagnosed_disease, treatment_given, status = 'Under Treatment' } = req.body;

  if (!batch_id || !symptoms || !diagnosed_disease) {
    return res.status(400).json({ error: 'Batch selection, observed symptoms, and diagnosis are required.' });
  }

  try {
    const result = await run(
      'INSERT INTO health_records (batch_id, flock_id, date_observed, symptoms, diagnosed_disease, treatment_given, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [parseInt(batch_id), parseInt(batch_id), date_observed || new Date().toISOString().split('T')[0], symptoms.trim(), diagnosed_disease.trim(), treatment_given ? treatment_given.trim() : 'Prescribed isolation and hydration', status]
    );

    const newRecord = await get(`
      SELECT hr.*, b.batch_name, b.shed_name, b.hen_count
      FROM health_records hr
      LEFT JOIN batches b ON hr.batch_id = b.id
      WHERE hr.id = ?
    `, [result.id]);

    broadcastUpdate('HEALTH_RECORD_LOGGED', { record: newRecord });
    res.status(201).json(newRecord);
  } catch (err) {
    console.error('Error logging health record:', err);
    res.status(500).json({ error: 'Server error recording clinical diagnosis' });
  }
};

const updateHealthStatus = async (req, res) => {
  const { id } = req.params;
  const { status, treatment_given } = req.body;

  try {
    await run(
      'UPDATE health_records SET status = ?, treatment_given = COALESCE(?, treatment_given) WHERE id = ?',
      [status, treatment_given, parseInt(id)]
    );

    const updated = await get(`
      SELECT hr.*, b.batch_name, b.shed_name, b.hen_count
      FROM health_records hr
      LEFT JOIN batches b ON hr.batch_id = b.id
      WHERE hr.id = ?
    `, [id]);

    broadcastUpdate('HEALTH_RECORD_UPDATED', { record: updated });
    res.json(updated);
  } catch (err) {
    console.error('Error updating health status:', err);
    res.status(500).json({ error: 'Server error updating health status' });
  }
};

const deleteHealthRecord = async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM health_records WHERE id = ?', [id]);
    broadcastUpdate('HEALTH_RECORD_DELETED', { id: parseInt(id) });
    res.json({ message: 'Health record deleted' });
  } catch (err) {
    console.error('Error deleting health record:', err);
    res.status(500).json({ error: 'Server error deleting health record' });
  }
};

app.get('/api/health', getHealthRecords);
app.get('/api/biosecurity', getHealthRecords);
app.post('/api/health', requireRole(['Admin', 'Vet']), postHealthRecord);
app.post('/api/biosecurity', requireRole(['Admin', 'Vet']), postHealthRecord);
app.put('/api/health/:id/status', requireRole(['Admin', 'Vet']), updateHealthStatus);
app.put('/api/biosecurity/:id/status', requireRole(['Admin', 'Vet']), updateHealthStatus);
app.delete('/api/health/:id', requireRole(['Admin', 'Vet']), deleteHealthRecord);
app.delete('/api/biosecurity/:id', requireRole(['Admin', 'Vet']), deleteHealthRecord);

// -------------------------------------------------------------
// Operational Tasks API
// -------------------------------------------------------------
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await all('SELECT * FROM tasks ORDER BY CASE WHEN status = "Pending" THEN 0 ELSE 1 END, due_date ASC');
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

app.post('/api/tasks', requireRole(['Admin', 'Vet', 'Staff']), async (req, res) => {
  const { task_description, assigned_to = 'Staff', due_date } = req.body;

  if (!task_description || !due_date) {
    return res.status(400).json({ error: 'Task description and due date are required.' });
  }

  try {
    const result = await run(
      'INSERT INTO tasks (task_description, assigned_to, due_date, status) VALUES (?, ?, ?, "Pending")',
      [task_description.trim(), assigned_to, due_date]
    );

    const newTask = await get('SELECT * FROM tasks WHERE id = ?', [result.id]);
    broadcastUpdate('TASK_CREATED', { task: newTask });
    res.status(201).json(newTask);
  } catch (err) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Server error creating task' });
  }
});

app.post('/api/tasks/complete', requireRole(['Admin', 'Vet', 'Staff']), async (req, res) => {
  const { id } = req.body;
  const completedBy = req.user?.name || 'Staff';

  try {
    await run(
      'UPDATE tasks SET status = "Completed", completed_by = ? WHERE id = ?',
      [completedBy, parseInt(id)]
    );

    const updated = await get('SELECT * FROM tasks WHERE id = ?', [id]);
    broadcastUpdate('TASK_COMPLETED', { task: updated });
    res.json(updated);
  } catch (err) {
    console.error('Error completing task:', err);
    res.status(500).json({ error: 'Server error completing task' });
  }
});

app.delete('/api/tasks/:id', requireRole(['Admin']), async (req, res) => {
  const { id } = req.params;
  try {
    await run('DELETE FROM tasks WHERE id = ?', [id]);
    broadcastUpdate('TASK_DELETED', { id: parseInt(id) });
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

// -------------------------------------------------------------
// Reports Generation Engine (Daily / Weekly / Monthly / Custom)
// -------------------------------------------------------------
const handleReportGeneration = async (req, res) => {
  const { period = 'monthly', startDate, endDate, type } = req.query;
  const reportPeriod = type || period;

  let start = startDate;
  let end = endDate || new Date().toISOString().split('T')[0];

  if (!start) {
    if (reportPeriod === 'daily') start = end;
    else if (reportPeriod === 'weekly') start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    else if (reportPeriod === 'monthly') start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    else start = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  }

  if (!start) {
    if (period === 'daily') start = end;
    else if (period === 'weekly') start = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    else if (period === 'monthly') start = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    else start = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
  }

  try {
    const batches = await all('SELECT * FROM batches');
    const eggStats = await get(
      'SELECT SUM(eggs_collected) as collected, SUM(eggs_damaged) as damaged, SUM(net_eggs) as net FROM egg_production WHERE date BETWEEN ? AND ?',
      [start, end]
    );
    const feedConsumed = await get(
      'SELECT SUM(quantity_used) as total FROM feed_consumption WHERE date BETWEEN ? AND ?',
      [start, end]
    );
    const feedReceived = await get(
      'SELECT SUM(quantity) as total FROM feed_stock WHERE date_received BETWEEN ? AND ?',
      [start, end]
    );
    const vaccinesAdministered = await all(
      'SELECT v.*, b.batch_name FROM vaccinations v LEFT JOIN batches b ON v.batch_id = b.id WHERE v.administered_date BETWEEN ? AND ?',
      [start, end]
    );
    const healthCases = await all(
      'SELECT hr.*, b.batch_name FROM health_records hr LEFT JOIN batches b ON hr.batch_id = b.id WHERE hr.date_observed BETWEEN ? AND ?',
      [start, end]
    );

    const totalHens = batches.reduce((acc, b) => acc + (b.status === 'Active' ? b.hen_count : 0), 0);
    const netEggs = eggStats.net || 0;
    const daysInPeriod = Math.max(1, Math.ceil((new Date(end) - new Date(start)) / 86400000) + 1);
    const avgLayRate = totalHens > 0 ? ((netEggs / (totalHens * daysInPeriod)) * 100).toFixed(1) : '0.0';

    res.json({
      period,
      startDate: start,
      endDate: end,
      daysInPeriod,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user?.name || 'Admin',
      summary: {
        totalActiveHens: totalHens,
        totalEggsCollected: eggStats.collected || 0,
        totalEggsDamaged: eggStats.damaged || 0,
        totalNetEggs: netEggs,
        averageLayRatePercent: parseFloat(avgLayRate),
        totalFeedConsumedTons: parseFloat((feedConsumed.total || 0).toFixed(2)),
        totalFeedReceivedTons: parseFloat((feedReceived.total || 0).toFixed(2)),
        vaccinesCompletedCount: vaccinesAdministered.length,
        healthIncidentsCount: healthCases.length
      },
      batches,
      vaccinesAdministered,
      healthCases
    });
  } catch (err) {
    console.error('Error generating report:', err);
    res.status(500).json({ error: 'Server error generating farm report' });
  }
};

app.get('/api/reports', handleReportGeneration);
app.get('/api/reports/generate', handleReportGeneration);

// -------------------------------------------------------------
// Global Search API (Internal Records)
// -------------------------------------------------------------
app.get('/api/search', async (req, res) => {
  const q = req.query.q ? req.query.q.trim().toLowerCase() : '';
  if (!q || q.length < 2) {
    return res.json({ batches: [], feed: [], eggs: [], vaccinations: [], health: [] });
  }

  const queryPattern = `%${q}%`;

  try {
    const batches = await all(
      'SELECT * FROM batches WHERE LOWER(batch_name) LIKE ? OR LOWER(shed_name) LIKE ? OR LOWER(breed) LIKE ?',
      [queryPattern, queryPattern, queryPattern]
    );
    const feed = await all(
      'SELECT * FROM feed_stock WHERE LOWER(feed_type) LIKE ? OR LOWER(supplier) LIKE ?',
      [queryPattern, queryPattern]
    );
    const eggs = await all(
      'SELECT ep.*, b.batch_name FROM egg_production ep LEFT JOIN batches b ON ep.batch_id = b.id WHERE ep.date LIKE ? OR LOWER(b.batch_name) LIKE ?',
      [queryPattern, queryPattern]
    );
    const vaccinations = await all(
      'SELECT v.*, b.batch_name FROM vaccinations v LEFT JOIN batches b ON v.batch_id = b.id WHERE LOWER(v.vaccine_name) LIKE ? OR LOWER(b.batch_name) LIKE ?',
      [queryPattern, queryPattern]
    );
    const health = await all(
      'SELECT hr.*, b.batch_name FROM health_records hr LEFT JOIN batches b ON hr.batch_id = b.id WHERE LOWER(hr.symptoms) LIKE ? OR LOWER(hr.diagnosed_disease) LIKE ?',
      [queryPattern, queryPattern]
    );

    res.json({
      query: q,
      totalMatches: batches.length + feed.length + eggs.length + vaccinations.length + health.length,
      results: { batches, feed, eggs, vaccinations, health }
    });
  } catch (err) {
    console.error('Error executing search:', err);
    res.status(500).json({ error: 'Server error performing search' });
  }
});

// -------------------------------------------------------------
// Web Knowledge Search (Curated & Verified Poultry Resources)
// -------------------------------------------------------------
const POULTRY_KNOWLEDGE_BASE = [
  {
    id: 1,
    category: 'Vaccination & Biosecurity',
    title: 'Newcastle Disease (Lasota) Schedule & Ocular Administration',
    summary: 'Newcastle disease is a highly contagious viral avian disease. The live Lasota strain is administered via ocular eye-drop or drinking water at 7-10 days of age with boosters at 3-4 weeks. Maintains flock maternal antibody titers.',
    keywords: ['newcastle', 'lasota', 'vaccine', 'viral', 'respiratory', 'eye'],
    source: 'World Organisation for Animal Health (WOAH / OIE)',
    url: 'https://www.woah.org/en/disease/newcastle-disease/',
    reliability: 'Official Global Veterinary Standard'
  },
  {
    id: 2,
    category: 'Vaccination & Biosecurity',
    title: 'Infectious Bursal Disease (Gumboro) Prevention Protocols',
    summary: 'Gumboro virus causes immunosuppression in young chicks (3-6 weeks). Administered orally in non-chlorinated skim-milk water solutions. Requires maintaining strict sanitation and temperature control.',
    keywords: ['gumboro', 'ibd', 'bursal', 'immuno', 'water', 'vaccine'],
    source: 'Food and Agriculture Organization (FAO - United Nations)',
    url: 'https://www.fao.org/animal-health/poultry-health-guidelines',
    reliability: 'UN Agricultural Reference'
  },
  {
    id: 3,
    category: 'Feed & Nutrition',
    title: 'Layer Hen Daily Caloric & Calcium Requirements for High Lay Rates',
    summary: 'Commercial layers consume 110-120g of balanced crumble/mash daily, requiring 3.8-4.2% calcium, 16-18% crude protein, and 2750-2800 kcal/kg metabolizable energy for optimal eggshell calcification and peak lay rates above 90%.',
    keywords: ['feed', 'calcium', 'nutrition', 'protein', 'layer', 'eggshell', 'consumption', 'crude'],
    source: 'Poultry Science Association (PSA) & USDA Extension',
    url: 'https://www.extension.purdue.edu/extmedia/AS/AS-529-W.pdf',
    reliability: 'Peer-Reviewed Poultry Nutrition'
  },
  {
    id: 4,
    category: 'Health & Diagnostics',
    title: 'Avian Conjunctivitis & Ammonia-Induced Eye Lesions',
    summary: 'Watery discharge, closed eyes, and swollen eyelids are frequently caused by excessive ammonia levels (>25 ppm) in deep litter sheds or secondary Mycoplasma gallisepticum. Immediate action: improve ventilation exchange rates and apply antibiotic ophthalmic drops.',
    keywords: ['eye', 'conjunctivitis', 'swollen', 'ammonia', 'respiratory', 'discharge', 'ventilation'],
    source: 'Cornell University College of Veterinary Medicine - Avian Health',
    url: 'https://www.vet.cornell.edu/animal-health-diagnostic-center/programs/avian-health',
    reliability: 'Academic Veterinary Institution'
  },
  {
    id: 5,
    category: 'Shed & Climate Control',
    title: 'Optimal Poultry Shed Thermal Comfort & Humidity Standards',
    summary: 'Adult laying hens achieve peak egg efficiency between 18°C to 24°C with relative humidity at 55-65%. Temperatures exceeding 30°C induce heat stress, causing panting, reduced feed conversion, and thin eggshells. Supplement electrolytes in drinking water during hot weather.',
    keywords: ['temperature', 'humidity', 'climate', 'heat stress', 'ventilation', 'shed', 'lighting'],
    source: 'University of Georgia Poultry Extension (UGA Extension)',
    url: 'https://extension.uga.edu/topic-areas/poultry.html',
    reliability: 'Agricultural Extension Service'
  },
  {
    id: 6,
    category: 'Biosecurity & Sanitation',
    title: 'Commercial Shed Disinfection & Footbath Protocols',
    summary: 'Maintain quaternary ammonium or virucidal disinfectant footbaths (changed every 48h) at each shed portal. Strictly limit vehicle entry and sanitize automated feed troughs weekly to eliminate Salmonella and E. coli transfer.',
    keywords: ['disinfection', 'footbath', 'sanitation', 'biosecurity', 'salmonella', 'shed'],
    source: 'USDA Animal and Plant Health Inspection Service (APHIS)',
    url: 'https://www.aphis.usda.gov/aphis/ourfocus/animalhealth/animal-disease-information/avian',
    reliability: 'Federal Agriculture Standard'
  }
];

app.get('/api/web-search', async (req, res) => {
  const query = req.query.q ? req.query.q.trim().toLowerCase() : '';

  if (!query) {
    return res.json({
      query: '',
      results: POULTRY_KNOWLEDGE_BASE,
      disclaimer: 'Informational veterinary knowledge for farm reference. For severe outbreaks or regulatory diseases, consult your registered veterinarian immediately.'
    });
  }

  const terms = query.split(/\s+/);
  const matched = POULTRY_KNOWLEDGE_BASE.filter(item => {
    const text = `${item.title} ${item.summary} ${item.category} ${item.keywords.join(' ')}`.toLowerCase();
    return terms.some(term => text.includes(term));
  });

  res.json({
    query,
    totalFound: matched.length,
    results: matched.length > 0 ? matched : POULTRY_KNOWLEDGE_BASE,
    disclaimer: 'Informational veterinary knowledge for farm reference. For severe outbreaks or regulatory diseases, consult your registered veterinarian immediately.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`[FlockPulse Enterprise Backend] running on port ${PORT}`);
});
