# Modifiers in Jetpack Compose

Modifiers allow you to decorate or augment composables. They are the primary way to style and position elements.

## Rule of Order

**ORDER MATTERS.** Modifiers are applied from left to right (or top to bottom in code).

- `Modifier.padding(10.dp).background(Color.Red)` -> Background is applied *after* padding.
- `Modifier.background(Color.Red).padding(10.dp)` -> Padding is applied *inside* the background.

## Standard Order Recommendation

1. Sizing (`fillMaxSize`, `size`, `height`, `width`)
2. Padding
3. Background / Border / Shape
4. Constraints or Offsets
5. Interaction handlers (`clickable`, `toggleable`)

## Best Practices

- **Pass a Modifier**: Every reusable composable should accept a `modifier: Modifier = Modifier` parameter as its first optional argument.
- **Consumer Ownership**: Let the caller decide the size and outer padding of your component.
- **`clickable` vs `IconButton`**: Use `IconButton` for simple icon buttons. Use `Modifier.clickable` for custom layouts, ensuring you use `indication` and `interactionSource` for proper visual feedback (Ripples).

## Reusability Pattern

```kotlin
@Composable
fun MyComponent(
    modifier: Modifier = Modifier
) {
    Box(
        modifier = modifier
            .background(Color.Gray)
            .padding(16.dp)
    ) {
        // ...
    }
}
```

## 4. Advanced Usage

- **`graphicsLayer`**: Use for efficient rotations, scaling, and opacity changes without triggering recomposition as often.
- **Custom Modifiers**: Avoid overusing them; usually, a simple extension function on `Modifier` is enough.
