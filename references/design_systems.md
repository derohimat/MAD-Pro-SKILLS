# Design Systems & Theming (MAD Pro)

## 🏗️ Architecture: Design Tokens

A scalable Android app doesn't use hardcoded colors. Use **Design Tokens** to bridge Design and Development.

### 🎨 Color Palette (Material 3)

Define your core brand colors in `Color.kt` and map them to a `ColorScheme`.

```kotlin
// ui/theme/Color.kt
val MdPurple80 = Color(0xFFD0BCFF)
val MdPurple40 = Color(0xFF6650a4)
// ...

// ui/theme/Theme.kt
private val DarkColorScheme = darkColorScheme(
    primary = MdPurple80,
    secondary = MdPurpleGrey80,
    // ...
)
```

## 📐 Typography System

Standardize text styles using `MaterialTheme.typography`.

| Style | Use Case |
| :--- | :--- |
| `displayLarge` | Hero numbers, prominent headers |
| `titleMedium` | Section titles, list headers |
| `bodyLarge` | Main content text |
| `labelSmall` | Captions, legal text |

```kotlin
// ui/theme/Type.kt
val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    )
)
```

## 🧊 Shape & Spacing (8dp Grid)

Always use multiples of 8dp for margins and paddings.

```kotlin
object AppSpacing {
    val xSmall = 4.dp
    val small = 8.dp
    val medium = 16.dp
    val large = 32.dp
}
```

## 🚀 Implementation Rule

1. **Never** hardcode `Color(0xFF...)` in a screen. Use `MaterialTheme.colorScheme.primary`.
2. **Never** use `16.sp` directly. Use `MaterialTheme.typography.bodyLarge`.
3. Use **CompositionLocals** if you need custom design tokens (e.g., specific brand spacing).

```kotlin
@Composable
fun MyComponent() {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.onSurface
    ) {
        Text(
            text = "MAD Pro Standard",
            style = MaterialTheme.typography.bodyLarge
        )
    }
}
```
