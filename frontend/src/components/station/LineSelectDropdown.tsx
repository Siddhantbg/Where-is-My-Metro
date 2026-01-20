import { useState, useEffect, useRef } from 'react';
import { MetroLine } from '../../types/metro';
import { LineBadge } from './LineBadge';
import { useStore } from '../../store';

interface LineSelectDropdownProps {
  placeholder: string;
  onSelect: (line: MetroLine) => void;
  selectedLine: MetroLine | null;
}

export function LineSelectDropdown({
  placeholder,
  onSelect,
  selectedLine
}: LineSelectDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [lines, setLines] = useState<MetroLine[]>([]);
  const [loading, setLoading] = useState(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { selectedCity } = useStore();

  useEffect(() => {
    async function fetchLines() {
      try {
        setLoading(true);
        // Filter lines by selected city
        const url = selectedCity
          ? `http://localhost:5000/api/lines?cityId=${selectedCity}`
          : 'http://localhost:5000/api/lines';
        const response = await fetch(url);
        const data = await response.json();
        setLines(data);
      } catch (error) {
        console.error('Failed to fetch metro lines:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchLines();
  }, [selectedCity]);

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

  const handleLineSelect = (line: MetroLine) => {
    onSelect(line);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(null as any);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Container */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-3 bg-white border-2 border-gray-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500 transition-colors focus:outline-none focus:border-blue-500"
        >
          <div className="flex items-center gap-3 flex-1">
            {selectedLine ? (
              <>
                <LineBadge
                  color={selectedLine.color}
                  number={selectedLine.displayOrder}
                  size="sm"
                />
                <span className="font-medium text-gray-900">{selectedLine.name}</span>
              </>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {selectedLine && (
              <span className="w-6 h-6"></span>
            )}
            <svg
              className={`w-5 h-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
        {selectedLine && (
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
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">
              Loading metro lines...
            </div>
          ) : lines.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No metro lines found
            </div>
          ) : (
            <div className="py-2">
              {lines.map((line) => (
                <button
                  key={line.id}
                  onClick={() => handleLineSelect(line)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-pink-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-gray-600 font-medium">Line {line.displayOrder}</span>
                    <span className="text-gray-800">{line.name}</span>
                  </div>
                  <LineBadge
                    color={line.color}
                    number={line.displayOrder}
                    size="sm"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
