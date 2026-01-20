interface TrainIndicatorProps {
  progress: number; // 0-100
}

export function TrainIndicator({ progress }: TrainIndicatorProps) {
  return (
    <div
      className="relative transition-all duration-1000 ease-linear"
      style={{
        transform: `translateY(${progress * 0.48}px)`, // Move down based on progress (48px = height between stations)
      }}
    >
      {/* Glowing Outer Ring */}
      <div className="absolute inset-0 -m-2 bg-blue-500 rounded-full opacity-30 animate-ping" />

      {/* Main Train Icon */}
      <div className="relative w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full shadow-lg flex items-center justify-center">
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-50 animate-pulse" />

        {/* Metro Train Icon */}
        <svg
          className="w-6 h-6 text-white relative z-10"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2l2-2h4l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-4-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm5.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-7h-5V6h5v4z" />
        </svg>
      </div>

      {/* Direction Arrow */}
      <div className="absolute -right-8 top-1/2 -translate-y-1/2">
        <svg
          className="w-4 h-4 text-blue-600 animate-bounce"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  );
}
