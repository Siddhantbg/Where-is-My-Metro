import { Request, Response } from 'express';
import { eq, asc, desc } from 'drizzle-orm';
import db from '../config/database';
import { metroLines, metroStations, lineStations } from '../db/schema';

export const getAllLines = async (req: Request, res: Response) => {
  try {
    const { cityId } = req.query;

    let query = db.select().from(metroLines);

    // Filter by cityId if provided
    if (cityId && typeof cityId === 'string') {
      query = query.where(eq(metroLines.cityId, cityId)) as any;
    }

    const lines = await query.orderBy(metroLines.displayOrder);
    res.json(lines);
  } catch (error) {
    console.error('Error fetching metro lines:', error);
    res.status(500).json({ error: 'Failed to fetch metro lines' });
  }
};

export const getLineById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const line = await db.select().from(metroLines).where(eq(metroLines.id, id)).limit(1);

    if (line.length === 0) {
      return res.status(404).json({ error: 'Metro line not found' });
    }

    res.json(line[0]);
  } catch (error) {
    console.error('Error fetching metro line:', error);
    res.status(500).json({ error: 'Failed to fetch metro line' });
  }
};

export const getLinesWithStations = async (req: Request, res: Response) => {
  try {
    const { cityId } = req.query;

    // Get all metro lines ordered by displayOrder, filtered by cityId if provided
    let query = db.select().from(metroLines);

    if (cityId && typeof cityId === 'string') {
      query = query.where(eq(metroLines.cityId, cityId)) as any;
    }

    const lines = await query.orderBy(metroLines.displayOrder);

    // For each line, get its stations with sequence numbers
    const linesWithStations = await Promise.all(
      lines.map(async (line) => {
        // Get stations for this line ordered by sequence number
        const stations = await db
          .select({
            id: metroStations.id,
            name: metroStations.name,
            latitude: metroStations.latitude,
            longitude: metroStations.longitude,
            isInterchange: metroStations.isInterchange,
            order: lineStations.sequenceNumber,
          })
          .from(metroStations)
          .innerJoin(lineStations, eq(metroStations.id, lineStations.stationId))
          .where(eq(lineStations.lineId, line.id))
          .orderBy(asc(lineStations.sequenceNumber));

        // Get terminal stations (first and last)
        const terminalStations = {
          start: stations.length > 0 ? stations[0].name : '',
          end: stations.length > 0 ? stations[stations.length - 1].name : '',
        };

        return {
          id: line.id,
          name: line.name,
          color: line.color,
          displayOrder: line.displayOrder,
          terminalStations,
          stations,
        };
      })
    );

    res.json(linesWithStations);
  } catch (error) {
    console.error('Error fetching lines with stations:', error);
    res.status(500).json({ error: 'Failed to fetch lines with stations' });
  }
};
