import { VariableProcessor, FigmaVariablesResponse } from "../../types.js";
import { TailwindV3FormatHolder } from "../TailwindV3FormatHolder.js";

interface FigmaVariableAlias {
  type: "VARIABLE_ALIAS";
  id: string;
}

type FigmaVariableValue = string | FigmaVariableAlias;

interface BorderWidthMode {
  modeId: string;
  name: string;
  className: string;
}

export class BorderWidthModesProcessor implements VariableProcessor {
  /**
   * Formats a Figma variable name into a valid CSS/Tailwind identifier
   * Example: "highlight-border-width" -> "highlight"
   */
  private formatVariableName(name: string): string {
    // Get the last part of the path
    const parts = name.split("/");
    const lastPart = parts[parts.length - 1];

    // Clean up the name
    return lastPart
      .replace(/^border-width-/, "") // Remove border-width- prefix
      .replace(/-border-width$/, "") // Remove border-width suffix
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-") // Replace non-alphanumeric with hyphens
      .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
  }

  /**
   * Gets the CSS variable name for a border width
   * Example: "highlight-border-width" -> "spacing-border-width-highlight"
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

    return `spacing-border-width-${this.formatVariableName(name)}`;
  }

  /**
   * Gets the CSS variable name for a referenced border width
   * Example: "_Primitives/Border width/xs" -> "spacing-border-width-xs"
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

    return `spacing-border-width-${cleanName}`;
  }

  /**
   * Converts a mode name to a CSS class name
   * Example: "TIMETOACT" -> "timetoact"
   */
  private getModeClassName(modeName: string): string {
    return modeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  /**
   * Gets all border width modes from the collection
   */
  private getBorderWidthModes(collection: any): BorderWidthMode[] {
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
          collection.name === "Border width modes" &&
          collection.remote === false
        ) {
          // Get all available modes
          const modes = this.getBorderWidthModes(collection);
          const defaultMode = modes.find(
            (m) => m.modeId === collection.defaultModeId
          );
          if (!defaultMode) {
            console.warn("No default mode found in border width modes");
            continue;
          }

          // Collect variables for each mode
          const modeVariables: { [className: string]: string[] } = {};
          const rootVariables: string[] = [];
          const processedVariables = new Set<string>();

          for (const variableId of collection.variableIds) {
            const variable = variables.meta.variables[variableId];
            if (variable) {
              const name = this.formatVariableName(variable.name);
              const cssVarName = this.getCssVariableName(variable.name);

              // Skip if we've already processed this variable name
              if (processedVariables.has(name)) continue;
              processedVariables.add(name);

              // Add root variables (default mode)
              const defaultValue = variable.valuesByMode[
                defaultMode.modeId
              ] as FigmaVariableValue;
              if (this.isVariableAlias(defaultValue)) {
                // Variable alias
                const referencedVar = variables.meta.variables[defaultValue.id];
                if (referencedVar) {
                  const referencedVarName = this.getReferencedCssVariableName(
                    referencedVar.name
                  );
                  rootVariables.push(
                    `  --${cssVarName}: var(--${referencedVarName});`
                  );

                  // Add to Tailwind config
                  holder.addConfigValue(
                    ["theme", "extend", "borderWidth", name],
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
                if (this.isVariableAlias(modeValue)) {
                  // Variable alias
                  const referencedVar = variables.meta.variables[modeValue.id];
                  if (referencedVar) {
                    const referencedVarName = this.getReferencedCssVariableName(
                      referencedVar.name
                    );
                    if (!modeVariables[mode.className]) {
                      modeVariables[mode.className] = [];
                    }
                    modeVariables[mode.className].push(
                      `  --${cssVarName}: var(--${referencedVarName});`
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
