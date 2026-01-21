import { useEffect } from 'react';
import { useDataValidator } from '../../hooks/useDataValidator';
import { AlertCircle, CheckCircle, AlertTriangle, RefreshCw, Server } from 'lucide-react';

/**
 * DataValidator Component
 *
 * An optional admin/debug component that displays data validation results
 * from the Go-based metro-validator service.
 *
 * The validator service must be running separately:
 *   cd go-tools && ./metro-validator serve
 *
 * This component is completely optional and doesn't affect normal app functionality.
 */
export function DataValidator() {
  const { validate, results, loading, error, isAvailable, checkAvailability } = useDataValidator();

  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pass_with_warnings':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'fail':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pass_with_warnings':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'fail':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">Data Validator</h3>
          <span className="text-xs text-gray-500">(Go Service)</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isAvailable ? 'Online' : 'Offline'}
          </span>
          <button
            onClick={validate}
            disabled={loading || !isAvailable}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Validating...' : 'Validate'}
          </button>
        </div>
      </div>

      {!isAvailable && (
        <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200 text-sm text-gray-600">
          <p className="font-medium mb-1">Validator service not running</p>
          <code className="text-xs bg-gray-200 px-2 py-1 rounded">
            cd go-tools && ./metro-validator serve
          </code>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 rounded border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {/* Status Banner */}
          <div
            className={`flex items-center gap-2 p-3 rounded border ${getStatusColor(results.status)}`}
          >
            {getStatusIcon(results.status)}
            <span className="font-medium capitalize">
              {results.status.replace(/_/g, ' ')}
            </span>
            <span className="text-sm opacity-75">
              ({results.issues.filter((i) => i.severity === 'error').length} errors,{' '}
              {results.issues.filter((i) => i.severity === 'warning').length} warnings)
            </span>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2 text-center">
            {Object.entries(results.stats).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded p-2">
                <div className="text-lg font-semibold text-gray-800">{value}</div>
                <div className="text-xs text-gray-500">{key}</div>
              </div>
            ))}
          </div>

          {/* Category Results */}
          <div className="space-y-2">
            {Object.entries(results.results).map(([category, result]) => (
              <div
                key={category}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <span className="capitalize text-sm font-medium text-gray-700">{category}</span>
                <div className="flex items-center gap-2">
                  {result.failed > 0 ? (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {result.failed} errors
                    </span>
                  ) : null}
                  {result.warnings > 0 ? (
                    <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">
                      {result.warnings} warnings
                    </span>
                  ) : null}
                  <span className="text-xs text-gray-500">
                    {result.passed}/{result.passed + result.failed} passed
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Issues List */}
          {results.issues.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Issues</h4>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {results.issues.slice(0, 20).map((issue, index) => (
                  <div
                    key={index}
                    className={`text-xs p-2 rounded ${
                      issue.severity === 'error'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-yellow-50 text-yellow-700'
                    }`}
                  >
                    <span className="font-medium">[{issue.category}]</span> {issue.id}:{' '}
                    {issue.message}
                  </div>
                ))}
                {results.issues.length > 20 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    ... and {results.issues.length - 20} more issues
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamp */}
          <div className="text-xs text-gray-400 text-right">
            Last validated: {new Date(results.timestamp).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
}
