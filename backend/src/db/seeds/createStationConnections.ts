import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(__dirname, '../../../data/metro.db');
const sqlite = new Database(dbPath);

async function createStationConnections() {
  console.log('Creating station connections from line_stations data...');

  try {
    // Get all lines
    const lines = sqlite.prepare('SELECT * FROM metro_lines ORDER BY display_order').all() as any[];

    console.log(`Found ${lines.length} metro lines`);

    // Clear existing connections
    sqlite.exec('DELETE FROM station_connections');
    console.log('Cleared existing connections');

    let totalConnections = 0;

    // For each line, create connections between consecutive stations
    for (const line of lines) {
      console.log(`\nProcessing ${line.name}...`);

      // Get all stations for this line, ordered by sequence
      const stations = sqlite.prepare(`
        SELECT station_id, sequence_number
        FROM line_stations
        WHERE line_id = ?
        ORDER BY sequence_number ASC
      `).all(line.id) as any[];

      console.log(`  Found ${stations.length} stations`);

      // Create connections between consecutive stations
      const insertConnection = sqlite.prepare(`
        INSERT INTO station_connections (from_station_id, to_station_id, line_id, travel_time_seconds, stop_time_seconds)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (let i = 0; i < stations.length - 1; i++) {
        const fromStation = stations[i].station_id;
        const toStation = stations[i + 1].station_id;

        // Average travel time between stations: 120 seconds (2 minutes)
        // Average stop time at station: 25 seconds
        const travelTime = 120;
        const stopTime = 25;

        // Forward direction (station i -> station i+1)
        insertConnection.run(fromStation, toStation, line.id, travelTime, stopTime);
        totalConnections++;

        // Backward direction (station i+1 -> station i)
        insertConnection.run(toStation, fromStation, line.id, travelTime, stopTime);
        totalConnections++;
      }

      console.log(`  Created ${(stations.length - 1) * 2} connections`);
    }

    console.log(`\n✅ Successfully created ${totalConnections} station connections`);

    // Verify
    const count = sqlite.prepare('SELECT COUNT(*) as count FROM station_connections').get() as any;
    console.log(`\nVerification: ${count.count} connections in database`);

  } catch (error) {
    console.error('Error creating station connections:', error);
    throw error;
  } finally {
    sqlite.close();
  }
}

// Run the script
createStationConnections()
  .then(() => {
    console.log('\n🎉 Station connections created successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Failed to create station connections:', error);
    process.exit(1);
  });
