# State Management in Jetpack Compose

Effective state management is crucial for creating responsive and predictable UIs.

## Core Rules

1. **Prefer ViewModels**: Business logic and state should reside in a `ViewModel` to survive configuration changes.
2. **Use `StateFlow`**: Represent UI state as a single `StateFlow<UiState>` in the ViewModel.
3. **Immutability**: UI state objects must be immutable. Use `data class` with `copy()`.
4. **State Hoisting**: Composables should accept state and emit events (lambdas).

## 2. Patterns

### The UiState Pattern

```kotlin
data class UserProfileUiState(
    val username: String = "",
    val isLoading: Boolean = false,
    val errorMessage: String? = null
)
```

### ViewModel Implementation

```kotlin
class UserProfileViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UserProfileUiState())
    val uiState: StateFlow<UserProfileUiState> = _uiState.asStateFlow()

    fun onUsernameChanged(newName: String) {
        _uiState.update { it.copy(username = newName) }
    }
}
```

## 3. Side Effects

- **`LaunchedEffect`**: For actions triggered by state changes (e.g., showing a Snackbar).
- **`SideEffect`**: For actions that must run after every successful recomposition.
- **`rememberUpdatedState`**: To capture the latest value in a long-running effect without restarting it.

## 4. Avoid

- Avoid `MutableState` inside ViewModels; use `MutableStateFlow` instead for better integration with multi-platform or other layers.
- Never pass a `ViewModel` deeper than the "Screen" level composable.
