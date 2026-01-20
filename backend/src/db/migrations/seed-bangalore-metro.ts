import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = path.join(__dirname, '../../../data/metro.db');
const db = new Database(dbPath);

console.log('🚇 Seeding Bangalore Metro (Namma Metro) data...\n');

try {
  // Read the Bangalore metro data file
  const dataPath = path.join(__dirname, '../seeds/bangalore-metro-data.json');
  const bangaloreData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  db.exec('BEGIN TRANSACTION');

  // 1. Insert lines
  console.log('📍 Inserting metro lines...');
  const insertLine = db.prepare(`
    INSERT INTO metro_lines (id, city_id, name, color, display_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const line of bangaloreData.lines) {
    insertLine.run(line.id, line.cityId, line.name, line.color, line.displayOrder);
  }
  console.log(`✅ Inserted ${bangaloreData.lines.length} lines`);

  // 2. Insert stations
  console.log('\n📍 Inserting metro stations...');
  const insertStation = db.prepare(`
    INSERT INTO metro_stations (id, city_id, name, latitude, longitude, is_interchange)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  for (const station of bangaloreData.stations) {
    insertStation.run(
      station.id,
      station.cityId,
      station.name,
      station.latitude,
      station.longitude,
      station.isInterchange ? 1 : 0
    );
  }
  console.log(`✅ Inserted ${bangaloreData.stations.length} stations`);

  // 3. Insert line-station mappings
  console.log('\n📍 Creating line-station mappings...');
  const insertLineStation = db.prepare(`
    INSERT INTO line_stations (line_id, station_id, sequence_number, direction)
    VALUES (?, ?, ?, ?)
  `);

  // Purple Line stations (Whitefield to Challaghatta)
  const purpleLineStations = [
    'bangalore-whitefield',
    'bangalore-kadugodi-tree-park',
    'bangalore-hopefarm',
    'bangalore-itpl',
    'bangalore-nallurhalli',
    'bangalore-kundalahalli',
    'bangalore-seetharampalya',
    'bangalore-hoodi',
    'bangalore-garudacharapalya',
    'bangalore-kr-puram',
    'bangalore-benniganahalli',
    'bangalore-baiyappanahalli',
    'bangalore-swami-vivekananda-road',
    'bangalore-indiranagar',
    'bangalore-halasuru',
    'bangalore-trinity',
    'bangalore-mg-road',
    'bangalore-cubbon-park',
    'bangalore-vidhana-soudha',
    'bangalore-sir-m-visvesvaraya',
    'bangalore-majestic',
    'bangalore-city-railway-station',
    'bangalore-magadi-road',
    'bangalore-vijayanagar',
    'bangalore-attiguppe',
    'bangalore-deepanjali-nagar',
    'bangalore-mysore-road',
    'bangalore-nayandahalli',
    'bangalore-rajarajeshwari-nagar',
    'bangalore-jnanabharathi',
    'bangalore-pattanagere',
    'bangalore-kengeri',
    'bangalore-kengeri-bus-terminal',
    'bangalore-challaghatta'
  ];

  // Insert both directions for Purple Line
  purpleLineStations.forEach((stationId, index) => {
    insertLineStation.run('bangalore-purple', stationId, index + 1, 'forward');
    insertLineStation.run('bangalore-purple', stationId, purpleLineStations.length - index, 'backward');
  });
  console.log(`✅ Mapped ${purpleLineStations.length} stations to Purple Line (both directions)`);

  // Green Line stations (Madavara to Silk Institute)
  const greenLineStations = [
    'bangalore-madavara',
    'bangalore-chikkabidarakallu',
    'bangalore-manjunathanagar',
    'bangalore-nagasandra',
    'bangalore-dasarahalli',
    'bangalore-jalahalli',
    'bangalore-peenya-industry',
    'bangalore-peenya',
    'bangalore-goraguntepalya',
    'bangalore-yeshwanthpur',
    'bangalore-sandal-soap-factory',
    'bangalore-mahalakshmi',
    'bangalore-rajajinagar',
    'bangalore-mahakavi-kuvempu-road',
    'bangalore-srirampura',
    'bangalore-mantri-square',
    'bangalore-majestic',
    'bangalore-chikpete',
    'bangalore-kr-market',
    'bangalore-national-college',
    'bangalore-lalbagh',
    'bangalore-south-end-circle',
    'bangalore-jayanagar',
    'bangalore-rv-road',
    'bangalore-banashankari',
    'bangalore-jaya-prakash-nagar',
    'bangalore-yelachenahalli',
    'bangalore-konanakunte-cross',
    'bangalore-doddakallasandra',
    'bangalore-vajarahalli',
    'bangalore-thalaghattapura',
    'bangalore-silk-institute'
  ];

  // Insert both directions for Green Line
  greenLineStations.forEach((stationId, index) => {
    insertLineStation.run('bangalore-green', stationId, index + 1, 'forward');
    insertLineStation.run('bangalore-green', stationId, greenLineStations.length - index, 'backward');
  });
  console.log(`✅ Mapped ${greenLineStations.length} stations to Green Line (both directions)`);

  // 4. Insert station connections (with travel times)
  console.log('\n📍 Creating station connections...');
  const insertConnection = db.prepare(`
    INSERT INTO station_connections (from_station_id, to_station_id, line_id, travel_time_seconds, stop_time_seconds)
    VALUES (?, ?, ?, ?, ?)
  `);

  const AVERAGE_TRAVEL_TIME = 120; // 2 minutes between stations
  const STOP_TIME = 30; // 30 seconds dwell time

  // Purple Line connections
  for (let i = 0; i < purpleLineStations.length - 1; i++) {
    // Forward direction
    insertConnection.run(
      purpleLineStations[i],
      purpleLineStations[i + 1],
      'bangalore-purple',
      AVERAGE_TRAVEL_TIME,
      STOP_TIME
    );
    // Backward direction
    insertConnection.run(
      purpleLineStations[i + 1],
      purpleLineStations[i],
      'bangalore-purple',
      AVERAGE_TRAVEL_TIME,
      STOP_TIME
    );
  }
  console.log(`✅ Created ${(purpleLineStations.length - 1) * 2} Purple Line connections`);

  // Green Line connections
  for (let i = 0; i < greenLineStations.length - 1; i++) {
    // Forward direction
    insertConnection.run(
      greenLineStations[i],
      greenLineStations[i + 1],
      'bangalore-green',
      AVERAGE_TRAVEL_TIME,
      STOP_TIME
    );
    // Backward direction
    insertConnection.run(
      greenLineStations[i + 1],
      greenLineStations[i],
      'bangalore-green',
      AVERAGE_TRAVEL_TIME,
      STOP_TIME
    );
  }
  console.log(`✅ Created ${(greenLineStations.length - 1) * 2} Green Line connections`);

  db.exec('COMMIT');

  console.log('\n✅ Successfully seeded Bangalore Metro data!');
  console.log('\n📊 Summary:');
  console.log(`   - Lines: ${bangaloreData.lines.length} (Purple, Green)`);
  console.log(`   - Stations: ${bangaloreData.stations.length}`);
  console.log(`   - Interchange stations: 2 (Majestic, RV Road)`);
  console.log(`   - Purple Line: ${purpleLineStations.length} stations`);
  console.log(`   - Green Line: ${greenLineStations.length} stations`);
  console.log('\n🎉 Namma Metro is now available in the app!');

} catch (error) {
  db.exec('ROLLBACK');
  console.error('❌ Error seeding Bangalore Metro data:', error);
  process.exit(1);
}

db.close();
console.log('\n✅ Database connection closed');
