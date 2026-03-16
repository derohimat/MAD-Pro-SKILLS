# Adaptive Layouts and Large Screens

Modern Android apps must provide a great experience across all form factors: phones, foldables, tablets, and desktop.

## 1. Window Size Classes

Instead of targeting specific pixel widths, use Window Size Classes to categorize screen sizes:

- **Compact**: Typical phone in portrait.
- **Medium**: Small tablets, large foldables, or landscape phones.
- **Expanded**: Large tablets and desktop.

```kotlin
@Composable
fun MyApp(windowSize: WindowSizeClass) {
    when (windowSize.widthSizeClass) {
        WindowWidthSizeClass.Compact -> MyCompactUI()
        WindowWidthSizeClass.Medium -> MyMediumUI()
        WindowWidthSizeClass.Expanded -> MyExpandedUI()
    }
}
```

## 2. Canonical Layout Patterns

Google recommends three standard patterns for large screens:

- **List-Detail**: Best for browsing content while keeping context (e.g., Email, Messaging).
- **Supporting Pane**: Main content with a side pane for secondary info (e.g., Documents with comments).
- **Feed**: Grids that expand or stack based on width (e.g., Social Media, Photo Gallery).

## 3. Navigation Components for Adaptive UI

- **Bottom Navigation**: Use for Compact (phone) screens.
- **Navigation Rail**: Use for Medium (tablet) screens.
- **Navigation Drawer**: Use for Expanded (large tablet/desktop) screens.

## 4. Handling Foldables

Use the **Jetpack WindowManager** library to detect folding states:

- **Tabletop Mode**: Half of the screen on a flat surface.
- **Book Mode**: Half-folded vertically.

Ensure content avoids the "hinge" area when the device is not flat.

## 5. Testing Adaptive UI

- Use **Resizing Emulators** in Android Studio.
- Run UI tests with different configuration overrides.
- Use **Screenshot Testing** to verify layouts across different size classes.
