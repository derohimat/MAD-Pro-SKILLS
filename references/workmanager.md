# WorkManager & Background Tasks

WorkManager is the recommended solution for persistent, deferrable background work that needs to be guaranteed to run.

## 1. Core Concepts

- **Worker**: Where you define the actual work to be performed.
- **WorkRequest**: Defines how and when the work should be run (Constraints, Backoff policy).
- **WorkManager**: Executes the `WorkRequest` and manages system resources.

## 2. Defining a Worker

```kotlin
class UploadWorker(
    appContext: Context,
    workerParams: WorkerParameters
): CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            // Perform background sync or upload
            uploadData()
            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
```

## 3. Constraints & Triggers

Constraints ensure that work only runs when certain conditions are met:

```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.UNMETERED) // Only on Wi-Fi
    .setRequiresBatteryNotLow(true)
    .setRequiresCharging(true)
    .build()

val uploadWorkRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setConstraints(constraints)
    .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 10, TimeUnit.MINUTES)
    .build()

WorkManager.getInstance(context).enqueue(uploadWorkRequest)
```

## 4. Best Practices

- **Use CoroutineWorker**: For idiomatic Kotlin integration.
- **Respect Constraints**: Avoid draining the user's battery or using expensive data.
- **Avoid Long Running Work**: For immediate or very long foreground-like tasks, use `setForeground()`.
- **Periodic Work**: Use `PeriodicWorkRequest` for recurring tasks (minimum interval is 15 minutes).
