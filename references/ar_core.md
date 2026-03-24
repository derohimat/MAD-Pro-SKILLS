# ARCore & Augmented Reality Skills

ARCore enables placing virtual objects in the real world — used in property visualization, retail try-on, navigation, and education.

## 1. Sceneview Setup (Compose-native AR)

Use `io.github.sceneview:arsceneview` for idiomatic Compose AR integration.

```kotlin
// build.gradle.kts
// implementation("io.github.sceneview:arsceneview:2.x.x")

@Composable
fun ArPlacementScreen(modelUrl: String) {
    var planeNode by remember { mutableStateOf<AnchorNode?>(null) }

    ARScene(
        modifier = Modifier.fillMaxSize(),
        planeRenderer = true,
        onCreate = { arSceneView ->
            arSceneView.apply {
                planeFindingMode = Config.PlaneFindingMode.HORIZONTAL_AND_VERTICAL
                lightEstimationMode = Config.LightEstimationMode.ENVIRONMENTAL_HDR
            }
        },
        onSessionUpdated = { session, frame ->
            // Auto-place on first detected plane if not placed yet
        },
        onTapAr = { hitResult, _ ->
            if (planeNode == null) {
                planeNode = AnchorNode(engine = rememberEngine(), anchor = hitResult.createAnchor()).apply {
                    addChildNode(
                        ModelNode(modelInstance = rememberModelInstance(modelUrl), scaleToUnits = 0.5f)
                    )
                }
            }
        }
    )
}
```

## 2. AR Furniture / Product Placement

Used in furniture apps (IKEA-style) and e-commerce try-before-you-buy.

```kotlin
@Composable
fun FurniturePlacementScreen(viewModel: ArViewModel = hiltViewModel()) {
    val selectedProduct by viewModel.selectedProduct.collectAsStateWithLifecycle()
    var isPlaced by remember { mutableStateOf(false) }

    Box(modifier = Modifier.fillMaxSize()) {
        ARScene(
            modifier = Modifier.fillMaxSize(),
            onTapAr = { hitResult, _ ->
                if (selectedProduct != null) {
                    viewModel.placeProduct(hitResult.createAnchor())
                    isPlaced = true
                }
            }
        )

        // Product picker at bottom
        if (!isPlaced) {
            Column(modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp)) {
                Text("Tap a surface to place furniture", color = Color.White, modifier = Modifier.align(Alignment.CenterHorizontally))
                Spacer(Modifier.height(8.dp))
                ProductPickerRow(products = viewModel.products, selected = selectedProduct, onSelect = viewModel::selectProduct)
            }
        }

        // Controls when placed
        if (isPlaced) {
            Row(modifier = Modifier.align(Alignment.BottomCenter).padding(24.dp)) {
                OutlinedButton(onClick = { isPlaced = false; viewModel.clearPlacement() }, colors = ButtonDefaults.outlinedButtonColors(contentColor = Color.White)) { Text("Remove") }
                Spacer(Modifier.width(12.dp))
                Button(onClick = viewModel::takeArScreenshot) { Text("Take Photo") }
            }
        }
    }
}
```

## 3. AR Measurement Tool

Measure real-world distances between AR anchor points.

```kotlin
class ArMeasureViewModel : ViewModel() {
    private val _points = MutableStateFlow<List<AnchorNode>>(emptyList())
    val points: StateFlow<List<AnchorNode>> = _points
    val distance: StateFlow<Float?> = _points.map { nodes ->
        if (nodes.size == 2) {
            val p1 = nodes[0].worldPosition
            val p2 = nodes[1].worldPosition
            sqrt((p2.x - p1.x).pow(2) + (p2.y - p1.y).pow(2) + (p2.z - p1.z).pow(2))
        } else null
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(), null)

    fun addPoint(anchor: Anchor) = _points.update { it.take(1) + AnchorNode(anchor = anchor) }
    fun reset() = _points.value = emptyList()
}

@Composable
fun DistanceOverlay(distance: Float?) {
    distance?.let {
        val meters = "%.2f m".format(it)
        Card(modifier = Modifier.padding(16.dp)) {
            Text("Distance: $meters", modifier = Modifier.padding(12.dp), style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
    }
}
```

## 4. AR Face Filter (Face Mesh)

Use ARCore's Face Mesh for face filters in social and beauty apps.

```kotlin
// ARCore Face Tracking session config
fun configureFaceSession(session: Session) {
    val config = Config(session).apply {
        augmentedFaceMode = Config.AugmentedFaceMode.MESH3D
        focusMode = Config.FocusMode.AUTO
    }
    session.configure(config)
}

// Track face landmarks and place virtual glasses/masks
fun onFaceUpdated(face: AugmentedFace) {
    val noseRegion = face.getRegionPose(AugmentedFace.RegionType.NOSE_TIP)
    // Position your 3D model at noseRegion
}
```

## 5. QR Code / Image Target Tracking

Trigger AR content when the camera detects a specific image (museum, packaging, business card).

```kotlin
fun buildImageTrackingDatabase(session: Session, context: Context): AugmentedImageDatabase {
    val db = AugmentedImageDatabase(session)
    val bitmap = BitmapFactory.decodeResource(context.resources, R.drawable.ar_target)
    db.addImage("product_label", bitmap, 0.1f) // 0.1 = 10cm physical size
    return db
}

fun onImageTracked(image: AugmentedImage) {
    if (image.trackingState == TrackingState.TRACKING && image.name == "product_label") {
        // Place AR content above the detected image
        val centerPose = image.centerPose
    }
}
```

## 6. AR Screenshot & Share

```kotlin
fun takeArScreenshot(arSceneView: ARSceneView, context: Context) {
    val bitmap = arSceneView.toBitmap()
    val uri = bitmap.saveToMediaStore(context, "ar_capture_${System.currentTimeMillis()}")
    ShareCompat.IntentBuilder(context)
        .setType("image/jpeg")
        .setStream(uri)
        .setChooserTitle("Share AR Photo")
        .startChooser()
}
```

## Best Practices

- **Plane detection guidance**: Show a visual cue (e.g., moving phone animation) while waiting for plane detection.
- **Lighting estimation**: Enable `ENVIRONMENTAL_HDR` lighting so virtual objects look realistic in all lighting conditions.
- **Performance**: AR is GPU-intensive. Profile with GPU Inspector; use LOD (Level of Detail) models.
- **Battery**: Warn users that AR sessions drain the battery quickly. Add a timeout for long idle sessions.
- **Accuracy**: Physical scale matters — always provide `physicalSizeMeters` when adding images to the database.
