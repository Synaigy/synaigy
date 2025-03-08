import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import chalk from "chalk";
import { OutputFormat } from "../converters/types.js";

/**
 * Interface for Figma sync configuration
 */
export interface FigmaSyncConfig {
  figmaFileUrl: string;
  figmaToken: string;
  outputPath: string;
  outputFormat: OutputFormat;
}

/**
 * Path to configuration files
 */
const LOCAL_CONFIG_PATH = ".synaigyrc";
const GLOBAL_CONFIG_PATH = path.join(os.homedir(), ".synaigyrc");

/**
 * Check if configuration file exists
 */
export async function configExists(): Promise<boolean> {
  try {
    // First check for local config
    await fs.access(LOCAL_CONFIG_PATH);
    return true;
  } catch (error) {
    try {
      // Fall back to global config
      await fs.access(GLOBAL_CONFIG_PATH);
      return true;
    } catch (error) {
      return false;
    }
  }
}

/**
 * Load configuration from file
 */
export async function loadConfig(): Promise<FigmaSyncConfig> {
  try {
    // First try to load from local config
    try {
      const localConfigData = await fs.readFile(LOCAL_CONFIG_PATH, "utf-8");
      console.log(
        chalk.green("Using configuration from local .synaigyrc file")
      );
      return JSON.parse(localConfigData) as FigmaSyncConfig;
    } catch (localError) {
      // Fall back to global config
      const globalConfigData = await fs.readFile(GLOBAL_CONFIG_PATH, "utf-8");
      console.log(chalk.green("Using configuration from global file"));
      return JSON.parse(globalConfigData) as FigmaSyncConfig;
    }
  } catch (error) {
    console.error(chalk.red("Error loading configuration"), error);
    throw new Error("Failed to load configuration");
  }
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: FigmaSyncConfig): Promise<void> {
  try {
    // Save to both local and global config
    await fs.writeFile(
      LOCAL_CONFIG_PATH,
      JSON.stringify(config, null, 2),
      "utf-8"
    );
    // await fs.writeFile(
    //   GLOBAL_CONFIG_PATH,
    //   JSON.stringify(config, null, 2),
    //   "utf-8"
    // );
    console.log(
      chalk.green(
        "Configuration saved to both local .synaigyrc and global file"
      )
    );
  } catch (error) {
    console.error(chalk.red("Error saving configuration"), error);
    throw new Error("Failed to save configuration");
  }
}

/**
 * Extract Figma file ID from URL
 */
export function extractFigmaFileId(url: string): string {
  // Handle both URL formats:
  // https://www.figma.com/file/abcdef123456/FileName
  // https://www.figma.com/file/abcdef123456
  const match = url.match(/figma\.com\/(file|design)\/([^\/]+)/);
  return match ? match[2] : ""; // Return the second capture group which contains the file ID
}
