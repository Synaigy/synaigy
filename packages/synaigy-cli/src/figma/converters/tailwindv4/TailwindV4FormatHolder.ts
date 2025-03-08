import { FormatHolder } from "../types.js";

export class TailwindV4FormatHolder implements FormatHolder {
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
    // We don't need config comments for v4, but keep the method for compatibility
    return;
  }

  getOutputFiles(): { [key: string]: string } {
    // Parse and optimize CSS content
    const lines = this.cssVariables;
    const rootContent: string[] = [];
    const otherContent: string[] = [];
    const themeContent: string[] = [];
    let isInRoot = false;
    let isInOtherBlock = false;
    let isInComment = false;
    let currentSection: string[] = [];
    let currentOtherBlock: string[] = [];
    let skipNextEmpty = false;

    // Process config values into theme content
    const processConfigToTheme = () => {
      // Process colors
      if (this.configValues.theme?.colors) {
        themeContent.push("  /* Colors */");
        themeContent.push("  --color-*: initial;");
        const processColorObject = (obj: any, prefix: string = "") => {
          Object.entries(obj).forEach(([key, value]) => {
            // Convert spaces to dashes and ensure no double dashes
            const sanitizedKey = key.toLowerCase().replace(/\s+/g, "-");
            if (typeof value === "object") {
              processColorObject(value, `${prefix}${sanitizedKey}-`);
            } else {
              themeContent.push(
                `  --color-${prefix}${sanitizedKey}: ${value};`
              );
            }
          });
        };
        processColorObject(this.configValues.theme.colors);
        themeContent.push("");
      }

      // Process extended colors
      if (this.configValues.theme?.extend?.colors) {
        if (!this.configValues.theme?.colors) {
          themeContent.push("  /* Colors */");
          themeContent.push("  --color-*: initial;");
        }
        Object.entries(this.configValues.theme.extend.colors).forEach(
          ([key, value]) => {
            themeContent.push(`  --color-${key}: ${value};`);
          }
        );
        if (!this.configValues.theme?.colors) {
          themeContent.push("");
        }
      }

      // Process extended spacing
      if (this.configValues.theme?.extend?.spacing) {
        themeContent.push("  /* Spacing */");
        Object.entries(this.configValues.theme.extend.spacing).forEach(
          ([key, value]) => {
            themeContent.push(`  --spacing-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }

      // Process extended widths
      if (this.configValues.theme?.extend?.width) {
        themeContent.push("  /* Widths */");
        Object.entries(this.configValues.theme.extend.width).forEach(
          ([key, value]) => {
            themeContent.push(`  --spacing-width-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }

      // Process border radius
      if (this.configValues.theme?.borderRadius) {
        themeContent.push("  /* Border Radius */");
        themeContent.push("  --radius-*: initial;");
        Object.entries(this.configValues.theme.borderRadius).forEach(
          ([key, value]) => {
            themeContent.push(`  --radius-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }

      // Process font sizes
      if (this.configValues.theme?.fontSize) {
        themeContent.push("  /* Font Sizes */");
        themeContent.push("  --text-*: initial;");
        Object.entries(this.configValues.theme.fontSize).forEach(
          ([key, value]) => {
            themeContent.push(`  --text-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }

      // Process font weights
      if (this.configValues.theme?.fontWeight) {
        themeContent.push("  /* Font Weights */");
        themeContent.push("  --font-weight-*: initial;");
        Object.entries(this.configValues.theme.fontWeight).forEach(
          ([key, value]) => {
            themeContent.push(`  --font-weight-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }

      // Process font families
      if (this.configValues.theme?.fontFamily) {
        themeContent.push("  /* Font Families */");
        themeContent.push("  --font-*: initial;");
        Object.entries(this.configValues.theme.fontFamily).forEach(
          ([key, value]) => {
            themeContent.push(`  --font-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }

      // Process line heights
      if (this.configValues.theme?.lineHeight) {
        themeContent.push("  /* Line Heights */");
        themeContent.push("  --leading-*: initial;");
        Object.entries(this.configValues.theme.lineHeight).forEach(
          ([key, value]) => {
            themeContent.push(`  --leading-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }

      // Process screen breakpoints
      if (this.configValues.theme?.screens) {
        themeContent.push("  /* Screen Breakpoints */");
        themeContent.push("  --breakpoint-*: initial;");
        Object.entries(this.configValues.theme.screens).forEach(
          ([key, value]) => {
            themeContent.push(`  --breakpoint-${key}: ${value};`);
          }
        );
        themeContent.push("");
      }
    };

    // Process each line for CSS variables
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Track comment blocks
      if (trimmedLine.startsWith("/*")) {
        isInComment = true;
      } else if (trimmedLine.startsWith("*/")) {
        isInComment = false;
        skipNextEmpty = true;
      }

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
      } else if (trimmedLine === "") {
        if (skipNextEmpty) {
          skipNextEmpty = false;
        } else if (isInRoot) {
          currentSection.push(line);
        } else if (isInOtherBlock) {
          currentOtherBlock.push(line);
        }
      } else {
        if (isInRoot) {
          currentSection.push(line);
        } else if (isInOtherBlock) {
          currentOtherBlock.push(line);
        }
      }
    }

    // Process config values into theme content
    processConfigToTheme();

    // Construct optimized CSS content
    const cssContent = `@import "tailwindcss";

:root {
${rootContent.join("\n")}
}

${otherContent.join("\n")}

@theme {
  ${themeContent.join("\n")}
  }
`;

    return {
      "tailwind4.css": cssContent,
    };
  }
}
