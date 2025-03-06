import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

import chalk from "chalk";
import { execa } from "execa";
import * as fsExtra from "fs-extra";
import ora from "ora";
import prompts from "prompts";

interface CreateOptions {
  template?: string;
}

// GitHub repository information
const GITHUB_REPO = "synaigy/synaigy";
const GITHUB_BRANCH = "main";

// Check if we're in development mode
const isDevelopmentMode = () => {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.SYNAIGY_DEV_MODE === "true"
  );
};

// Get a temporary directory for downloading the template
const getTempDir = () => {
  return path.join(os.tmpdir(), `synaigy-template-${Date.now()}`);
};

// Download templates from GitHub
const downloadTemplateFromGitHub = async (tempDir: string): Promise<void> => {
  const spinner = ora(`Downloading templates from GitHub...`).start();

  try {
    // Create temporary directory
    await fsExtra.ensureDir(tempDir);

    // Clone the repository to the temporary directory
    await execa("git", [
      "clone",
      "--depth=1",
      "-b",
      GITHUB_BRANCH,
      `https://github.com/${GITHUB_REPO}.git`,
      tempDir,
    ]);

    // Remove .git directory
    await fsExtra.remove(path.join(tempDir, ".git"));

    spinner.succeed("Templates downloaded successfully");
  } catch (error) {
    spinner.fail("Failed to download templates");
    console.error(`Error downloading templates: ${error}`);
    throw error;
  }
};

// Get the path to local templates
const getLocalTemplatesDir = () => {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    return path.resolve(__dirname, "../../../templates");
  } catch (error) {
    console.error("Error in getLocalTemplatesDir:", error);
    return "";
  }
};

// Get available templates from a directory
const getAvailableTemplates = async (
  templatesDir: string
): Promise<string[]> => {
  try {
    // Ensure we're looking at the correct templates directory
    const entries = await fs.readdir(path.join(templatesDir, "templates"), {
      withFileTypes: true,
    });

    // Only include directories and filter out hidden ones
    return entries
      .filter(
        (entry) =>
          entry.isDirectory() &&
          !entry.name.startsWith(".") &&
          !["node_modules"].includes(entry.name)
      )
      .map((entry) => entry.name);
  } catch (error) {
    console.error(`Error getting templates: ${error}`);
    return [];
  }
};

export async function createProject(
  projectName: string,
  options: CreateOptions
): Promise<void> {
  const tempDir = getTempDir();
  let templatesDir = "";
  let useLocalTemplates = false;

  // In development mode, use local templates first
  if (isDevelopmentMode()) {
    console.log(chalk.blue("Development mode detected, using local templates"));
    templatesDir = getLocalTemplatesDir();
    useLocalTemplates = true;
  } else {
    // In production mode, try GitHub first, then fall back to local
    try {
      await downloadTemplateFromGitHub(tempDir);
      templatesDir = tempDir;
    } catch {
      console.log(
        chalk.yellow(
          "Failed to download templates from GitHub, falling back to local templates"
        )
      );
      templatesDir = getLocalTemplatesDir();
      useLocalTemplates = true;
    }
  }

  // Get list of available templates
  const availableTemplates = await getAvailableTemplates(templatesDir);

  if (availableTemplates.length === 0) {
    console.error(chalk.red("No templates available"));
    process.exit(1);
  }

  // If no template specified, prompt user to select one
  let templateName = options.template || "";
  if (!templateName) {
    const response = await prompts({
      type: "select",
      name: "template",
      message: "Select a template to use:",
      choices: availableTemplates.map((template) => ({
        title: template,
        value: template,
      })),
    });

    // User cancelled the selection
    if (!response.template) {
      console.log(chalk.yellow("Operation cancelled"));

      // Clean up if needed
      if (!useLocalTemplates) {
        await fsExtra.remove(tempDir);
      }

      process.exit(0);
    }

    templateName = response.template;
  }

  const templateDir = path.join(templatesDir, templateName);
  const targetDir = path.join(process.cwd(), projectName);

  // Check if template exists
  try {
    await fs.access(templateDir);
  } catch {
    console.error(chalk.red(`Error: Template '${templateName}' not found`));

    // List available templates
    console.log(
      `Available templates: ${chalk.green(availableTemplates.join(", "))}`
    );

    // Clean up if needed
    if (!useLocalTemplates) {
      await fsExtra.remove(tempDir);
    }

    process.exit(1);
  }

  // Check if target directory exists
  if (await fsExtra.pathExists(targetDir)) {
    const { overwrite } = await prompts({
      type: "confirm",
      name: "overwrite",
      message: `Directory ${chalk.cyan(projectName)} already exists. Do you want to overwrite it?`,
      initial: false,
    });

    if (!overwrite) {
      console.log(chalk.yellow("Operation cancelled"));

      // Clean up if needed
      if (!useLocalTemplates) {
        await fsExtra.remove(tempDir);
      }

      process.exit(0);
    }

    await fsExtra.remove(targetDir);
  }

  // Create project
  const spinner = ora(
    `Creating new project from ${chalk.green(templateName)} template...`
  ).start();

  try {
    // Copy template files
    await fsExtra.copy(templateDir, targetDir, {
      filter: (src) => {
        // Skip node_modules, .git, etc.
        const relativePath = path.relative(templateDir, src);
        return (
          !relativePath.includes("node_modules") &&
          !relativePath.includes(".git") &&
          !relativePath.startsWith(".")
        );
      },
    });

    // Update package.json name
    const packageJsonPath = path.join(targetDir, "package.json");
    if (await fsExtra.pathExists(packageJsonPath)) {
      const packageJson = JSON.parse(
        await fs.readFile(packageJsonPath, "utf8")
      );
      packageJson.name = projectName;
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }

    spinner.succeed(
      chalk.green(`Project created successfully at ${chalk.cyan(targetDir)}`)
    );

    // Post-creation instructions
    console.log("\n🚀 Next steps:");
    console.log(`  ${chalk.cyan("cd")} ${projectName}`);
    console.log(
      `  ${chalk.cyan("npm install")} (or ${chalk.cyan("yarn")} or ${chalk.cyan("pnpm install")})`
    );
    console.log(
      `  ${chalk.cyan("npm run dev")} (or ${chalk.cyan("yarn dev")} or ${chalk.cyan("pnpm dev")})\n`
    );
  } catch (error) {
    spinner.fail(chalk.red("Failed to create project"));
    console.error(error);
    process.exit(1);
  } finally {
    // Clean up temporary directory if we used GitHub templates
    if (!useLocalTemplates) {
      await fsExtra.remove(tempDir);
    }
  }
}
