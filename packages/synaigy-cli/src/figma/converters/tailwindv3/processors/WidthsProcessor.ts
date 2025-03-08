import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { pxToRem, extractPixelValue } from "../../../utils/units.js";

export class WidthsProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "width-none" -> "none"
   * Example: "width-xl" -> "xl"
   * Example: "width-5xl" -> "5xl"
   */
  private formatVariableName(name: string): string {
    // Remove the "width-" prefix and any parenthetical values
    return name
      .replace(/^width-/, "")
      .replace(/\s*\([^)]*\)/, "")
      .toLowerCase();
  }

  /**
   * Gets the CSS variable name for a width value
   * Example: "width-xl" -> "spacing-width-xl"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `spacing-width-${cleanName}`;
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
          (collection.name === "4. Widths" || collection.name === "Max-width")
        ) {
          // Collect all variables first
          const rootVariables: string[] = [];

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (variable && variable.resolvedType === "FLOAT") {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);
              const value = variable.valuesByMode[collection.defaultModeId];
              const pixelValue = extractPixelValue(value, variables, "width");
              const remValue = pxToRem(pixelValue);

              // Skip the 'none' value as it's already in Tailwind's defaults
              if (name !== "none") {
                // Add CSS variable to collection
                rootVariables.push(`  --${cssVarName}: ${remValue};`);

                // Add to Tailwind config
                holder.addConfigValue(
                  ["theme", "extend", "width", name],
                  `var(--${cssVarName})`
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
