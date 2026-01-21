import React from 'react';
import { useStore } from '../../store';
import { Zap } from 'lucide-react';
import InTransitMode from './InTransitMode';
import LiveTrainMap from '../map/LiveTrainMap';

/**
 * In-Transit Tracker - shows when user has enabled in-transit tracking
 * Can be integrated into the main Journey Planner component
 */
export const InTransitTracker: React.FC = () => {
  const {
    inTransitMode,
    inTransitLineId,
    inTransitDirection,
    activeTrainId,
    setInTransitMode,
    clearInTransitSession,
  } = useStore();

  if (!inTransitMode || !inTransitLineId || !inTransitDirection) {
    return null;
  }

  return (
    <>
      {/* Floating Badge */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setInTransitMode(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-full shadow-lg transition"
        >
          <Zap className="w-5 h-5 animate-pulse" />
          <span className="font-medium">In Transit</span>
        </button>
      </div>

      {/* Full Modal */}
      {inTransitMode && (
        <InTransitMode
          lineId={inTransitLineId}
          direction={inTransitDirection}
          onClose={() => clearInTransitSession()}
        />
      )}

      {/* Live Map (optional, can be shown as a drawer) */}
      {activeTrainId && (
        <div className="fixed bottom-24 right-6 w-80 bg-white rounded-lg shadow-lg z-30 max-h-80">
          <LiveTrainMap lineId={inTransitLineId} direction={inTransitDirection} />
        </div>
      )}
    </>
  );
};

export default InTransitTracker;
