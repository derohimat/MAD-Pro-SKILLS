# Camera & Media Skills

CameraX provides a consistent, lifecycle-aware camera API. Combined with the Media3/ExoPlayer stack, it covers most rich media use cases.

## 1. CameraX Preview in Compose

```kotlin
@Composable
fun CameraPreviewScreen() {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    var camera by remember { mutableStateOf<Camera?>(null) }

    val previewUseCase = remember { Preview.Builder().build() }
    val imageCaptureUseCase = remember { ImageCapture.Builder().setCaptureMode(ImageCapture.CAPTURE_MODE_MINIMIZE_LATENCY).build() }

    Box(modifier = Modifier.fillMaxSize()) {
        AndroidView(
            modifier = Modifier.fillMaxSize(),
            factory = { ctx ->
                val previewView = PreviewView(ctx)
                val executor = ContextCompat.getMainExecutor(ctx)
                ProcessCameraProvider.getInstance(ctx).also { future ->
                    future.addListener({
                        val cameraProvider = future.get()
                        cameraProvider.unbindAll()
                        camera = cameraProvider.bindToLifecycle(
                            lifecycleOwner,
                            CameraSelector.DEFAULT_BACK_CAMERA,
                            previewUseCase,
                            imageCaptureUseCase
                        )
                        previewUseCase.setSurfaceProvider(previewView.surfaceProvider)
                    }, executor)
                }
                previewView
            }
        )
        CameraControls(
            modifier = Modifier.align(Alignment.BottomCenter).padding(32.dp),
            onCapture = { imageCaptureUseCase.takePicture(context) },
            onFlipCamera = { /* switch camera selector */ }
        )
    }
}
```

## 2. Capturing a Photo

```kotlin
fun ImageCapture.takePicture(context: Context, onImageSaved: (Uri) -> Unit = {}, onError: (Exception) -> Unit = {}) {
    val outputFile = File(context.cacheDir, "capture_${System.currentTimeMillis()}.jpg")
    val outputOptions = ImageCapture.OutputFileOptions.Builder(outputFile).build()
    takePicture(
        outputOptions,
        ContextCompat.getMainExecutor(context),
        object : ImageCapture.OnImageSavedCallback {
            override fun onImageSaved(outputFileResults: ImageCapture.OutputFileResults) {
                onImageSaved(outputFileResults.savedUri ?: outputFile.toUri())
            }
            override fun onError(exception: ImageCaptureException) = onError(exception)
        }
    )
}
```

## 3. Video Recording with CameraX

```kotlin
class VideoRecorder(private val context: Context, private val lifecycleOwner: LifecycleOwner) {
    private val recorder = Recorder.Builder().setQualitySelector(QualitySelector.from(Quality.HD)).build()
    val videoCapture = VideoCapture.withOutput(recorder)
    private var activeRecording: Recording? = null

    fun startRecording(onVideoSaved: (Uri) -> Unit) {
        val outputFile = File(context.cacheDir, "video_${System.currentTimeMillis()}.mp4")
        activeRecording = recorder.prepareRecording(context, FileOutputOptions.Builder(outputFile).build())
            .withAudioEnabled()
            .start(ContextCompat.getMainExecutor(context)) { event ->
                if (event is VideoRecordEvent.Finalize && !event.hasError()) {
                    onVideoSaved(event.outputResults.outputUri)
                }
            }
    }

    fun stopRecording() = activeRecording?.stop()
    fun pauseRecording() = activeRecording?.pause()
    fun resumeRecording() = activeRecording?.resume()
}
```

## 4. Photo & Video Picker (Modern Media Picker)

```kotlin
// Single image
val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
    uri?.let { onImageSelected(it) }
}

// Multiple images
val multiImagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickMultipleVisualMedia(5)) { uris ->
    onImagesSelected(uris)
}

// Launch pickers
fun launchImagePicker() = imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly))
fun launchVideoPicker() = multiImagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.VideoOnly))
```

## 5. Image Loading with Coil

```kotlin
@Composable
fun MediaImage(uri: Uri?, modifier: Modifier = Modifier, contentScale: ContentScale = ContentScale.Crop) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(uri)
            .crossfade(true)
            .diskCachePolicy(CachePolicy.ENABLED)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .size(Size.ORIGINAL)
            .build(),
        contentDescription = null,
        modifier = modifier,
        contentScale = contentScale,
        placeholder = painterResource(R.drawable.ic_image_placeholder),
        error = painterResource(R.drawable.ic_broken_image)
    )
}
```

## 6. Camera Zoom & Focus Tap

```kotlin
@Composable
fun CameraPreviewWithGestures(camera: Camera?) {
    val detector = ScaleGestureDetector(
        LocalContext.current,
        object : ScaleGestureDetector.SimpleOnScaleGestureListener() {
            override fun onScale(detector: ScaleGestureDetector): Boolean {
                val currentZoom = camera?.cameraInfo?.zoomState?.value?.zoomRatio ?: 1f
                camera?.cameraControl?.setZoomRatio(currentZoom * detector.scaleFactor)
                return true
            }
        }
    )
    Box(modifier = Modifier.fillMaxSize().pointerInteropFilter { event ->
        detector.onTouchEvent(event)
        if (event.action == MotionEvent.ACTION_UP) {
            // Focus on tap point
            val factory = SurfaceOrientedMeteringPointFactory(event.x, event.y)
            val point = factory.createPoint(0.5f, 0.5f)
            val action = FocusMeteringAction.Builder(point, FocusMeteringAction.FLAG_AF).build()
            camera?.cameraControl?.startFocusAndMetering(action)
        }
        true
    })
}
```

## Best Practices

- **Request permissions early**: Request `CAMERA` and `RECORD_AUDIO` before navigating to the camera screen.
- **Lifecycle binding**: Always bind CameraX use cases to a lifecycle owner to prevent leaks.
- **Content provider**: Use `FileProvider` to share captured media files with other apps.
- **Orientation**: Lock the camera activity to portrait or handle rotation explicitly.
- **Storage**: Save final media to `MediaStore` (public) or `context.filesDir` (private) depending on user intent.
