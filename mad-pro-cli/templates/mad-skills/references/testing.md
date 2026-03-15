# Testing in Jetpack Compose

Compose testing is semantic-based, meaning it focuses on what the user sees and interacts with, rather than internal implementation details.

## Rule of Selection

1. **`hasText`** / **`hasContentDescription`**: Best for accessibility.
2. **`hasTestTag`**: Use only as a last resort for unique identification of complex nodes.

## 2. Setup

```kotlin
class MyComposeTest {
    @get:Rule
    val composeTestRule = createComposeRule()

    @Test
    fun loginFlow_showsErrorOnEmptyPassword() {
        composeTestRule.setContent {
            AppTheme {
                LoginScreen(...)
            }
        }

        // Action
        composeTestRule.onNodeWithText("Login").performClick()

        // Assertion
        composeTestRule.onNodeWithText("Password cannot be empty").assertIsDisplayed()
    }
}

## 3. Best Practices

- **Avoid `Thread.sleep`**: The `ComposeTestRule` automatically waits for the UI to be idle (IdlingResources).
- **Semantics**: Use `Modifier.semantics { contentDescription = "..." }` to make your UI testable and accessible at the same time.
- **Isolate Screenshots**: Use `captureToImage()` for visual regression testing.
- **Hilt Testing**: Use `@HiltAndroidTest` for integration tests that require a real ViewModel/Repository.

## 4. Verification Checklist

- Assert visibility with `assertIsDisplayed()`.
- Assert existence with `assertExists()`.
- Assert interactive state with `assertIsEnabled()` or `assertIsSelected()`.

## 5. Pro Tip

Use the `DeviceConfigurationOverride` APIs to test your UI against different screen sizes, font scales, and locales within a single test file.
