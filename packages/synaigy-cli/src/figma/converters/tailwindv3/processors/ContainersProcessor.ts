import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { pxToRem, extractPixelValue } from "../../../utils/units.js";

export class ContainersProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "container-padding-mobile" -> "padding-mobile"
   * Example: "container-max-width-desktop" -> "max-width-desktop"
   */
  private formatVariableName(name: string): string {
    return name
      .replace(/^container-/, "")
      .replace(/\s*\([^)]*\)/, "")
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Gets the CSS variable name for a container value
   * Example: "container-padding-mobile" -> "container-padding-mobile"
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
        if (
          collection.name === "5. Containers" &&
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
              const pixelValue = extractPixelValue(
                value,
                variables,
                "container"
              );
              const remValue = pxToRem(pixelValue);

              // Add CSS variable to collection
              rootVariables.push(`  --${cssVarName}: ${remValue};`);

              // Add to Tailwind config based on type
              if (name.startsWith("padding-")) {
                holder.addConfigValue(
                  [
                    "theme",
                    "container",
                    "padding",
                    name.replace("padding-", ""),
                  ],
                  `var(--${cssVarName})`
                );
              } else if (name.startsWith("max-width-")) {
                holder.addConfigValue(
                  ["theme", "container", "maxWidth"],
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
