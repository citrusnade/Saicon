require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

function runMigrations() {
    console.log('Running migrations...');
    try {
        const migrationFile = path.join(__dirname, '001_initial_schema.sql');
        const migrationSql = fs.readFileSync(migrationFile, 'utf8');
        db.exec(migrationSql);
        console.log('Migrations completed successfully.');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

runMigrations();