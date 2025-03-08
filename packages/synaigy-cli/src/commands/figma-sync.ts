import * as fs from "fs/promises";
import * as path from "path";

import chalk from "chalk";
import { Command } from "commander";
import prompts from "prompts";

import { ConverterFactory } from "../figma/converters/ConverterFactory.js";
import { OutputFormat } from "../figma/converters/types.js";
import { fetchFigmaVariables } from "../figma/utils/api.js";
import {
  configExists,
  loadConfig,
  saveConfig,
  extractFigmaFileId,
  FigmaSyncConfig,
} from "../figma/utils/config.js";

// Interface for command options
interface CommandOptions {
  debug?: boolean;
  figmaFileUrl?: string;
  figmaToken?: string;
  outputPath?: string;
  outputFormat?: string;
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Prompt for configuration when not provided via CLI
 */
async function promptForConfig(): Promise<FigmaSyncConfig> {
  console.log(
    chalk.blue("\nPlease provide the following configuration details:")
  );

  const response = await prompts([
    {
      type: "text",
      name: "figmaFileUrl",
      message: "Enter your Figma file URL (containing variables):",
      validate: (value) =>
        value.length > 0 ? true : "Figma file URL is required",
    },
    {
      type: "password",
      name: "figmaToken",
      message: "Enter your Figma Personal Access Token:",
      validate: (value) =>
        value.length > 0 ? true : "Figma token is required",
    },
    {
      type: "text",
      name: "outputPath",
      message: "Enter output directory for Tailwind CSS variables:",
      initial: "./",
    },
    {
      type: "select",
      name: "outputFormat",
      message: "Select output format:",
      choices: [
        { title: "Tailwind v4", value: "Tailwind4" },
        { title: "Tailwind v3", value: "Tailwind3" },
        { title: "Plain CSS", value: "PlainCSS" },
      ],
      initial: 0,
    },
  ]);

  // User cancelled the prompts
  if (!response.figmaFileUrl || !response.figmaToken) {
    console.log(chalk.yellow("\nOperation cancelled"));
    process.exit(0);
  }

  const config: FigmaSyncConfig = {
    figmaFileUrl: response.figmaFileUrl,
    figmaToken: response.figmaToken,
    outputPath: response.outputPath,
    outputFormat: response.outputFormat as OutputFormat,
  };

  // Save the config for future use
  await saveConfig(config);
  console.log(chalk.green("\n✅ Configuration saved successfully"));

  return config;
}

/**
 * Sync Figma variables to Tailwind config
 */
export async function figmaSync(options: CommandOptions = {}): Promise<void> {
  try {
    console.log(chalk.blue("\n🎨 Figma variables to Tailwind sync tool"));
    console.log(
      chalk.gray(
        "This tool fetches variables from a Figma file and converts them to Tailwind CSS (v4) and config.js (v3)"
      )
    );

    // Check if debug mode is enabled
    const debugMode = options.debug || false;
    if (debugMode) {
      console.log(
        chalk.yellow(
          "Debug mode enabled - Figma response will be saved to figmavariables.json"
        )
      );
    }

    // Check if configuration exists and load it if available
    let config: FigmaSyncConfig;
    const hasConfig = await configExists();

    if (hasConfig && !options.figmaFileUrl) {
      // Use existing configuration automatically if it exists and no CLI options provided
      config = await loadConfig();
      console.log(
        chalk.green("✅ Using existing configuration from .synaigyrc")
      );
    } else if (options.figmaFileUrl && options.figmaToken) {
      // Use CLI options if provided
      config = {
        figmaFileUrl: options.figmaFileUrl,
        figmaToken: options.figmaToken,
        outputPath: options.outputPath || "./",
        outputFormat: (options.outputFormat || "Tailwind4") as OutputFormat,
      };

      // Save the config for future use
      await saveConfig(config);
      console.log(chalk.green("\n✅ Configuration saved successfully"));
    } else {
      // No config file and no CLI options - prompt for values
      config = await promptForConfig();
    }

    // Extract file ID from URL
    const fileId = extractFigmaFileId(config.figmaFileUrl);
    if (!fileId) {
      throw new Error("Invalid Figma file URL");
    }

    // Path to debug JSON file - use current working directory where command is executed
    const currentWorkingDir = process.cwd();
    const debugFilePath = path.join(currentWorkingDir, "figmavariables.json");

    // Check if figmavariables.json exists and we're in debug mode
    let figmaData;
    const debugFileExists = await fileExists(debugFilePath);

    if (debugFileExists) {
      // In debug mode, use existing figmavariables.json if it exists
      console.log(
        chalk.blue(
          `\nUsing existing figmavariables.json from ${currentWorkingDir}...`
        )
      );
      try {
        const fileContent = await fs.readFile(debugFilePath, "utf-8");
        figmaData = JSON.parse(fileContent);
        console.log(chalk.green("✅ Successfully loaded figmavariables.json"));
      } catch (error) {
        console.error(
          chalk.yellow(
            `Failed to parse figmavariables.json at ${debugFilePath}, falling back to API call`
          ),
          error
        );
        console.log(chalk.blue("\nFetching variables from Figma API..."));
        figmaData = await fetchFigmaVariables(fileId, config.figmaToken);
      }
    } else {
      // Normal mode - fetch from API
      console.log(chalk.blue("\nFetching variables from Figma API..."));
      figmaData = await fetchFigmaVariables(fileId, config.figmaToken);
    }

    // Save figmaData to a file if debug mode is enabled and file doesn't exist
    if (debugMode && !debugFileExists) {
      console.log(chalk.blue(`Saving Figma response to ${debugFilePath}...`));
      await fs.writeFile(debugFilePath, JSON.stringify(figmaData, null, 2));
      console.log(
        chalk.green(`Debug: Figma response saved to ${debugFilePath}`)
      );
    }

    // Add safeguard to check if figmaData has expected structure
    if (!figmaData) {
      throw new Error("Failed to fetch valid data from Figma API");
    }

    // Create converter and process variables
    const converter = ConverterFactory.createConverter(config.outputFormat);
    const outputFiles = await converter.convert(figmaData, config);

    // Write output files
    for (const [filename, content] of Object.entries(outputFiles)) {
      const outputPath = path.join(config.outputPath, filename);
      await fs.writeFile(outputPath, content);
      console.log(chalk.green(`✅ Generated ${filename}`));
    }
    console.log(chalk.green(`✅ Generated successfully`));
  } catch (error) {
    console.error(chalk.red("\n❌ Failed to sync Figma variables:"), error);
    process.exit(1);
  }
}

// Create the command
export const command = new Command("figma-sync")
  .description("Sync Figma variables to Tailwind config")
  .option("-d, --debug", "Enable debug mode")
  .option("--figma-file-url <url>", "Figma file URL containing variables")
  .option("--figma-token <token>", "Figma Personal Access Token")
  .option(
    "--output-path <path>",
    "Output directory for Tailwind CSS variables",
    "./"
  )
  .option(
    "--design-system <system>",
    "Design system to use (UntitledUI or Flowbyte)",
    "UntitledUI"
  )
  .option(
    "--output-format <format>",
    "Output format (Tailwind3, Tailwind4, or PlainCSS)",
    "Tailwind4"
  )
  .action(async (options) => {
    await figmaSync(options);
  });
