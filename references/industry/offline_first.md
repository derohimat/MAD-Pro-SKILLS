# Skill: Offline-First Architecture

Offline-first apps ensure the user can launch, read, and write data immediately, regardless of network state. The network is treated as a background sync mechanism, not a real-time data provider.

## 💾 Architecture: Single Source of Truth

**Rule**: The UI *only* observes the local database (Room). It never observes the network response directly.

1. **Read**: `UI` observes `UseCase` -> `Repository` -> `Room (Flow)`.
2. **Write**: `UI` calls `Repository.insert()`.
3. **Sync**: `WorkManager` or `Repository` syncs Room up to the Network.

```kotlin
@Dao
interface TaskDao {
    @Query("SELECT * FROM tasks WHERE isCompleted = 0")
    fun observeActiveTasks(): Flow<List<TaskEntity>>
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity)
}
```

## 🔄 Execution: Sync Conflict Resolution

When a user writes offline, you must handle sync conflicts when they reconnect.

- **Client Wins**: If the client edits the file, overwrite the server.
- **Server Wins**: Override local changes.
- **Last Write Wins (LWW)**: Compare timestamps.

```kotlin
data class TaskEntity(
    val id: String,
    val title: String,
    val isCompleted: Boolean,
    val lastUpdatedLocally: Long, // Crucial for LWW conflict resolution
    val syncStatus: SyncStatus    // PENDING, SYNCED, FAILED
)
```

## ⚙️ Background Sync (WorkManager)

Use `WorkManager` to guarantee execution of pending syncs when the network connects, even if the user force-closes the app.

```kotlin
class SyncWorker(appContext: Context, workerParams: WorkerParameters) : CoroutineWorker(appContext, workerParams) {
    override suspend fun doWork(): Result {
        val pendingTasks = taskDao.getTasksByStatus(SyncStatus.PENDING)
        
        return try {
            val response = api.syncTasks(pendingTasks)
            taskDao.markAsSynced(response.syncedIds)
            Result.success()
        } catch (e: Exception) {
            Result.retry() // WorkManager will try again automatically with exponential backoff
        }
    }
}
```
