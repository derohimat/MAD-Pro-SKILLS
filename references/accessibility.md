# Accessibility in Jetpack Compose

Creating inclusive apps is a core responsibility. Compose provides a powerful "Semantics" system to make your UI accessible to everyone.

## 1. Content Descriptions

The most basic step. Always provide a `contentDescription` for purely visual elements like `Icon` or `Image` unless they are decorative.

```kotlin
Icon(
    imageVector = Icons.Default.Add,
    contentDescription = "Add new contact" // Specific action
)
```

## 2. Using Semantics

Use the `Modifier.semantics` for complex components where the default behavior isn't enough.

- **`mergeDescendants = true`**: Groups smaller elements into a single focusable entity for screen readers.
- **`heading()`**: Marks a component as a header to help users navigate.
- **`stateDescription`**: Provides a custom description for a state (e.g., "Active" instead of just "Checked").

```kotlin
Column(
    modifier = Modifier
        .semantics(mergeDescendants = true) {
            heading()
        }
) {
    Text("User Profile")
    Text("John Doe")
}
```

## 3. Custom Actions

Use `onClickLabel` to specify what happens when an item is clicked, which is read by TalkBack.

```kotlin
Modifier.clickable(
    onClickLabel = "Open detailed profile",
    onClick = { ... }
)
```

## 4. Visual Accessibility

- **Touch Targets**: Ensure all interactive elements are at least **48x48dp**.
- **Dynamic Type**: Use `sp` for text sizes to ensure they scale with the user's system font settings.
- **Contrast**: Use Material 3 theme colors to ensure proper contrast ratios.

- **TalkBack**: Test your app manually with TalkBack enabled.
- **Accessibility Scanner**: Use the Google Accessibility Scanner app to identify common issues.
- **Semantic Assertions in Tests**:

## 5. Testing Accessibility

```kotlin
composeTestRule
    .onNode(hasContentDescription("Add"))
    .assertExists()
```
