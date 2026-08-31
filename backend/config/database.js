const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbPath = path.join(__dirname, '..', process.env.DB_PATH || './database/krishibandhu.db');
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Load schema (idempotent — uses IF NOT EXISTS everywhere)
const schemaPath = path.join(__dirname, '..', '..', 'database', 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

module.exports = db;
