export interface Position {
  row: number;
  col: number;
}

/**
 * Generates a 20x16 grid of colors covering the color spectrum
 * This creates 320 distinct colors organized like a professional color picker
 * Hues vary horizontally, saturation and lightness vary vertically
 */
export function generateColorGrid(): string[] {
  const colors: string[] = [];
  const cols = 20; // Number of hue steps
  const rows = 16; // Number of saturation/lightness steps (removed bottom 4)

  // Generate colors row by row
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      // Hue varies by column (0-360 degrees)
      const hue = (col / cols) * 360;

      // Top rows: varying lightness with full saturation (tints)
      // Remaining rows: full saturation spectrum
      let saturation: number;
      let lightness: number;

      if (row < 4) {
        // Top 4 rows: light tints (high lightness, full saturation)
        saturation = 100;
        lightness = 95 - row * 10; // 95%, 85%, 75%, 65%
      } else {
        // Remaining 12 rows: full spectrum (varying lightness, full saturation)
        saturation = 100;
        lightness = 60 - (row - 4) * 4; // 60% down to 12%
      }

      const color = hslToHex(hue, saturation, lightness);
      colors.push(color);
    }
  }

  return colors;
}

/**
 * Converts HSL color values to HEX
 */
function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;

  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0,
    g = 0,
    b = 0;

  if (0 <= h && h < 60) {
    r = c;
    g = x;
    b = 0;
  } else if (60 <= h && h < 120) {
    r = x;
    g = c;
    b = 0;
  } else if (120 <= h && h < 180) {
    r = 0;
    g = c;
    b = x;
  } else if (180 <= h && h < 240) {
    r = 0;
    g = x;
    b = c;
  } else if (240 <= h && h < 300) {
    r = x;
    g = 0;
    b = c;
  } else if (300 <= h && h < 360) {
    r = c;
    g = 0;
    b = x;
  }

  const rHex = Math.round((r + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const gHex = Math.round((g + m) * 255)
    .toString(16)
    .padStart(2, "0");
  const bHex = Math.round((b + m) * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${rHex}${gHex}${bHex}`.toUpperCase();
}

/**
 * Finds the position (row, col) of a color in the grid
 */
export function findColorPosition(
  colors: string[],
  targetColor: string
): Position {
  // Try to find exact match first
  const exactIndex = colors.findIndex(
    (c) => c.toLowerCase() === targetColor.toLowerCase()
  );
  if (exactIndex !== -1) {
    return {
      row: Math.floor(exactIndex / 20),
      col: exactIndex % 20,
    };
  }

  // If no exact match, find the closest color
  const targetRgb = hexToRgb(targetColor);
  let closestIndex = 0;
  let minDistance = Infinity;

  colors.forEach((color, idx) => {
    const rgb = hexToRgb(color);
    const distance = Math.sqrt(
      Math.pow(rgb.r - targetRgb.r, 2) +
        Math.pow(rgb.g - targetRgb.g, 2) +
        Math.pow(rgb.b - targetRgb.b, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestIndex = idx;
    }
  });

  return {
    row: Math.floor(closestIndex / 20),
    col: closestIndex % 20,
  };
}

/**
 * Converts HEX color to RGB
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

/**
 * Checks if a guess position is within a certain distance (in grid cells) from the target
 * Uses Chebyshev distance (max of horizontal and vertical distance)
 * This allows for diagonal proximity detection
 */
export function isWithinProximity(
  guessPos: Position,
  targetPos: Position,
  maxDistance: number
): boolean {
  const horizontalDistance = Math.abs(guessPos.col - targetPos.col);
  const verticalDistance = Math.abs(guessPos.row - targetPos.row);

  // Chebyshev distance (allows diagonal movement)
  const distance = Math.max(horizontalDistance, verticalDistance);

  return distance <= maxDistance && distance > 0;
}
