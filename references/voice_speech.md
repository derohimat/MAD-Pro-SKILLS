# Voice & Speech Skills

Voice features improve accessibility and enable hands-free interaction in navigation, IoT control, note-taking, and customer support apps.

## 1. Speech-to-Text (on-device)

Use Android's built-in `SpeechRecognizer` for real-time transcription without network dependency.

```kotlin
class SpeechToTextManager(private val context: Context) {
    private var recognizer: SpeechRecognizer? = null
    private val _result = MutableStateFlow<SpeechResult>(SpeechResult.Idle)
    val result: StateFlow<SpeechResult> = _result

    sealed class SpeechResult {
        object Idle : SpeechResult()
        object Listening : SpeechResult()
        data class Partial(val text: String) : SpeechResult()
        data class Final(val text: String) : SpeechResult()
        data class Error(val code: Int) : SpeechResult()
    }

    fun start() {
        recognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) { _result.value = SpeechResult.Listening }
                override fun onPartialResults(partialResults: Bundle?) {
                    val partial = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: return
                    _result.value = SpeechResult.Partial(partial)
                }
                override fun onResults(results: Bundle?) {
                    val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull() ?: return
                    _result.value = SpeechResult.Final(text)
                }
                override fun onError(error: Int) { _result.value = SpeechResult.Error(error) }
                override fun onBeginningOfSpeech() {}
                override fun onEndOfSpeech() {}
                override fun onRmsChanged(rmsdB: Float) {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
            })
            startListening(Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
                putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
                putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
                putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault())
            })
        }
    }

    fun stop() { recognizer?.stopListening(); recognizer?.destroy() }
}
```

## 2. Voice Input Compose UI

```kotlin
@Composable
fun VoiceSearchBar(onResult: (String) -> Unit) {
    val manager = remember { SpeechToTextManager(LocalContext.current) }
    val result by manager.result.collectAsStateWithLifecycle()
    val isListening = result is SpeechToTextManager.SpeechResult.Listening || result is SpeechToTextManager.SpeechResult.Partial

    val scale by animateFloatAsState(if (isListening) 1.2f else 1f, animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy))
    val permissionLauncher = rememberLauncherForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) manager.start()
    }

    LaunchedEffect(result) {
        if (result is SpeechToTextManager.SpeechResult.Final) {
            onResult((result as SpeechToTextManager.SpeechResult.Final).text)
        }
    }

    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        Text(
            text = when (result) {
                is SpeechToTextManager.SpeechResult.Partial -> (result as SpeechToTextManager.SpeechResult.Partial).text
                is SpeechToTextManager.SpeechResult.Listening -> "Listening..."
                else -> "Tap mic to speak"
            },
            modifier = Modifier.weight(1f),
            color = if (isListening) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurfaceVariant
        )
        IconButton(
            onClick = { if (isListening) manager.stop() else permissionLauncher.launch(android.Manifest.permission.RECORD_AUDIO) },
            modifier = Modifier.scale(scale)
        ) {
            Icon(
                if (isListening) Icons.Default.MicOff else Icons.Default.Mic,
                contentDescription = "Voice input",
                tint = if (isListening) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
            )
        }
    }
}
```

## 3. Text-to-Speech

```kotlin
class TextToSpeechManager(private val context: Context) {
    private var tts: TextToSpeech? = null
    private var isReady = false

    fun initialize() {
        tts = TextToSpeech(context) { status ->
            isReady = status == TextToSpeech.SUCCESS
            tts?.language = Locale.getDefault()
            tts?.setSpeechRate(1.0f)
            tts?.setPitch(1.0f)
        }
    }

    fun speak(text: String, queueMode: Int = TextToSpeech.QUEUE_FLUSH) {
        if (!isReady) return
        tts?.speak(text, queueMode, null, "utterance_${System.currentTimeMillis()}")
    }

    fun stop() = tts?.stop()
    fun shutdown() = tts?.shutdown()
}

// Compose usage
@Composable
fun ReadAloudButton(text: String) {
    val manager = remember { TextToSpeechManager(LocalContext.current).apply { initialize() } }
    DisposableEffect(Unit) { onDispose { manager.shutdown() } }
    IconButton(onClick = { manager.speak(text) }) {
        Icon(Icons.Default.VolumeUp, contentDescription = "Read aloud")
    }
}
```

## 4. Waveform Visualization

Show a real-time audio waveform while recording.

```kotlin
@Composable
fun AudioWaveform(amplitudes: List<Float>, modifier: Modifier = Modifier) {
    val primary = MaterialTheme.colorScheme.primary
    Canvas(modifier = modifier) {
        val barWidth = size.width / amplitudes.size
        amplitudes.forEachIndexed { index, amplitude ->
            val barHeight = size.height * amplitude.coerceIn(0f, 1f)
            drawRoundRect(
                color = primary,
                topLeft = Offset(index * barWidth, (size.height - barHeight) / 2),
                size = Size(barWidth * 0.7f, barHeight),
                cornerRadius = CornerRadius(2.dp.toPx())
            )
        }
    }
}
```

## 5. Multi-Language Speech

```kotlin
fun getSupportedLocales(): List<Locale> {
    val tts = TextToSpeech(context) {}
    return tts.availableLanguages?.toList() ?: listOf(Locale.getDefault())
}

fun setLanguage(locale: Locale) {
    tts?.language = locale
}
```

## Best Practices

- **Permission**: Always request `RECORD_AUDIO` before using the microphone; explain why.
- **Offline vs online**: The default `SpeechRecognizer` uses Google's cloud; for offline, use Vosk or ML Kit's on-device model.
- **Accessibility**: Provide voice input as an *additional* option, never the *only* option.
- **Noise handling**: Inform the user when the environment is too noisy for reliable recognition.
- **Cancel gracefully**: Always call `stopListening()` when the user navigates away from the screen.
