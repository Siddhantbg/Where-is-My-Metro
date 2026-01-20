import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// Cities Table
export const cities = sqliteTable('cities', {
  id: text('id').primaryKey(), // 'delhi', 'mumbai', 'kolkata'
  name: text('name').notNull(), // 'Delhi', 'Mumbai', 'Kolkata'
  displayName: text('display_name').notNull(), // 'Delhi Metro', 'Mumbai Metro'
  country: text('country').notNull().default('India'),
  timezone: text('timezone').notNull().default('Asia/Kolkata'),
  mapCenter: text('map_center').notNull(), // JSON: {lat, lng}
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
});

// Metro Lines Table
export const metroLines = sqliteTable('metro_lines', {
  id: text('id').primaryKey(), // 'delhi-red', 'mumbai-line-1', etc.
  cityId: text('city_id').notNull().references(() => cities.id),
  name: text('name').notNull(), // 'Red Line'
  color: text('color').notNull(), // '#E21B28'
  displayOrder: integer('display_order').notNull(),
});

// Metro Stations Table
export const metroStations = sqliteTable('metro_stations', {
  id: text('id').primaryKey(), // 'delhi-rajiv-chowk', 'mumbai-andheri'
  cityId: text('city_id').notNull().references(() => cities.id),
  name: text('name').notNull(), // 'Rajiv Chowk'
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  isInterchange: integer('is_interchange', { mode: 'boolean' }).notNull().default(false),
});

// Line-Station Relationships (junction table)
export const lineStations = sqliteTable('line_stations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lineId: text('line_id').notNull().references(() => metroLines.id),
  stationId: text('station_id').notNull().references(() => metroStations.id),
  sequenceNumber: integer('sequence_number').notNull(), // Position on line (1, 2, 3...)
  direction: text('direction').notNull(), // 'forward' or 'backward'
});

// Inter-station Travel Times
export const stationConnections = sqliteTable('station_connections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromStationId: text('from_station_id').notNull().references(() => metroStations.id),
  toStationId: text('to_station_id').notNull().references(() => metroStations.id),
  lineId: text('line_id').notNull().references(() => metroLines.id),
  travelTimeSeconds: integer('travel_time_seconds').notNull(), // 90-180 seconds
  stopTimeSeconds: integer('stop_time_seconds').notNull().default(25), // Dwell time at station: 20-30 seconds
});

// Train Schedules
export const trainSchedules = sqliteTable('train_schedules', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lineId: text('line_id').notNull().references(() => metroLines.id),
  direction: text('direction').notNull(), // 'forward' or 'backward'
  startStationId: text('start_station_id').notNull().references(() => metroStations.id),
  endStationId: text('end_station_id').notNull().references(() => metroStations.id),
  firstTrainTime: text('first_train_time').notNull(), // '06:00:00'
  lastTrainTime: text('last_train_time').notNull(), // '23:00:00'
  peakFrequencyMinutes: integer('peak_frequency_minutes').notNull(), // 2-4 minutes
  offPeakFrequencyMinutes: integer('off_peak_frequency_minutes').notNull(), // 5-10 minutes
});

// Peak Hours (separate table for flexibility)
export const peakHours = sqliteTable('peak_hours', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  scheduleId: integer('schedule_id').notNull().references(() => trainSchedules.id),
  startTime: text('start_time').notNull(), // '07:00:00'
  endTime: text('end_time').notNull(), // '10:00:00'
});

// Crowdsourced Train Sightings Table
export const trainSightings = sqliteTable('train_sightings', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  lineId: text('line_id').notNull().references(() => metroLines.id),
  stationId: text('station_id').notNull().references(() => metroStations.id),
  direction: text('direction').notNull(), // 'forward' or 'backward'
  timestamp: integer('timestamp', { mode: 'timestamp' }).notNull(),
  userId: text('user_id'), // Optional - anonymous reporting allowed
  userLatitude: real('user_latitude'), // For proximity verification
  userLongitude: real('user_longitude'),
  confidenceScore: real('confidence_score').default(1.0), // 0.0 to 1.0
  isVerified: integer('is_verified', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// TypeScript types for the schema
export type City = typeof cities.$inferSelect;
export type MetroLine = typeof metroLines.$inferSelect;
export type MetroStation = typeof metroStations.$inferSelect;
export type LineStation = typeof lineStations.$inferSelect;
export type StationConnection = typeof stationConnections.$inferSelect;
export type TrainSchedule = typeof trainSchedules.$inferSelect;
export type PeakHour = typeof peakHours.$inferSelect;

export type InsertCity = typeof cities.$inferInsert;
export type InsertMetroLine = typeof metroLines.$inferInsert;
export type InsertMetroStation = typeof metroStations.$inferInsert;
export type InsertLineStation = typeof lineStations.$inferInsert;
export type InsertStationConnection = typeof stationConnections.$inferInsert;
export type InsertTrainSchedule = typeof trainSchedules.$inferInsert;
export type InsertPeakHour = typeof peakHours.$inferInsert;
export type TrainSighting = typeof trainSightings.$inferSelect;
export type InsertTrainSighting = typeof trainSightings.$inferInsert;
