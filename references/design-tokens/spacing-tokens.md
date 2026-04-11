# Design Tokens: Spacing & Shapes

These are dimensions pattern commonly used to ensure pixel-perfect Android UIs.
Avoid hardcoding `dp` values directly in modifiers. 

## Spacing (Using 4dp & 8dp Grid System)

Create a `Spacing.kt` or `Dimens.kt` to store these:

```kotlin
package com.example.ui.theme

import androidx.compose.ui.unit.dp

object Spacing {
    val none = 0.dp
    
    // Base 4dp system
    val extraSmall = 4.dp
    val small = 8.dp
    val medium = 16.dp
    val large = 24.dp
    val extraLarge = 32.dp
    
    // Component specific
    val screenPadding = 16.dp
    val cardPadding = 12.dp
    val itemSpacing = 8.dp
    val buttonPadding = 16.dp
    val buttonHeight = 48.dp // Accessibility minimum touch target
}
```

## Shapes (Material 3)

Define corners in `Shape.kt`:

```kotlin
package com.example.ui.theme

import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Shapes
import androidx.compose.ui.unit.dp

val AppShapes = Shapes(
    extraSmall = RoundedCornerShape(4.dp),
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp),
    extraLarge = RoundedCornerShape(24.dp)
)
```

## Common Usage Pattern

```kotlin
@Composable
fun ThemedCard(content: @Composable () -> Unit) {
    Card(
        shape = MaterialTheme.shapes.medium, // Uses 12.dp
        modifier = Modifier.padding(Spacing.medium) // Uses 16.dp
    ) {
        Column(
            modifier = Modifier.padding(Spacing.cardPadding) // Uses 12.dp
        ) {
            content()
        }
    }
}
```
