# Local Data Persistence in Jetpack Compose

Handling persistent data correctly ensures a seamless offline-first experience.

## 1. Room Database

Room is the recommended way to handle structured local data.

**Pattern**: Expose data as a `Flow` in the DAO.

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    fun getAllUsers(): Flow<List<User>>
}
```

**Consumption in Compose**:

```kotlin
val users by viewModel.usersFlow.collectAsStateWithLifecycle(initialValue = emptyList())
```

## 2. DataStore (Preferences)

Use DataStore instead of SharedPreferences for simple key-value pairs.

- **Async/Safe**: It uses Coroutines and handles data updates atomically.
- **State Integration**: Since it exposes a `Flow`, it integrates perfectly with Compose.

```kotlin
val settingsFlow: Flow<UserSettings> = context.dataStore.data
    .map { preferences ->
        UserSettings(theme = preferences[THEME_KEY] ?: "light")
    }
```

## 3. Offline-First Architecture

A standard offline-first app follows this flow:

1. UI requests data from the ViewModel.
2. ViewModel observes a Flow from the Repository (which observes the Room DB).
3. Repository triggers a network sync if needed and saves the result to Room.
4. Room automatically emits the new data to the Flow, updating the UI.

## 4. Best Practices

- **Never block the Main Thread**: Room and DataStore operations should always run on `Dispatchers.IO`.
- **Encrypted DataStore**: Use encryption for sensitive settings.
- **Migration**: Always provide a `Migration` strategy when changing your database schema to avoid app crashes.
- **Single Instance**: Ensure you use a single instance of your Room Database (usually via Hilt/Koin).
