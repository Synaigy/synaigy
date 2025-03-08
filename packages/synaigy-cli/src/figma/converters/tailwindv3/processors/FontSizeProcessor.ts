import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { pxToRem, extractPixelValue } from "../../../utils/units.js";

export class FontSizeProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Font size/text-xs" -> "xs"
   * Example: "Font size/text-xl" -> "xl"
   * Example: "Font size/display-xs" -> "display-xs"
   */
  private formatVariableName(name: string): string {
    // Remove the "Font size/" prefix and then the "text-" prefix if it exists
    return name
      .replace(/^Font size\//, "")
      .replace(/^text-/, "")
      .replace(/\s*\([^)]*\)/, "")
      .toLowerCase();
  }

  /**
   * Gets the CSS variable name for a font size
   * Example: "Font size/text-xs" -> "text-xs"
   * Example: "Font size/display-xs" -> "text-display-xs"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    // Always prefix with "text-"
    return `font-size-${cleanName}`;
  }

  /**
   * Checks if a variable is a font size variable
   */
  private isFontSizeVariable(name: string): boolean {
    return name.startsWith("Font size/");
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
          collection.remote === false &&
          collection.name === "6. Typography"
        ) {
          // Collect all variables first
          const rootVariables: string[] = [];

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (
              variable &&
              variable.resolvedType === "FLOAT" &&
              this.isFontSizeVariable(variable.name)
            ) {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);
              const value = variable.valuesByMode[collection.defaultModeId];
              const pixelValue = extractPixelValue(
                value,
                variables,
                "font-size"
              );
              const remValue = pxToRem(pixelValue);

              // Add CSS variable to collection
              rootVariables.push(`  --${cssVarName}: ${remValue};`);

              // Add to Tailwind config
              holder.addConfigValue(
                ["theme", "fontSize", name],
                `var(--${cssVarName})`
              );
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
