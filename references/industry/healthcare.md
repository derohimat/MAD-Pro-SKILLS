# Industry: Healthcare & Telemedicine

Healthcare applications handle extreme compliance requirements (HIPAA execution) and often support high-quality Video RTC.

## 🔒 Security: HIPAA Compliance Patterns

1. **No Caching PI/PHI**: Never store Protected Health Information in plain text inside `SharedPreferences` or `Room`.
2. **Encrypted Storage**: Only use Android's `EncryptedSharedPreferences` and SQLCipher for Room DB.
3. **In-Memory Scrubbing**: Clear sensitive view models immediately after the user leaves the screen.
4. **Screenshot Prevention**: Block OS screenshots on screens showing medical records.

```kotlin
// Prevent screenshots in Compose via the Activity Window
DisposableEffect(Unit) {
    val window = (context as Activity).window
    window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
    onDispose {
        window.clearFlags(WindowManager.LayoutParams.FLAG_SECURE)
    }
}
```

## 🎥 UI Execution: Telemedicine WebRTC

For live doctor consultations, WebRTC is standard. Manage the complex WebRTC connection state outside of Compose, and only pass the SurfaceView renderer.

```kotlin
@Composable
fun VideoCallScreen(
    localVideoTrack: VideoTrack?,
    remoteVideoTrack: VideoTrack?
) {
    Box(modifier = Modifier.fillMaxSize()) {
        // Full screen remote video
        remoteVideoTrack?.let { track ->
            AndroidView(factory = { ctx -> 
                SurfaceViewRenderer(ctx).apply { 
                    track.addSink(this) 
                } 
            }, modifier = Modifier.fillMaxSize())
        }
        
        // PIP local video
        localVideoTrack?.let { track ->
            AndroidView(factory = { ctx -> 
                SurfaceViewRenderer(ctx).apply { 
                    track.addSink(this) 
                } 
            }, modifier = Modifier
                .size(120.dp, 160.dp)
                .align(Alignment.TopEnd)
                .padding(16.dp)
                .clip(RoundedCornerShape(12.dp))
            )
        }
    }
}
```
