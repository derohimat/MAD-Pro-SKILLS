# Industry: EdTech & Video Learning

EdTech focuses heavily on video delivery (ExoPlayer), offline downloads, and course progression state.

## 📺 Architecture: Reusable Video Player

Do not leak ExoPlayer instances. Always use standard dispose patterns in Compose.

```kotlin
@OptIn(UnstableApi::class)
@Composable
fun CourseVideoPlayer(videoUrl: String, onVideoComplete: () -> Unit) {
    val context = LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            val mediaItem = MediaItem.fromUri(videoUrl)
            setMediaItem(mediaItem)
            prepare()
            playWhenReady = true
            
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(state: Int) {
                    if (state == Player.STATE_ENDED) onVideoComplete()
                }
            })
        }
    }

    DisposableEffect(Unit) {
        onDispose {
            exoPlayer.release()
        }
    }

    AndroidView(
        factory = { ctx -> PlayerView(ctx).apply { player = exoPlayer } },
        modifier = Modifier.fillMaxWidth().aspectRatio(16/9f)
    )
}
```

## ⬇️ Offline Downloads

Users need to download large video files for offline learning. Use Android's `DownloadManager` or `WorkManager` for reliable execution.

```kotlin
fun startCourseDownload(context: Context, url: String, title: String) {
    val request = DownloadManager.Request(Uri.parse(url))
        .setTitle(title)
        .setDescription("Downloading course video...")
        .setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED)
        .setDestinationInExternalFilesDir(context, Environment.DIRECTORY_MOVIES, "$title.mp4")
        .setAllowedOverMetered(false) // Save user data

    val downloadManager = context.getSystemService(Context.DOWNLOAD_SERVICE) as DownloadManager
    downloadManager.enqueue(request)
}
```

## 📊 Progress Tracking

Track viewing progress locally and batch-upload to the server to prevent spamming analytics endpoints.
