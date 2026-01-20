import { Request, Response } from 'express';
import { findShortestRoute } from '../services/routeFinder.service';

export const findRoute = async (req: Request, res: Response) => {
  try {
    const { origin, destination, departureTime } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    if (origin === destination) {
      return res.status(400).json({ error: 'Origin and destination cannot be the same' });
    }

    const route = await findShortestRoute(origin, destination, departureTime);

    if (!route) {
      return res.status(404).json({ error: 'No route found between these stations' });
    }

    res.json(route);
  } catch (error: any) {
    console.error('Error finding route:', error);

    // Handle city validation error specifically
    if (error.message === 'Origin and destination must be in the same city') {
      return res.status(400).json({ error: error.message });
    }

    res.status(500).json({ error: 'Failed to find route' });
  }
};
