# Domain Layer in Modern Android Development

The Domain Layer is an optional layer that sits between the UI and Data layers. It is responsible for encapsulating complex business logic or logic that is reused by multiple ViewModels.

## 1. The Role of the Domain Layer

- **Simplification**: Simplifies ViewModels by removing business logic.
- **Reusability**: Allows sharing logic across different screens (e.g., calculating a complex price).
- **Testability**: Makes business logic easy to unit test without dependencies on Android classes or UI.

## 2. Use Cases

The primary component of the Domain Layer is the `UseCase` (often called an Interactor).

### Naming Convention

A Use Case should be named after the action it performs: `Verb` + `Noun` + `UseCase`.
Example: `GetUserDataUseCase`, `ValidateEmailUseCase`.

### Implementation

Each Use Case should typically perform only **one** task and expose a single public function (usually using the `operator fun invoke`).

```kotlin
class GetUserUseCase @Inject constructor(
    private val userRepository: UserRepository
) {
    operator fun invoke(userId: String): Flow<User> {
        return userRepository.getUser(userId)
    }
}
```

## 3. When to Use a Domain Layer

You don't always need a Domain Layer. Google recommends adding it only when:

1. **Logic is complex**: E.g., data from multiple repositories needs to be combined.
2. **Logic is reused**: E.g., multiple ViewModels need to perform the same validation.
3. **Purity is desired**: You want to keep your domain logic purely in Kotlin, away from the Data layer's implementation details.

## 4. Best Practices

- **Stateless**: Use Cases should be stateless. Any state should be managed by the UI or Data layers.
- **Dependency Direction**: The Domain layer depends on the Data layer's **interfaces** (abstractions), not its implementations.
- **Single Source of Truth**: Use Cases should not maintain their own cache; they should rely on the Data layer for that.
- **Error Handling**: Use Cases can catch data-layer-specific exceptions and map them to domain-specific errors.
