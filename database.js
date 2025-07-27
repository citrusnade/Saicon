const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, 'db.sqlite3');

const db = new Database(dbPath, { verbose: console.log });
db.pragma('journal_mode = WAL');

module.exports = db;