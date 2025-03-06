# Contributing to synaigy-cli

Thank you for your interest in contributing to synaigy-cli! This document provides guidelines and explains the development workflow, particularly focusing on our versioning and release process.

## Development Workflow

### Setting Up the Development Environment

1. Clone the repository
2. Install dependencies with `pnpm install`
3. Run `pnpm dev` to start the development server
4. Build the project with `pnpm build`
5. Run tests with `pnpm test`
6. Lint code with `pnpm lint`

### Making Changes

1. Create a new branch for your feature or bugfix: `git checkout -b feature/your-feature-name`
2. Make your changes
3. Run tests and linting to ensure your changes don't break anything
4. Commit your changes following the [Conventional Commits](https://www.conventionalcommits.org/) format
   - Example: `feat: add new template option` or `fix: resolve installation issue`

### Creating a Changeset

We use [changesets](https://github.com/changesets/changesets) to manage versions and changelogs.

**Important**: For any changes that affect functionality (new features, bug fixes, breaking changes), you MUST create a changeset:

```bash
pnpm changeset
```

The CLI will prompt you to:

1. Select which packages are affected by the change
2. Choose if this is a major, minor, or patch change according to [semver](https://semver.org/)
3. Write a description of the change (this will appear in the changelog)

This creates a new markdown file in the `.changeset` directory, which should be committed with your changes.

### Pull Request Process

1. Push your branch to GitHub: `git push -u origin feature/your-feature-name`
2. Create a pull request against the main branch
3. Ensure your PR includes a changeset if needed (the CI will check this)
4. Wait for code review and CI checks to pass
5. Once approved, your PR will be merged

### When to Skip Changesets

You can skip creating a changeset for:

- Documentation-only changes (prefix PR title with `docs:`)
- Chores and maintenance tasks (prefix PR title with `chore:`)
- Any PR with `[skip-changeset]` in the title

## Release Process

Releases are handled automatically by our CI pipeline:

1. When PRs with changesets are merged to `main`, a new PR titled "🚀 Release: New Version" is automatically created
2. This PR includes all pending changesets, updated versions, and changelog entries
3. When this PR is merged, the CI will:
   - Generate or update CHANGELOG.md files in each package
   - Update version numbers in package.json files
   - Publish the updated packages to npm
   - Create GitHub releases
   - Push git tags

### Changelogs

Changesets automatically generates and updates a CHANGELOG.md file in each package directory. These changelog files follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format.

The changelog entries come directly from the descriptions you write when creating a changeset, so make sure to write clear, user-focused descriptions of your changes.

## npm Publishing

The synaigy-cli package is published to npm with the package name `synaigy`. Only maintainers with npm publishing rights can release new versions.

## Questions?

If you have any questions about contributing, please reach out to the maintainers.
