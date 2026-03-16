# Architecture and Dependency Injection in Modern Android Development

Modern Android Development (MAD) follows a multi-layered architecture to ensure separation of concerns, scalability, and testability.

## 1. The MAD Layered Architecture

### UI Layer

- **Composables**: Pure, stateless UI components.
- **ViewModels**: Manage UI state and handle user events. ViewModels interact with the Domain Layer (Use Cases) or the Data Layer (Repositories).

### Domain Layer (Optional)

- **Use Cases**: Encapsulate complex business logic and enable reusability across ViewModels.
- **Domain Models**: Pure Kotlin classes representing the data used by the business logic.

### Data Layer

- **Repositories**: Orchestrate data from multiple sources (Network, Local DB, Cache) and provide a clean API to the other layers.
- **Data Sources**: Implementation details like Retrofit services (Network) or Room DAOs (Local).

## 2. Unidirectional Data Flow (UDF)

Data should flow in a single direction to maintain a predictable state:

1. **State Flows Down**: Data travels from Repositories -> Use Cases -> ViewModels -> UI.
2. **Events Flow Up**: User interactions travel from UI -> ViewModels -> Use Cases -> Repositories.

Managing dependencies manually leads to tightly coupled code. Use DI frameworks to automate this.

### Hilt (Recommended)

Google's official wrapper around Dagger, optimized for Android.

**ViewModel Injection:**

```kotlin
@HiltViewModel
class UserViewModel @Inject constructor(
    private val getUserUseCase: GetUserUseCase
) : ViewModel() { ... }
```

### Koin

A pure-Kotlin functional DI framework.

**Configuring a Module:**

```kotlin
val appModule = module {
    single<UserRepository> { UserRepositoryImpl(get()) }
    factory { GetUserUseCase(get()) }
    viewModel { UserViewModel(get()) }
}
```

## 3. Best Practices

- **Constructor Injection**: Always prefer constructor injection for better testability.
- **Interface Segregation**: ViewModels and Use Cases should depend on Repository interfaces, not implementations.
- **Scoped Objects**: Use `@ViewModelScoped` for objects that should live as long as the ViewModel.
- **Single Source of Truth**: The Repository should be the only component that decides where data comes from.
