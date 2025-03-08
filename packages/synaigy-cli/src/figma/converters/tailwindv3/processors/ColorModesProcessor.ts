import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";
import { FigmaVariableAlias } from "../../../utils/color.js";

interface ColorMode {
  modeId: string;
  name: string;
  className: string;
}

export class ColorModesProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Colors/Text/text-primary (900)" -> "text-primary-900"
   * Example: "Colors/Component/Colors/Alpha/alpha-white-10" -> "alpha-white-10"
   */
  private formatVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Extract any numbers in parentheses
    const numericSuffix = lastPart.match(/\((\d+)\)/)?.[1] || "";

    // Clean up the name and add numeric suffix if present
    const cleanName = lastPart
      .replace(/\s*\([^)]*\)/, "") // Remove anything in parentheses
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    return numericSuffix ? `${cleanName}-${numericSuffix}` : cleanName;
  }

  /**
   * Gets the CSS variable name for a color
   * Example: "Colors/Text/text-primary (900)" -> "color-text-primary-900"
   */
  private getCssVariableName(name: string): string {
    const cleanName = this.formatVariableName(name);
    return `color-${cleanName}`;
  }

  /**
   * Gets the CSS variable name for a referenced color
   * Example: "_Primitives/Colors/Gray (light mode)/900" -> "color-gray-light-mode-900"
   * Example: "_Primitives/Colors/Component/Colors/Utility/Gray/utility-gray-400" -> "color-utility-gray-400"
   * Example: "_Primitives/Colors/Base/white" -> "color-base-white"
   */
  private getReferencedCssVariableName(name: string): string {
    // Remove both "_Primitives/Colors/" prefix and any "Colors/" in the path
    const cleanPath = name
      .replace(/^_Primitives\/Colors\//, "")
      .replace(/Colors\//g, ""); // Remove all instances of "Colors/"

    // Split into parts after cleaning
    const parts = cleanPath.split("/");

    // Special handling for Gray with mode information
    if (parts[0].startsWith("Gray")) {
      const mode = parts[0].match(/\((.*?)\)/)?.[1] || ""; // Extract mode from parentheses
      const value = parts[1];
      return `color-gray-${mode.toLowerCase().replace(/\s+/g, "-")}-${value}`;
    }

    // Get the last meaningful part (usually contains the actual color name)
    const lastPart = parts[parts.length - 1];

    // For utility colors, we want to preserve the utility type but remove redundancy
    if (lastPart.includes("utility-")) {
      const utilityType = parts[parts.length - 2]?.toLowerCase() || ""; // e.g., "gray"
      return `color-utility-${utilityType}-${lastPart.split("-").pop()}`; // e.g., "400"
    }

    // For other cases, clean up and remove redundant parts
    const formattedName = parts
      .filter((part, index) => {
        // Remove parts that are repeated in the last part
        if (index === parts.length - 1) return true;
        return !lastPart.toLowerCase().includes(part.toLowerCase());
      })
      .join("-")
      .replace(/\s*\([^)]*\)/, "") // Remove anything in parentheses
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .replace(/-+/g, "-"); // Replace multiple consecutive hyphens with single hyphen

    return `color-${formattedName}`;
  }

  /**
   * Converts a mode name to a CSS class name
   * Example: "Default (dark mode)" -> "default-dark-mode"
   */
  private getModeClassName(modeName: string): string {
    return modeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Gets all color modes from the collection
   */
  private getColorModes(collection: any): ColorMode[] {
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
        if (
          (collection.name === "Color modes" ||
            collection.name === "1. Color modes") &&
          collection.remote === false
        ) {
          // Get all available modes
          const modes = this.getColorModes(collection);
          const defaultMode = modes.find(
            (m) => m.modeId === collection.defaultModeId
          );
          if (!defaultMode) {
            console.warn("No default light mode found in color modes");
            continue;
          }

          // Collect variables for each mode
          const modeVariables: { [className: string]: string[] } = {};
          const rootVariables: string[] = [];
          const processedVariables = new Set<string>();

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (variable && variable.resolvedType === "COLOR") {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);

              // Skip if we've already processed this variable name
              if (processedVariables.has(name)) continue;
              processedVariables.add(name);

              // Add root variables (default light mode)
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
                    ["theme", "extend", "colors", name],
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
