import { FigmaVariablesResponse } from "../converters/types.js";

export interface VariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

/**
 * Converts a pixel value to rem
 * @param pixels The pixel value to convert
 * @returns The value in rem, or "0" if pixels is 0
 */
export function pxToRem(pixels: number): string {
  if (pixels === 0) return "0";
  return `${(pixels / 16).toFixed(3)}rem`;
}

/**
 * Resolves a variable alias to its actual value
 * @param alias The variable alias object
 * @param variables The complete variables collection
 * @returns The resolved value
 */
export function resolveVariableAlias(
  alias: VariableAlias,
  variables: FigmaVariablesResponse
): any {
  const referencedVariable = variables.meta.variables[alias.id];
  if (!referencedVariable) {
    console.warn(`Could not find referenced variable: ${alias.id}`);
    return 0;
  }
  return referencedVariable.valuesByMode[
    Object.keys(referencedVariable.valuesByMode)[0]
  ];
}

/**
 * Extracts a pixel value from a Figma variable value
 * @param value The value to extract pixels from (can be number, string with px, or variable alias)
 * @param variables The complete variables collection (needed for resolving aliases)
 * @param context Optional context for warning messages (e.g., "width" or "spacing")
 * @returns The extracted pixel value
 */
export function extractPixelValue(
  value: any,
  variables: FigmaVariablesResponse,
  context: string = "value"
): number {
  // If it's already a number, return it
  if (typeof value === "number") {
    return value;
  }

  // If it's a string, try to extract the pixel value
  if (typeof value === "string") {
    const match = value.match(/\((\d+)px\)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  // If it's a variable alias, resolve it
  if (
    value &&
    typeof value === "object" &&
    "type" in value &&
    value.type === "VARIABLE_ALIAS"
  ) {
    const resolvedValue = resolveVariableAlias(
      value as VariableAlias,
      variables
    );
    // Recursively extract pixel value from resolved value
    return extractPixelValue(resolvedValue, variables, context);
  }

  console.warn(`Unexpected value type for ${context}:`, value);
  return 0;
}
