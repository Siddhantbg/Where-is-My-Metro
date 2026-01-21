import { useState, useEffect, useRef } from 'react';
import { MetroStation } from '../../types/metro';
import { MetroIcon, InterchangeIcon } from '../icons/FacilityIcons';
import { LineBadge } from './LineBadge';
import api from '../../services/api';

interface StationSelectDropdownProps {
  placeholder: string;
  lineId: string | null;
  lineColor: string;
  lineNumber: number;
  onSelect: (station: MetroStation) => void;
  selectedStation: MetroStation | null;
  excludeStationId?: string;
}

export function StationSelectDropdown({
  placeholder,
  lineId,
  lineColor,
  lineNumber,
  onSelect,
  selectedStation,
  excludeStationId
}: StationSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stations, setStations] = useState<Array<MetroStation & { order: number }>>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchStations() {
      if (!lineId) {
        setStations([]);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/stations?lineId=${lineId}`);
        const data = response.data;

        // Add order based on sequenceNumber or index
        const stationsWithOrder = data.map((station: any, idx: number) => ({
          ...station,
          order: station.sequenceNumber || idx + 1
        }));

        setStations(stationsWithOrder);
      } catch (error) {
        console.error('Failed to fetch stations:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStations();
  }, [lineId]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleStationSelect = (station: MetroStation) => {
    onSelect(station);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null as any);
    setSearchQuery('');
  };

  const filteredStations = stations.filter(station => {
    if (excludeStationId && station.id === excludeStationId) return false;
    if (!searchQuery) return true;
    return station.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const isDisabled = !lineId;

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Container */}
      <div className="relative">
        <button
          onClick={() => !isDisabled && setIsOpen(!isOpen)}
          disabled={isDisabled}
          className={`w-full px-4 py-3 bg-white border-2 rounded-lg text-left flex items-center justify-between transition-colors focus:outline-none ${
            isDisabled
              ? 'border-gray-200 cursor-not-allowed bg-gray-50'
              : 'border-gray-300 hover:border-blue-500 focus:border-blue-500'
          }`}
        >
          <div className="flex items-center gap-3 flex-1">
            {selectedStation ? (
              <>
                <span className="font-medium text-gray-900">{selectedStation.name}</span>
                {selectedStation.isInterchange && (
                  <InterchangeIcon className="w-4 h-4 text-purple-600" />
                )}
              </>
            ) : (
              <span className={isDisabled ? 'text-gray-400' : 'text-gray-500'}>
                {isDisabled ? 'Select a line first' : placeholder}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedStation && !isDisabled && (
              <span className="w-6 h-6"></span>
            )}
            <svg
              className={`w-5 h-5 transition-transform ${
                isDisabled ? 'text-gray-400' : 'text-gray-500'
              } ${isOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </button>
        {/* Clear button overlay */}
        {selectedStation && !isDisabled && (
          <button
            onClick={handleClear}
            className="absolute right-10 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors z-10"
            aria-label="Clear selection"
          >
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown Panel */}
      {isOpen && !isDisabled && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl">
          {/* Header with Line Badge and Search */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Select Station</span>
              <LineBadge color={lineColor} number={lineNumber} size="sm" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Station List */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center text-gray-500">
                Loading stations...
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchQuery ? 'No matching stations' : 'No stations found'}
              </div>
            ) : (
              <div className="py-2 bg-pink-50">
                {filteredStations.map((station) => (
                  <button
                    key={station.id}
                    onClick={() => handleStationSelect(station)}
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-white transition-colors group"
                  >
                    {/* Left: Number + Radio + Name */}
                    <div className="flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-8">({station.order})</span>
                      <span
                        className="w-4 h-4 border-2 rounded-full"
                        style={{ borderColor: lineColor }}
                      />
                      <span className="font-medium uppercase text-sm group-hover:text-blue-600">
                        {station.name}
                      </span>
                    </div>

                    {/* Right: Facility Icons */}
                    <div className="flex items-center gap-2">
                      <MetroIcon className="w-5 h-5 text-gray-600" />
                      {station.isInterchange && (
                        <InterchangeIcon className="w-5 h-5 text-purple-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
