# Real-Time Data Sync Skills

Real-time sync is essential for chat, ride-hailing, collaborative tools, and live dashboards.

## 1. WebSocket with OkHttp

Establish a persistent WebSocket connection with automatic reconnection.

```kotlin
class RealTimeSyncManager(private val config: SyncConfig) {
    private val _events = MutableSharedFlow<SyncEvent>(extraBufferCapacity = 64)
    val events: SharedFlow<SyncEvent> = _events
    private var webSocket: WebSocket? = null
    private var reconnectJob: Job? = null

    fun connect(scope: CoroutineScope) {
        val request = Request.Builder().url(config.webSocketUrl)
            .addHeader("Authorization", "Bearer ${config.token}").build()
        webSocket = config.client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                val event = Json.decodeFromString<SyncEvent>(text)
                _events.tryEmit(event)
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                scheduleReconnect(scope)
            }
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                if (code != 1000) scheduleReconnect(scope)
            }
        })
    }

    private fun scheduleReconnect(scope: CoroutineScope) {
        reconnectJob?.cancel()
        reconnectJob = scope.launch {
            var delay = 1_000L
            repeat(5) {
                delay(delay)
                connect(scope)
                delay = minOf(delay * 2, 30_000L) // Exponential backoff
            }
        }
    }

    fun disconnect() { webSocket?.close(1000, "User disconnected") }
}
```

## 2. Firebase Realtime Database

Use Firebase RTDB for low-latency, high-frequency updates like driver location or live scores.

```kotlin
fun <T : Any> observeFirebaseNode(path: String, clazz: KClass<T>): Flow<T?> = callbackFlow {
    val ref = FirebaseDatabase.getInstance().getReference(path)
    val listener = ref.addValueEventListener(object : ValueEventListener {
        override fun onDataChange(snapshot: DataSnapshot) {
            trySend(snapshot.getValue(clazz.java))
        }
        override fun onCancelled(error: DatabaseError) {
            close(error.toException())
        }
    })
    awaitClose { ref.removeEventListener(listener) }
}
```

## 3. Server-Sent Events (SSE)

Use SSE for server-to-client streaming when bidirectional communication is not needed.

```kotlin
fun observeOrderUpdates(orderId: String): Flow<OrderUpdate> = flow {
    val client = OkHttpClient.Builder().readTimeout(0, TimeUnit.SECONDS).build()
    val request = Request.Builder().url("$BASE_URL/orders/$orderId/events").build()
    val response = client.newCall(request).execute()
    val source = response.body?.source() ?: return@flow
    while (true) {
        val line = source.readUtf8Line() ?: break
        if (line.startsWith("data:")) {
            val data = line.removePrefix("data:").trim()
            emit(Json.decodeFromString<OrderUpdate>(data))
        }
    }
}
```

## 4. Optimistic UI Updates

Update the UI immediately and revert on failure.

```kotlin
fun toggleLike(postId: String) = viewModelScope.launch {
    // Optimistic update
    _uiState.update { state ->
        state.copy(posts = state.posts.map {
            if (it.id == postId) it.copy(isLikedByMe = !it.isLikedByMe, likeCount = if (it.isLikedByMe) it.likeCount - 1 else it.likeCount + 1) else it
        })
    }
    // Sync with server (revert on failure)
    val result = postRepository.toggleLike(postId)
    if (result.isFailure) {
        _uiState.update { state ->
            state.copy(posts = state.posts.map {
                if (it.id == postId) it.copy(isLikedByMe = !it.isLikedByMe, likeCount = if (it.isLikedByMe) it.likeCount - 1 else it.likeCount + 1) else it
            })
        }
    }
}
```

## 5. Connection State Banner

Show a connectivity banner when real-time sync is unavailable.

```kotlin
@Composable
fun ConnectionStateBanner(isConnected: Boolean) {
    AnimatedVisibility(
        visible = !isConnected,
        enter = slideInVertically(initialOffsetY = { -it }),
        exit = slideOutVertically(targetOffsetY = { -it })
    ) {
        Surface(color = MaterialTheme.colorScheme.errorContainer) {
            Row(modifier = Modifier.fillMaxWidth().padding(8.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.WifiOff, null, modifier = Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Reconnecting...", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
```

## Best Practices

- **Heartbeat / Ping**: Send periodic pings to keep the connection alive through proxies.
- **Message queue**: Queue outgoing messages while offline and flush on reconnect.
- **Idempotent events**: Design event handlers to be safe if the same event arrives twice.
- **Conflict resolution**: Use a "last-write-wins" or vector clock strategy for concurrent edits.
