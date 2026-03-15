# Advanced UI & Pro Techniques in Compose

Take your Compose skills to the next level with complex animations, custom drawing, and specialized layouts.

## 1. Advanced Animations

Move beyond `AnimatedVisibility` to more fine-grained control.

### `updateTransition`

Manage multiple animation properties simultaneously that are linked to a single state change.

```kotlin
val transition = updateTransition(expanded, label = "cardExpansion")
val color by transition.animateColor { isExpanded -> if (isExpanded) Red else Blue }
val size by transition.animateDp { isExpanded -> if (isExpanded) 200.dp else 100.dp }
```

### `Animatable`

For low-level, fire-and-forget animations or animations where you need a custom listener/trigger.

```kotlin
val alpha = remember { Animatable(0f) }
LaunchedEffect(Unit) {
    alpha.animateTo(1f, animationSpec = tween(1000))
}
```

## 2. Custom Drawing with Canvas

When standard components aren't enough, use the `Canvas` API.

- **Draw Phase**: Drawing is highly efficient because it bypasses Layout and Composition.
- **Access to Native Canvas**: You can drop down to `drawIntoCanvas` to use standard Android `android.graphics.Canvas` features.

```kotlin
Canvas(modifier = Modifier.size(100.dp)) {
    drawCircle(color = Color.Blue, radius = size.minDimension / 2)
    drawLine(color = Color.Black, start = Offset.Zero, end = Offset(size.width, size.height))
}
```

## 3. Custom Layouts

If `Row`, `Column`, and `Box` don't fit your needs, build a custom layout.

- **`Layout` composable**: Measure children once, and place them in a 2D space.
- **`SubcomposeLayout`**: Allows you to defer composition of some children until you know the constraints of others (used in `Scaffold` and `BoxWithConstraints`).

## 4. Advanced Interactivity

- **`PointerInput`**: Detect custom gestures like multi-touch, long-press with specific offsets, or custom drag-and-drop.
- **LookaheadScope**: New in Compose, allows you to "look ahead" at where a layout *will* be to animate transitions smoothly between different layout configurations.

## 5. Visual Effects

- **`graphicsLayer`**: Applying renders effects like `blur`, `shadow`, `scale`, and `rotation` efficiently.
- **Shaders**: Use `RuntimeShader` (Android AGSL) to create high-performance visual effects like glows, patterns, and distortions.

## 6. Performance "Pro" Tips

- **Avoid frequent state reads in Composition**: If a value changes 60 times per second, read it only in the **Draw** or **Layout** phase using lambda modifiers.
- **Stability Monitoring**: Use the `compose-compiler-report` to identify unstable classes that are causing excessive recomposition.
