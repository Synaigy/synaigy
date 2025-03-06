import chalk from "chalk";
import { Command } from "commander";

import { createProject } from "./commands/create.js";

const program = new Command();

console.log(chalk.bold(`\n🚀 ${chalk.blue("Synaigy CLI")}\n`));

// If no arguments provided, show available commands
if (process.argv.length <= 2) {
  console.log(chalk.yellow("Available commands:"));
  console.log(
    `  ${chalk.green("create")} - Create a new project from a template`
  );
  console.log(chalk.yellow("\nFor more details, run:"));
  console.log(`  ${chalk.cyan("synaigy --help")}\n`);
}

program
  .name("synaigy")
  .description("Synaigy CLI to scaffold projects from templates")
  .version("1.0.1");

program
  .command("create")
  .description("Create a new project from a template")
  .argument("<project-name>", "Name of the project to create")
  .option("-t, --template <template>", "Template to use")
  .action(async (projectName, options) => {
    await createProject(projectName, options);
  });

program.parse(process.argv);

// If no arguments provided, show help
if (process.argv.length <= 2) {
  program.help();
}
