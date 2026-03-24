# Offline-First Architecture Skills

Offline-first apps remain functional without a network connection, syncing seamlessly when connectivity is restored.

## 1. Single Source of Truth (Room)

The UI always reads from Room. The repository fetches from the network and writes to Room. Never fetch directly from the network in the UI layer.

```kotlin
class ProductRepository @Inject constructor(
    private val productApi: ProductApiService,
    private val productDao: ProductDao
) {
    fun getProducts(): Flow<List<Product>> = productDao.observeAll().map { entities ->
        entities.map { it.toDomainModel() }
    }

    suspend fun syncProducts() {
        val remote = productApi.getProducts()
        productDao.upsertAll(remote.map { it.toEntity() })
    }
}

// ViewModel triggers sync on launch
init {
    viewModelScope.launch {
        repository.syncProducts() // Fire-and-forget; UI observes Room
    }
}
```

## 2. Network-Aware Repository

Only sync when connected; surface a "stale data" indicator if not synced recently.

```kotlin
class NetworkAwareRepository(
    private val repository: ProductRepository,
    private val networkMonitor: NetworkMonitor
) {
    suspend fun syncIfOnline() {
        if (networkMonitor.isOnline()) {
            repository.syncProducts()
        }
    }
}

// NetworkMonitor using ConnectivityManager
class ConnectivityNetworkMonitor @Inject constructor(
    private val connectivityManager: ConnectivityManager
) : NetworkMonitor {
    override fun isOnline(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val caps = connectivityManager.getNetworkCapabilities(network) ?: return false
        return caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    override fun observeIsOnline(): Flow<Boolean> = callbackFlow {
        val callback = object : ConnectivityManager.NetworkCallback() {
            override fun onAvailable(network: Network) { trySend(true) }
            override fun onLost(network: Network) { trySend(false) }
        }
        connectivityManager.registerDefaultNetworkCallback(callback)
        awaitClose { connectivityManager.unregisterNetworkCallback(callback) }
    }
}
```

## 3. Online/Offline Banner in Compose

```kotlin
@Composable
fun OfflineBanner(modifier: Modifier = Modifier) {
    val networkMonitor = hiltViewModel<NetworkViewModel>()
    val isOnline by networkMonitor.isOnline.collectAsStateWithLifecycle()

    AnimatedVisibility(
        visible = !isOnline,
        modifier = modifier,
        enter = slideInVertically() + fadeIn(),
        exit = slideOutVertically() + fadeOut()
    ) {
        Surface(color = MaterialTheme.colorScheme.errorContainer, modifier = Modifier.fillMaxWidth()) {
            Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp), verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.WifiOff, contentDescription = null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
                Text("You're offline. Showing cached data.", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
```

## 4. WorkManager – Background Sync

Queue sync work to execute when connectivity is restored.

```kotlin
class SyncProductsWorker @AssistedInject constructor(
    @Assisted appContext: Context,
    @Assisted workerParams: WorkerParameters,
    private val repository: ProductRepository
) : CoroutineWorker(appContext, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            repository.syncProducts()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) Result.retry() else Result.failure()
        }
    }
}

fun scheduleSyncWork(workManager: WorkManager) {
    val constraints = Constraints.Builder()
        .setRequiredNetworkType(NetworkType.CONNECTED)
        .build()
    val request = PeriodicWorkRequestBuilder<SyncProductsWorker>(15, TimeUnit.MINUTES)
        .setConstraints(constraints)
        .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
        .build()
    workManager.enqueueUniquePeriodicWork("sync_products", ExistingPeriodicWorkPolicy.KEEP, request)
}
```

## 5. Optimistic Create with Local ID

Insert the record locally first with a temporary ID, then replace with the server-assigned ID on success.

```kotlin
suspend fun createPost(content: String): Result<Post> {
    val tempId = "local_${System.currentTimeMillis()}"
    val localPost = Post(id = tempId, content = content, status = PostStatus.PENDING)
    postDao.insert(localPost.toEntity())
    return try {
        val serverPost = postApi.createPost(content)
        postDao.delete(tempId)
        postDao.insert(serverPost.toEntity())
        Result.success(serverPost)
    } catch (e: Exception) {
        postDao.updateStatus(tempId, PostStatus.FAILED)
        Result.failure(e)
    }
}
```

## 6. Conflict Resolution Strategy

```kotlin
// Last-write-wins: use updatedAt timestamp
@Upsert
suspend fun upsert(entity: ProductEntity)

// Server-wins: only insert if entity doesn't exist or server version is newer
suspend fun upsertIfNewer(entity: ProductEntity) {
    val existing = productDao.findById(entity.id)
    if (existing == null || entity.updatedAt > existing.updatedAt) {
        productDao.upsert(entity)
    }
}
```

## Best Practices

- **Cache expiry**: Add a `cachedAt` timestamp to entities. Refresh if data is older than a threshold.
- **User-triggered actions offline**: Queue mutations (add to cart, like, comment) in a local "pending operations" table and sync when online.
- **Error messages**: Surface "Cached data from X minutes ago" rather than confusing error messages.
- **Testing**: Use Robolectric + Room in-memory DB to test your offline-first flows without a device.
