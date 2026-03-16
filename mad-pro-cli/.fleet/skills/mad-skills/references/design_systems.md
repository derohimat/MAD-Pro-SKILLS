# Design Systems at Scale

A professional Design System goes beyond basic theming. It provides a common language between designers and developers.

## 1. Design Tokens

Tokens are the smallest pieces of the design system: colors, spacing, typography, and elevation stored as data.

### Standard Token Structure

- **Primitive Tokens**: `blue-500`, `spacing-16`.
- **Semantic Tokens**: `color-primary`, `spacing-medium`.
- **Component Tokens**: `button-background-color`.

## 2. Shared Component Library

Encapsulate Material 3 components into your own brand-specific wrappers to ensure consistency.

```kotlin
@Composable
fun MadButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier,
        enabled = enabled,
        shape = MadTheme.shapes.button, // Custom shape from tokens
        colors = ButtonDefaults.buttonColors(
            containerColor = MadTheme.colors.primary
        )
    ) {
        Text(text = text, style = MadTheme.typography.label)
    }
}
```

## 3. Documentation (Showcase)

Create a "Catalog" or "Showcase" app within your project to view and test components in isolation.

- Use **Compose Previews** extensively with different configurations (Dark mode, Large font).
- Consider tools like **Showkase** to automatically generate a component browser.
- Use **Screenshot Testing** (Paparazzi or Roborazzi) to prevent visual regressions.
