import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";

export class ContainerWidthsProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Container/sm" -> "sm"
   * Example: "Container/2xl" -> "2xl"
   */
  private formatVariableName(name: string): string {
    return name
      .replace(/^Container\//, "")
      .replace(/\s*\([^)]*\)/, "")
      .toLowerCase();
  }

  /**
   * Gets the CSS variable name for a container width value
   * Example: "Container/sm" -> "container-sm"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `container-${cleanName}`;
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
        if (collection.name === "Container") {
          // Collect all variables first
          const rootVariables: string[] = [];

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (variable && variable.resolvedType === "FLOAT") {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);
              const value = variable.valuesByMode[collection.defaultModeId];

              // Add CSS variable to collection
              rootVariables.push(`  --${cssVarName}: ${value}px;`);

              // Add to Tailwind config screens using CSS variable reference
              holder.addConfigValue(
                ["theme", "screens", name],
                `var(--${cssVarName})`
              );
            }
          }

          // Output root block with collected variables
          if (rootVariables.length > 0) {
            holder.addCssVariable("\n:root {");
            rootVariables.forEach((variable) =>
              holder.addCssVariable(variable)
            );
            holder.addCssVariable("}\n");
          }

          // Add final newline
          holder.addCssVariable("\n");
        }
      }
    }
  }
}
