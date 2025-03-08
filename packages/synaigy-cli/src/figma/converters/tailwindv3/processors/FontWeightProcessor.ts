import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";

export class FontWeightProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Font weight/regular" -> "regular"
   * Example: "Font weight/semibold" -> "semibold"
   */
  private formatVariableName(name: string): string {
    // Remove the "Font weight/" prefix
    return name
      .replace(/^Font weight\//, "")
      .replace(/\s*\([^)]*\)/, "")
      .toLowerCase();
  }

  /**
   * Gets the CSS variable name for a font weight
   * Example: "Font weight/regular" -> "font-weight-regular"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `font-weight-${cleanName}`;
  }

  /**
   * Checks if a variable is a font weight variable
   */
  private isFontWeightVariable(name: string): boolean {
    return name.startsWith("Font weight/");
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
              variable.resolvedType === "STRING" &&
              this.isFontWeightVariable(variable.name)
            ) {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);
              const value = variable.valuesByMode[collection.defaultModeId];

              // Add CSS variable to collection
              rootVariables.push(`  --${cssVarName}: "${value}";`);

              // Add to Tailwind config
              holder.addConfigValue(
                ["theme", "fontWeight", name],
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
