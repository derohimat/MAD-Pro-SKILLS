# MAD Pro CLI Wiki

Welcome to the MAD Pro CLI Wiki! This document covers the comprehensive features, configuration, and advanced use cases for the CLI.

## Table of Contents
1. [Configuration (`.mad-pro.json`)](#configuration)
2. [Doctor Sub-modules](#doctor-sub-modules)
   - [Architecture Checker](#architecture-checker)
   - [Security & Leak Scanner](#security--leak-scanner)
   - [Diff Code Reviewer](#diff-code-reviewer)
3. [Design Tokens](#design-tokens)
4. [Agent Prompts](#agent-prompts)

---

## Configuration

When you run `mad-pro doctor` or `mad-pro prompt` for the first time, a `.mad-pro.json` file is generated in the root of your project:

```json
{
  "architecture": "mvi",
  "di": "hilt"
}
```

This configuration ensures the agent and the CLI output are adaptive to your specific project needs. Supported architectures:
- `mvvm`: Standard ViewModel + StateFlow/LiveData
- `mvi`: Intent → State → Effect
- `mvp`: View interface + Presenter
- `clean+mvi`: Domain Layer (UseCases) + MVI
- `viper`: View, Interactor, Presenter, Entity, Router
- `custom`: Disables strict pattern matching

---

## Doctor Sub-modules

The `mad-pro doctor` command is actually a suite of scanners designed to keep your project fully compliant with MAD patterns.

### Architecture Checker
Runs by default (`mad-pro doctor`). Recursively scans `.kt` files to detect anti-patterns based on your chosen architecture.

**Key Checks:**
- Detects the existence of God-classes (> 300 lines).
- Detects business logic bypassing UseCases or Interactors.
- Scans for `runBlocking` on the main thread.
- Warns against placing complex logic directly in `@Composable` or `Activity`.

### Security & Leak Scanner
Run with `mad-pro doctor --security`.

**Key Checks:**
- **Critical**: Hardcoded API keys and Secrets (`val API_KEY = "sk-..."`).
- **Critical**: HTTP insecure endpoints in network clients.
- **Critical**: Data stored in unencrypted `SharedPreferences`.
- **Critical**: World-readable file permissions.
- **Critical**: Broadcast receivers lacking an `unregisterReceiver` call.
- **Warning**: Potential memory leaks from un-recycled `Bitmaps` or dangling `GlobalScope.launch`.
- **Warning**: Logging sensitive data (e.g. `Log.d(TAG, token)`).

### Diff Code Reviewer
Run with `mad-pro doctor --review <target-branch>`

This automatically hooks into `git diff`, extracting the changed files between the `target-branch` and your `HEAD`. It only scans those files, allowing you to easily block PRs containing architectural anti-patterns or security vulnerabilities.

Export the report to a markdown file for easy GitHub commenting:
```bash
mad-pro doctor --review main --security --output review.md
```

---

## Design Tokens

Design Tokens allow your AI agents to build UIs consistently. By running `mad-pro add` or checking the Tokens box during `init`, you install three markdown files in `references/design-tokens/`:
1. `color-tokens.md`: Material 3 palettes and industry-specific defaults.
2. `typography-tokens.md`: Material 3 type scales and recommended font families.
3. `spacing-tokens.md`: Standardized 4dp/8dp grid system and component dimensions.

The contextual prompt generation system automatically instructs the AI to use these tokens instead of hard-coding `dp` or `Color` values.

---

## Agent Prompts

Running `mad-pro prompt` analyzes your project's `.mad-pro.json` and the currently installed `/references` (and their respective industry blueprints) to generate highly optimized instruction rules.

You can directly output to:
- `.cursorrules` (for Cursor IDE)
- `.windsurfrules` (for Windsurf)
- Generic clipboard output
