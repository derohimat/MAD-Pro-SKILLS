# Image Editing Skills

In-app image editing covers cropping, filters, annotations, and transformations — used in social, ID verification, healthcare, and e-commerce apps.

## 1. Image Crop with UCrop

Use the `uCrop` library for a polished crop/rotate/scale experience.

```kotlin
// Launch UCrop
fun launchCrop(sourceUri: Uri, context: Context, launcher: ActivityResultLauncher<Intent>) {
    val destinationUri = Uri.fromFile(File(context.cacheDir, "cropped_${System.currentTimeMillis()}.jpg"))
    val options = UCrop.Options().apply {
        setCompressionQuality(90)
        setHideBottomControls(false)
        setFreeStyleCropEnabled(true)
        setToolbarColor(context.getColor(R.color.colorPrimary))
        setStatusBarColor(context.getColor(R.color.colorPrimaryDark))
    }
    val intent = UCrop.of(sourceUri, destinationUri)
        .withAspectRatio(1f, 1f) // Square crop (profile photos)
        .withOptions(options)
        .getIntent(context)
    launcher.launch(intent)
}

// Receive result
val cropLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
    if (result.resultCode == RESULT_OK) {
        val croppedUri = UCrop.getOutput(result.data!!)
        onImageCropped(croppedUri)
    }
}
```

## 2. Color Filters with Canvas

Apply Instagram-style filters using `ColorMatrix`.

```kotlin
val filters = mapOf(
    "Normal" to ColorMatrix(),
    "Grayscale" to ColorMatrix().apply { setSaturation(0f) },
    "Warm" to ColorMatrix(floatArrayOf(
        1.3f, 0f, 0f, 0f, 0f,
        0f, 1.1f, 0f, 0f, 0f,
        0f, 0f, 0.8f, 0f, 0f,
        0f, 0f, 0f, 1f, 0f
    )),
    "Cool" to ColorMatrix(floatArrayOf(
        0.8f, 0f, 0f, 0f, 0f,
        0f, 1.0f, 0f, 0f, 0f,
        0f, 0f, 1.3f, 0f, 0f,
        0f, 0f, 0f, 1f, 0f
    ))
)

@Composable
fun FilteredImage(bitmap: Bitmap, filter: ColorMatrix, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        drawIntoCanvas { canvas ->
            val paint = Paint().asFrameworkPaint().apply {
                colorFilter = ColorMatrixColorFilter(filter)
            }
            canvas.nativeCanvas.drawBitmap(bitmap, 0f, 0f, paint)
        }
    }
}
```

## 3. Drawing & Annotation (Compose Canvas)

Allow users to draw, highlight, or annotate images (medical imaging, document review).

```kotlin
@Composable
fun ImageAnnotationCanvas(imageBitmap: ImageBitmap, onAnnotationComplete: (List<Path>) -> Unit) {
    var currentPath by remember { mutableStateOf(Path()) }
    val paths = remember { mutableStateListOf<Pair<Path, Color>>() }
    var selectedColor by remember { mutableStateOf(Color.Red) }
    var strokeWidth by remember { mutableFloatStateOf(4f) }

    Column {
        // Color picker row
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(8.dp)) {
            listOf(Color.Red, Color.Blue, Color.Green, Color.Yellow, Color.Black).forEach { color ->
                Box(
                    modifier = Modifier.size(32.dp).clip(CircleShape).background(color)
                        .border(if (color == selectedColor) 3.dp else 0.dp, Color.White, CircleShape)
                        .clickable { selectedColor = color }
                )
            }
        }
        // Canvas
        Box {
            Image(bitmap = imageBitmap, contentDescription = null, modifier = Modifier.fillMaxWidth())
            Canvas(
                modifier = Modifier.matchParentSize().pointerInput(Unit) {
                    detectDragGestures(
                        onDragStart = { offset -> currentPath = Path().apply { moveTo(offset.x, offset.y) } },
                        onDrag = { change, _ -> currentPath.lineTo(change.position.x, change.position.y) },
                        onDragEnd = { paths.add(Pair(currentPath, selectedColor)); onAnnotationComplete(paths.map { it.first }) }
                    )
                }
            ) {
                paths.forEach { (path, color) ->
                    drawPath(path, color = color, style = Stroke(width = strokeWidth, cap = StrokeCap.Round, join = StrokeJoin.Round))
                }
                drawPath(currentPath, color = selectedColor, style = Stroke(width = strokeWidth, cap = StrokeCap.Round))
            }
        }
    }
}
```

## 4. Brightness, Contrast & Saturation Sliders

```kotlin
@Composable
fun ImageAdjustmentsPanel(onAdjust: (brightness: Float, contrast: Float, saturation: Float) -> Unit) {
    var brightness by remember { mutableFloatStateOf(0f) }
    var contrast by remember { mutableFloatStateOf(1f) }
    var saturation by remember { mutableFloatStateOf(1f) }

    Column(modifier = Modifier.padding(16.dp)) {
        AdjustmentSlider("Brightness", brightness, -1f..1f) { brightness = it; onAdjust(brightness, contrast, saturation) }
        AdjustmentSlider("Contrast", contrast, 0f..2f) { contrast = it; onAdjust(brightness, contrast, saturation) }
        AdjustmentSlider("Saturation", saturation, 0f..2f) { saturation = it; onAdjust(brightness, contrast, saturation) }
    }
}

fun buildAdjustedColorMatrix(brightness: Float, contrast: Float, saturation: Float): ColorMatrix {
    val matrix = ColorMatrix()
    matrix.setScale(contrast, contrast, contrast, 1f)
    val satMatrix = ColorMatrix().apply { setSaturation(saturation) }
    matrix.postConcat(satMatrix)
    val b = brightness * 255
    val brightnessMatrix = ColorMatrix(floatArrayOf(
        1f, 0f, 0f, 0f, b,
        0f, 1f, 0f, 0f, b,
        0f, 0f, 1f, 0f, b,
        0f, 0f, 0f, 1f, 0f
    ))
    matrix.postConcat(brightnessMatrix)
    return matrix
}
```

## 5. Exporting Edited Image

```kotlin
suspend fun exportEditedImage(context: Context, bitmap: Bitmap, quality: Int = 90): Uri {
    return withContext(Dispatchers.IO) {
        val file = File(context.cacheDir, "edited_${System.currentTimeMillis()}.jpg")
        file.outputStream().use { bitmap.compress(Bitmap.CompressFormat.JPEG, quality, it) }
        FileProvider.getUriForFile(context, "${context.packageName}.provider", file)
    }
}
```

## Best Practices

- **Non-destructive editing**: Store transformations as a list of operations and only apply them on export.
- **Undo/redo stack**: Maintain a `SnapshotStateList` of operations to support undo/redo.
- **Preview performance**: Apply filters at a reduced resolution for the live preview; full quality only on export.
- **Memory**: Large bitmaps can cause OOM. Use `BitmapFactory.Options.inSampleSize` to downsample before editing.
