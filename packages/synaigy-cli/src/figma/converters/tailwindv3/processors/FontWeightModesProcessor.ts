import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";

interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

type FigmaVariableValue = string | FigmaVariableAlias;

interface LineHeightMode {
  modeId: string;
  name: string;
  className: string;
}

export class FontWeightModesProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "Font weight/display/light" -> "display-light"
   */
  private formatVariableName(name: string): string {
    // Get the parts after "Font weight/"
    const parts = name.split("/").slice(1);
    return parts.join("-").toLowerCase();
  }

  /**
   * Gets the CSS variable name for a line height
   * Example: "Font weight/display/light" -> "font-weight-display-light"
   */
  private getCssVariableName(name: string): string {
    // Get the parts after "Font weight/"
    const parts = name.split("/").slice(1);
    return `font-weight-${parts.join("-").toLowerCase()}`;
  }

  /**
   * Gets the CSS variable name for a referenced line height
   */
  private getReferencedCssVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Clean up the name
    const cleanName = lastPart
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, "") // Remove leading/trailing hyphens
      .replace(/-+/g, "-"); // Replace multiple consecutive hyphens with single hyphen

    return `font-weight-${cleanName}`;
  }

  /**
   * Converts a mode name to a CSS class name
   */
  private getModeClassName(modeName: string): string {
    return modeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Gets all line height modes from the collection
   */
  private getLineHeightModes(collection: any): LineHeightMode[] {
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
          const modes = this.getLineHeightModes(collection);
          const defaultMode = modes.find(
            (m) => m.modeId === collection.defaultModeId
          );
          if (!defaultMode) {
            console.warn("No default mode found in line height modes");
            continue;
          }

          // Collect variables for each mode
          const modeVariables: { [className: string]: string[] } = {};
          const rootVariables: string[] = [];
          const processedVariables = new Set<string>();

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];

            // Only process font weight variables (those under Font weight/)
            if (variable && variable.name.includes("Font weight/")) {
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
                // Direct value
                const cssValue = `  --${cssVarName}: ${defaultValue};`;
                rootVariables.push(cssValue);

                // Add to Tailwind config
                holder.addConfigValue(
                  ["theme", "extend", "fontWeight", name],
                  `var(--${cssVarName})`
                );
              } else if (this.isVariableAlias(defaultValue)) {
                // Variable alias
                const referencedVar = variables.meta.variables[defaultValue.id];
                if (referencedVar) {
                  const referencedVarName = this.getReferencedCssVariableName(
                    referencedVar.name
                  );
                  const cssValue = `  --${cssVarName}: var(--${referencedVarName});`;
                  rootVariables.push(cssValue);

                  // Add to Tailwind config
                  holder.addConfigValue(
                    ["theme", "extend", "fontWeight", name],
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
                  // Direct value
                  if (!modeVariables[mode.className]) {
                    modeVariables[mode.className] = [];
                  }
                  const cssValue = `  --${cssVarName}: ${modeValue};`;
                  modeVariables[mode.className].push(cssValue);
                } else if (this.isVariableAlias(modeValue)) {
                  // Variable alias
                  const referencedVar = variables.meta.variables[modeValue.id];
                  if (referencedVar) {
                    const referencedVarName = this.getReferencedCssVariableName(
                      referencedVar.name
                    );
                    if (!modeVariables[mode.className]) {
                      modeVariables[mode.className] = [];
                    }
                    const cssValue = `  --${cssVarName}: var(--${referencedVarName});`;
                    modeVariables[mode.className].push(cssValue);
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
