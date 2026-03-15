# Layouts and Structure

Jetpack Compose provides powerful tools for building flexible and responsive layouts.

## Fundamental Components

1. **`Scaffold`**: Always use `Scaffold` as the root of a screen to handle Top Bars, Bottom Bars, and Snackbars.
2. **`Column` / `Row`**: The primary building blocks for vertical and horizontal alignment.
3. **`Box`**: Use for overlapping content or centering elements.
4. **`LazyColumn` / `LazyRow`**: Essential for lists with many items to ensure performance.

## Best Practices

- **Weight**: Use `Modifier.weight()` within Columns and Rows to distribute space proportionally.
- **Content Padding**: Use `PaddingValues` in Lazy lists instead of adding padding to individual items to avoid clipping issues.
- **Intrinsics**: Avoid fixed heights where possible; use `Modifier.height(IntrinsicSize.Min/Max)` if you need components to match heights.

## Responsive Design

- Use `Adaptive` layouts for larger screens.
- Check `WindowWidthSizeClass` to switch between Navigation Rail (Tablet/Desktop) and Bottom Navigation (Mobile).

## Example: Standard Screen Structure

```kotlin
@Composable
fun MyScreen(
    uiState: MyUiState,
    onBackClick: () -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Title") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = null)
                    }
                }
            )
        }
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .padding(innerPadding)
                .fillMaxSize()
        ) {
            // Content here
        }
    }
}
```

## 5. Optimization

- Use `LazyColumn` keys (`items(items, key = { it.id })`) to help Compose maintain state during list updates.
- Use `contentType` in Lazy lists to help with view recycling efficiency.
