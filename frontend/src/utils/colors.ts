// Metro line color mapping
export const METRO_COLORS: Record<string, string> = {
  red: '#E21B28',
  blue: '#0066B3',
  yellow: '#F7B500',
  green: '#00A550',
  violet: '#8B008B',
  pink: '#E91E8C',
  magenta: '#D81F98',
  grey: '#808080',
  rapid: '#F04E98',
};

/**
 * Get color for a metro line
 * @param lineId Line identifier (e.g., 'red', 'blue')
 * @returns Hex color code
 */
export function getLineColor(lineId: string): string {
  return METRO_COLORS[lineId.toLowerCase()] || '#000000';
}

/**
 * Get text color (black or white) that contrasts with background color
 * @param bgColor Background color in hex format
 * @returns 'black' or 'white'
 */
export function getContrastColor(bgColor: string): 'black' | 'white' {
  // Remove # if present
  const color = bgColor.replace('#', '');

  // Convert to RGB
  const r = parseInt(color.substring(0, 2), 16);
  const g = parseInt(color.substring(2, 4), 16);
  const b = parseInt(color.substring(4, 6), 16);

  // Calculate luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'black' : 'white';
}
