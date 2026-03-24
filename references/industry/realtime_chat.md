# Real-Time Chat App Skills

Chat apps require low-latency messaging, media sharing, typing indicators, and read receipts.

## 1. Message Bubble UI

Distinguish sent and received messages with different alignments and colors.

```kotlin
@Composable
fun MessageBubble(message: ChatMessage, isMe: Boolean) {
    val bubbleColor = if (isMe) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.surfaceVariant
    val textColor = if (isMe) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSurfaceVariant
    val alignment = if (isMe) Arrangement.End else Arrangement.Start
    val shape = if (isMe) {
        RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 4.dp)
    } else {
        RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp)
    }

    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp), horizontalArrangement = alignment) {
        if (!isMe) {
            AsyncImage(model = message.senderAvatar, contentDescription = null, modifier = Modifier.size(28.dp).clip(CircleShape).align(Alignment.Bottom))
            Spacer(Modifier.width(6.dp))
        }
        Column(horizontalAlignment = if (isMe) Alignment.End else Alignment.Start) {
            Box(modifier = Modifier.background(bubbleColor, shape).padding(horizontal = 12.dp, vertical = 8.dp).widthIn(max = 260.dp)) {
                Text(text = message.text, color = textColor)
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(message.formattedTime, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.outline)
                if (isMe) {
                    Spacer(Modifier.width(2.dp))
                    Icon(
                        imageVector = when (message.status) {
                            MessageStatus.SENT -> Icons.Default.Check
                            MessageStatus.DELIVERED -> Icons.Default.DoneAll
                            MessageStatus.READ -> Icons.Default.DoneAll
                        },
                        contentDescription = null,
                        tint = if (message.status == MessageStatus.READ) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                        modifier = Modifier.size(14.dp)
                    )
                }
            }
        }
    }
}
```

## 2. WebSocket Chat with Okhttp

```kotlin
class ChatWebSocketClient(private val url: String, private val token: String) {
    private val client = OkHttpClient.Builder()
        .pingInterval(30, TimeUnit.SECONDS)
        .build()

    private val _messages = MutableSharedFlow<ChatMessage>()
    val messages: SharedFlow<ChatMessage> = _messages

    private var webSocket: WebSocket? = null

    fun connect() {
        val request = Request.Builder().url(url).addHeader("Authorization", "Bearer $token").build()
        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onMessage(webSocket: WebSocket, text: String) {
                val message = Json.decodeFromString<ChatMessage>(text)
                _messages.tryEmit(message)
            }
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: Response?) {
                // Handle reconnection
            }
        })
    }

    fun send(text: String, roomId: String) {
        val payload = Json.encodeToString(SendMessageRequest(roomId = roomId, text = text))
        webSocket?.send(payload)
    }

    fun disconnect() = webSocket?.close(1000, "User left")
}
```

## 3. Typing Indicator

```kotlin
@Composable
fun TypingIndicator(typers: List<String>) {
    AnimatedVisibility(visible = typers.isNotEmpty(), enter = fadeIn() + expandVertically(), exit = fadeOut() + shrinkVertically()) {
        Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
            val infiniteTransition = rememberInfiniteTransition()
            (0..2).forEach { index ->
                val offsetY by infiniteTransition.animateFloat(
                    initialValue = 0f, targetValue = -6f,
                    animationSpec = infiniteRepeatable(tween(400), RepeatMode.Reverse, initialStartOffset = StartOffset(index * 120))
                )
                Box(modifier = Modifier.size(8.dp).offset(y = offsetY.dp).clip(CircleShape).background(MaterialTheme.colorScheme.outline))
                if (index < 2) Spacer(Modifier.width(4.dp))
            }
            Spacer(Modifier.width(8.dp))
            Text(
                text = when (typers.size) {
                    1 -> "${typers[0]} is typing..."
                    2 -> "${typers[0]} and ${typers[1]} are typing..."
                    else -> "${typers.size} people are typing..."
                },
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.outline
            )
        }
    }
}
```

## 4. Chat Input Bar

```kotlin
@Composable
fun ChatInputBar(value: String, onValueChange: (String) -> Unit, onSend: () -> Unit, onAttach: () -> Unit) {
    Surface(shadowElevation = 8.dp) {
        Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.Bottom) {
            IconButton(onClick = onAttach) { Icon(Icons.Default.AttachFile, contentDescription = "Attach") }
            OutlinedTextField(
                value = value,
                onValueChange = onValueChange,
                placeholder = { Text("Message") },
                modifier = Modifier.weight(1f),
                maxLines = 5,
                shape = RoundedCornerShape(24.dp)
            )
            Spacer(Modifier.width(4.dp))
            FilledIconButton(
                onClick = onSend,
                enabled = value.isNotBlank()
            ) {
                Icon(Icons.AutoMirrored.Filled.Send, contentDescription = "Send")
            }
        }
    }
}
```

## 5. Media Message Support

```kotlin
@Composable
fun ImageMessage(imageUrl: String, thumbnailUrl: String, isMe: Boolean, onTap: () -> Unit) {
    val alignment = if (isMe) Arrangement.End else Arrangement.Start
    Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 2.dp), horizontalArrangement = alignment) {
        AsyncImage(
            model = ImageRequest.Builder(LocalContext.current)
                .data(thumbnailUrl)
                .crossfade(true)
                .build(),
            contentDescription = "Image message",
            modifier = Modifier
                .size(200.dp)
                .clip(RoundedCornerShape(12.dp))
                .clickable(onClick = onTap),
            contentScale = ContentScale.Crop
        )
    }
}
```

## 6. Message Persistence with Room

Cache messages locally so the chat is available offline.

```kotlin
@Entity(tableName = "messages", indices = [Index("roomId")])
data class MessageEntity(
    @PrimaryKey val id: String,
    val roomId: String,
    val senderId: String,
    val text: String,
    val sentAt: Long,
    val status: String
)

@Dao
interface MessageDao {
    @Query("SELECT * FROM messages WHERE roomId = :roomId ORDER BY sentAt ASC")
    fun observeMessages(roomId: String): Flow<List<MessageEntity>>

    @Upsert
    suspend fun upsert(message: MessageEntity)
}
```

## Best Practices

- **Optimistic sending**: Display the message immediately (with a "sending" indicator) before the server acknowledges it.
- **Reconnection**: Implement exponential backoff for WebSocket reconnection on failure.
- **Message deduplication**: Use the message ID as a primary key in Room to avoid duplicates.
- **Scroll to bottom**: Auto-scroll to the latest message only if the user was already at the bottom.
- **Encryption**: For sensitive chats, implement end-to-end encryption using the Signal Protocol.
