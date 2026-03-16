# Migration from XML to Jetpack Compose

Migrating a legacy application to Jetpack Compose should be a gradual process, not a "big bang" rewrite.

## Gradual Migration Strategies

1. **New Features in Compose**: Build all new screens and features using Compose.
2. **Bottom-Up**: Start by migrating small, leaf-level components (buttons, text fields).
3. **Top-Down**: Migrate entire screens at once by replacing the Fragment/Activity layout with a `ComposeView`.

## Interoperability APIs

### Using Compose in XML (`ComposeView`)

To add Compose to an existing XML layout, use `ComposeView`.

**XML Layout:**

```xml
<LinearLayout ...>
    <androidx.compose.ui.platform.ComposeView
        android:id="@+id/compose_view"
        android:layout_width="match_parent"
        android:layout_height="wrap_content" />
</LinearLayout>
```

**Activity/Fragment:**

```kotlin
binding.composeView.apply {
    setViewCompositionStrategy(ViewCompositionStrategy.DisposeOnViewTreeLifecycleDestroyed)
    setContent {
        M3Theme {
            MyComposeComponent()
        }
    }
}
```

### Using Views in Compose (`AndroidView`)

If you need a component that doesn't exist in Compose yet (e.g., `MapView`, `WebView`), use `AndroidView`.

```kotlin
@Composable
fun LegacyWebView(url: String) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webViewClient = WebViewClient()
            }
        },
        update = { webView ->
            webView.loadUrl(url)
        }
    )
}
```

## Theme Interop

Use the **Material Theme Adapter** library to bridge your existing XML XML (MDC/AppCompat) theme with `MaterialTheme` in Compose.

```kotlin
MdcTheme { // Automatically inherits colors from your XML theme
    MyScreen()
}
```

## 4. Navigation Interop

- **Fragment to Compose**: Use `findNavController().navigate(R.id.compose_fragment)`.
- **Compose to Fragment**: If using `NavHost` in Compose, you can still navigate to deep links that are handled by your existing Fragment-based navigation.

## 5. Best Practices

- **Avoid Hybrid State**: Do not share `MutableState` directly between Views and Composables. Use `ViewModel` as the single source of truth.
- **Dispose Correctly**: Always set a `ViewCompositionStrategy` to avoid memory leaks in Fragments.
- **Standardize UI**: Migrating is a great time to audit your design system and ensure consistency.
