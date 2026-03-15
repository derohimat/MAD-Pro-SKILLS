# Migrating from Native Android to Kotlin Multiplatform (KMP)

Migrating an existing Android project to KMP allows you to share business logic with iOS, Web, and Desktop while keeping your existing Android UI.

## 1. The Migration Strategy: "Data-First"

The most successful migrations follow a bottom-up approach, starting with the data layer.

### Phase 1: Preparation

- **Modularize**: Ensure your app has a clear separation between UI and Data/Domain.
- **Dependency Audit**: Identify libraries that don't support KMP (e.g., standard Room, Retrofit, Glide). Find KMP alternatives (Ktor, SQLDelight/Room-KMP).

### Phase 2: Create the Shared Module

- Add a new `KMP Shared Module` to your project (usually named `:shared` or `:common`).
- Configure `commonMain`, `androidMain`, and `iosMain` source sets in `build.gradle.kts`.

### Phase 3: Migrate Data Models

- Move your POJOs/Data Classes to `commonMain`.
- Ensure they only use Kotlin standard libraries (no `android.*` imports).

### Phase 4: Migrate Networking & Persistence

- Replace Retrofit with **Ktor**.
- Replace Room with **SQLDelight** or use the new **Room-KMP** version.
- Move Repositories to `commonMain`.

### Phase 5: Domain Layer Migration

- Move Use Cases and business logic to `commonMain`.
- Use `expect/actual` for platform-specific logic (e.g., getting a device ID or logging).

## 2. Handling Android-Specific Dependencies

If a class depends on `Context`, you have two choices:

1. **Remove the dependency**: Refactor the class to not need `Context`.
2. **Inject from Android**: Define an interface in `commonMain` and provide the implementation in `androidMain` using the Android `Context`.

## 3. Integration with iOS

Once the shared module is ready:

- Connect the shared module to an Xcode project using the `KMP CocoaPods plugin` or `Swift Package Manager (SPM)`.
- Call the shared Repositories/Use Cases from SwiftUI.

## 4. Common Pitfalls

- **Avoid `android.*` in Shared**: Using any Android-specific library in `commonMain` will break the iOS build.
- **Serialization**: Use `kotlinx-serialization` instead of GSON or Moshi if you want to share models.
- **Concurrency**: Use `Flow` as the bridge between Kotlin and Swift (with SKIE for better compatibility).

## 5. Migration Checklist

- [ ] Project modularized by layer?
- [ ] KMP shared module created?
- [ ] Networking moved to Ktor?
- [ ] Database moved to SQLDelight/Room-KMP?
- [ ] Business logic (Use Cases) in `commonMain`?
- [ ] iOS project consuming shared code?
