import { useState } from 'react';
import { useStore } from '../store';
import { metroApi } from '../services/metroApi';

export function useFindRoute() {
  const { setCurrentJourney, setIsCalculatingRoute } = useStore();
  const [error, setError] = useState<string | null>(null);

  const findRoute = async (originId: string, destinationId: string, departureTime?: string) => {
    if (!originId || !destinationId) {
      setError('Please select both origin and destination');
      return null;
    }

    if (originId === destinationId) {
      setError('Origin and destination cannot be the same');
      return null;
    }

    setIsCalculatingRoute(true);
    setError(null);

    try {
      const result = await metroApi.findRoute(originId, destinationId, departureTime);
      setCurrentJourney(result as any); // Type will be properly defined later
      setIsCalculatingRoute(false);
      return result;
    } catch (err: any) {
      console.error('Error finding route:', err);
      const errorMessage = err.response?.data?.error || 'Failed to find route. Please try again.';
      setError(errorMessage);
      setIsCalculatingRoute(false);
      setCurrentJourney(null);
      return null;
    }
  };

  const clearRoute = () => {
    setCurrentJourney(null);
    setError(null);
  };

  return {
    findRoute,
    clearRoute,
    error,
  };
}
