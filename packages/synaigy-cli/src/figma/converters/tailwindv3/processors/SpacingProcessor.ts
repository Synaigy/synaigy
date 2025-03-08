import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { pxToRem, extractPixelValue } from "../../../utils/units.js";

interface VariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

export class SpacingProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "spacing-none" -> "none"
   * Example: "spacing-xl" -> "xl"
   * Example: "spacing-5xl" -> "5xl"
   */
  private formatVariableName(name: string): string {
    // Remove the "spacing-" prefix and any parenthetical values
    return name
      .replace(/^spacing-/, "")
      .replace(/\s*\([^)]*\)/, "")
      .toLowerCase();
  }

  /**
   * Gets the CSS variable name for a spacing value
   * Example: "spacing-xl" -> "spacing-xl"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `spacing-${cleanName}`;
  }

  /**
   * Resolves a variable alias to its actual value
   * @param alias The variable alias object
   * @param variables The complete variables collection
   * @returns The resolved value
   */
  private resolveVariableAlias(
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
          (collection.name === "3. Spacing" || collection.name === "Spacing") &&
          collection.remote === false
        ) {
          // Collect all variables first
          const rootVariables: string[] = [];

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (variable && variable.resolvedType === "FLOAT") {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);
              const value = variable.valuesByMode[collection.defaultModeId];
              const pixelValue = extractPixelValue(value, variables, "spacing");
              const remValue = pxToRem(pixelValue);

              // Skip the 'none' value as it's already in Tailwind's defaults
              if (name !== "none") {
                // Add CSS variable to collection
                rootVariables.push(`  --${cssVarName}: ${remValue};`);

                // Add to Tailwind config
                holder.addConfigValue(
                  ["theme", "extend", "spacing", name],
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
