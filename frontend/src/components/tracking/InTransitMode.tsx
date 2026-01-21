import React, { useState } from 'react';
import { useTrainTracking, useTrainReporter, useLineLiveTrains } from '../../hooks/useLiveTracking';
import { MapPin, Zap, Users, Clock, AlertCircle } from 'lucide-react';

interface InTransitModeProps {
  lineId: string;
  direction: 'forward' | 'backward';
  onClose: () => void;
}

/**
 * Component for users already in the metro to track live
 */
export const InTransitMode: React.FC<InTransitModeProps> = ({ lineId, direction, onClose }) => {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [isReporting, setIsReporting] = useState(false);

  const { trains, loading, error } = useLineLiveTrains(lineId, direction);
  const { train: selectedTrainData } = useTrainTracking(selectedTrain);
  const { error: reportError } = useTrainReporter(
    selectedTrain,
    lineId,
    'current-city', // Replace with actual city
    direction,
    isReporting
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.7) return 'bg-green-100 text-green-800';
    if (confidence > 0.4) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const formatTime = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleSelectTrain = (trainId: string) => {
    setSelectedTrain(trainId);
    setIsReporting(true);
  };

  const handleStopTracking = () => {
    setIsReporting(false);
    setSelectedTrain(null);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-lg">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">In-Transit Tracking</h2>
              <p className="text-blue-100 mt-1">Live train positions on your line</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-blue-800 rounded-lg p-2 transition"
            >
              ✕
            </button>
          </div>
          <div className="flex gap-4 text-sm">
            <span className="bg-blue-500/40 px-3 py-1 rounded-full">Line: {lineId}</span>
            <span className="bg-blue-500/40 px-3 py-1 rounded-full">Direction: {direction}</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-6">
          {/* Active Reporting */}
          {isReporting && selectedTrain && selectedTrainData && (
            <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-5 h-5 text-green-600" />
                    <h3 className="font-bold text-lg text-green-900">Live Tracking Active</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                    <div>
                      <p className="text-gray-600">Train ID</p>
                      <p className="font-mono font-bold text-green-700">{selectedTrain}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Speed</p>
                      <p className="font-bold text-green-700">{selectedTrainData.speed.toFixed(1)} km/h</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Confidence</p>
                      <p className="font-bold text-green-700">
                        {(selectedTrainData.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">People Reporting</p>
                      <p className="font-bold text-green-700">{selectedTrainData.reportCount}</p>
                    </div>
                  </div>
                  {selectedTrainData.nextStationETA && (
                    <div className="mt-3 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">
                        Next station in {formatTime(selectedTrainData.nextStationETA)}
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleStopTracking}
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Stop Sharing
                </button>
              </div>
              {reportError && (
                <div className="mt-3 flex items-center gap-2 text-red-700 text-sm bg-red-100 p-2 rounded">
                  <AlertCircle className="w-4 h-4" />
                  {reportError}
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-red-900">Error</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && !trains.length && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Loading trains...</p>
            </div>
          )}

          {/* Available Trains List */}
          {trains.length > 0 ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-gray-900 mb-3">
                Available Trains ({trains.length})
              </h3>
              {trains.map((train) => (
                <div
                  key={train.trainId}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition ${
                    selectedTrain === train.trainId
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => handleSelectTrain(train.trainId)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-mono font-bold text-lg">{train.trainId}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">
                          {train.currentLatitude.toFixed(4)}, {train.currentLongitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getConfidenceColor(
                        train.confidence
                      )}`}
                    >
                      {(train.confidence * 100).toFixed(0)}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-3 text-sm">
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-600 text-xs">Speed</p>
                      <p className="font-bold text-gray-900">{train.speed.toFixed(1)} km/h</p>
                    </div>
                    <div className="bg-gray-50 rounded p-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-600" />
                      <div>
                        <p className="text-gray-600 text-xs">Reports</p>
                        <p className="font-bold text-gray-900">{train.reportCount}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded p-2">
                      <p className="text-gray-600 text-xs">Status</p>
                      <p className="font-bold text-gray-900">
                        {train.isActive ? '🟢 Active' : '🔴 Stale'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 text-right">
                    <button
                      className={`px-4 py-2 rounded-lg font-medium transition ${
                        selectedTrain === train.trainId
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectTrain(train.trainId);
                      }}
                    >
                      {selectedTrain === train.trainId ? 'Tracking ✓' : 'Select'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            !loading && (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500">No active trains on this line</p>
                <p className="text-sm text-gray-400 mt-1">
                  Be the first to report your train position!
                </p>
              </div>
            )
          )}

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How It Works</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Select a train to start tracking and share your location</li>
              <li>Your GPS location updates every 30 seconds (low battery impact)</li>
              <li>Train position is calculated from multiple user reports</li>
              <li>Share live updates with friends using the read-only link</li>
              <li>Click "Stop Sharing" to end location tracking</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InTransitMode;
