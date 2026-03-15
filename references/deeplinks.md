# Deep Links and App Links

Deep links allow users to navigate directly to a specific part of your app from an external source (Email, Website, SMS).

## 1. Traditional Deep Links

Easy to implement but not exclusive to your app. Multiple apps might try to handle the same URI.

- **Scheme**: e.g., `myapp://product/123`.
- **Implementation**: Define an `<intent-filter>` in `AndroidManifest.xml`.

## 2. Android App Links (Verified Deep Links)

The most secure way to handle links. These are verified against a web domain you own.

- **Security**: Ensures that only your app can handle your website's URLs.
- **UX**: Opens the app directly without showing the "Disambiguation Dialog".
- **Verification**: Requires a `assetlinks.json` file hosted on your website at `.well-known/assetlinks.json`.

## 3. Navigation Component Integration

Integration with the Jetpack Navigation library makes Deep Linking seamless.

```kotlin
composable(
    route = "product/{id}",
    deepLinks = listOf(navDeepLink { uriPattern = "https://www.myapp.com/product/{id}" })
) { backStackEntry ->
    val id = backStackEntry.arguments?.getString("id")
    ProductScreen(productId = id)
}
```

## 4. Handling Parameters

- **Type Safety**: Use the default navigation arguments to parse IDs or tokens.
- **Fallback**: Always provide a fallback (e.g., Home Screen) if the deep link parameters are malformed or the resource no longer exists.

## 4. Security Considerations

- **Input Validation**: Treat all deep link data as "untrusted". Validate strings, IDs, and tokens before using them.
- **Authentication**: Ensure that sensitive screens (like "Change Password") still require a valid session even if opened via a deep link.
