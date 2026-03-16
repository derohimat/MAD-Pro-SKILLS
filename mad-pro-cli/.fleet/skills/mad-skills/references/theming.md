# Theming in Jetpack Compose

Jetpack Compose uses Material 3 (M3) as its default design system.

## Material Theme Structure

A standard M3 theme consists of:

1. **`ColorScheme`**: Dynamic vs Static colors.
2. **`Typography`**: Standardized text styles (Headline, Body, Label).
3. **`Shapes`**: Corner radiuses for components.

## Implementation Pattern

```kotlin
@Composable
fun AppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
```

## 3. Best Practices

- **Use Theme Tokens**: Never hardcode hex values like `Color(0xFF00FF00)`. Always use `MaterialTheme.colorScheme.primary`.
- **Text Styles**: Use `MaterialTheme.typography.bodyLarge` instead of modifying `fontSize` and `fontWeight` manually.
- **Local Providers**: Create your own `CompositionLocal` if you need to pass custom theme attributes (e.g., custom spacing or extra semantic colors) that aren't in M3.

## 4. Visual Hierarchy

- Use `Surface` to automatically handle background colors and content color nesting (providing correct contrast).
- Use `Elevated` vs `Filled` vs `Outlined` components to signify importance.

## 5. Dark Mode Support

- Always verify your theme in both light and dark modes. Use `@Preview` with `uiMode = UI_MODE_NIGHT_YES`.
