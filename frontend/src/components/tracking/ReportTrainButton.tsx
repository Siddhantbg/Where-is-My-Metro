import { useState } from 'react';
import { Train, X, Check, ChevronRight } from 'lucide-react';
import { useStore } from '../../store';
import { metroApi } from '../../services/metroApi';

interface ReportTrainButtonProps {
  currentStationId?: string;
  lineId?: string;
}

export function ReportTrainButton({ currentStationId, lineId }: ReportTrainButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedDirection, setSelectedDirection] = useState<'forward' | 'backward' | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { userLocation } = useStore();

  const handleOpenModal = () => {
    setShowModal(true);
    setSelectedDirection(null);
  };

  const handleClose = () => {
    setShowModal(false);
    setSelectedDirection(null);
  };

  const handleSubmit = async () => {
    if (!selectedDirection || !currentStationId || !lineId) return;

    setIsSubmitting(true);

    try {
      await metroApi.reportTrainSighting({
        lineId,
        stationId: currentStationId,
        direction: selectedDirection,
        userLatitude: userLocation?.lat,
        userLongitude: userLocation?.lng,
      });

      // Show success animation
      setShowSuccess(true);
      setShowModal(false);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Failed to report train sighting:', error);
      alert('Failed to report train. Please try again.');
    } finally {
      setIsSubmitting(false);
      setSelectedDirection(null);
    }
  };

  // Don't show button if we don't have station/line context
  if (!currentStationId || !lineId) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={handleOpenModal}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full p-4 shadow-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 hover:scale-110 active:scale-95 group"
        title="Report train spotted"
      >
        <Train className="w-6 h-6" />
        <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
          !
        </div>
      </button>

      {/* Report Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-scale-in">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <Train className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Spot a Train?</h3>
                  <p className="text-sm text-gray-600">Help others track in real-time</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">
                Did you just see a train at this station? Select its direction:
              </p>

              {/* Direction Selection */}
              <div className="space-y-3">
                <button
                  onClick={() => setSelectedDirection('forward')}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    selectedDirection === 'forward'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedDirection === 'forward'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedDirection === 'forward' && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Forward Direction</p>
                      <p className="text-xs text-gray-600">Towards end of line</p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 transition-colors ${
                      selectedDirection === 'forward' ? 'text-blue-600' : 'text-gray-400'
                    }`}
                  />
                </button>

                <button
                  onClick={() => setSelectedDirection('backward')}
                  className={`w-full flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                    selectedDirection === 'backward'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedDirection === 'backward'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {selectedDirection === 'backward' && (
                        <Check className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">Backward Direction</p>
                      <p className="text-xs text-gray-600">Towards start of line</p>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-5 h-5 transition-transform ${
                      selectedDirection === 'backward' ? 'text-blue-600 rotate-180' : 'text-gray-400 rotate-180'
                    }`}
                  />
                </button>
              </div>

              {/* Privacy Notice */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-600">
                  🔒 Your location is used only to verify proximity to the station. Reports are anonymous.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-gray-200">
              <button
                onClick={handleClose}
                className="flex-1 py-3 px-4 rounded-lg border-2 border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!selectedDirection || isSubmitting}
                className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedDirection && !isSubmitting
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-lg'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Reporting...' : 'Report Train'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSuccess && (
        <div className="fixed bottom-24 right-6 z-50 bg-white rounded-lg shadow-2xl p-4 flex items-center gap-3 animate-slide-up">
          <div className="bg-green-500 rounded-full p-2">
            <Check className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Thank You!</p>
            <p className="text-sm text-gray-600">Train spotted successfully</p>
          </div>
        </div>
      )}
    </>
  );
}
