import React, { useEffect, useRef } from 'react';
import { useLineLiveTrains } from '../../hooks/useLiveTracking';

interface LiveTrainMapProps {
  lineId: string;
  direction: 'forward' | 'backward';
  centerLat?: number;
  centerLng?: number;
  zoom?: number;
}

/**
 * Live map showing all trains on a line in real-time
 * Uses canvas for lightweight rendering (or integrate Leaflet/Mapbox as needed)
 */
export const LiveTrainMap: React.FC<LiveTrainMapProps> = ({
  lineId,
  direction,
  centerLat = 28.7041,
  centerLng = 77.1025,
  zoom = 12,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { trains } = useLineLiveTrains(lineId, direction);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Draw background
    ctx.fillStyle = '#f0f4f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e7ff';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
    for (let i = 0; i < canvas.height; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvas.width, i);
      ctx.stroke();
    }

    // Simple projection (placeholder for proper map projection)
    const project = (lat: number, lng: number) => {
      const scale = Math.pow(2, zoom) * 256 / (40075017 * Math.PI / 180);
      const x =
        ((lng * 20037508.34) / 180 - (centerLng * 20037508.34) / 180) * scale +
        canvas.width / 2;
      const y =
        (canvas.height / 2 -
          (Math.log(Math.tan((Math.PI / 4 + (lat * Math.PI) / 360) * 1)) *
            (20037508.34 / Math.PI)) *
            scale) /
          1;
      return { x, y };
    };

    // Draw trains
    trains.forEach((train) => {
      const pos = project(train.currentLatitude, train.currentLongitude);

      // Draw train dot
      const radius = train.confidence > 0.7 ? 8 : train.confidence > 0.4 ? 6 : 4;
      const color =
        train.confidence > 0.7
          ? '#10b981'
          : train.confidence > 0.4
            ? '#f59e0b'
            : '#ef4444';

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
      ctx.fill();

      // Draw outline
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw train ID label
      ctx.fillStyle = '#1f2937';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(train.trainId.substring(0, 4), pos.x, pos.y - radius - 8);

      // Draw speed indicator
      ctx.fillStyle = '#6366f1';
      ctx.font = '10px sans-serif';
      ctx.fillText(`${train.speed.toFixed(0)} km/h`, pos.x, pos.y + radius + 12);
    });

    // Draw center marker
    const center = project(centerLat, centerLng);
    ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
    ctx.beginPath();
    ctx.arc(center.x, center.y, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw legend
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Live Trains', 10, 20);

    const legendY = 40;
    const legendItems = [
      { color: '#10b981', label: 'High confidence' },
      { color: '#f59e0b', label: 'Medium confidence' },
      { color: '#ef4444', label: 'Low confidence' },
    ];

    legendItems.forEach((item, index) => {
      const y = legendY + index * 16;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.arc(18, y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#666';
      ctx.font = '10px sans-serif';
      ctx.fillText(item.label, 28, y + 3);
    });
  }, [trains, lineId, direction, centerLat, centerLng, zoom]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="w-full h-96"
      />
      <div className="bg-gray-50 p-3 text-xs text-gray-600">
        📍 Live train positions • Updates every 5-10 seconds • Confidence based on multiple reports
      </div>
    </div>
  );
};

export default LiveTrainMap;
