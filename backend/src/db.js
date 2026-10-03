import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, '../poultry.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON;');

// Promise wrappers
export const run = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const get = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const all = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Initialize database schema and seeds
export const initDb = async () => {
  try {
    // 1. Users Table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        role TEXT NOT NULL DEFAULT 'Staff',
        password_hash TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Comprehensive Table Column Migrations for existing databases
    try {
      // Users
      const userCols = (await all("PRAGMA table_info(users)")).map(c => c.name);
      if (!userCols.includes('email')) await run("ALTER TABLE users ADD COLUMN email TEXT");
      if (!userCols.includes('password_hash')) await run("ALTER TABLE users ADD COLUMN password_hash TEXT");
      if (!userCols.includes('role')) await run("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'Staff'");
      if (!userCols.includes('created_at')) {
        await run("ALTER TABLE users ADD COLUMN created_at DATETIME");
        await run("UPDATE users SET created_at = datetime('now') WHERE created_at IS NULL");
      }

      // Batches
      const batchCols = (await all("PRAGMA table_info(batches)")).map(c => c.name);
      if (!batchCols.includes('breed')) await run("ALTER TABLE batches ADD COLUMN breed TEXT");
      if (!batchCols.includes('shed_name')) await run("ALTER TABLE batches ADD COLUMN shed_name TEXT DEFAULT 'Shed 1'");
      if (!batchCols.includes('status')) await run("ALTER TABLE batches ADD COLUMN status TEXT NOT NULL DEFAULT 'Active'");

      // Feed Stock
      const stockCols = (await all("PRAGMA table_info(feed_stock)")).map(c => c.name);
      if (!stockCols.includes('feed_type')) {
        await run("ALTER TABLE feed_stock ADD COLUMN feed_type TEXT");
        if (stockCols.includes('type')) {
          await run("UPDATE feed_stock SET feed_type = type WHERE feed_type IS NULL");
        }
      }
      if (!stockCols.includes('unit')) await run("ALTER TABLE feed_stock ADD COLUMN unit TEXT NOT NULL DEFAULT 'Tons'");
      if (!stockCols.includes('supplier')) await run("ALTER TABLE feed_stock ADD COLUMN supplier TEXT DEFAULT 'Agri Supplier'");
      if (!stockCols.includes('batch_id')) await run("ALTER TABLE feed_stock ADD COLUMN batch_id INTEGER");

      // Feed Consumption
      const consCols = (await all("PRAGMA table_info(feed_consumption)")).map(c => c.name);
      if (!consCols.includes('batch_id')) {
        await run("ALTER TABLE feed_consumption ADD COLUMN batch_id INTEGER");
        if (consCols.includes('flock_id')) {
          await run("UPDATE feed_consumption SET batch_id = flock_id WHERE batch_id IS NULL");
        }
      }
      if (!consCols.includes('feed_type')) {
        await run("ALTER TABLE feed_consumption ADD COLUMN feed_type TEXT DEFAULT 'Layer Mash'");
      }
      if (!consCols.includes('unit')) await run("ALTER TABLE feed_consumption ADD COLUMN unit TEXT NOT NULL DEFAULT 'Tons'");

      // Egg Production
      const eggCols = (await all("PRAGMA table_info(egg_production)")).map(c => c.name);
      if (!eggCols.includes('batch_id')) {
        await run("ALTER TABLE egg_production ADD COLUMN batch_id INTEGER");
        if (eggCols.includes('flock_id')) {
          await run("UPDATE egg_production SET batch_id = flock_id WHERE batch_id IS NULL");
        }
      }
      if (!eggCols.includes('eggs_damaged')) await run("ALTER TABLE egg_production ADD COLUMN eggs_damaged INTEGER NOT NULL DEFAULT 0");
      if (!eggCols.includes('net_eggs')) {
        await run("ALTER TABLE egg_production ADD COLUMN net_eggs INTEGER NOT NULL DEFAULT 0");
        await run("UPDATE egg_production SET net_eggs = eggs_collected - eggs_damaged WHERE net_eggs = 0");
      }

      // Vaccinations
      const vaccCols = (await all("PRAGMA table_info(vaccinations)")).map(c => c.name);
      if (!vaccCols.includes('batch_id')) {
        await run("ALTER TABLE vaccinations ADD COLUMN batch_id INTEGER");
        if (vaccCols.includes('flock_id')) {
          await run("UPDATE vaccinations SET batch_id = flock_id WHERE batch_id IS NULL");
        }
      }
      if (!vaccCols.includes('dosage')) await run("ALTER TABLE vaccinations ADD COLUMN dosage TEXT DEFAULT 'Standard 0.5ml'");
      if (!vaccCols.includes('administered_date')) await run("ALTER TABLE vaccinations ADD COLUMN administered_date TEXT");
      if (!vaccCols.includes('administered_by')) await run("ALTER TABLE vaccinations ADD COLUMN administered_by TEXT");
      if (!vaccCols.includes('status')) await run("ALTER TABLE vaccinations ADD COLUMN status TEXT NOT NULL DEFAULT 'upcoming'");

      // Health Records
      const healthCols = (await all("PRAGMA table_info(health_records)")).map(c => c.name);
      if (!healthCols.includes('batch_id')) {
        await run("ALTER TABLE health_records ADD COLUMN batch_id INTEGER");
        if (healthCols.includes('flock_id')) {
          await run("UPDATE health_records SET batch_id = flock_id WHERE batch_id IS NULL");
        }
      }
    } catch (migErr) {
      console.warn('[Kukoo] Column migration warning:', migErr.message);
    }

    // 2. Batches / Sheds Table
    await run(`
      CREATE TABLE IF NOT EXISTS batches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_name TEXT NOT NULL,
        shed_name TEXT NOT NULL,
        hen_count INTEGER NOT NULL,
        breed TEXT,
        start_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Feed Stock Table
    await run(`
      CREATE TABLE IF NOT EXISTS feed_stock (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        feed_type TEXT NOT NULL,
        quantity REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT 'Tons',
        supplier TEXT NOT NULL,
        date_received TEXT NOT NULL,
        batch_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE SET NULL
      )
    `);

    // 4. Feed Consumption Table
    await run(`
      CREATE TABLE IF NOT EXISTS feed_consumption (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        feed_type TEXT NOT NULL,
        quantity_used REAL NOT NULL,
        unit TEXT NOT NULL DEFAULT 'Tons',
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )
    `);

    // 5. Egg Production Table
    await run(`
      CREATE TABLE IF NOT EXISTS egg_production (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        eggs_collected INTEGER NOT NULL,
        eggs_damaged INTEGER NOT NULL DEFAULT 0,
        net_eggs INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )
    `);

    // 6. Vaccinations Table
    await run(`
      CREATE TABLE IF NOT EXISTS vaccinations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        vaccine_name TEXT NOT NULL,
        due_date TEXT NOT NULL,
        dosage TEXT DEFAULT 'Standard 0.5ml',
        administered_date TEXT,
        administered_by TEXT,
        status TEXT NOT NULL DEFAULT 'upcoming',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )
    `);

    // 7. Health Records Table
    await run(`
      CREATE TABLE IF NOT EXISTS health_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        batch_id INTEGER NOT NULL,
        date_observed TEXT NOT NULL,
        symptoms TEXT NOT NULL,
        diagnosed_disease TEXT NOT NULL,
        treatment_given TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Monitoring',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (batch_id) REFERENCES batches(id) ON DELETE CASCADE
      )
    `);

    // 8. Alerts Table
    await run(`
      CREATE TABLE IF NOT EXISTS alerts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'warning',
        status TEXT NOT NULL DEFAULT 'unread',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 9. Tasks Table
    await run(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_description TEXT NOT NULL,
        assigned_to TEXT NOT NULL DEFAULT 'Staff',
        due_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Pending',
        completed_by TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Check & Seed/Update Default Users
    const adminHash = bcrypt.hashSync('admin123', 10);
    const staffHash = bcrypt.hashSync('staff123', 10);
    const vetHash = bcrypt.hashSync('vet123', 10);

    const existingAdmin = await get('SELECT id FROM users WHERE LOWER(name) = ?', ['admin']);
    if (!existingAdmin) {
      await run('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)', ['admin', 'admin@kukoo.app', 'Admin', adminHash]);
    } else {
      await run('UPDATE users SET password_hash = ?, role = ?, email = COALESCE(email, ?) WHERE id = ?', [adminHash, 'Admin', 'admin@kukoo.app', existingAdmin.id]);
    }

    const existingStaff = await get('SELECT id FROM users WHERE LOWER(name) = ?', ['staff']);
    if (!existingStaff) {
      await run('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)', ['staff', 'staff@kukoo.app', 'Staff', staffHash]);
    } else {
      await run('UPDATE users SET password_hash = ?, role = ?, email = COALESCE(email, ?) WHERE id = ?', [staffHash, 'Staff', 'staff@kukoo.app', existingStaff.id]);
    }

    const existingVet = await get('SELECT id FROM users WHERE LOWER(name) = ?', ['vet']);
    if (!existingVet) {
      await run('INSERT INTO users (name, email, role, password_hash) VALUES (?, ?, ?, ?)', ['vet', 'vet@kukoo.app', 'Vet', vetHash]);
    } else {
      await run('UPDATE users SET password_hash = ?, role = ?, email = COALESCE(email, ?) WHERE id = ?', [vetHash, 'Vet', 'vet@kukoo.app', existingVet.id]);
    }
    console.log('[Kukoo] Default users verified: admin/admin123, staff/staff123, vet/vet123.');

    // Check & Seed Batches if empty
    const batchRow = await get('SELECT COUNT(*) as count FROM batches');
    if (!batchRow || batchRow.count === 0) {
      await run('INSERT INTO batches (batch_name, shed_name, hen_count, breed, start_date, status) VALUES (?, ?, ?, ?, ?, ?)', [
        'Batch Alpha (Layer A-1)', 'Shed 1', 1200, 'Hy-Line Brown', '2026-05-10', 'Active'
      ]);
      await run('INSERT INTO batches (batch_name, shed_name, hen_count, breed, start_date, status) VALUES (?, ?, ?, ?, ?, ?)', [
        'Batch Beta (Layer B-2)', 'Shed 2', 1500, 'Lohmann White', '2026-06-15', 'Active'
      ]);
      await run('INSERT INTO batches (batch_name, shed_name, hen_count, breed, start_date, status) VALUES (?, ?, ?, ?, ?, ?)', [
        'Batch Gamma (Broiler C-1)', 'Shed 3', 800, 'Ross 308', '2026-07-20', 'Active'
      ]);
      console.log('[Kukoo] Starter production batches seeded.');
    }

    // Check & Seed Feed Stock if empty
    const feedStockRow = await get('SELECT COUNT(*) as count FROM feed_stock');
    if (!feedStockRow || feedStockRow.count === 0) {
      await run('INSERT INTO feed_stock (feed_type, quantity, unit, supplier, date_received) VALUES (?, ?, ?, ?, ?)', [
        'Layer Crumble Plus', 12.5, 'Tons', 'AgriNutra Feed Mills', '2026-09-15'
      ]);
      await run('INSERT INTO feed_stock (feed_type, quantity, unit, supplier, date_received) VALUES (?, ?, ?, ?, ?)', [
        'Maize & Grain Silo Mix', 18.0, 'Tons', 'National Agro Grain Suppliers', '2026-09-20'
      ]);
      await run('INSERT INTO feed_stock (feed_type, quantity, unit, supplier, date_received) VALUES (?, ?, ?, ?, ?)', [
        'Broiler Finisher Pellet', 6.0, 'Tons', 'Apex Animal Nutrition Ltd', '2026-09-25'
      ]);
      console.log('[Kukoo] Starter feed stock inventory seeded.');
    }

    // Check & Seed Feed Consumption if empty
    const feedConsRow = await get('SELECT COUNT(*) as count FROM feed_consumption');
    if (!feedConsRow || feedConsRow.count === 0) {
      const dates = ['2026-09-27', '2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03'];
      for (const d of dates) {
        await run('INSERT INTO feed_consumption (batch_id, feed_type, quantity_used, unit, date) VALUES (?, ?, ?, ?, ?)', [1, 'Layer Crumble Plus', 0.14, 'Tons', d]);
        await run('INSERT INTO feed_consumption (batch_id, feed_type, quantity_used, unit, date) VALUES (?, ?, ?, ?, ?)', [2, 'Maize & Grain Silo Mix', 0.17, 'Tons', d]);
        await run('INSERT INTO feed_consumption (batch_id, feed_type, quantity_used, unit, date) VALUES (?, ?, ?, ?, ?)', [3, 'Broiler Finisher Pellet', 0.09, 'Tons', d]);
      }
      console.log('[Kukoo] Starter feed consumption history seeded.');
    }

    // Check & Seed Egg Production if empty
    const eggProdRow = await get('SELECT COUNT(*) as count FROM egg_production');
    if (!eggProdRow || eggProdRow.count === 0) {
      const history = [
        { date: '2026-09-27', b1: 1140, d1: 12, b2: 1420, d2: 15 },
        { date: '2026-09-28', b1: 1155, d1: 10, b2: 1435, d2: 18 },
        { date: '2026-09-29', b1: 1130, d1: 14, b2: 1410, d2: 12 },
        { date: '2026-09-30', b1: 1162, d1: 8,  b2: 1448, d2: 14 },
        { date: '2026-10-01', b1: 1170, d1: 9,  b2: 1452, d2: 16 },
        { date: '2026-10-02', b1: 1165, d1: 11, b2: 1460, d2: 13 },
        { date: '2026-10-03', b1: 1180, d1: 7,  b2: 1475, d2: 11 },
      ];

      for (const h of history) {
        await run('INSERT INTO egg_production (batch_id, date, eggs_collected, eggs_damaged, net_eggs) VALUES (?, ?, ?, ?, ?)', [
          1, h.date, h.b1, h.d1, h.b1 - h.d1
        ]);
        await run('INSERT INTO egg_production (batch_id, date, eggs_collected, eggs_damaged, net_eggs) VALUES (?, ?, ?, ?, ?)', [
          2, h.date, h.b2, h.d2, h.b2 - h.d2
        ]);
      }
      console.log('[Kukoo] Starter egg production logs seeded.');
    }

    // Check & Seed Vaccinations if empty
    const vaccRow = await get('SELECT COUNT(*) as count FROM vaccinations');
    if (!vaccRow || vaccRow.count === 0) {
      await run('INSERT INTO vaccinations (batch_id, vaccine_name, due_date, dosage, administered_date, administered_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        1, 'Newcastle Disease (Lasota)', '2026-09-25', '0.5ml Eye-drop', '2026-09-25', 'Dr. Sarah Jenkins', 'completed'
      ]);
      await run('INSERT INTO vaccinations (batch_id, vaccine_name, due_date, dosage, administered_date, administered_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        2, 'Infectious Bursal Disease (Gumboro)', '2026-10-06', 'Drinking water dose', null, null, 'upcoming'
      ]);
      await run('INSERT INTO vaccinations (batch_id, vaccine_name, due_date, dosage, administered_date, administered_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        3, 'Fowl Pox Vaccine', '2026-09-28', 'Wing-web puncture', null, null, 'overdue'
      ]);
      await run('INSERT INTO vaccinations (batch_id, vaccine_name, due_date, dosage, administered_date, administered_by, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [
        1, 'Infectious Bronchitis (IB H120)', '2026-10-12', 'Coarse spray', null, null, 'upcoming'
      ]);
      console.log('[Kukoo] Starter vaccination schedules seeded.');
    }

    // Check & Seed Health Records if empty
    const healthRow = await get('SELECT COUNT(*) as count FROM health_records');
    if (!healthRow || healthRow.count === 0) {
      await run('INSERT INTO health_records (batch_id, date_observed, symptoms, diagnosed_disease, treatment_given, status) VALUES (?, ?, ?, ?, ?, ?)', [
        1, '2026-10-01', 'Mild sneezing, nasal discharge in 6 birds', 'Mild Respiratory Stress', 'Tilmicosin soluble oral liquid (3 days) & ventilation check', 'Under Treatment'
      ]);
      await run('INSERT INTO health_records (batch_id, date_observed, symptoms, diagnosed_disease, treatment_given, status) VALUES (?, ?, ?, ?, ?, ?)', [
        2, '2026-09-28', 'Reduced water intake during afternoon heat', 'Heat Fatigue', 'Electrolyte & Vitamin C supplementation in water tanks', 'Resolved'
      ]);
      console.log('[Kukoo] Starter flock health diagnostics seeded.');
    }

    // Check & Seed Tasks if empty
    const taskRow = await get('SELECT COUNT(*) as count FROM tasks');
    if (!taskRow || taskRow.count === 0) {
      await run('INSERT INTO tasks (task_description, assigned_to, due_date, status) VALUES (?, ?, ?, ?)', [
        'Inspect Shed 2 automated nipple drinker lines for pressure drops', 'Staff', '2026-10-04', 'Pending'
      ]);
      await run('INSERT INTO tasks (task_description, assigned_to, due_date, status) VALUES (?, ?, ?, ?)', [
        'Calibrate temperature sensor probes in Shed 1 & 3', 'Staff', '2026-10-04', 'Pending'
      ]);
      await run('INSERT INTO tasks (task_description, assigned_to, due_date, status, completed_by) VALUES (?, ?, ?, ?, ?)', [
        'Disinfect bio-security footbath at Shed 1 entrance', 'Staff', '2026-10-03', 'Completed', 'staff'
      ]);
      console.log('[Kukoo] Starter farm operational tasks seeded.');
    }

    console.log('[Kukoo] Database initialization and schema verification complete.');
  } catch (err) {
    console.error('[Kukoo] Error during DB schema initialization:', err);
  }
};
