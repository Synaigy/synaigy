import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";

export class FontFamilyProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Font family/font-family-display" -> "display"
   * Example: "Font family/font-family-body" -> "body"
   */
  private formatVariableName(name: string): string {
    // Remove the "Font family/font-family-" prefix
    return name
      .replace(/^Font family\/font-family-/, "")
      .replace(/\s*\([^)]*\)/, "")
      .toLowerCase();
  }

  /**
   * Gets the CSS variable name for a font family
   * Example: "Font family/font-family-display" -> "font-family-display"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `font-family-${cleanName}`;
  }

  /**
   * Checks if a variable is a font family variable
   */
  private isFontFamilyVariable(name: string): boolean {
    return name.startsWith("Font family/");
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
          (collection.name === "6. Typography" ||
            collection.name === "Typography")
        ) {
          // Collect all variables first
          const rootVariables: string[] = [];

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (
              variable &&
              variable.resolvedType === "STRING" &&
              this.isFontFamilyVariable(variable.name)
            ) {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);
              const value = variable.valuesByMode[collection.defaultModeId];

              // Add CSS variable to collection
              rootVariables.push(`  --${cssVarName}: ${value};`);

              // Add to Tailwind config
              holder.addConfigValue(
                ["theme", "fontFamily", name],
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
