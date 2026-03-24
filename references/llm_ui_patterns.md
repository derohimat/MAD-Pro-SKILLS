# LLM UI Patterns

Best practices for building AI chat and streaming text UIs in Compose — covering response rendering, thinking states, and conversation management.

## 1. Streaming Text with Typewriter Effect

Render streamed tokens progressively so the UI feels alive.

```kotlin
@Composable
fun StreamingTextBubble(text: String, isComplete: Boolean) {
    var displayedText by remember { mutableStateOf("") }
    LaunchedEffect(text) { displayedText = text } // Update directly since Gemini SDK gives cumulative text

    Box(modifier = Modifier.background(MaterialTheme.colorScheme.surfaceVariant, RoundedCornerShape(topStart = 4.dp, topEnd = 16.dp, bottomStart = 16.dp, bottomEnd = 16.dp)).padding(12.dp)) {
        Row {
            Text(text = displayedText, style = MaterialTheme.typography.bodyMedium)
            if (!isComplete) {
                // Blinking cursor
                val alpha by rememberInfiniteTransition(label = "cursor").animateFloat(
                    initialValue = 1f, targetValue = 0f,
                    animationSpec = infiniteRepeatable(tween(500), RepeatMode.Reverse), label = "alpha"
                )
                Text("▍", color = MaterialTheme.colorScheme.primary.copy(alpha = alpha), modifier = Modifier.padding(start = 2.dp))
            }
        }
    }
}
```

## 2. Thinking / Loading Indicator

Show a meaningful loading state while waiting for the first token.

```kotlin
@Composable
fun ThinkingIndicator() {
    val infiniteTransition = rememberInfiniteTransition(label = "thinking")
    Row(modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        AsyncImage(model = R.drawable.ic_gemini, contentDescription = "AI", modifier = Modifier.size(24.dp).clip(CircleShape))
        Spacer(Modifier.width(8.dp))
        (0..2).forEach { index ->
            val offsetY by infiniteTransition.animateFloat(
                initialValue = 0f, targetValue = -6f,
                animationSpec = infiniteRepeatable(tween(400), RepeatMode.Reverse, StartOffset(index * 130)),
                label = "dot_$index"
            )
            Box(modifier = Modifier.size(6.dp).offset(y = offsetY.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary))
            if (index < 2) Spacer(Modifier.width(4.dp))
        }
    }
}
```

## 3. Markdown Rendering

LLM responses often contain Markdown. Use a library like `Compose Markdown` to render it.

```kotlin
// implementation("com.github.jeziellago:compose-markdown:0.5.x")
@Composable
fun MarkdownResponse(markdown: String) {
    Markdown(
        content = markdown,
        modifier = Modifier.fillMaxWidth(),
        colors = markdownColor(
            text = MaterialTheme.colorScheme.onSurface,
            codeBackground = MaterialTheme.colorScheme.surfaceVariant,
            inlineCodeBackground = MaterialTheme.colorScheme.secondaryContainer
        )
    )
}
```

## 4. Conversation List UI

```kotlin
@Composable
fun ConversationScreen(viewModel: LlmViewModel = hiltViewModel()) {
    val messages by viewModel.messages.collectAsStateWithLifecycle()
    val isGenerating by viewModel.isGenerating.collectAsStateWithLifecycle()
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size, isGenerating) {
        if (messages.isNotEmpty()) listState.animateScrollToItem(messages.size - 1)
    }

    LazyColumn(state = listState, contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(messages, key = { it.id }) { message ->
            when (message.role) {
                "user" -> UserMessageBubble(message.text)
                "model" -> ModelMessageBubble(text = message.text, isStreaming = isGenerating && message == messages.last())
                "error" -> ErrorBubble(message.text, onRetry = viewModel::retry)
            }
        }
        if (isGenerating && (messages.isEmpty() || messages.last().role == "user")) {
            item { ThinkingIndicator() }
        }
    }
}
```

## 5. Prompt Suggestions

Show quick-action chips to help users start conversations.

```kotlin
@Composable
fun PromptSuggestions(suggestions: List<String>, onSelect: (String) -> Unit) {
    LazyRow(contentPadding = PaddingValues(horizontal = 16.dp), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        items(suggestions) { suggestion ->
            SuggestionChip(onClick = { onSelect(suggestion) }, label = { Text(suggestion, maxLines = 1) })
        }
    }
}
```

## 6. Stop Generation Button

Allow the user to cancel a streaming response mid-way.

```kotlin
private var generationJob: Job? = null

fun sendMessage(prompt: String) {
    generationJob = viewModelScope.launch {
        // ... start streaming ...
    }
}

fun stopGeneration() {
    generationJob?.cancel()
    _isGenerating.value = false
}

// In UI
if (isGenerating) {
    OutlinedButton(onClick = viewModel::stopGeneration, modifier = Modifier.fillMaxWidth()) {
        Icon(Icons.Default.Stop, null)
        Spacer(Modifier.width(4.dp))
        Text("Stop generating")
    }
}
```

## 7. Conversation History Management

```kotlin
data class Conversation(val id: String, val title: String, val createdAt: Long, val messageCount: Int)

@Composable
fun ConversationHistorySheet(conversations: List<Conversation>, onSelect: (String) -> Unit, onDelete: (String) -> Unit) {
    ModalBottomSheet(onDismissRequest = {}) {
        LazyColumn {
            item { Text("Previous Conversations", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, modifier = Modifier.padding(16.dp)) }
            items(conversations, key = { it.id }) { conversation ->
                ListItem(
                    headlineContent = { Text(conversation.title) },
                    supportingContent = { Text("${conversation.messageCount} messages · ${conversation.relativeTime}") },
                    modifier = Modifier.clickable { onSelect(conversation.id) },
                    trailingContent = {
                        IconButton(onClick = { onDelete(conversation.id) }) { Icon(Icons.Default.Delete, null, tint = MaterialTheme.colorScheme.error) }
                    }
                )
            }
        }
    }
}
```

## Best Practices

- **Scroll behavior**: Auto-scroll to bottom only when the user is already at the bottom, not if they scrolled up to read.
- **Copy button**: Add a "Copy response" button to each AI message for usability.
- **Error recovery**: On API errors, show a retry button inline with the failed message.
- **Context window**: Warn users when the conversation is getting long (context limit approaching).
- **System prompt transparency**: Consider showing users what system prompt is being used to build trust.
