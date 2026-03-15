# Jetpack Compose UI Patterns

Standardizing how you build components ensures consistency across the app and makes the code easier to maintain.

## 1. The Slot API Pattern

This is the most powerful pattern in Compose for creating flexible, reusable components. Instead of passing many flags, pass a `@Composable` lambda.

```kotlin
@Composable
fun MyStandardCard(
    title: String,
    content: @Composable () -> Unit, // Slot
    actions: @Composable (() -> Unit)? = null // Optional Slot
) {
    Card {
        Column {
            Text(title, style = MaterialTheme.typography.titleLarge)
            content()
            actions?.let {
                Row { it() }
            }
        }
    }
}
```

## 2. Stateful vs Stateless Components

- **Stateless**: Accepts state as parameters and emits events via lambdas. These are easy to test and reuse.
- **Stateful**: Owns and manages a `ViewModel` or its own internal state. These are usually "Screen" or "Container" level components.

**Pattern**: Always aim to make your UI components stateless and "hoist" the state to a stateful container.

## 3. UI State Patterns (LCE)

Use a standard pattern for Loading, Content, and Error states.

```kotlin
@Composable
fun <T> LceContainer(
    state: LceState<T>,
    onRetry: () -> Unit,
    content: @Composable (T) -> Unit
) {
    when (state) {
        is LceState.Loading -> CircularProgressIndicator()
        is LceState.Error -> ErrorView(state.message, onRetry)
        is LceState.Content -> content(state.data)
    }
}
```

## 4. Derived State for List Headers

Use `derivedStateOf` to implement patterns like sticky headers or showing/hiding elements based on scroll position without killing performance.

## 5. CompositionLocal Patterns

Use `CompositionLocal` sparingly for values that are "provided" globally down the tree (e.g., `LocalContentColor`, `LocalSpacing`).

```kotlin
val LocalSpacing = staticCompositionLocalOf { Spacing() }

@Composable
fun MyTheme(content: @Composable () -> Unit) {
    CompositionLocalProvider(LocalSpacing provides Spacing(medium = 16.dp)) {
        content()
    }
}
```

## 6. The "Scaffold" Pattern

Every screen should follow a standard structure:

1. `Scaffold` (TopAppBar, SnackbarHost).
2. `Box` with `PullRefresh` (if applicable).
3. `LazyColumn` for content.
4. Error handling via `Snackbar`.
