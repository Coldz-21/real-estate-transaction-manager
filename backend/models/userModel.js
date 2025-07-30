const db = require('../database/config');
const bcrypt = require('bcryptjs');

// Create users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT,
    role TEXT DEFAULT 'agent',
    notify_on_new_loops BOOLEAN DEFAULT 1,
    notify_on_updated_loops BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Migration: Add notification preference columns if they don't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasNotifyNewLoops = tableInfo.some(column => column.name === 'notify_on_new_loops');
  const hasNotifyUpdatedLoops = tableInfo.some(column => column.name === 'notify_on_updated_loops');

  if (!hasNotifyNewLoops) {
    console.log('Adding notify_on_new_loops column to users table...');
    db.prepare('ALTER TABLE users ADD COLUMN notify_on_new_loops BOOLEAN DEFAULT 1').run();
    console.log('notify_on_new_loops column added successfully');
  }

  if (!hasNotifyUpdatedLoops) {
    console.log('Adding notify_on_updated_loops column to users table...');
    db.prepare('ALTER TABLE users ADD COLUMN notify_on_updated_loops BOOLEAN DEFAULT 1').run();
    console.log('notify_on_updated_loops column added successfully');
  }
} catch (error) {
  console.error('Error during user notification migration:', error);
}

// Insert default users if table is empty
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
if (userCount.count === 0) {
  const hashedPassword = bcrypt.hashSync('password123', 10);
  
  // Insert admin user
  db.prepare(`
    INSERT INTO users (name, email, password, role) 
    VALUES (?, ?, ?, ?)
  `).run('Admin User', 'admin@nexusrealtync.co', hashedPassword, 'admin');
  
  // Insert agent user
  db.prepare(`
    INSERT INTO users (name, email, password, role) 
    VALUES (?, ?, ?, ?)
  `).run('Agent Smith', 'agent@nexusrealtync.co', hashedPassword, 'agent');
}

module.exports = {
  findByEmail: (email) => {
    return db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  },
  
  findById: (id) => {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },
  
  create: (userData) => {
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password, role) 
      VALUES (?, ?, ?, ?)
    `);
    return stmt.run(userData.name, userData.email, userData.password, userData.role || 'agent');
  },
  
  getAllAgents: () => {
    return db.prepare('SELECT id, name, email FROM users WHERE role = ?').all('agent');
  },

  updateNotificationPreferences: (id, preferences) => {
    const stmt = db.prepare(`
      UPDATE users SET
        notify_on_new_loops = ?,
        notify_on_updated_loops = ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    return stmt.run(preferences.notify_on_new_loops, preferences.notify_on_updated_loops, id);
  },

  getAdminsWithNotifications: (notificationType) => {
    const column = notificationType === 'new' ? 'notify_on_new_loops' : 'notify_on_updated_loops';
    return db.prepare(`
      SELECT id, name, email FROM users
      WHERE role = 'admin' AND ${column} = 1
    `).all();
  }
};
