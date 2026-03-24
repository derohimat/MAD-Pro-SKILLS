# Industry: Realtime Chat & Messaging

Chat applications must be offline-resilient, handle instant WebSockets, push notifications processing, and efficient local SQLite implementations to avoid redownloading message history.

## 💬 Architecture: Single Source of Truth

The UI must always observe the Local Database (Room). The WebSocket simply writes to the Database, and Room triggers the UI update naturally.

```kotlin
// View -> Flow -> Room
val messages: Flow<List<Message>> = db.messageDao().observeChat(chatId)

// Network -> Room -> Background Service
class ChatWebSocketClient(private val db: AppDatabase) {
    fun onMessageReceived(json: String) {
        val message = parseJson(json)
        // This insert automatically triggers the UI Flow above
        db.messageDao().insert(message) 
    }
}
```

## ⬇️ Handling Outbound Messages

Messages should be displayed locally instantly, even if the connection is dead, marked with a "Pending" or "Clock" icon.

```kotlin
suspend fun sendMessage(text: String, chatId: String) {
    val localId = UUID.randomUUID().toString()
    val msg = Message(id = localId, text = text, status = SENT_STATUS_PENDING)
    
    // 1. Instantly write to DB for UI
    db.messageDao().insert(msg)
    
    // 2. Queue in WorkManager or try WebSocket directly
    val result = webSocket.send(msg)
    
    // 3. Update status on ACK
    if (result.isSuccess) {
        db.messageDao().updateStatus(localId, SENT_STATUS_DELIVERED)
    } else {
        db.messageDao().updateStatus(localId, SENT_STATUS_FAILED)
    }
}
```

## 🎨 UI Execution: Reverse LazyColumn

Chat UIs grow from bottom to top. Use `reverseLayout = true` so the newest message is always correctly positioned.

```kotlin
@Composable
fun ChatList(messages: List<Message>) {
    LazyColumn(
        reverseLayout = true,
        modifier = Modifier.fillMaxSize()
    ) {
        items(messages) { msg ->
            ChatBubble(msg)
        }
    }
}
```
