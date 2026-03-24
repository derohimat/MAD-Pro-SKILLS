# Media Streaming App Skills

Streaming apps require smooth video/audio playback, adaptive bitrate, DRM, playlist management, picture-in-picture, and download-for-offline.

## 1. ExoPlayer / Media3 Setup

```kotlin
// build.gradle.kts
// implementation("androidx.media3:media3-exoplayer:1.5.x")
// implementation("androidx.media3:media3-ui:1.5.x")
// implementation("androidx.media3:media3-exoplayer-dash:1.5.x")
// implementation("androidx.media3:media3-exoplayer-hls:1.5.x")

@Module @InstallIn(SingletonComponent::class)
object MediaModule {
    @Provides @Singleton
    fun provideExoPlayer(@ApplicationContext context: Context): ExoPlayer =
        ExoPlayer.Builder(context)
            .setAudioAttributes(AudioAttributes.Builder().setContentType(C.AUDIO_CONTENT_TYPE_MOVIE).setUsage(C.USAGE_MEDIA).build(), true)
            .setHandleAudioBecomingNoisy(true) // Pause on headphone disconnect
            .build()
}
```

## 2. Compose Video Player

```kotlin
@Composable
fun VideoPlayer(mediaUrl: String, modifier: Modifier = Modifier) {
    val context = LocalContext.current
    val exoPlayer = remember {
        ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(mediaUrl))
            prepare()
            playWhenReady = true
        }
    }
    DisposableEffect(Unit) { onDispose { exoPlayer.release() } }

    Box(modifier = modifier) {
        AndroidView(
            factory = { ctx ->
                PlayerView(ctx).apply {
                    player = exoPlayer
                    useController = true
                    resizeMode = AspectRatioFrameLayout.RESIZE_MODE_FIT
                }
            },
            modifier = Modifier.fillMaxSize()
        )
    }
}
```

## 3. Custom Playback Controls

```kotlin
@Composable
fun CustomPlaybackControls(exoPlayer: ExoPlayer) {
    val playerState by produceState(initialValue = PlayerState.from(exoPlayer)) {
        val listener = object : Player.Listener {
            override fun onIsPlayingChanged(isPlaying: Boolean) { value = PlayerState.from(exoPlayer) }
            override fun onPlaybackStateChanged(state: Int) { value = PlayerState.from(exoPlayer) }
        }
        exoPlayer.addListener(listener)
        awaitDispose { exoPlayer.removeListener(listener) }
    }

    Column {
        // Seekbar
        Slider(
            value = playerState.position.toFloat(),
            onValueChange = { exoPlayer.seekTo(it.toLong()) },
            valueRange = 0f..playerState.duration.toFloat().coerceAtLeast(1f),
            modifier = Modifier.fillMaxWidth()
        )
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly, verticalAlignment = Alignment.CenterVertically) {
            IconButton(onClick = { exoPlayer.seekTo(maxOf(0, exoPlayer.currentPosition - 10_000)) }) { Icon(Icons.Default.Replay10, null) }
            FilledIconButton(onClick = { if (playerState.isPlaying) exoPlayer.pause() else exoPlayer.play() }, modifier = Modifier.size(56.dp)) {
                Icon(if (playerState.isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow, null, modifier = Modifier.size(32.dp))
            }
            IconButton(onClick = { exoPlayer.seekTo(minOf(exoPlayer.duration, exoPlayer.currentPosition + 10_000)) }) { Icon(Icons.Default.Forward10, null) }
        }
        Row(modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(playerState.position.formatDuration(), style = MaterialTheme.typography.bodySmall)
            Text(playerState.duration.formatDuration(), style = MaterialTheme.typography.bodySmall)
        }
    }
}
```

## 4. Picture-in-Picture (PiP)

```kotlin
class VideoActivity : ComponentActivity() {
    override fun onUserLeaveHint() {
        enterPictureInPictureMode(
            PictureInPictureParams.Builder()
                .setAspectRatio(Rational(16, 9))
                .setActions(listOf(
                    RemoteAction(Icon.createWithResource(this, R.drawable.ic_pause), "Pause", "Pause", PendingIntent.getBroadcast(this, 0, Intent("ACTION_PAUSE"), PendingIntent.FLAG_IMMUTABLE))
                ))
                .build()
        )
    }

    override fun onPictureInPictureModeChanged(isInPictureInPictureMode: Boolean, newConfig: Configuration) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode, newConfig)
        // Hide/show custom controls based on PiP mode
    }
}
```

## 5. HLS / DASH Adaptive Streaming

```kotlin
fun buildAdaptiveMediaItem(url: String): MediaItem {
    return MediaItem.Builder()
        .setUri(url)
        .setMimeType(when {
            url.contains(".m3u8") -> MimeTypes.APPLICATION_M3U8
            url.contains(".mpd") -> MimeTypes.APPLICATION_MPD
            else -> MimeTypes.VIDEO_MP4
        })
        .build()
}

// Quality selector
@Composable
fun QualitySelector(tracks: Tracks, onTrackSelected: (TrackGroup, Int) -> Unit) {
    val videoTracks = tracks.groups.filter { it.type == C.TRACK_TYPE_VIDEO }
    ModalBottomSheet(onDismissRequest = {}) {
        Column {
            Text("Video Quality", modifier = Modifier.padding(16.dp), fontWeight = FontWeight.Bold)
            ListItem(headlineContent = { Text("Auto") }, leadingContent = { Icon(Icons.Default.AutoMode, null) }, modifier = Modifier.clickable { /* set auto */ })
            videoTracks.forEach { group ->
                (0 until group.length).forEach { index ->
                    val format = group.getTrackFormat(index)
                    ListItem(headlineContent = { Text("${format.height}p") }, supportingContent = { Text("${format.bitrate / 1000}kbps") }, modifier = Modifier.clickable { onTrackSelected(group.mediaTrackGroup, index) })
                }
            }
        }
    }
}
```

## 6. DRM Widevine Protection

```kotlin
fun buildProtectedMediaItem(videoUrl: String, licenseUrl: String, token: String): MediaItem {
    return MediaItem.Builder()
        .setUri(videoUrl)
        .setDrmConfiguration(
            MediaItem.DrmConfiguration.Builder(C.WIDEVINE_UUID)
                .setLicenseUri(licenseUrl)
                .setLicenseRequestHeaders(mapOf("Authorization" to "Bearer $token"))
                .build()
        )
        .build()
}
```

## 7. Download for Offline

```kotlin
class DownloadManager @Inject constructor(@ApplicationContext private val context: Context) {
    private val downloadManager = DownloadManager(context, DatabaseProvider(context), CacheDataSource.Factory())

    fun downloadContent(mediaItem: MediaItem, quality: String = "720p") {
        val request = DownloadRequest.Builder(mediaItem.mediaId, mediaItem.localConfiguration!!.uri)
            .setMimeType(MimeTypes.VIDEO_MP4)
            .setData(quality.toByteArray())
            .build()
        DownloadService.sendAddDownload(context, VideoDownloadService::class.java, request, false)
    }

    fun removeDownload(mediaId: String) = DownloadService.sendRemoveDownload(context, VideoDownloadService::class.java, mediaId, false)
    fun getDownloads(): List<Download> = downloadManager.downloadIndex.getDownloads().use { cursor -> buildList { while (cursor.moveToNext()) add(cursor.download) } }
}
```

## Best Practices

- **Buffering feedback**: Show a `CircularProgressIndicator` when `playbackState == Player.STATE_BUFFERING`.
- **Orientation**: Switch to full landscape automatically on full-screen; return to portrait on exit.
- **Lock screen controls**: Register a `MediaSession` to show playback controls on the lock screen and media notification.
- **Subtitle support**: Add `SubtitleConfiguration` to `MediaItem` for multi-language caption tracks.
- **Content resumption**: Save the last playback position in Room and resume from that position on reopen.
