import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { FigmaVariableAlias } from "../../../utils/color.js";

interface RadiusMode {
  modeId: string;
  name: string;
  className: string;
}

export class RadiusModesProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Radius/Button/button-radius (lg)" -> "button-radius-lg"
   */
  private formatVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Extract any size in parentheses
    const sizeSuffix = lastPart.match(/\((.*?)\)/)?.[1] || "";

    // Clean up the name and add size suffix if present
    const cleanName = lastPart
      .replace(/\s*\([^)]*\)/, "") // Remove anything in parentheses
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    return sizeSuffix ? `${cleanName}-${sizeSuffix}` : cleanName;
  }

  /**
   * Gets the CSS variable name for a radius
   * Example: "Radius/Button/button-radius (lg)" -> "radius-button-radius-lg"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `radius-${cleanName}`;
  }

  /**
   * Gets the CSS variable name for a referenced radius
   */
  private getReferencedCssVariableName(name: string): string {
    const cleanPath = name
      .replace(/^_Primitives\/Radius\//, "")
      .replace(/Radius\//g, "");

    const parts = cleanPath.split("/");
    const lastPart = parts[parts.length - 1];

    const formattedName = parts
      .filter((part, index) => {
        if (index === parts.length - 1) return true;
        return !lastPart.toLowerCase().includes(part.toLowerCase());
      })
      .join("-")
      .replace(/\s*\([^)]*\)/, "") // Remove anything in parentheses
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .replace(/-+/g, "-"); // Replace multiple consecutive hyphens with single hyphen

    return `radius-${formattedName}`;
  }

  /**
   * Converts a mode name to a CSS class name
   * Example: "Default (compact)" -> "default-compact"
   */
  private getModeClassName(modeName: string): string {
    return modeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Gets all radius modes from the collection
   */
  private getRadiusModes(collection: any): RadiusMode[] {
    return collection.modes.map((mode: any) => ({
      modeId: mode.modeId,
      name: mode.name,
      className: this.getModeClassName(mode.name),
    }));
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
        if (collection.name === "Radius modes" && collection.remote === false) {
          // Get all available modes
          const modes = this.getRadiusModes(collection);
          const defaultMode = modes.find(
            (m) => m.modeId === collection.defaultModeId
          );
          if (!defaultMode) {
            console.warn("No default mode found in radius modes");
            continue;
          }

          // Collect variables for each mode
          const modeVariables: { [className: string]: string[] } = {};
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

              // Add root variables (default mode)
              const defaultValue = variable.valuesByMode[defaultMode.modeId];
              if (this.isVariableAlias(defaultValue)) {
                const referencedVar = variables.meta.variables[defaultValue.id];
                if (referencedVar) {
                  const referencedVarName = this.getReferencedCssVariableName(
                    referencedVar.name
                  );
                  rootVariables.push(
                    `  --${cssVarName}: var(--${referencedVarName});`
                  );

                  // Add to Tailwind config with the original name as key and our CSS variable as value
                  holder.addConfigValue(
                    ["theme", "extend", "borderRadius", name],
                    `var(--${cssVarName})`
                  );
                }
              }

              // Collect variables for each mode
              for (const mode of modes) {
                if (mode.modeId === defaultMode.modeId) continue;

                const modeValue = variable.valuesByMode[mode.modeId];
                if (this.isVariableAlias(modeValue)) {
                  const referencedVar = variables.meta.variables[modeValue.id];
                  if (referencedVar) {
                    if (!modeVariables[mode.className]) {
                      modeVariables[mode.className] = [];
                    }
                    modeVariables[mode.className].push(
                      `  --${cssVarName}: var(--${this.getReferencedCssVariableName(referencedVar.name)});`
                    );
                  }
                }
              }
            }
          }

          // Output root block with collected variables
          holder.addCssVariable("\n:root {");
          rootVariables.forEach((variable) => holder.addCssVariable(variable));
          holder.addCssVariable("}\n");

          // Output mode-specific classes
          for (const [className, variables] of Object.entries(modeVariables)) {
            holder.addCssVariable("\n");
            holder.addCssVariable(`.${className} {`);
            variables.forEach((variable) => holder.addCssVariable(variable));
            holder.addCssVariable("}");
          }

          // Add final newline
          holder.addCssVariable("\n");
        }
      }
    }
  }
}
