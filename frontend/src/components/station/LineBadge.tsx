interface LineBadgeProps {
  color: string;
  number: number;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LineBadge({ color, number, name, size = 'md' }: LineBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base'
  };

  const textColor = color === '#FFDE00' ? 'text-black' : 'text-white';

  return (
    <div className="flex items-center gap-2">
      {name && <span className="text-sm text-gray-600 font-medium">{name}</span>}
      <span
        className={`${sizeClasses[size]} rounded-full font-bold ${textColor}`}
        style={{ backgroundColor: color }}
      >
        {number}
      </span>
    </div>
  );
}
