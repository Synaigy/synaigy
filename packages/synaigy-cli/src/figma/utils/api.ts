import chalk from "chalk";
import ora from "ora";
import { FigmaVariablesResponse } from "../converters/types.js";

/**
 * Fetch variables from Figma API for the given file
 */
export async function fetchFigmaVariables(
  fileId: string,
  token: string
): Promise<FigmaVariablesResponse> {
  const spinner = ora("Fetching Figma variables...").start();

  try {
    // Build request URL for the Figma API
    const apiUrl = `https://api.figma.com/v1/files/${fileId}/variables/local`;

    spinner.text = "Connecting to Figma API...";
    // Make the API request
    const response = await fetch(apiUrl, {
      headers: {
        "X-Figma-Token": token,
      },
    });

    // Check if response is valid
    if (!response.ok) {
      const errorText = await response.text();
      spinner.fail(`API request failed with status ${response.status}`);
      console.error(chalk.red("Response:"), errorText);
      throw new Error(
        `API error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    // Extract data from response
    spinner.text = "Parsing Figma API response...";
    const data = await response.json();

    spinner.succeed("Figma variables fetched successfully");
    return data;
  } catch (error: any) {
    spinner.fail("Failed to fetch Figma variables");

    // Handle different types of errors
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      console.error(chalk.red("Network Error:"), error.message);
    } else {
      console.error(chalk.red("Error fetching from Figma API:"), error.message);
    }

    throw new Error("Failed to fetch Figma variables");
  }
}
