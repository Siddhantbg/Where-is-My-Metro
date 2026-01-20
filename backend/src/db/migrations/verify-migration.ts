import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../..', 'data', 'metro.db');
const db = new Database(dbPath);

console.log('🔍 Verifying database migration...\n');

try {
  // Check cities table
  const cities = db.prepare('SELECT * FROM cities').all();
  console.log('📍 Cities:');
  console.table(cities);

  // Check metro lines (sample)
  const lines = db.prepare('SELECT * FROM metro_lines LIMIT 5').all();
  console.log('\n🚇 Metro Lines (sample):');
  console.table(lines);

  // Check metro stations (sample)
  const stations = db.prepare('SELECT * FROM metro_stations LIMIT 5').all();
  console.log('\n🚉 Metro Stations (sample):');
  console.table(stations);

  // Check line_stations (sample)
  const lineStations = db.prepare('SELECT * FROM line_stations LIMIT 5').all();
  console.log('\n🔗 Line-Station Relationships (sample):');
  console.table(lineStations);

  // Verify counts
  const counts = {
    cities: db.prepare('SELECT COUNT(*) as count FROM cities').get() as { count: number },
    lines: db.prepare('SELECT COUNT(*) as count FROM metro_lines').get() as { count: number },
    stations: db.prepare('SELECT COUNT(*) as count FROM metro_stations').get() as { count: number },
    lineStations: db.prepare('SELECT COUNT(*) as count FROM line_stations').get() as { count: number },
    connections: db.prepare('SELECT COUNT(*) as count FROM station_connections').get() as { count: number },
  };

  console.log('\n📊 Database Counts:');
  console.table(counts);

  // Verify all IDs have city prefix (should contain a hyphen)
  const linesWithPrefix = db.prepare("SELECT COUNT(*) as count FROM metro_lines WHERE id LIKE '%-%'").get() as { count: number };
  const stationsWithPrefix = db.prepare("SELECT COUNT(*) as count FROM metro_stations WHERE id LIKE '%-%'").get() as { count: number };

  console.log('\n✅ Verification Results:');
  console.log(`- Lines with city prefix: ${linesWithPrefix.count}/${counts.lines.count}`);
  console.log(`- Stations with city prefix: ${stationsWithPrefix.count}/${counts.stations.count}`);

  if (linesWithPrefix.count === counts.lines.count && stationsWithPrefix.count === counts.stations.count) {
    console.log('\n🎉 Migration verification successful! All IDs have city prefix.');
  } else {
    console.log('\n⚠️  Warning: Some IDs missing city prefix!');
  }

} catch (error) {
  console.error('❌ Verification failed:', error);
} finally {
  db.close();
}
