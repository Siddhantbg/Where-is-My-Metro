import db from '../config/database';
import { metroLines, metroStations, lineStations, stationConnections, trainSchedules } from './schema';
import linesData from './seeds/lines.json';
import stationsData from './seeds/stations.json';

async function seed() {
  console.log('Starting database seeding...');

  try {
    // Seed Metro Lines
    console.log('Seeding metro lines...');
    for (const line of linesData) {
      await db.insert(metroLines).values(line).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${linesData.length} metro lines`);

    // Seed Stations
    console.log('Seeding metro stations...');
    for (const station of stationsData) {
      await db.insert(metroStations).values(station).onConflictDoNothing();
    }
    console.log(`✓ Seeded ${stationsData.length} metro stations`);

    // Seed some line-station relationships for testing (Yellow Line example)
    console.log('Seeding line-station relationships...');
    const yellowLineStations = [
      { lineId: 'yellow', stationId: 'huda-city-centre', sequenceNumber: 1, direction: 'forward' },
      { lineId: 'yellow', stationId: 'hauz-khas', sequenceNumber: 2, direction: 'forward' },
      { lineId: 'yellow', stationId: 'rajiv-chowk', sequenceNumber: 3, direction: 'forward' },
      { lineId: 'yellow', stationId: 'new-delhi', sequenceNumber: 4, direction: 'forward' },
      { lineId: 'yellow', stationId: 'chandni-chowk', sequenceNumber: 5, direction: 'forward' },
      { lineId: 'yellow', stationId: 'kashmere-gate', sequenceNumber: 6, direction: 'forward' },
    ];

    for (const ls of yellowLineStations) {
      await db.insert(lineStations).values(ls).onConflictDoNothing();
    }
    console.log(`✓ Seeded line-station relationships`);

    // Seed some connections (Yellow Line example)
    console.log('Seeding station connections...');
    const connections = [
      { fromStationId: 'huda-city-centre', toStationId: 'hauz-khas', lineId: 'yellow', travelTimeSeconds: 120, stopTimeSeconds: 25 },
      { fromStationId: 'hauz-khas', toStationId: 'rajiv-chowk', lineId: 'yellow', travelTimeSeconds: 180, stopTimeSeconds: 25 },
      { fromStationId: 'rajiv-chowk', toStationId: 'new-delhi', lineId: 'yellow', travelTimeSeconds: 90, stopTimeSeconds: 25 },
      { fromStationId: 'new-delhi', toStationId: 'chandni-chowk', lineId: 'yellow', travelTimeSeconds: 150, stopTimeSeconds: 25 },
      { fromStationId: 'chandni-chowk', toStationId: 'kashmere-gate', lineId: 'yellow', travelTimeSeconds: 120, stopTimeSeconds: 25 },
    ];

    for (const conn of connections) {
      await db.insert(stationConnections).values(conn).onConflictDoNothing();
    }
    console.log(`✓ Seeded station connections`);

    // Seed schedule for Yellow Line
    console.log('Seeding train schedules...');
    await db.insert(trainSchedules).values({
      lineId: 'yellow',
      direction: 'forward',
      startStationId: 'huda-city-centre',
      endStationId: 'kashmere-gate',
      firstTrainTime: '06:00:00',
      lastTrainTime: '23:00:00',
      peakFrequencyMinutes: 3,
      offPeakFrequencyMinutes: 8,
    }).onConflictDoNothing();
    console.log(`✓ Seeded train schedules`);

    console.log('\n✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seed();
