# Security Best Practices in Jetpack Compose

Ensuring your Android application is secure involves protecting data at rest, in transit, and during interaction.

## Secure Storage

Avoid storing sensitive information (tokens, PII) in plain `SharedPreferences` or `DataStore`.

1. **EncryptedSharedPreferences**: Use the Security library to encrypt key-value pairs.
2. **Encrypted DataStore**: Use `okio` based encryption or a custom wrapper for `DataStore<Preferences>`.

```kotlin
val masterKey = MasterKey.Builder(context)
    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
    .build()

val sharedPreferences = EncryptedSharedPreferences.create(
    context,
    "secret_shared_prefs",
    masterKey,
    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
)
```

## Biometric Authentication

Use `BiometricPrompt` for sensitive actions (e.g., payments or revealing secrets). Integration with Compose requires handling the fragment-based callback.

- **Always verify**: Ensure the device supports biometrics before showing the prompt.
- **CryptoObject**: Link the biometric scan to a `Cipher` or `Signature` for maximum security.

## Permissions

Modern Android (API 33+) requires granular permissions.

- **Accompanist Permissions**: Use libraries like `com.google.accompanist:accompanist-permissions` for a better Compose experience.
- **Explain why**: Always provide a clear rationale to the user *before* requesting a dangerous permission.

```kotlin
val permissionState = rememberPermissionState(android.Manifest.permission.CAMERA)
if (permissionState.status.isGranted) {
    Text("Camera permission granted")
} else {
    Button(onClick = { permissionState.launchPermissionRequest() }) {
        Text("Request permission")
    }
}
```

## Root Detection & Play Integrity

Protect your app from running on compromised devices.

- **Play Integrity API**: Use Google's official API to verify that you are talking to a genuine app binary running on a genuine Android device.
- **Root Checks**: Use libraries like `RootBeer` for basic local checks, but rely on server-side validation for critical flows.

## Network Security

- **SSL Pinning**: Use OkHttp's `CertificatePinner` to prevent MiTM attacks.
- **Network Security Config**: Define a `network_security_config.xml` to enforce HTTPS and disable cleartext traffic.

## Best Practices

- **Hide sensitive content in task switcher**: Use `FLAG_SECURE` in the relevant activity or window.
- **Input Sanitization**: Always sanitize user input before sending it to a backend or a database.
- **Hardcoded Secrets**: Never store API keys or secrets in your source code. Use `local.properties` or environment variables with the Secrets Gradle Plugin.
