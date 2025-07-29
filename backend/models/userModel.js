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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

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
  }
};
