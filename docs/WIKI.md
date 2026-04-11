# MAD Pro CLI Wiki

Welcome to the **MAD Pro CLI Wiki**! This document is the ultimate reference guide for the entire MAD Pro command-line toolset. Whether you are bootstrapping a new project, refactoring an existing monolithic codebase, or enforcing architectural standards in your CI/CD pipeline, the CLI tools below will streamline your workflow.

---

## 📑 Table of Contents

1. [Project Initialization](#1-project-initialization)
   - [`mad-pro create`](#mad-pro-create)
   - [`mad-pro init`](#mad-pro-init)
2. [Skill & Context Management](#2-skill--context-management)
   - [`mad-pro add`](#mad-pro-add)
   - [`mad-pro list`](#mad-pro-list)
   - [`mad-pro prompt`](#mad-pro-prompt)
   - [Design Tokens](#design-tokens)
3. [Architecture & Security Audit](#3-architecture--security-audit)
   - [`mad-pro doctor`](#mad-pro-doctor)
   - [CLI Configuration (`.mad-pro.json`)](#cli-configuration-mad-projson)

---

## 1. Project Initialization

### `mad-pro create`
Scaffold a 100% Modern Android Development (MAD) compliant project from scratch.

```bash
mad-pro create <project-name>
```

**Features:**
- **KrossWave KMP Template:** Automatically scaffolds a Kotlin Multiplatform structure with shared Compose UI (Android/iOS) and Koin dependency injection.
- **Basic Android Template:** Bootstraps a standard Android project utilizing Jetpack Compose, Material 3, and Hilt.
- Generates standard gradle configurations and basic folder scaffolding (UI, Domain, Data layers).

### `mad-pro init`
Contextualizes an **existing** project with MAD Pro's AI agent references. This is your first step if you didn't use `mad-pro create`.

```bash
mad-pro init
```

**Interactive Wizard Features:**
- Prompts you for your primary IDE (Cursor, Windsurf, VS Code, Android Studio, Zed).
- Allows you to select **Skill Categories** needed for your project (Core MAD, Platform Capabilities, AI/Emerging, Industry Verticals, Monetization, Engineering Excellence).
- Installs the chosen context markdown files straight into the `/references` directory of your project.
- Automatically generates `.cursorrules` or `.windsurfrules` based on your IDE selection.

---

## 2. Skill & Context Management

### `mad-pro add`
Installs specific architectural blueprints or skills on-demand without going through the full setup wizard. 

```bash
mad-pro add
```

**How it works:**
1. Triggers an interactive checkbox prompt listing all available skills in the library (76+ skills).
2. You can search or select specific items (e.g. `barcode_qr`, `gemini_api`, `clean_architecture`).
3. Installs the documentation into `/references` so your AI assistant gains immediate context on how to implement that specific feature robustly.

### `mad-pro list`
Displays everything your AI agent currently "knows".

```bash
mad-pro list
```

**Output:**
- Shows a grouped inventory tree of all `.md` skills present in your local `/references/` directory.
- Differentiates between core capabilities, design tokens, and industry-specific paradigms.

### `mad-pro prompt`
Generates optimized system instructions tailored dynamically to your project's architecture and installed skills.

```bash
mad-pro prompt
```

- Analyzes `.mad-pro.json` to understand your architecture (MVI, MVVM, etc.) and DI tool.
- Calculates your active `/references` and design tokens.
- Generates exact system prompts formatted for `.cursorrules`, `.windsurfrules`, or a generic clipboard copy.

### Design Tokens
Found under `/references/design-tokens/`, these files enforce consistent AI UI generation:
- `color-tokens.md`: Material 3 palettes.
- `typography-tokens.md`: Material 3 typography bounds.
- `spacing-tokens.md`: Standard 4dp/8dp grid limits.
*When installed, the `prompt` command forces the agent to use these tokens rather than hallucinating random `<dp>` or `Color` values.*

---

## 3. Architecture & Security Audit

### `mad-pro doctor`
The ultimate quality gate command. It acts as a static analysis tool validating architectural constraints and security best practices.

```bash
mad-pro doctor
```

**Sub-modules and Flags:**

| Command / Flag | Description |
|---|---|
| `mad-pro doctor` | **Architecture Checker:** Default run. Scans `.kt` files recursively for God-classes (>300 lines), direct use of Repositories bypassing UseCases/Interactors (depending on Architecture choice), main-thread `runBlocking`, and missing DI annotations. |
| `--security` | **Security & Leak Scanner:** Detects hardcoded APIs/Tokens, insecure `http://` bindings, plaintext `SharedPreferences`, decoupled `BroadcastReceivers`, world-readable intents, and memory leaks from `GlobalScope.launch` or un-recycled Bitmaps. |
| `--review <branch>` | **Diff Code Reviewer:** Integrates with `git diff <branch>...HEAD` to scan **only changed files**. Perfect for automating PR Code Reviews in CI pipelines. |
| `--fix` | *(Beta)* Scaffolds simulated fixes (e.g., automatically generating intermediate `UseCase` layers to resolve business logic violations). |
| `--output <file>` | Exports the audit report to a markdown file. Examples: `mad-pro doctor --review main --security --output review.md` |

### CLI Configuration (`.mad-pro.json`)

On its first run, `mad-pro doctor` or `prompt` creates a configuration file at the root directory to persist specific adaptive parameters. By detecting this file, MAD Pro ensures its scanners don't throw false positives (e.g. bypassing a UseCase might be a warning in pure MVVM, but a critical failure in Clean Architecture).

**Example Configuration:**
```json
{
  "architecture": "clean+mvi",
  "di": "hilt"
}
```

**Supported Architectures:**
- `mvvm`: Standard ViewModels + StateFlow
- `mvi`: Explicit Intent → State → Effect streams
- `mvp`: Interfaces bridging Presenter and View
- `clean+mvi`: Domain Layer enforced (UseCases) + MVI
- `viper`: View, Interactor, Presenter, Entity, Router
- `custom`: Reduces strict layer matching for exotic team structures.
