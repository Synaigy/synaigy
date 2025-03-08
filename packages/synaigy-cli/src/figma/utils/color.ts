/**
 * Interface for Figma's color value format
 */
export interface FigmaColor {
  r: number; // Red component (0-1)
  g: number; // Green component (0-1)
  b: number; // Blue component (0-1)
  a: number; // Alpha component (0-1)
}

export interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

export type FigmaColorValue = FigmaColor | FigmaVariableAlias;

/**
 * Converts a Figma color object to RGBA format
 * Figma uses 0-1 range for all components
 */
export function convertFigmaColorToRGBA(color: FigmaColor): string {
  // Convert from 0-1 range to 0-255 range for RGB
  const r = Math.round(color.r * 255);
  const g = Math.round(color.g * 255);
  const b = Math.round(color.b * 255);
  // Keep alpha in 0-1 range
  const a = color.a.toFixed(3);

  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Converts hex color to RGBA
 * Supports #RGB, #RGBA, #RRGGBB, #RRGGBBAA formats
 */
function hexToRGBA(hex: string): string {
  // Remove the hash
  hex = hex.replace("#", "");

  let r: number,
    g: number,
    b: number,
    a = 1;

  // Handle different hex formats
  if (hex.length === 3 || hex.length === 4) {
    // Convert #RGB(A) to #RRGGBB(AA)
    r = parseInt(hex[0] + hex[0], 16);
    g = parseInt(hex[1] + hex[1], 16);
    b = parseInt(hex[2] + hex[2], 16);
    if (hex.length === 4) {
      a = parseInt(hex[3] + hex[3], 16) / 255;
    }
  } else if (hex.length === 6 || hex.length === 8) {
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
    if (hex.length === 8) {
      a = parseInt(hex.slice(6, 8), 16) / 255;
    }
  } else {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
}

/**
 * Normalizes rgb/rgba color to ensure consistent RGBA format
 */
function normalizeRGBA(color: string): string {
  // Extract values using regex
  const rgbMatch = color.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/
  );
  if (!rgbMatch) {
    throw new Error(`Invalid rgb/rgba color: ${color}`);
  }

  const [, r, g, b, a = "1"] = rgbMatch;
  return `rgba(${r}, ${g}, ${b}, ${parseFloat(a).toFixed(3)})`;
}

/**
 * Converts HSL/HSLA color to RGBA
 */
function hslToRGBA(color: string): string {
  // Extract values using regex
  const hslMatch = color.match(
    /hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*([0-9.]+))?\)/
  );
  if (!hslMatch) {
    throw new Error(`Invalid hsl/hsla color: ${color}`);
  }

  const [, h, s, l, a = "1"] = hslMatch;
  const alpha = parseFloat(a);

  // Convert HSL to RGB
  const hue = parseInt(h) / 360;
  const sat = parseInt(s) / 100;
  const light = parseInt(l) / 100;

  let r: number, g: number, b: number;

  if (sat === 0) {
    r = g = b = light;
  } else {
    const q = light < 0.5 ? light * (1 + sat) : light + sat - light * sat;
    const p = 2 * light - q;

    r = hueToRGB(p, q, hue + 1 / 3);
    g = hueToRGB(p, q, hue);
    b = hueToRGB(p, q, hue - 1 / 3);
  }

  return `rgba(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}, ${alpha.toFixed(3)})`;
}

/**
 * Helper function for HSL to RGB conversion
 */
function hueToRGB(p: number, q: number, t: number): number {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}
