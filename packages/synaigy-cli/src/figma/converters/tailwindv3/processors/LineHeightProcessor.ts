import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { pxToRem, extractPixelValue } from "../../../utils/units.js";

export class LineHeightProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Line height/Default/text-xs" -> "text-xs"
   * Example: "Line height/Leading tight/text-xs" -> "tight-text-xs"
   */
  private formatVariableName(name: string): string {
    // Split the path and remove "Line height"
    const parts = name.split("/").slice(1);

    // Handle different categories
    if (parts[0] === "Default") {
      // For default, just use the text size part
      return parts[1]
        .replace(/^text-/, "")
        .replace(/\s*\([^)]*\)/, "")
        .toLowerCase();
    } else {
      // For others (like "Leading tight"), combine with the text size
      const category = parts[0].replace("Leading ", "").toLowerCase();
      const size = parts[1].replace(/^text-/, "").toLowerCase();
      return `${category}-${size}`;
    }
  }

  /**
   * Gets the CSS variable name for a line height
   * Example: "Line height/Default/text-xs" -> "line-height-text-xs"
   * Example: "Line height/Leading tight/text-xs" -> "line-height-tight-text-xs"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `line-height-${cleanName}`;
  }

  /**
   * Checks if a variable is a line height variable
   */
  private isLineHeightVariable(name: string): boolean {
    return name.startsWith("Line height/");
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
          collection.name === "6. Typography" &&
          collection.remote === false
        ) {
          // Collect all variables first
          const rootVariables: string[] = [];

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (
              variable &&
              variable.resolvedType === "FLOAT" &&
              this.isLineHeightVariable(variable.name)
            ) {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);
              const value = variable.valuesByMode[collection.defaultModeId];
              const pixelValue = extractPixelValue(
                value,
                variables,
                "line-height"
              );
              const remValue = pxToRem(pixelValue);

              // Add CSS variable to collection
              rootVariables.push(`  --${cssVarName}: ${remValue};`);

              // Add to Tailwind config
              holder.addConfigValue(
                ["theme", "lineHeight", name],
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
