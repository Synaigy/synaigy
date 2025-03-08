import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";

interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

type FigmaVariableValue = string | FigmaVariableAlias;

export class BorderWidthProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Border width/border-width-none" -> "none"
   */
  private formatVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Clean up the name
    return lastPart
      .replace(/^border-width-/, "") // Remove border-width- prefix
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Gets the CSS variable name for a border width
   * Example: "Border width/border-width-none" -> "spacing-border-width-none"
   */
  private getCssVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Clean up the name but keep the border-width prefix
    const cleanName = lastPart
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    return `spacing-${cleanName}`;
  }

  /**
   * Gets the CSS variable name for a referenced border width
   */
  private getReferencedCssVariableName(name: string): string {
    const cleanPath = name
      .replace(/^_Primitives\//, "")
      .replace(/Border width\//g, "");

    const parts = cleanPath.split("/");
    const lastPart = parts[parts.length - 1];

    const formattedName = lastPart
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .replace(/-+/g, "-"); // Replace multiple consecutive hyphens with single hyphen

    return `spacing-${formattedName}`;
  }

  /**
   * Checks if a value is a variable alias
   */
  private isVariableAlias(value: any): value is FigmaVariableAlias {
    return (
      value && typeof value === "object" && value.type === "VARIABLE_ALIAS"
    );
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
        if (collection.name === "Border width" && collection.remote === false) {
          const rootVariables: string[] = [];
          const processedVariables = new Set<string>();

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (variable && variable.resolvedType === "FLOAT") {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);

              // Skip if we've already processed this variable name
              if (processedVariables.has(name)) continue;
              processedVariables.add(name);

              // Get the value
              const value = variable.valuesByMode[
                collection.defaultModeId
              ] as FigmaVariableValue;
              if (typeof value === "string" || typeof value === "number") {
                // Direct value
                rootVariables.push(`  --${cssVarName}: ${value};`);

                // Add to Tailwind config
                holder.addConfigValue(["theme", "borderWidth", name], value);
              } else if (this.isVariableAlias(value)) {
                console.log("is reference");
                // Variable alias
                const referencedVar = variables.meta.variables[value.id];
                console.log(referencedVar);
                if (referencedVar) {
                  const referencedValue =
                    referencedVar.valuesByMode[collection.defaultModeId];
                  if (
                    typeof referencedValue === "string" ||
                    typeof referencedValue === "number"
                  ) {
                    rootVariables.push(
                      `  --${cssVarName}: ${referencedValue};`
                    );

                    // Add to Tailwind config
                    holder.addConfigValue(
                      ["theme", "borderWidth", name],
                      referencedValue
                    );
                  }
                }
              }
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
        }
      }
    }
  }
}
