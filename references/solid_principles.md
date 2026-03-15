# SOLID Principles in Modern Android

SOLID is an acronym for five design principles intended to make software designs more understandable, flexible, and maintainable.

## 1. Single Responsibility Principle (SRP)

> **"A class should have one, and only one, reason to change."**

- **Android Example**: Don't put data fetching logic inside a Composable or a ViewModel.
- **Improved**: Use a Repository for data fetching and a Use Case for business logic. The Composable should only be responsible for rendering the UI.

## 2. Open/Closed Principle (OCP)

> **"Software entities should be open for extension, but closed for modification."**

- **Android Example**: Use **Slot APIs** in Jetpack Compose.
- **Improved**: Instead of a giant `MyButton` with 20 parameters, accept a `content: @Composable () -> Unit` lambda. This allows the button to be extended with any content without modifying the `MyButton` code.

## 3. Liskov Substitution Principle (LSP)

> **"Objects in a program should be replaceable with instances of their subtypes without altering the correctness of that program."**

- **Android Example**: If you have a `BaseRepository`, any implementation (e.g., `ProdRepo`, `MockRepo`) should behave predictably according to the interface contract.
- **Avoid**: Throwing `NotImplementedError` in a subclass for a method that is part of the parent's contract.

## 4. Interface Segregation Principle (ISP)

> **"Many client-specific interfaces are better than one general-purpose interface."**

- **Android Example**: Instead of one massive `Actions` interface for a screen, split it into smaller ones like `AuthActions`, `ProfileActions`.
- **Improved**: Prevents a class from being forced to implement methods it doesn't need.

## 5. Dependency Inversion Principle (DIP)

> **"Depend upon abstractions, not concretions."**

- **Android Example**: A ViewModel should depend on a `UserRepository` interface, not the `UserRepositoryImpl` class.
- **Implementation**:
  - Higher-level modules should not depend on lower-level modules. Both should depend on abstractions.
  - Abstractions should not depend on details. Details should depend on abstractions.

## Implementation Pattern (DIP)

```kotlin
// Abstraction (Domain Layer)
interface WeatherRepository {
    suspend fun getCurrentWeather(): Weather
}

// Low-level detail (Data Layer)
class OpenWeatherRepo : WeatherRepository {
    override suspend fun getCurrentWeather() = // ...
}

// High-level module (UI Layer)
class WeatherViewModel @Inject constructor(
    private val repository: WeatherRepository // Depends on abstraction
) : ViewModel() {
    // ...
}
```
