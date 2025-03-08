import { FormatHolder } from "../types.js";

export class TailwindV3FormatHolder implements FormatHolder {
  private cssVariables: string[] = [];
  private configValues: { [key: string]: any } = {};
  private configComments: { path: string[]; comments: string[] }[] = [];

  addCssVariable(variable: string) {
    this.cssVariables.push(variable);
  }

  addConfigValue(path: string[], value: any) {
    let current = this.configValues;
    for (let i = 0; i < path.length - 1; i++) {
      if (!current[path[i]]) {
        current[path[i]] = {};
      }
      current = current[path[i]];
    }
    current[path[path.length - 1]] = value;
  }

  addConfigComment(path: string[], comments: string[]) {
    this.configComments.push({ path, comments });
  }

  private generateConfigWithComments(): string {
    const lines: string[] = [];
    lines.push("module.exports = {");

    // Helper function to indent a string
    const indent = (str: string, level: number) => "  ".repeat(level) + str;

    // Helper function to recursively build the config string
    const buildConfig = (
      obj: any,
      path: string[] = [],
      level: number = 1
    ): void => {
      // Handle object entries
      const entries = Object.entries(obj);
      entries.forEach(([key, value], index) => {
        const isLast = index === entries.length - 1;
        const currentPath = [...path, key];

        if (value && typeof value === "object") {
          // For numeric keys, don't add quotes
          const formattedKey = /^\d+$/.test(key) ? key : `"${key}"`;
          lines.push(indent(`${formattedKey}: {`, level));
          buildConfig(value, currentPath, level + 1);
          lines.push(indent(`}${isLast ? "" : ","}`, level));
        } else {
          // For numeric keys, don't add quotes
          const formattedKey = /^\d+$/.test(key) ? key : `"${key}"`;
          lines.push(
            indent(`${formattedKey}: "${value}"${isLast ? "" : ","}`, level)
          );
        }
      });
    };

    // Build the configuration
    buildConfig(this.configValues);
    lines.push("};");

    return lines.join("\n");
  }

  getOutputFiles(): { [key: string]: string } {
    // Parse and optimize CSS content
    const lines = this.cssVariables;
    const rootContent: string[] = [];
    const otherContent: string[] = [];
    let isInRoot = false;
    let isInOtherBlock = false;
    let currentSection: string[] = [];
    let currentOtherBlock: string[] = [];

    // Process each line
    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === ":root {") {
        isInRoot = true;
        // If we have content from a previous section, add it with a newline
        if (currentSection.length > 0) {
          rootContent.push(...currentSection, "");
          currentSection = [];
        }
      } else if (trimmedLine.startsWith(".") && trimmedLine.endsWith("{")) {
        isInOtherBlock = true;
        // Start a new block for theme mode
        currentOtherBlock = [line];
      } else if (trimmedLine === "}") {
        if (isInRoot) {
          isInRoot = false;
          // Add any remaining content from the current section
          if (currentSection.length > 0) {
            rootContent.push(...currentSection);
            currentSection = [];
          }
        } else if (isInOtherBlock) {
          isInOtherBlock = false;
          // Complete the theme mode block
          currentOtherBlock.push(line);
          otherContent.push(...currentOtherBlock, "");
          currentOtherBlock = [];
        }
      } else if (isInRoot && trimmedLine !== "") {
        currentSection.push(line);
      } else if (isInOtherBlock && trimmedLine !== "") {
        currentOtherBlock.push(line);
      } else if (!isInRoot && !isInOtherBlock && trimmedLine.startsWith("/*")) {
        // Preserve top-level comments
        otherContent.push(line);
      }
    }

    // Construct optimized CSS content
    const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
${rootContent.join("\n")}
}

${otherContent.join("\n")}`;

    return {
      "tailwind3.css": cssContent,
      "tailwind3.config.js": this.generateConfigWithComments(),
    };
  }
}
