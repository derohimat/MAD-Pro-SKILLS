# KMP and Compose Multiplatform

Kotlin Multiplatform (KMP) allows you to share code between Android, iOS, Web, and Desktop while keeping the native performance and look of each platform.

## 1. Code Sharing Strategy

The most common approach in MAD is sharing the **Data** and **Domain** layers:

- **Shared (`:commonMain`)**: Business logic, Use Cases, Repositories, and API definitions.
- **Android (`:androidMain`)**: Android-specific implementations (e.g., Room, Biometrics).
- **iOS (`:iosMain`)**: iOS-specific implementations (e.g., Keychain, CoreData).

## 2. Compose Multiplatform (CMP)

Compose Multiplatform extends Jetpack Compose to other platforms. You can share not just the logic, but the **UI** as well.

### Standard Module Structure

```text
shared/
  commonMain/  <- Shared UI and Logic
  androidMain/ <- Android specific UI/Logic
  iosMain/     <- iOS specific UI/Logic
  desktopMain/ <- Desktop specific UI/Logic
```

## 3. Libraries for KMP

Use multiplatform-ready libraries to maximize code sharing:

- **Networking**: Ktor
- **Database**: SQLDelight or Room (KMP support)
- **Dependency Injection**: Koin
- **Serialization**: Kotlinx.serialization
- **Concurrency**: Kotlin Coroutines

## 4. Platform-Specific Implementation: `expect/actual`

When you need to access platform APIs (like the Camera or UUIDs), use the `expect/actual` pattern:

```kotlin
// In commonMain
expect fun getDeviceName(): String

// In androidMain
actual fun getDeviceName(): String = "Android ${Build.MODEL}"

// In iosMain
actual fun getDeviceName(): String = UIDevice.currentDevice.name
```

## 5. Integration with iOS

- **SwiftUI Integration**: You can host a Compose Multiplatform view inside a SwiftUI `UIViewControllerRepresentable`.
- **SKIE**: Use the SKIE library to improve the Swift/Kotlin compatibility layer (e.g., making Flows and Sealed Classes easier to use in Swift).
