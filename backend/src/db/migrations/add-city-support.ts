import Database from 'better-sqlite3';
import path from 'path';

/**
 * Migration Script: Add Multi-City Support
 *
 * This script migrates the database to support multiple cities by:
 * 1. Creating the cities table
 * 2. Adding cityId columns to metro_lines and metro_stations
 * 3. Migrating existing Delhi data with cityId='delhi'
 * 4. Updating all IDs to include city prefix (delhi-*)
 * 5. Updating foreign key references
 */

const dbPath = path.join(__dirname, '../../..', 'data', 'metro.db');
const db = new Database(dbPath);

console.log('🚀 Starting multi-city migration...\n');

try {
  // Disable foreign keys during migration
  db.exec('PRAGMA foreign_keys = OFF');

  // Begin transaction
  db.exec('BEGIN TRANSACTION');

  // Step 1: Create cities table
  console.log('📋 Step 1: Creating cities table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS cities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      display_name TEXT NOT NULL,
      country TEXT NOT NULL DEFAULT 'India',
      timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
      map_center TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    )
  `);
  console.log('✅ Cities table created\n');

  // Step 2: Insert Delhi as the first city
  console.log('📋 Step 2: Inserting Delhi city...');
  const delhiMapCenter = JSON.stringify({ lat: 28.6139, lng: 77.2090 });
  const insertDelhi = db.prepare(`
    INSERT OR IGNORE INTO cities (id, name, display_name, country, timezone, map_center, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertDelhi.run('delhi', 'Delhi', 'Delhi Metro', 'India', 'Asia/Kolkata', delhiMapCenter, 1);
  console.log('✅ Delhi city inserted\n');

  // Step 3: Create temporary tables with cityId
  console.log('📋 Step 3: Creating temporary tables with cityId...');

  // Create temp metro_lines table
  db.exec(`
    CREATE TABLE metro_lines_new (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL REFERENCES cities(id),
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      display_order INTEGER NOT NULL
    )
  `);

  // Create temp metro_stations table
  db.exec(`
    CREATE TABLE metro_stations_new (
      id TEXT PRIMARY KEY,
      city_id TEXT NOT NULL REFERENCES cities(id),
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      is_interchange INTEGER NOT NULL DEFAULT 0
    )
  `);
  console.log('✅ Temporary tables created\n');

  // Step 4: Migrate metro_lines data with city prefix
  console.log('📋 Step 4: Migrating metro lines with delhi- prefix...');
  db.exec(`
    INSERT INTO metro_lines_new (id, city_id, name, color, display_order)
    SELECT 'delhi-' || id, 'delhi', name, color, display_order
    FROM metro_lines
  `);
  const linesCount = db.prepare('SELECT COUNT(*) as count FROM metro_lines_new').get() as { count: number };
  console.log(`✅ Migrated ${linesCount.count} metro lines\n`);

  // Step 5: Migrate metro_stations data with city prefix
  console.log('📋 Step 5: Migrating metro stations with delhi- prefix...');
  db.exec(`
    INSERT INTO metro_stations_new (id, city_id, name, latitude, longitude, is_interchange)
    SELECT 'delhi-' || id, 'delhi', name, latitude, longitude, is_interchange
    FROM metro_stations
  `);
  const stationsCount = db.prepare('SELECT COUNT(*) as count FROM metro_stations_new').get() as { count: number };
  console.log(`✅ Migrated ${stationsCount.count} metro stations\n`);

  // Step 6: Update line_stations table with new IDs
  console.log('📋 Step 6: Updating line_stations table...');
  db.exec(`
    CREATE TABLE line_stations_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id TEXT NOT NULL REFERENCES metro_lines(id),
      station_id TEXT NOT NULL REFERENCES metro_stations(id),
      sequence_number INTEGER NOT NULL,
      direction TEXT NOT NULL
    )
  `);
  db.exec(`
    INSERT INTO line_stations_new (line_id, station_id, sequence_number, direction)
    SELECT 'delhi-' || line_id, 'delhi-' || station_id, sequence_number, direction
    FROM line_stations
  `);
  console.log('✅ Line-station relationships updated\n');

  // Step 7: Update station_connections table with new IDs
  console.log('📋 Step 7: Updating station_connections table...');
  db.exec(`
    CREATE TABLE station_connections_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_station_id TEXT NOT NULL REFERENCES metro_stations(id),
      to_station_id TEXT NOT NULL REFERENCES metro_stations(id),
      line_id TEXT NOT NULL REFERENCES metro_lines(id),
      travel_time_seconds INTEGER NOT NULL,
      stop_time_seconds INTEGER NOT NULL DEFAULT 25
    )
  `);
  db.exec(`
    INSERT INTO station_connections_new (from_station_id, to_station_id, line_id, travel_time_seconds, stop_time_seconds)
    SELECT 'delhi-' || from_station_id, 'delhi-' || to_station_id, 'delhi-' || line_id, travel_time_seconds, stop_time_seconds
    FROM station_connections
  `);
  console.log('✅ Station connections updated\n');

  // Step 8: Update train_schedules table with new IDs
  console.log('📋 Step 8: Updating train_schedules table...');
  db.exec(`
    CREATE TABLE train_schedules_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      line_id TEXT NOT NULL REFERENCES metro_lines(id),
      direction TEXT NOT NULL,
      start_station_id TEXT NOT NULL REFERENCES metro_stations(id),
      end_station_id TEXT NOT NULL REFERENCES metro_stations(id),
      first_train_time TEXT NOT NULL,
      last_train_time TEXT NOT NULL,
      peak_frequency_minutes INTEGER NOT NULL,
      off_peak_frequency_minutes INTEGER NOT NULL
    )
  `);
  db.exec(`
    INSERT INTO train_schedules_new (line_id, direction, start_station_id, end_station_id, first_train_time, last_train_time, peak_frequency_minutes, off_peak_frequency_minutes)
    SELECT 'delhi-' || line_id, direction, 'delhi-' || start_station_id, 'delhi-' || end_station_id, first_train_time, last_train_time, peak_frequency_minutes, off_peak_frequency_minutes
    FROM train_schedules
  `);
  console.log('✅ Train schedules updated\n');

  // Step 9: Drop old tables and rename new ones
  console.log('📋 Step 9: Replacing old tables with new ones...');
  db.exec('DROP TABLE IF EXISTS peak_hours');
  db.exec('DROP TABLE IF EXISTS train_schedules');
  db.exec('DROP TABLE IF EXISTS station_connections');
  db.exec('DROP TABLE IF EXISTS line_stations');
  db.exec('DROP TABLE IF EXISTS metro_stations');
  db.exec('DROP TABLE IF EXISTS metro_lines');

  db.exec('ALTER TABLE metro_lines_new RENAME TO metro_lines');
  db.exec('ALTER TABLE metro_stations_new RENAME TO metro_stations');
  db.exec('ALTER TABLE line_stations_new RENAME TO line_stations');
  db.exec('ALTER TABLE station_connections_new RENAME TO station_connections');
  db.exec('ALTER TABLE train_schedules_new RENAME TO train_schedules');

  // Recreate peak_hours table
  db.exec(`
    CREATE TABLE peak_hours (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      schedule_id INTEGER NOT NULL REFERENCES train_schedules(id),
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL
    )
  `);
  console.log('✅ Tables replaced successfully\n');

  // Commit transaction
  db.exec('COMMIT');

  // Re-enable foreign keys
  db.exec('PRAGMA foreign_keys = ON');

  console.log('🎉 Migration completed successfully!\n');
  console.log('Summary:');
  console.log(`- Cities added: 1 (Delhi)`);
  console.log(`- Metro lines migrated: ${linesCount.count}`);
  console.log(`- Metro stations migrated: ${stationsCount.count}`);
  console.log(`- All IDs now have 'delhi-' prefix`);

} catch (error) {
  // Rollback on error
  db.exec('ROLLBACK');
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
