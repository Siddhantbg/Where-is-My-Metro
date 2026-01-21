import { useState, useCallback } from 'react';

// Go validator server URL (runs on port 5001 by default)
const VALIDATOR_API_URL = 'http://localhost:5001';

interface ValidationIssue {
  severity: 'error' | 'warning';
  category: string;
  id: string;
  message: string;
}

interface ValidationCategoryResult {
  category: string;
  passed: number;
  failed: number;
  warnings: number;
  issues?: ValidationIssue[];
}

interface ValidationStats {
  Cities: number;
  Lines: number;
  Stations: number;
  Connections: number;
}

interface ValidationResponse {
  success: boolean;
  database: string;
  timestamp: string;
  stats: ValidationStats;
  results: Record<string, ValidationCategoryResult>;
  issues: ValidationIssue[];
  status: 'pass' | 'pass_with_warnings' | 'fail' | 'error';
  error?: string;
}

interface UseDataValidatorReturn {
  validate: () => Promise<void>;
  results: ValidationResponse | null;
  loading: boolean;
  error: string | null;
  isAvailable: boolean;
  checkAvailability: () => Promise<boolean>;
}

/**
 * Hook to interact with the Go-based metro data validator service.
 *
 * The validator runs as a separate service on port 5001 and validates
 * the integrity of metro data in the SQLite database.
 *
 * This hook is optional - the app functions normally without it.
 *
 * Usage:
 * ```tsx
 * const { validate, results, loading, error, isAvailable } = useDataValidator();
 *
 * // Check if validator service is running
 * await checkAvailability();
 *
 * // Run validation
 * await validate();
 * ```
 */
export function useDataValidator(): UseDataValidatorReturn {
  const [results, setResults] = useState<ValidationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${VALIDATOR_API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000), // 2 second timeout
      });
      const available = response.ok;
      setIsAvailable(available);
      return available;
    } catch {
      setIsAvailable(false);
      return false;
    }
  }, []);

  const validate = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // First check if service is available
      const available = await checkAvailability();
      if (!available) {
        throw new Error('Validator service is not running. Start it with: metro-validator serve');
      }

      const response = await fetch(`${VALIDATOR_API_URL}/api/validate`);

      if (!response.ok) {
        throw new Error(`Validation request failed: ${response.statusText}`);
      }

      const data: ValidationResponse = await response.json();
      setResults(data);

      if (data.error) {
        setError(data.error);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Validation failed';
      setError(message);
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [checkAvailability]);

  return {
    validate,
    results,
    loading,
    error,
    isAvailable,
    checkAvailability,
  };
}
