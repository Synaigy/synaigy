import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";

interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

type FigmaVariableValue = string | FigmaVariableAlias;

interface FontFamilyMode {
  modeId: string;
  name: string;
  className: string;
}

export class FontFamilyModesProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Typography/Font family/font-family-display" -> "display"
   * Example: "Typography/Font family/font-family-heading (primary)" -> "heading-primary"
   */
  private formatVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Extract any variant in parentheses
    const variantSuffix = lastPart.match(/\((.*?)\)/)?.[1] || "";

    // Clean up the name and add variant suffix if present
    const cleanName = lastPart
      .replace(/^font-family-/, "") // Remove font-family- prefix
      .replace(/\s*\([^)]*\)/, "") // Remove anything in parentheses
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens

    return variantSuffix ? `${cleanName}-${variantSuffix}` : cleanName;
  }

  /**
   * Gets the CSS variable name for a font family
   * Example: "Typography/Font family/font-family-display" -> "font-family-display"
   */
  private getCssVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Extract any variant in parentheses
    const variantSuffix = lastPart.match(/\((.*?)\)/)?.[1] || "";

    // Clean up the name but keep the font-family prefix
    const cleanName = lastPart
      .replace(/\s*\([^)]*\)/, "") // Remove anything in parentheses
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens;

    const baseName = variantSuffix
      ? `${cleanName}-${variantSuffix}`
      : cleanName;
    return baseName;
  }

  /**
   * Gets the CSS variable name for a referenced font family
   */
  private getReferencedCssVariableName(name: string): string {
    const cleanPath = name
      .replace(/^_Primitives\/Typography\//, "")
      .replace(/Typography\//g, "")
      .replace(/Font Family\//g, "");

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

    return formattedName;
  }

  /**
   * Converts a mode name to a CSS class name
   * Example: "Default (modern)" -> "default-modern"
   */
  private getModeClassName(modeName: string): string {
    return modeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Gets all font family modes from the collection
   */
  private getFontFamilyModes(collection: any): FontFamilyMode[] {
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
        if (collection.name === "Typography" && collection.remote === false) {
          // Get all available modes
          const modes = this.getFontFamilyModes(collection);
          const defaultMode = modes.find(
            (m) => m.modeId === collection.defaultModeId
          );
          if (!defaultMode) {
            console.warn("No default mode found in font family modes");
            continue;
          }

          // Collect variables for each mode
          const modeVariables: { [className: string]: string[] } = {};
          const rootVariables: string[] = [];
          const processedVariables = new Set<string>();

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            // Only process font family variables (those under Font family/)
            if (
              variable &&
              variable.resolvedType === "STRING" &&
              variable.name.includes("Font family/")
            ) {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);

              // Skip if we've already processed this variable name
              if (processedVariables.has(name)) continue;
              processedVariables.add(name);

              // Add root variables (default mode)
              const defaultValue = variable.valuesByMode[
                defaultMode.modeId
              ] as FigmaVariableValue;
              if (typeof defaultValue === "string") {
                // Direct string value
                rootVariables.push(`  --${cssVarName}: ${defaultValue};`);

                // Add to Tailwind config
                holder.addConfigValue(
                  ["theme", "extend", "fontFamily", name],
                  `var(--${cssVarName})`
                );
              } else if (this.isVariableAlias(defaultValue)) {
                // Variable alias
                const referencedVar = variables.meta.variables[defaultValue.id];
                if (referencedVar) {
                  const referencedValue = referencedVar.valuesByMode[
                    defaultMode.modeId
                  ] as string;
                  rootVariables.push(`  --${cssVarName}: ${referencedValue};`);

                  // Add to Tailwind config
                  holder.addConfigValue(
                    ["theme", "extend", "fontFamily", name],
                    `var(--${cssVarName})`
                  );
                }
              }

              // Collect variables for each mode
              for (const mode of modes) {
                if (mode.modeId === defaultMode.modeId) continue;

                const modeValue = variable.valuesByMode[
                  mode.modeId
                ] as FigmaVariableValue;
                if (typeof modeValue === "string") {
                  // Direct string value
                  if (!modeVariables[mode.className]) {
                    modeVariables[mode.className] = [];
                  }
                  modeVariables[mode.className].push(
                    `  --${cssVarName}: ${modeValue};`
                  );
                } else if (this.isVariableAlias(modeValue)) {
                  // Variable alias
                  const referencedVar = variables.meta.variables[modeValue.id];
                  if (referencedVar) {
                    const referencedValue = referencedVar.valuesByMode[
                      mode.modeId
                    ] as string;
                    if (!modeVariables[mode.className]) {
                      modeVariables[mode.className] = [];
                    }
                    modeVariables[mode.className].push(
                      `  --${cssVarName}: ${referencedValue};`
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
