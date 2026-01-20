import { Request, Response } from 'express';
import { db } from '../config/database';
import { cities, metroLines, metroStations } from '../db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Get all active cities
 * GET /api/cities
 */
export async function getAllCities(req: Request, res: Response) {
  try {
    // Get all active cities
    const allCities = await db.select().from(cities).where(eq(cities.isActive, true)).all();

    // For each city, get counts of lines and stations
    const citiesWithCounts = await Promise.all(
      allCities.map(async (city) => {
        const linesCount = await db
          .select()
          .from(metroLines)
          .where(eq(metroLines.cityId, city.id))
          .all();

        const stationsCount = await db
          .select()
          .from(metroStations)
          .where(eq(metroStations.cityId, city.id))
          .all();

        return {
          ...city,
          mapCenter: JSON.parse(city.mapCenter), // Parse JSON string
          linesCount: linesCount.length,
          stationsCount: stationsCount.length,
        };
      })
    );

    res.json(citiesWithCounts);
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ error: 'Failed to fetch cities' });
  }
}

/**
 * Get a specific city by ID
 * GET /api/cities/:cityId
 */
export async function getCityById(req: Request, res: Response) {
  try {
    const { cityId } = req.params;

    const city = await db.select().from(cities).where(eq(cities.id, cityId)).get();

    if (!city) {
      return res.status(404).json({ error: 'City not found' });
    }

    // Get counts
    const linesCount = await db
      .select()
      .from(metroLines)
      .where(eq(metroLines.cityId, city.id))
      .all();

    const stationsCount = await db
      .select()
      .from(metroStations)
      .where(eq(metroStations.cityId, city.id))
      .all();

    const cityWithCounts = {
      ...city,
      mapCenter: JSON.parse(city.mapCenter),
      linesCount: linesCount.length,
      stationsCount: stationsCount.length,
    };

    res.json(cityWithCounts);
  } catch (error) {
    console.error('Error fetching city:', error);
    res.status(500).json({ error: 'Failed to fetch city' });
  }
}
