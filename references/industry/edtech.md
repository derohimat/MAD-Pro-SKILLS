# EdTech App Skills

EdTech apps focus on content delivery, learner progress, interactive quizzes, and engagement mechanics.

## 1. Course Catalog

```kotlin
@Composable
fun CourseCatalogScreen(viewModel: CourseViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        items(state.courses, key = { it.id }) { course ->
            CourseCard(course = course, onEnroll = viewModel::enroll)
        }
    }
}

@Composable
fun CourseCard(course: Course, onEnroll: (String) -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column {
            AsyncImage(model = course.thumbnailUrl, contentDescription = course.title, modifier = Modifier.fillMaxWidth().height(140.dp), contentScale = ContentScale.Crop)
            Column(modifier = Modifier.padding(12.dp)) {
                Text(course.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text("${course.instructor} · ${course.totalLessons} lessons · ${course.duration}", style = MaterialTheme.typography.bodySmall)
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    LinearProgressIndicator(progress = { course.progressFraction }, modifier = Modifier.weight(1f))
                    Spacer(Modifier.width(8.dp))
                    Text("${(course.progressFraction * 100).toInt()}%", style = MaterialTheme.typography.labelSmall)
                }
                Spacer(Modifier.height(8.dp))
                Button(onClick = { onEnroll(course.id) }, modifier = Modifier.fillMaxWidth()) {
                    Text(if (course.isEnrolled) "Continue" else "Enroll Now")
                }
            }
        }
    }
}
```

## 2. Video Player with Chapters

Use ExoPlayer via `AndroidView` for robust media playback.

```kotlin
@Composable
fun LessonVideoPlayer(videoUrl: String, onProgress: (Long) -> Unit) {
    val context = LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(videoUrl))
            prepare()
        }
    }
    DisposableEffect(Unit) { onDispose { exoPlayer.release() } }
    AndroidView(
        factory = { PlayerView(it).apply { player = exoPlayer } },
        modifier = Modifier.fillMaxWidth().aspectRatio(16f / 9f)
    )
}

@Composable
fun ChapterList(chapters: List<Chapter>, currentChapterId: String, onSelect: (Chapter) -> Unit) {
    LazyColumn {
        items(chapters) { chapter ->
            ListItem(
                headlineContent = { Text(chapter.title) },
                supportingContent = { Text(chapter.duration) },
                leadingContent = {
                    if (chapter.isCompleted) Icon(Icons.Default.CheckCircle, null, tint = Color(0xFF4CAF50))
                    else if (chapter.id == currentChapterId) Icon(Icons.Default.PlayCircle, null, tint = MaterialTheme.colorScheme.primary)
                    else Icon(Icons.Default.PlayCircleOutline, null)
                },
                modifier = Modifier.clickable { onSelect(chapter) }
            )
        }
    }
}
```

## 3. Quiz Engine

```kotlin
data class QuizUiState(
    val question: Question,
    val selectedOption: Int? = null,
    val isAnswered: Boolean = false,
    val questionIndex: Int = 0,
    val totalQuestions: Int = 0
)

@Composable
fun QuizScreen(state: QuizUiState, onSelect: (Int) -> Unit, onNext: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        LinearProgressIndicator(
            progress = { (state.questionIndex + 1f) / state.totalQuestions },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(24.dp))
        Text("${state.questionIndex + 1}/${state.totalQuestions}", style = MaterialTheme.typography.labelMedium)
        Spacer(Modifier.height(8.dp))
        Text(state.question.text, style = MaterialTheme.typography.titleLarge)
        Spacer(Modifier.height(24.dp))
        state.question.options.forEachIndexed { index, option ->
            val color = when {
                !state.isAnswered -> if (state.selectedOption == index) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                index == state.question.correctIndex -> Color(0xFF4CAF50).copy(alpha = 0.2f)
                state.selectedOption == index -> Color(0xFFF44336).copy(alpha = 0.2f)
                else -> MaterialTheme.colorScheme.surfaceVariant
            }
            Card(
                modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp).clickable(enabled = !state.isAnswered) { onSelect(index) },
                colors = CardDefaults.cardColors(containerColor = color)
            ) {
                Text(option, modifier = Modifier.padding(16.dp))
            }
        }
        if (state.isAnswered) {
            Spacer(Modifier.weight(1f))
            Button(onClick = onNext, modifier = Modifier.fillMaxWidth()) {
                Text("Next Question")
            }
        }
    }
}
```

## 4. Progress Tracking & Streaks

```kotlin
@Composable
fun LearningStreakCard(streak: LearningStreak) {
    Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("🔥", style = MaterialTheme.typography.displaySmall)
            Spacer(Modifier.width(12.dp))
            Column {
                Text("${streak.currentDays}-day streak!", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text("Keep it up! You've learned for ${streak.totalMinutes} minutes total.", style = MaterialTheme.typography.bodySmall)
            }
        }
    }
}
```

## 5. Certificate Generation

On course completion, generate a PDF certificate and allow sharing.

```kotlin
fun generateCertificate(context: Context, userName: String, courseName: String, date: String): Uri {
    val pdfDocument = PdfDocument()
    val pageInfo = PdfDocument.PageInfo.Builder(595, 842, 1).create()
    val page = pdfDocument.startPage(pageInfo)
    val canvas = page.canvas
    // Draw certificate content with canvas API
    canvas.drawText("Certificate of Completion", 297f, 200f, Paint().apply { textSize = 24f; textAlign = Paint.Align.CENTER })
    canvas.drawText(userName, 297f, 350f, Paint().apply { textSize = 36f; textAlign = Paint.Align.CENTER; isFakeBoldText = true })
    canvas.drawText(courseName, 297f, 420f, Paint().apply { textSize = 18f; textAlign = Paint.Align.CENTER })
    pdfDocument.finishPage(page)
    val file = File(context.filesDir, "certificate_$courseName.pdf")
    pdfDocument.writeTo(file.outputStream())
    pdfDocument.close()
    return FileProvider.getUriForFile(context, "${context.packageName}.provider", file)
}
```

## Best Practices

- **Offline video**: Download lessons for offline playback using `DownloadManager` or ExoPlayer's `DownloadService`.
- **Playback speed**: Allow users to adjust video speed (0.75x, 1x, 1.25x, 1.5x, 2x).
- **Save progress**: Save playback position every 5 seconds so users can resume where they left off.
- **Gamification**: Use XP points, badges, and leaderboards to drive engagement.
