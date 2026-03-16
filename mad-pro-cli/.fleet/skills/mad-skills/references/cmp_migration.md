# Migrating from Jetpack Compose to Compose Multiplatform (CMP)

Compose Multiplatform (CMP) allows you to use your Jetpack Compose UI skills to build applications for iOS, Web, and Desktop.

## 1. The Migration Workflow

Once your project has a KMP module (see [KMP Migration](file:///Users/denirohimat/Works/JetpackComposeSkills/references/kmp_migration.md)), you can start sharing your UI.

### Phase 1: Dependency Update

- Change your Gradle dependencies from `androidx.compose.*` to the multiplatform equivalent `org.jetbrains.compose.*`.
- Use the **Compose Multiplatform Gradle Plugin** to manage versions across platforms.

### Phase 2: Move UI to `commonMain`

- Move your `@Composable` functions from the `:app` module (Android) to the `commonMain` source set of your shared module.
- **Goal**: Keep as much UI logic in `commonMain` as possible.

### Phase 3: Replacement of Android-Specific APIs

Replace Android-only APIs with their KMP/CMP equivalents:

- **Resources**: Replace `R.string.*` or `R.drawable.*` with **library-based resource management** (e.g., `Moko-Resources` or the built-in CMP resources API).
- **ViewModels**: Use **KMP ViewModels** (e.g., from `androidx.lifecycle` KMP support or `Decompose`).
- **Navigation**: Switch to multiplatform navigation libraries like **Compose-Navigation (Multiplatform)**, **Voyager**, or **Decompose**.

## 2. Platform-Specific UI: `expect/actual`

Sometimes you need a native UI component (e.g., a Google Map or a specialized iOS picker).

- **Expect**: Define a `Composable` interface in `commonMain`.
- **Actual (Android)**: Implement using `AndroidView` to wrap existing native views.
- **Actual (iOS)**: Implement using `UIKitView` to wrap UIKit/SwiftUI components.

## 3. Handling Graphics and Interop

- **Canvas**: CMP supports a common Canvas API across all platforms.
- **Images**: Ensure images are in formats supported by all platforms (WebP, PNG, SVG).
- **Fonts**: Bundle custom fonts in the shared module to ensure consistent typography.

## 4. Migration Checklist

- [ ] Compose Multiplatform plugin applied?
- [ ] Dependencies switched to `org.jetbrains.compose`?
- [ ] UI components moved to `commonMain`?
- [ ] Resources (Strings/Images) migrated to multiplatform-ready API?
- [ ] Navigation replaced with multiplatform solution?
- [ ] ViewModels updated to support KMP?

## 5. Next Steps

After migrating the UI, test on different targets:

- **iOS**: Run using the `iosApp` target in Android Studio or Xcode.
- **Desktop**: Run using `./gradlew :shared:run`.
- **Web**: Run using `./gradlew :shared:jsBrowserDevelopmentRun`.
