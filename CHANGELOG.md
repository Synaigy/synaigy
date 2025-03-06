# Changelog

This monorepo uses [Changesets](https://github.com/changesets/changesets) to manage changelogs.

Individual package CHANGELOG.md files are generated automatically in each package's directory:

- [`packages/synaigy-cli/CHANGELOG.md`](./packages/synaigy-cli/CHANGELOG.md)
- Other packages as they're added

These CHANGELOG.md files are created automatically when a release is made.

## How It Works

1. Contributors create changeset files using `pnpm changeset`
2. When releases are made, these changeset files are processed to:
   - Update version numbers in package.json files
   - Generate or update CHANGELOG.md files in each package
   - Publish the packages

If you're not seeing CHANGELOG.md files in the package directories after a release, please check:

1. That changesets were created for the changes
2. That the release workflow completed successfully
