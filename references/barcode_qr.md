# Barcode & QR Code Skills

QR/barcode scanning is essential in e-commerce, food delivery, government apps, logistics, and payments.

## 1. CameraX + ML Kit Barcode Scanner

```kotlin
@Composable
fun BarcodeScannerScreen(onBarcodeDetected: (String) -> Unit) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val cameraProviderFuture = remember { ProcessCameraProvider.getInstance(context) }

    AndroidView(
        modifier = Modifier.fillMaxSize(),
        factory = { ctx ->
            val previewView = PreviewView(ctx)
            cameraProviderFuture.addListener({
                val cameraProvider = cameraProviderFuture.get()
                val preview = Preview.Builder().build().also {
                    it.setSurfaceProvider(previewView.surfaceProvider)
                }
                val barcodeScanner = BarcodeScanning.getClient(
                    BarcodeScannerOptions.Builder()
                        .setBarcodeFormats(Barcode.FORMAT_QR_CODE, Barcode.FORMAT_ALL_FORMATS)
                        .build()
                )
                val imageAnalysis = ImageAnalysis.Builder()
                    .setBackpressureStrategy(ImageAnalysis.STRATEGY_KEEP_ONLY_LATEST)
                    .build()
                    .also { analysis ->
                        analysis.setAnalyzer(ContextCompat.getMainExecutor(ctx)) { imageProxy ->
                            processImageProxy(barcodeScanner, imageProxy, onBarcodeDetected)
                        }
                    }
                cameraProvider.unbindAll()
                cameraProvider.bindToLifecycle(lifecycleOwner, CameraSelector.DEFAULT_BACK_CAMERA, preview, imageAnalysis)
            }, ContextCompat.getMainExecutor(ctx))
            previewView
        }
    )
}

private fun processImageProxy(scanner: BarcodeScanner, imageProxy: ImageProxy, onDetected: (String) -> Unit) {
    val mediaImage = imageProxy.image ?: run { imageProxy.close(); return }
    val inputImage = InputImage.fromMediaImage(mediaImage, imageProxy.imageInfo.rotationDegrees)
    scanner.process(inputImage)
        .addOnSuccessListener { barcodes ->
            barcodes.firstOrNull()?.rawValue?.let { onDetected(it) }
        }
        .addOnCompleteListener { imageProxy.close() }
}
```

## 2. Scanner UI with Overlay

```kotlin
@Composable
fun ScannerOverlay() {
    val strokeColor = MaterialTheme.colorScheme.primary
    Box(modifier = Modifier.fillMaxSize()) {
        // Dark scrim outside scan area
        Canvas(modifier = Modifier.fillMaxSize()) {
            val scanSize = size.width * 0.65f
            val left = (size.width - scanSize) / 2
            val top = (size.height - scanSize) / 2
            drawRect(Color.Black.copy(alpha = 0.55f))
            // Cut out scan area
            drawRoundRect(
                color = Color.Transparent,
                topLeft = Offset(left, top),
                size = Size(scanSize, scanSize),
                cornerRadius = CornerRadius(16.dp.toPx()),
                blendMode = BlendMode.Clear
            )
        }
        // Corner brackets
        CornerBrackets(strokeColor = strokeColor, modifier = Modifier.align(Alignment.Center))
        // Label
        Text(
            text = "Point camera at QR code",
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 120.dp),
            color = Color.White,
            style = MaterialTheme.typography.bodyMedium
        )
        // Scanning animation line
        ScanningLine(modifier = Modifier.align(Alignment.Center))
    }
}
```

## 3. QR Code Generation

Generate QR codes in-app (e.g., payment QR, sharing links, tickets).

```kotlin
// implementation("com.google.zxing:core:3.5.3")

fun generateQrCodeBitmap(content: String, size: Int = 512): Bitmap {
    val hints = mapOf(EncodeHintType.MARGIN to 1, EncodeHintType.ERROR_CORRECTION to ErrorCorrectionLevel.H)
    val bitMatrix = MultiFormatWriter().encode(content, BarcodeFormat.QR_CODE, size, size, hints)
    val bitmap = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888)
    for (x in 0 until size) {
        for (y in 0 until size) {
            bitmap.setPixel(x, y, if (bitMatrix[x, y]) android.graphics.Color.BLACK else android.graphics.Color.WHITE)
        }
    }
    return bitmap
}

@Composable
fun QrCodeDisplay(content: String, modifier: Modifier = Modifier) {
    val bitmap = remember(content) { generateQrCodeBitmap(content) }
    Image(bitmap = bitmap.asImageBitmap(), contentDescription = "QR Code", modifier = modifier)
}
```

## 4. One-Shot Photo Scan

Scan barcode from a photo (e.g., user imports an image of a QR code).

```kotlin
val photoPickerLauncher = rememberLauncherForActivityResult(ActivityResultContracts.PickVisualMedia()) { uri ->
    uri?.let {
        val inputImage = InputImage.fromFilePath(context, it)
        BarcodeScanning.getClient().process(inputImage)
            .addOnSuccessListener { barcodes ->
                barcodes.firstOrNull()?.rawValue?.let { value -> onBarcodeDetected(value) }
            }
    }
}
```

## 5. Torch / Flashlight Control

```kotlin
@Composable
fun TorchToggleButton(camera: Camera) {
    var isTorchOn by remember { mutableStateOf(false) }
    IconButton(onClick = {
        isTorchOn = !isTorchOn
        camera.cameraControl.enableTorch(isTorchOn)
    }) {
        Icon(
            imageVector = if (isTorchOn) Icons.Default.FlashOn else Icons.Default.FlashOff,
            contentDescription = "Toggle torch",
            tint = Color.White
        )
    }
}
```

## Best Practices

- **One-shot detection**: Use a boolean flag or `StateFlow` to prevent firing `onBarcodeDetected` multiple times for the same code.
- **Vibration feedback**: Trigger `VibrationEffect.createOneShot(100, DEFAULT_AMPLITUDE)` on successful scan.
- **Sound feedback**: Play a beep on successful scan for accessibility and confirmation.
- **Permissions**: Always request `CAMERA` permission before showing the scanner screen.
- **Multiple formats**: Default to `FORMAT_ALL_FORMATS` unless you want to restrict to only QR codes for performance.
