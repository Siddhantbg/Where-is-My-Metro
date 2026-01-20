import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/metro.db');
const db = new Database(dbPath);

console.log('🚀 Adding train_sightings table for crowdsourced tracking...\n');

try {
  db.exec('BEGIN TRANSACTION');

  // Create train_sightings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS train_sightings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id TEXT NOT NULL REFERENCES metro_lines(id),
      station_id TEXT NOT NULL REFERENCES metro_stations(id),
      direction TEXT NOT NULL CHECK(direction IN ('forward', 'backward')),
      timestamp INTEGER NOT NULL,
      user_id TEXT,
      user_latitude REAL,
      user_longitude REAL,
      confidence_score REAL DEFAULT 1.0 CHECK(confidence_score >= 0 AND confidence_score <= 1),
      is_verified INTEGER DEFAULT 0 CHECK(is_verified IN (0, 1)),
      created_at INTEGER NOT NULL DEFAULT (unixepoch())
    )
  `);

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_train_sightings_line_id ON train_sightings(line_id);
    CREATE INDEX IF NOT EXISTS idx_train_sightings_station_id ON train_sightings(station_id);
    CREATE INDEX IF NOT EXISTS idx_train_sightings_timestamp ON train_sightings(timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_train_sightings_line_timestamp
      ON train_sightings(line_id, timestamp DESC);
  `);

  db.exec('COMMIT');

  console.log('✅ Successfully created train_sightings table');
  console.log('✅ Created performance indexes');
  console.log('\n📊 Table Structure:');
  console.log('   - id: Auto-increment primary key');
  console.log('   - line_id: Reference to metro line');
  console.log('   - station_id: Where train was spotted');
  console.log('   - direction: forward or backward');
  console.log('   - timestamp: When train was spotted (Unix timestamp)');
  console.log('   - user_id: Optional user identifier');
  console.log('   - user_latitude/longitude: For proximity verification');
  console.log('   - confidence_score: 0.0 to 1.0 (quality of report)');
  console.log('   - is_verified: Whether report has been verified');
  console.log('   - created_at: When report was submitted');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error creating train_sightings table:', error);
  process.exit(1);
}

db.close();
console.log('\n✅ Database connection closed');
console.log('🎉 Crowdsourced tracking infrastructure ready!');
