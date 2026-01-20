import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/metro.db');
const db = new Database(dbPath);

// Read the cities data
const citiesDataPath = path.join(__dirname, '../seeds/other-cities-data.json');
const citiesData = JSON.parse(fs.readFileSync(citiesDataPath, 'utf-8'));

console.log('🚀 Adding other Indian metro cities...\n');

try {
  db.exec('BEGIN TRANSACTION');

  const insertCity = db.prepare(`
    INSERT INTO cities (id, name, display_name, country, timezone, map_center, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const city of citiesData.cities) {
    const mapCenter = JSON.stringify(city.mapCenter);

    insertCity.run(
      city.id,
      city.name,
      city.displayName,
      city.country,
      city.timezone,
      mapCenter,
      city.isActive ? 1 : 0
    );

    console.log(`✅ Added: ${city.displayName}`);
  }

  db.exec('COMMIT');
  console.log('\n✨ Successfully added all cities!');
  console.log('\n📊 Cities Summary:');

  const cities = db.prepare('SELECT * FROM cities ORDER BY name').all();
  cities.forEach((city: any) => {
    const stats = citiesData.stats[city.id];
    const linesCount = stats?.linesCount || 0;
    const stationsCount = stats?.stationsCount || 0;
    console.log(`   ${city.display_name}: ${linesCount} lines • ${stationsCount} stations`);
  });

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error adding cities:', error);
  process.exit(1);
}

db.close();
console.log('\n✅ Database connection closed');
