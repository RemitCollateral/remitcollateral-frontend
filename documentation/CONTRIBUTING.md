# Contributing to MergeLabs

Thank you for your interest in contributing to MergeLabs! We welcome contributions from developers, testers, technical writers, and community members. 

By contributing to MergeLabs, you help build high-quality, production-ready developer tools and SDKs for the Stellar and Soroban blockchain ecosystem.

---

## Table of Contents

1. [Code of Conduct](#1-code-of-conduct)
2. [Monorepo Overview](#2-monorepo-overview)
3. [Local Development Setup](#3-local-development-setup)
4. [Monorepo Package Commands](#4-monorepo-package-commands)
5. [Testing Guidelines](#5-testing-guidelines)
6. [Coding Standards & Tooling](#6-coding-standards--tooling)
7. [Git Branching & Commit Conventions](#7-git-branching--commit-conventions)
8. [Releasing & Versioning (Changesets)](#8-releasing--versioning-changesets)
9. [Submitting a Pull Request](#9-submitting-a-pull-request)

---

## 1. Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please be respectful and constructive in all communication, including GitHub issues, pull requests, and community discussions.

---

## 2. Monorepo Overview

MergeLabs is structured as a monorepo managed with **pnpm workspaces**. The packages are located in the `packages/` directory:

```
MergeLabs/
├── packages/
│   ├── notify/         # Soroban event listener and decoder
│   ├── mock/           # RPC, Wallet, and Contract mock engines for tests
│   ├── hooks/          # React hooks for Freighter wallet and Soroban interactions
│   └── forms/          # Headless UI forms (SendPayment, Swap, Trustline)
├── documentation/      # Technical documentation and guides
├── .github/workflows/  # CI/CD workflows
├── pnpm-workspace.yaml # Workspace configuration
└── package.json        # Root package manifest
```

---

## 3. Local Development Setup

### Prerequisites

To contribute code, ensure you have the following installed locally:
- **Node.js** (v18.0.0 or higher, v20+ recommended)
- **pnpm** (v8.0.0 or higher)
- **Git**

### Step-by-Step Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/AstronLabs/MergeLabs.git
    cd MergeLabs
    ```

2.  **Install Dependencies**:
    We use `pnpm` to manage workspace dependencies. Do not use `npm` or `yarn` as it will fail to resolve workspace packages.
    ```bash
    pnpm install
    ```

3.  **Build All Packages**:
    Build all modules locally to link the type declarations across workspace dependencies:
    ```bash
    pnpm build
    ```

---

## 4. Monorepo Package Commands

We use global scripts in the root `package.json` to control the workspace. You can execute commands across all packages or target specific packages using pnpm filters.

### Root Command Cheat Sheet

| Command | Action |
| :--- | :--- |
| `pnpm build` | Compiles code and generates `.d.ts` typings for all packages. |
| `pnpm test` | Runs unit tests across all packages using Vitest. |
| `pnpm test:integration` | Runs end-to-end integration tests against Stellar Testnet. |
| `pnpm lint` | Runs ESLint and Prettier across all codebase files. |
| `pnpm typecheck` | Validates TypeScript configuration and rules. |
| `pnpm coverage` | Generates a unified test coverage report. |
| `pnpm changeset` | Creates a new changeset description for releases. |

### Targeting Specific Packages

To run a script for a single package (e.g. `@astronlabs/notify`), use the `--filter` flag:

```bash
# Run tests only in the notify package
pnpm --filter @astronlabs/notify test

# Run typecheck only in the hooks package
pnpm --filter @astronlabs/hooks typecheck
```

---

## 5. Testing Guidelines

We enforce high test coverage. Any new features or bug fixes must include unit tests.

### Unit Tests
We use **Vitest** for unit testing due to its speed and support for ES modules.
- Place test files alongside the source files, naming them `*.test.ts` or `*.test.tsx`.
- Use the `@astronlabs/mock` package when testing code that relies on wallet signatures or Soroban RPC networks.

Run unit tests in watch mode:
```bash
pnpm test
```

### Integration Tests
Integration tests execute real transaction builds, horizon queries, and subscription flows against the live Stellar Testnet.
```bash
pnpm test:integration
```

> [!WARNING]
> Integration tests require an active internet connection and may rely on Testnet stability. If you observe intermittent RPC timeouts, rerun the test suite.

---

## 6. Coding Standards & Tooling

To keep our codebase readable and maintainable, we enforce strict linting, formatting, and typing rules.

- **Strict TypeScript**: We do not allow `any` types unless absolutely necessary (which must be documented with a comment). Keep compiler options set to strict mode.
- **Formatting**: We use **Prettier** for code formatting. Code format is automatically checked in the pull request pipeline.
- **Linting**: We use **ESLint** to enforce coding patterns.
- **Code Hygiene**:
  - Always clean up event subscriptions and set intervals using `.destroy()` or `unsubscribe()` handlers.
  - Document public APIs using **JSDoc** comments so they appear correctly in IDE tooltips for downstream developers.

---

## 7. Git Branching & Commit Conventions

We use semantic branching and conventional commits to keep the repository history readable and automatically compile release notes.

### Branch Name Prefix

Always create a new branch from `main` before starting development. Use the following prefixes:
*   `feat/` - for new features (e.g., `feat/add-albedo-wallet`)
*   `fix/` - for bug fixes (e.g., `fix/decoder-bigint-conversion`)
*   `docs/` - for changes in documentation (e.g., `docs/update-contributing-guide`)
*   `chore/` - for updates that don't modify src or test files (e.g., `chore/bump-tsconfig`)
*   `test/` - for adding or correcting tests (e.g., `test/add-mock-rpc-fail-case`)

### Commit Messages

Commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.

**Format**:
```
<type>(<package>): <description>

[optional body]
```

**Examples**:
*   `feat(hooks): add useStellarEvent hook for live event streams`
*   `fix(notify): resolve XDR parsing error on ScvAddress types`
*   `docs(all): fix grammar and links inside the technical documentation`
*   `test(mock): add integration test cases for simulated wallet approvals`

---

## 8. Releasing & Versioning (Changesets)

We use [Changesets](https://github.com/changesets/changesets) to manage versioning and release notes.

If your changes require a package version bump (major, minor, or patch), you must include a changeset:

1.  Run the changeset CLI tool in the repository root:
    ```bash
    pnpm changeset
    ```
2.  Follow the interactive prompts:
    - Select the package(s) that should be bumped.
    - Choose the semver bump type (major, minor, or patch).
    - Provide a short summary of the changes. This summary will be added to the package's `CHANGELOG.md` upon release.
3.  Commit the generated changeset file (located in `.changeset/`) with your pull request.

---

## 9. Submitting a Pull Request

When you are ready to submit your code:

1.  **Sync with Upstream**:
    Ensure your branch is up-to-date with the latest `main` branch.
    ```bash
    git fetch origin
    git rebase origin/main
    ```
2.  **Verify Quality Checks**:
    Ensure the build, tests, and formatting pass locally:
    ```bash
    pnpm build
    pnpm test
    pnpm typecheck
    pnpm lint
    ```
3.  **Add a Changeset**:
    Run `pnpm changeset` if you are modifying package code.
4.  **Create the Pull Request**:
    Push your branch and open a PR on GitHub.
    - Provide a detailed summary of your changes.
    - Mention any related issues using `Closes #123`.
    - Wait for reviews from the core maintainers. Address any feedback promptly.
