# Network Data Best Practices in Jetpack Compose

Handling network requests efficiently and safely is crucial for a responsive user experience.

## 1. Networking Engines

### Retrofit (Standard)

The industry standard for type-safe REST clients on Android.

**Setup with Serialization:**

```kotlin
val retrofit = Retrofit.Builder()
    .baseUrl("https://api.example.com/")
    .addConverterFactory(Json.asConverterFactory("application/json".toMediaType()))
    .build()
```

### Ktor Client (Kotlin-First)

A multiplatform-ready asynchronous client for HTTP requests.

```kotlin
val client = HttpClient(Android) {
    install(ContentNegotiation) {
        json()
    }
}
```

## 2. JSON Serialization

Use **KotlinX Serialization** instead of GSON or Moshi for better Kotlin integration and performance.

```kotlin
@Serializable
data class User(val id: Int, val name: String)
```

## 3. Handling API Responses

### The Result Wrapper Pattern

Avoid throwing exceptions in the data layer. Use a `Result` or a custom `Resource` wrapper.

```kotlin
sealed class NetworkResult<out T> {
    data class Success<out T>(val data: T) : NetworkResult<T>()
    data class Error(val exception: Exception) : NetworkResult<Nothing>()
    object Loading : NetworkResult<Nothing>()
}
```

### Flow Integration

Expose network calls as a `Flow` to the ViewModel.

```kotlin
fun getUser(userId: String): Flow<NetworkResult<User>> = flow {
    emit(NetworkResult.Loading)
    try {
        val user = apiService.getUser(userId)
        emit(NetworkResult.Success(user))
    } catch (e: Exception) {
        emit(NetworkResult.Error(e))
    }
}
```

## 4. Caching and Offline Support

- **Repository as Source of Truth**: The UI should only ever observe the local database (Room). The Repository is responsible for syncing the network data into the database.
- **OkHttp Cache**: Use `Cache-Control` headers for simple GET request caching.

## 5. Error Handling & Connectivity

- **Retry Logic**: Implement exponential backoff for transient errors.
- **Connectivity Monitoring**: Use `ConnectivityManager` to observe network changes and notify the user when they are offline.
- **User-Friendly Messages**: Never show raw stack traces or "SocketTimeoutException" to the user. Map them to human-readable strings.

## 6. Best Practices

- **Timeout Configuration**: Set reasonable connection and read timeouts.
- **Logging**: Use `HttpLoggingInterceptor` (OkHttp) or `Logging` feature (Ktor) only in debug builds.
- **Security**: Use HTTPS for all traffic. Sanitize sensitive data in logs.
- **Efficiency**: Use `Gzip` compression if supported by the server.
