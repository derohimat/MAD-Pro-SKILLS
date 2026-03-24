# Skill: Real-Time Sync & WebSockets

When building features like live collaboration, trading dashboards, or chat, standard HTTP polling wastes battery and data. Use WebSockets (via OkHttp) or Server-Sent Events (SSE).

## ⚡ Architecture: OkHttp WebSocket

Wrap the OkHttp `WebSocketListener` in a Kotlin `callbackFlow` to consume events cleanly in Compose without callback hell.

```kotlin
class LiveSyncClient(private val client: OkHttpClient) {
    
    fun connect(url: String): Flow<SyncEvent> = callbackFlow {
        val request = Request.Builder().url(url).build()
        
        val webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                // Parse your JSON into a Domain Event
                val event = parseSyncEvent(text)
                trySend(event)
            }

            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                close(t) // Propagate error upstream
            }
            
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                close()
            }
        })

        // On flow cancellation, close the socket
        awaitClose { webSocket.close(1000, "User left screen") }
    }
}
```

## 🔄 Automatic Reconnection

Network drops happen. Use Flow's `retryWhen` operator to handle reconnections automatically with exponential backoff.

```kotlin
val safeSyncFlow = liveSyncClient.connect("wss://api.example.com/sync")
    .retryWhen { cause, attempt ->
        if (cause is IOException && attempt < 5) {
            delay(1000L * attempt) // 1s, 2s, 3s...
            true
        } else false
    }
```
