# Concurrency and Flow in Jetpack Compose

Kotlin Coroutines and Flow are the lifeblood of asynchronous programming in modern Android development.

## 1. Collecting Flow Safely

**NEVER** use `collectAsState()` in production. Always use `collectAsStateWithLifecycle()` to ensure collection stops when the app is in the background.

```kotlin
val uiState by viewModel.uiState.collectAsStateWithLifecycle()
```

*Requires `androidx.lifecycle:lifecycle-runtime-compose` dependency.*

## 2. Side Effect APIs

- **`LaunchedEffect`**: Runs a coroutine when a "key" changes. If the key is `Unit`, it runs once when the composable enters the composition.
- **`rememberCoroutineScope`**: Returns a scope tied to the composition lifecycle. Use this for firing coroutines in response to user events (like button clicks).
- **`DisposableEffect`**: Used for setup/teardown logic (e.g., registering listeners).

```kotlin
val scope = rememberCoroutineScope()
Button(onClick = {
    scope.launch { /* trigger long running task */ }
}) { ... }
```

## 3. Best Practices for Coroutines

- **Main-Safe ViewModels**: All ViewModel functions should be "main-safe". The ViewModel is responsible for choosing the correct Dispatcher (usually `Dispatchers.IO` for background tasks).
- **Avoid GlobalScope**: Always use `viewModelScope` or `rememberCoroutineScope` to ensure tasks are canceled when no longer needed.
- **Flow Operators**: Use `onEach`, `map`, and `filter` in the ViewModel to transform data before it reaches the UI.

## 4. Derived State and Flow

If you have a Flow that depends on another Flow, use `combine` or `flatMapLatest` in the ViewModel.

```kotlin
val filteredData = combine(searchQuery, rawData) { query, data ->
    data.filter { it.contains(query) }
}.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
```

## 5. Threading Rule

- **Composition**: Must be on the Main Thread.
- **Business Logic/Data**: Should be on background threads (managed by the Repository/ViewModel).
- **State Updates**: Updates to `MutableStateFlow` or Compose `State` are thread-safe, but usually happen on the Main Thread.

## 6. Threading Rule
