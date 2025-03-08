# Synaigy CLI Monorepo

This repository contains the Synaigy CLI tool and project templates, designed to streamline the creation and management of various project examples.

## Structure

- `packages/synaigy-cli`: The CLI tool package
- `templates/ovh-chatbot`: An example for creating an OVH chatbot project

## Features

- 🚀 Quick project scaffolding with examples
- 🎯 Built-in best practices and configurations
- 🔧 Customizable project templates
- 📦 Monorepo support with pnpm
- 🔄 Automated versioning and release workflow
- 🧪 Comprehensive testing setup
- 📝 Automated changelog generation

## Commands

### Create

Create a new project from a template:

```bash
synaigy create my-new-project
```

### Figma Sync

Sync Figma local variables to Tailwind configuration:

```bash
synaigy figma-sync
```

This command:

- Prompts for Figma file URL, API token, output path, and design system type
- Stores configuration in `.synaigyrc` file (make sure to add this to `.gitignore`)
- Fetches variables from Figma Variables API
- Converts the variables to a Tailwind v4 compatible configuration
- Currently focuses on color modes from Figma

## Development

This is a pnpm monorepo. To set up the development environment:

```bash
# Install dependencies for all packages
pnpm install

# Build all packages
pnpm build
```

### Prerequisites

- Node.js 18.x or higher
- pnpm 8.x or higher
- Git

### Working with the CLI

To work on the CLI tool:

```bash
# Navigate to the CLI package
cd packages/synaigy-cli

# Run the development build with watch mode
pnpm dev
```

To test the CLI locally:

```bash
# Link the CLI globally
pnpm link --global

# Now you can use the CLI from anywhere
synaigy create my-app
```

### Adding a new template

1. Create a new directory in the `templates` folder
2. Implement your template
3. Update the CLI to support the new template

## Best Practices

This repository follows several best practices for TypeScript monorepos:

### Code Quality

- **ESLint**: Enforces code quality rules with TypeScript-specific configurations
  - Run `pnpm lint` to check for linting issues
- **Prettier**: Ensures consistent code formatting
  - Run `pnpm format` to format all files

### Testing

- **Jest**: Used for unit and integration testing
  - Run `pnpm test` to run all tests
  - Tests are required to pass before commits and in CI

### Git Workflow

- **Husky**: Enforces pre-commit hooks for linting and testing
  - Automatically runs before each commit
- **Commitlint**: Enforces conventional commit message format
  - Format: `type(scope): subject` (e.g. `feat(cli): add new command`)
  - Types: build, chore, ci, docs, feat, fix, perf, refactor, revert, style, test

### Versioning and Releases

- **Changesets**: Manages versioning and changelogs for packages
  - To create a changeset: `pnpm changeset`
  - To update versions: `pnpm version`
  - To publish: `pnpm release`
  - Automated release workflow via GitHub Actions

#### Adding Changes with Changesets

When making changes to packages that should be released:

1. Make your changes to the codebase
2. Run `pnpm changeset` to create a new changeset
3. Select the packages that have changed
4. Choose the semver bump type (patch, minor, major)
5. Provide a summary of the changes
6. Commit the new changeset file along with your changes
7. When your PR is merged to main, a release PR will be automatically created
8. When the release PR is merged, packages will be published to npm

#### GitHub Actions Release Workflow

This repository uses GitHub Actions to automate the release process:

1. When changes are pushed to the main branch, the release workflow runs
2. It builds and tests all packages
3. Using Changesets, it either:
   - Creates a PR to update versions and changelogs (if changesets are present)
   - Publishes packages to npm (if the version PR was merged)

##### Required Repository Setup

For the automated release workflow to function properly:

1. **NPM Token**: Add an `NPM_TOKEN` secret in your GitHub repository settings

   - Generate this token from your npm account with publish permissions
   - Go to GitHub repo → Settings → Secrets and variables → Actions → New repository secret

2. **GitHub Token Permissions**: The workflow requires write permissions

   - These are configured in the workflow file with:

   ```yaml
   permissions:
     contents: write
     pull-requests: write
   ```

   - Ensure GitHub repository settings allow for these permissions
   - Go to Settings → Actions → General → Workflow permissions → Select "Read and write permissions"

3. **Package Publishing Config**: Each package that should be published needs proper configuration:
   ```json
   "publishConfig": {
     "access": "public",
     "registry": "https://registry.npmjs.org/"
   }
   ```

##### Troubleshooting Releases

If you encounter issues with the release process:

- **Authentication Errors**: Verify your NPM_TOKEN is correct and has publish permissions
- **Permission Errors**: Check GitHub repository settings to ensure the workflow has proper permissions
- **Package Registry Issues**: Ensure the package name is available and you have ownership
- **Version Conflicts**: Make sure you're not trying to publish a version that already exists

### CI/CD

- **GitHub Actions**: Automates testing and deployment
  - CI workflow runs on all pull requests and pushes to main
  - Release workflow uses Changesets to version and publish packages

## Usage

### Installing the CLI

```bash
npm install -g synaigy
# or
yarn global add synaigy
# or
pnpm add -g synaigy
```

### Creating a new project

```bash
# Create a new project with the default Next.js template
synaigy create my-app

# Create a new project with a specific template
synaigy create my-app --template nextjs

# Create a new OVH chatbot project
synaigy create my-chatbot --template ovh-chatbot
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`pnpm test && pnpm lint`)
5. Create a changeset (`pnpm changeset`)
6. Commit your changes using conventional commits
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

MIT
