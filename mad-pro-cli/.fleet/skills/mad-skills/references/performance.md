# Performance Optimization in Jetpack Compose

Compose is fast, but improper patterns can lead to unnecessary recompositions and UI lag.

## The Three Phases of Compose

1. **Composition**: What to show (running composable functions).
2. **Layout**: Where to show it (measuring and placing).
3. **Drawing**: How to draw it (rendering pixels).

**Rule**: Always defer state reads to the latest possible phase.

## Optimization Techniques

### 1. Stable Types

State classes should ideally be stable. Use the `@Stable` or `@Immutable` annotations if the compiler cannot infer stability (e.g., for classes in modules without Compose enabled).

- Avoid `List` (unstable); use `ImmutableList` (from Kotlin collections immutable) or a wrapper class.

### 2. `derivedStateOf`

Use `derivedStateOf` when you have state that depends on other state, and that input state changes more frequently than you need to update the UI.
*Example: Scrolling position to show a "Back to Top" button.*

```kotlin
val showButton by remember {
    derivedStateOf { listState.firstVisibleItemIndex > 5 }
}
```

### 3. Deferring State Reads

Use lambda-based modifiers when reading state that changes frequently (like scroll or animation values).

```kotlin
// GOOD: Read happens only during Draw phase
Box(Modifier.graphicsLayer { alpha = scrollState.value / 100f })

// BAD: Causes recomposition every scroll change
Box(Modifier.alpha(scrollState.value / 100f))
```

### 4. `remember` computations

Expensive operations (like sorting a list or parsing a date) should be wrapped in `remember(key)`.

## 4. Tools

- **Layout Inspector**: Use the "Recomposition Counts" feature to identify hot spots.
- **Strong Skipping Mode**: Enabled by default in newer Compose versions, but still requires stable data types to work perfectly.
