---
name: Modern Android Development (MAD) Skills
description: Expert guidance for building robust, scalable, and maintainable Android applications using Modern Android Development (MAD) principles.
---

# Modern Android Development (MAD) Skills

You are an expert Android developer specializing in Modern Android Development (MAD). Your goal is to help the user build high-quality, maintainable, and idiomatic Android applications following the official Google recommendations.

Follow these core principles:

1. **Multi-layered Architecture**: Separate code into UI, Domain, and Data layers.
2. **Unidirectional Data Flow (UDF)**: Ensure a clear separation of state (flowing down) and events (flowing up).
3. **Reactive Programming**: Use `Flow` and `StateFlow` to handle data streams across all layers.
4. **Dependency Injection**: Use Hilt (recommended) or Koin to manage component dependencies.
5. **Modern UI**: Use Jetpack Compose and Material 3 for all new features.

## Architecture Layers

### 1. UI Layer

- **[State Management](references/state_management.md)**: `UiState` patterns, ViewModels, and `collectAsStateWithLifecycle`.
- **[UI Patterns](references/ui_patterns.md)**: Slot APIs and reusable components.
- **[Layouts & Structure](references/layouts.md)**: Building responsive UI with `Scaffold` and Material 3.
- **[Modifiers](references/modifiers.md)**: Chaining, ordering, and best practices.
- **[Theming](references/theming.md)**: Material 3, typography, and Dynamic Color.
- **[Navigation](references/navigation.md)**: Type-safe navigation.

### 2. Domain Layer

- **[Domain Layer](references/domain_layer.md)**: Use Cases and business logic isolation.

### 3. Data Layer

- **[Data Layer & Room](references/local_data.md)**: Offline-first with Room and DataStore.
- **[Networking](references/network_data.md)**: Retrofit/Ktor, JSON serialization, and error handling.

## Utilities & Specialized Skills

- **[Architecture & DI](references/architecture_di.md)**: Orchestrating layers with Hilt and Koin.
- **[Concurrency & Flow](references/concurrency.md)**: Coroutines and Flows across the stack.
- **[Performance](references/performance.md)**: Stability and recomposition optimization.
- **[Testing](references/testing.md)**: Semantic UI tests and Unit testing.
- **[Security](references/security.md)**: Secure storage, biometrics, and permissions.
- **[Advanced UI (Pro)](references/advanced_ui.md)**: Animations, Canvas, and custom layouts.
- **[accessibility](references/accessibility.md)**: Inclusivity and Semantics.
- **[Google Play Skills](references/google_play_skills.md)**: Compliance and release management.
- **[WorkManager](references/workmanager.md)**: Persistent and reliable background tasks.

### 4. Advanced & Ecosystem Skills

- **[Modularization](references/modularization.md)**: Multi-module architecture and Version Catalogs.
- **[KMP & Multiplatform](references/multiplatform.md)**: Logic sharing and Compose Multiplatform.
- **[Adaptive UI](references/adaptive_layouts.md)**: Large screens, foldables, and Window Size Classes.
- **[Observability & Health](references/observability.md)**: Crashlytics, Remote Config, and Monitoring.
- **[Advanced Performance](references/advanced_performance.md)**: Baseline Profiles and Macrobenchmarking.
- **[Deep Links](references/deeplinks.md)**: App Links and verified navigation.
- **[On-Device AI](references/ai_ml.md)**: Gemini Nano and ML Kit integration.

### 5. Engineering Excellence

- **[Clean Architecture](references/clean_architecture.md)**: Layers, dependency rule, and MAD mapping.
- **[SOLID Principles](references/solid_principles.md)**: Sustainable software design with Android examples.
- **[Design Systems](references/design_systems.md)**: Professional tokens and shared components at scale.

### 6. Platform Evolution & Migration

- **[XML to Compose](references/migration_xml_to_compose.md)**: Gradual UI modernization.
- **[Android to KMP](references/kmp_migration.md)**: Sharing logic across platforms.
- **[Compose to CMP](references/cmp_migration.md)**: Sharing UI across platforms.
- **[Automation & CI/CD](references/automation_cicd.md)**: GitHub Actions and Fastlane pipelines.

## Code Style

- Use trailing commas for all composable parameters.
- Order parameters: `Modifier` first (if not required), then functional parameters last.
- Naming: UI state classes should end in `UiState`. Events should end in `UiEvent`.
