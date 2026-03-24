# Gemini API Integration Skills

Integrate Google's Gemini API for text, vision, and multimodal AI features in your Android app.

## 1. SDK Setup

```kotlin
// build.gradle.kts
// implementation("com.google.ai.client.generativeai:generativeai:0.9.0")

// ViewModel
@HiltViewModel
class GeminiViewModel @Inject constructor(
    private val generativeModel: GenerativeModel
) : ViewModel() {

    // Inject via Hilt module:
    // @Provides @Singleton
    // fun provideGeminiModel() = GenerativeModel(
    //     modelName = "gemini-1.5-flash",
    //     apiKey = BuildConfig.GEMINI_API_KEY
    // )
}
```

## 2. Text Generation

```kotlin
private val _uiState = MutableStateFlow<GeminiUiState>(GeminiUiState.Idle)
val uiState: StateFlow<GeminiUiState> = _uiState

fun generateText(prompt: String) = viewModelScope.launch {
    _uiState.value = GeminiUiState.Loading
    try {
        val response = generativeModel.generateContent(prompt)
        _uiState.value = GeminiUiState.Success(response.text ?: "No response")
    } catch (e: Exception) {
        _uiState.value = GeminiUiState.Error(e.message ?: "Unknown error")
    }
}

sealed class GeminiUiState {
    object Idle : GeminiUiState()
    object Loading : GeminiUiState()
    data class Success(val text: String) : GeminiUiState()
    data class Streaming(val text: String) : GeminiUiState()
    data class Error(val message: String) : GeminiUiState()
}
```

## 3. Streaming Text Response

Stream tokens as they are generated for a real-time, typewriter-style effect.

```kotlin
fun streamText(prompt: String) = viewModelScope.launch {
    _uiState.value = GeminiUiState.Streaming("")
    val responseFlow = generativeModel.generateContentStream(prompt)
    responseFlow.collect { chunk ->
        val currentText = (_uiState.value as? GeminiUiState.Streaming)?.text ?: ""
        _uiState.value = GeminiUiState.Streaming(currentText + (chunk.text ?: ""))
    }
    val finalText = (_uiState.value as? GeminiUiState.Streaming)?.text ?: ""
    _uiState.value = GeminiUiState.Success(finalText)
}
```

## 4. Vision — Image Understanding

Send an image with a prompt for analysis (product recognition, document scanning, meal logging).

```kotlin
fun analyzeImage(bitmap: Bitmap, prompt: String) = viewModelScope.launch {
    _uiState.value = GeminiUiState.Loading
    try {
        val imagePart = content {
            image(bitmap)
            text(prompt)
        }
        val response = generativeModel.generateContent(imagePart)
        _uiState.value = GeminiUiState.Success(response.text ?: "")
    } catch (e: Exception) {
        _uiState.value = GeminiUiState.Error(e.message ?: "")
    }
}

// Example use-cases:
// analyzeImage(foodPhoto, "What is this food and estimate its calories?")
// analyzeImage(documentPhoto, "Extract all text from this document.")
// analyzeImage(skinPhoto, "Describe what you see. Do not provide medical advice.")
```

## 5. Multi-Turn Chat

Maintain conversation context with `ChatSession`.

```kotlin
private val chat = generativeModel.startChat(history = emptyList())
private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
val messages: StateFlow<List<ChatMessage>> = _messages

fun sendMessage(userMessage: String) = viewModelScope.launch {
    _messages.update { it + ChatMessage(role = "user", text = userMessage) }
    try {
        val response = chat.sendMessage(userMessage)
        val replyText = response.text ?: ""
        _messages.update { it + ChatMessage(role = "model", text = replyText) }
    } catch (e: Exception) {
        _messages.update { it + ChatMessage(role = "error", text = e.message ?: "") }
    }
}
```

## 6. Chat UI

```kotlin
@Composable
fun GeminiChatScreen(viewModel: GeminiViewModel = hiltViewModel()) {
    val messages by viewModel.messages.collectAsStateWithLifecycle()
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    var input by remember { mutableStateOf("") }
    val listState = rememberLazyListState()

    LaunchedEffect(messages.size) { if (messages.isNotEmpty()) listState.animateScrollToItem(messages.lastIndex) }

    Scaffold(
        bottomBar = {
            Row(modifier = Modifier.fillMaxWidth().padding(8.dp), verticalAlignment = Alignment.Bottom) {
                OutlinedTextField(value = input, onValueChange = { input = it }, modifier = Modifier.weight(1f), placeholder = { Text("Ask Gemini...") }, maxLines = 4)
                Spacer(Modifier.width(8.dp))
                FilledIconButton(onClick = { viewModel.sendMessage(input); input = "" }, enabled = input.isNotBlank() && uiState !is GeminiUiState.Loading) {
                    Icon(Icons.AutoMirrored.Filled.Send, null)
                }
            }
        }
    ) { padding ->
        LazyColumn(state = listState, contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(padding)) {
            items(messages) { ChatBubble(it) }
            if (uiState is GeminiUiState.Loading) item { ThinkingIndicator() }
        }
    }
}
```

## 7. Function Calling (Tool Use)

Let Gemini trigger structured functions in your app.

```kotlin
val getOrderStatusTool = defineFunction(
    name = "get_order_status",
    description = "Returns the current status of an order",
    Schema.str("order_id", "The unique order identifier")
) { orderId ->
    val status = orderRepository.getStatus(orderId)
    content { text("Order $orderId is ${status.displayName}") }
}

val model = GenerativeModel(
    modelName = "gemini-1.5-flash",
    apiKey = BuildConfig.GEMINI_API_KEY,
    tools = listOf(Tool(listOf(getOrderStatusTool)))
)
```

## Best Practices

- **API key security**: Never hardcode your API key. Store it in `local.properties` and inject via `BuildConfig`. Use a backend proxy for production.
- **Rate limiting**: Add debounce to user input to avoid excessive API calls.
- **Content filtering**: Gemini has built-in safety filters. Handle `HARM_CATEGORY_*` blocks gracefully in the UI.
- **Cost management**: Use `gemini-1.5-flash` for latency-sensitive tasks; `gemini-1.5-pro` for accuracy-critical ones.
- **Prompt engineering**: System instructions can be injected via `GenerativeModel(systemInstruction = content { text("...") })`.
