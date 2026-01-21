import api from './api';
import { MetroLine, MetroStation } from '../types/metro';

export const metroApi = {
  // Get all metro lines
  async getLines(): Promise<MetroLine[]> {
    const response = await api.get<MetroLine[]>('/lines');
    return response.data;
  },

  // Get line by ID
  async getLineById(id: string): Promise<MetroLine> {
    const response = await api.get<MetroLine>(`/lines/${id}`);
    return response.data;
  },

  // Get all stations
  async getStations(lineId?: string): Promise<MetroStation[]> {
    const params = lineId ? { lineId } : {};
    const response = await api.get<MetroStation[]>('/stations', { params });
    return response.data;
  },

  // Get station by ID
  async getStationById(id: string): Promise<MetroStation> {
    const response = await api.get<MetroStation>(`/stations/${id}`);
    return response.data;
  },

  // Get nearby stations
  async getNearbyStations(
    lat: number,
    lng: number,
    radius: number = 2000
  ): Promise<any[]> {
    const response = await api.get<any[]>('/stations/nearby', {
      params: { lat, lng, radius },
    });
    return response.data;
  },

  // Find route between two stations
  async findRoute(
    origin: string,
    destination: string,
    departureTime?: string
  ): Promise<any> {
    const response = await api.post<any>('/routes/find', {
      origin,
      destination,
      departureTime,
    });
    return response.data;
  },

  // Crowdsourced Tracking APIs

  // Report a train sighting
  async reportTrainSighting(data: {
    lineId: string;
    stationId: string;
    direction: 'forward' | 'backward';
    userLatitude?: number;
    userLongitude?: number;
    userId?: string;
  }): Promise<any> {
    const response = await api.post<any>('/train-sightings', data);
    return response.data;
  },

  // Get estimated train positions for a line
  async getTrainPositions(
    lineId: string,
    direction?: 'forward' | 'backward',
    maxAge?: number
  ): Promise<any> {
    const params: any = {};
    if (direction) params.direction = direction;
    if (maxAge) params.maxAge = maxAge;

    const response = await api.get<any>(`/train-positions/${lineId}`, { params });
    return response.data;
  },

  // Get live tracking for a route
  async getLiveRouteTracking(
    origin: string,
    destination: string,
    maxAge?: number
  ): Promise<any> {
    const params = maxAge ? { maxAge } : {};
    const response = await api.get<any>(`/live-tracking/${origin}/${destination}`, { params });
    return response.data;
  },

  // Get recent sightings (for debugging/admin)
  async getRecentSightings(cityId?: string, limit?: number): Promise<any> {
    const params: any = {};
    if (cityId) params.cityId = cityId;
    if (limit) params.limit = limit;

    const response = await api.get<any>('/train-sightings/recent', { params });
    return response.data;
  },
};

export default metroApi;
