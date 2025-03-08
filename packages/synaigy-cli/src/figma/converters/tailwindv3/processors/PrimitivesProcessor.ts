import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { convertFigmaColorToRGBA } from "../../../utils/color.js";

export class PrimitivesProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Colors/Gray blue/50" -> "gray-blue-50"
   * Example: "Colors/Gray (light mode)/900" -> "gray-light-mode-900"
   * Example: "Colors/Gray (dark mode)/900" -> "gray-dark-mode-900"
   * Example: "Colors/Base/white" -> "base-white"
   */
  private formatVariableName(name: string): string {
    // Remove the "Colors/" prefix if it exists
    const parts = name.replace(/^Colors\//, "").split("/");

    // Process each part
    const processedParts = parts.map((part) =>
      part
        .toLowerCase()
        // Handle parentheses content
        .replace(
          /\s*\((.*?)\)/,
          (_, content) => `-${content.replace(/\s+/g, "-")}`
        )
        // Replace remaining spaces with dashes
        .replace(/\s+/g, "-")
        // Remove any non-alphanumeric characters (except dashes)
        .replace(/[^a-z0-9-]+/g, "")
        // Remove leading/trailing dashes
        .replace(/^-+|-+$/g, "")
    );

    // Join all parts with dashes
    return processedParts.join("-");
  }

  /**
   * Creates a nested path array for the Tailwind config
   * Example: "Colors/Gray blue/50" -> ["theme", "colors", "gray-blue", "50"]
   * Example: "Colors/Gray (light mode)/900" -> ["theme", "colors", "gray-light-mode", "900"]
   * Example: "Colors/Base/white" -> ["theme", "colors", "base", "white"]
   */
  private createConfigPath(name: string): string[] {
    // Remove the "Colors/" prefix
    const parts = name.replace(/^Colors\//, "").split("/");

    // Process all parts except the last one (which is the shade number)
    const processedParts = parts.slice(0, -1).map((part) =>
      part
        .toLowerCase()
        // Handle parentheses content
        .replace(
          /\s*\((.*?)\)/,
          (_, content) => `-${content.replace(/\s+/g, "-")}`
        )
        // Replace remaining spaces with dashes
        .replace(/\s+/g, "-")
        // Remove any non-alphanumeric characters (except dashes)
        .replace(/[^a-z0-9-]+/g, "")
        // Remove leading/trailing dashes
        .replace(/^-+|-+$/g, "")
    );

    // Add the last part (shade number) without processing
    const lastPart = parts[parts.length - 1];

    // Return the full path array including the base config path
    return ["theme", "colors", ...processedParts, lastPart];
  }

  /**
   * Gets the category path from a variable name
   * Example: "Colors/Base/white" -> "Base"
   * Example: "Colors/Gray (dark mode)/25" -> "Gray (dark mode)"
   */
  private getCategory(name: string): string {
    const parts = name.split("/");
    // Remove the "Colors/" prefix and get the next part with its mode
    return parts.length > 1 ? parts[1] : "";
  }

  process(
    variables: FigmaVariablesResponse,
    holder: TailwindV3FormatHolder
  ): void {
    const variableCollections = Object.values(
      variables.meta.variableCollections
    );

    if (variableCollections) {
      for (const collection of variableCollections) {
        if (
          (collection.name.toLowerCase() === "_primitives" ||
            collection.name.toLowerCase() === "colors") &&
          collection.remote === false
        ) {
          // Collect all variables first
          const rootVariables: string[] = [];

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (variable && variable.resolvedType === "COLOR") {
              const name = this.formatVariableName(variable.name);
              const configPath = this.createConfigPath(variable.name);
              const colorValue =
                variable.valuesByMode[collection.defaultModeId];

              try {
                // Convert color to RGBA format
                const rgbaColor = convertFigmaColorToRGBA(colorValue);

                // Skip the 'none' value as it's already in Tailwind's defaults
                if (name !== "none") {
                  // Add CSS variable to collection
                  rootVariables.push(`  --color-${name}: ${rgbaColor};`);

                  // Add to Tailwind config with nested structure
                  holder.addConfigValue(configPath, `var(--color-${name})`);
                }
              } catch (error) {
                console.warn(
                  `Failed to convert color value for variable "${variable.name}":`,
                  error
                );
              }
            }
          }

          // Output root block with collected variables
          holder.addCssVariable("\n:root {");
          rootVariables.forEach((variable) => holder.addCssVariable(variable));
          holder.addCssVariable("}\n");

          // Add final newline
          holder.addCssVariable("\n");
        }
      }
    }
  }
}
