# Maps & Location Skills

Location-based features are central to ride-hailing, food delivery, property, and logistics apps.

## 1. Google Maps in Compose

Use the Maps Compose library (`maps-compose`) for a native Compose API.

```kotlin
// build.gradle.kts
// implementation("com.google.maps.android:maps-compose:4.x.x")

@Composable
fun LocationMapScreen(userLocation: LatLng, markers: List<MapMarker>) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(userLocation, 14f)
    }
    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false)
    ) {
        Marker(state = MarkerState(userLocation), title = "You are here")
        markers.forEach { marker ->
            Marker(
                state = MarkerState(marker.position),
                title = marker.title,
                snippet = marker.description,
                icon = BitmapDescriptorFactory.defaultMarker(marker.color)
            )
        }
    }
}
```

## 2. Requesting Location Permissions

```kotlin
@Composable
fun LocationPermissionHandler(onGranted: () -> Unit) {
    val locationPermissions = arrayOf(
        android.Manifest.permission.ACCESS_FINE_LOCATION,
        android.Manifest.permission.ACCESS_COARSE_LOCATION
    )
    val launcher = rememberLauncherForActivityResult(ActivityResultContracts.RequestMultiplePermissions()) { permissions ->
        val granted = permissions.values.any { it }
        if (granted) onGranted()
    }
    LaunchedEffect(Unit) { launcher.launch(locationPermissions) }
}
```

## 3. Getting Current Location

Use the Fused Location Provider for battery-efficient location access.

```kotlin
suspend fun Context.getLastKnownLocation(): LatLng? {
    val fusedClient = LocationServices.getFusedLocationProviderClient(this)
    return suspendCancellableCoroutine { cont ->
        fusedClient.lastLocation.addOnSuccessListener { location ->
            cont.resume(location?.let { LatLng(it.latitude, it.longitude) })
        }.addOnFailureListener { cont.resume(null) }
    }
}

fun Context.observeLocationUpdates(intervalMs: Long = 5_000L): Flow<LatLng> = callbackFlow {
    val fusedClient = LocationServices.getFusedLocationProviderClient(this@observeLocationUpdates)
    val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, intervalMs).build()
    val callback = object : LocationCallback() {
        override fun onLocationResult(result: LocationResult) {
            result.lastLocation?.let { trySend(LatLng(it.latitude, it.longitude)) }
        }
    }
    fusedClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
    awaitClose { fusedClient.removeLocationUpdates(callback) }
}
```

## 4. Geocoding & Reverse Geocoding

Convert between addresses and coordinates.

```kotlin
fun LatLng.toAddress(context: Context): String? {
    val geocoder = Geocoder(context, Locale.getDefault())
    return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        var address: String? = null
        geocoder.getFromLocation(latitude, longitude, 1) { addresses ->
            address = addresses.firstOrNull()?.getAddressLine(0)
        }
        address
    } else {
        @Suppress("DEPRECATION")
        geocoder.getFromLocation(latitude, longitude, 1)?.firstOrNull()?.getAddressLine(0)
    }
}

fun String.toLatLng(context: Context): LatLng? {
    val geocoder = Geocoder(context, Locale.getDefault())
    @Suppress("DEPRECATION")
    return geocoder.getFromLocationName(this, 1)?.firstOrNull()?.let { LatLng(it.latitude, it.longitude) }
}
```

## 5. Drawing Polylines (Routes)

```kotlin
@Composable
fun RoutePolyline(routePoints: List<LatLng>, color: Color = MaterialTheme.colorScheme.primary) {
    Polyline(
        points = routePoints,
        color = color,
        width = 10f,
        jointType = JointType.ROUND,
        startCap = ButtCap(),
        endCap = RoundCap()
    )
}
```

## 6. Geofencing

Trigger actions when the user enters or exits a defined geographic area.

```kotlin
fun Context.addGeofence(id: String, center: LatLng, radiusMeters: Float, pendingIntent: PendingIntent) {
    val geofence = Geofence.Builder()
        .setRequestId(id)
        .setCircularRegion(center.latitude, center.longitude, radiusMeters)
        .setTransitionTypes(Geofence.GEOFENCE_TRANSITION_ENTER or Geofence.GEOFENCE_TRANSITION_EXIT)
        .setExpirationDuration(Geofence.NEVER_EXPIRE)
        .build()
    val request = GeofencingRequest.Builder()
        .setInitialTrigger(GeofencingRequest.INITIAL_TRIGGER_ENTER)
        .addGeofence(geofence)
        .build()
    GeofencingClient(this).addGeofences(request, pendingIntent)
}
```

## 7. Custom Map Markers

```kotlin
@Composable
fun CustomMapMarker(position: LatLng, icon: ImageVector, tint: Color) {
    val compositionContext = rememberCompositionContext()
    val context = LocalContext.current
    val markerBitmap = remember(icon) {
        // Convert a Compose vector to a Bitmap for the marker
        icon.toBitmap(context, tint)
    }
    Marker(state = MarkerState(position), icon = BitmapDescriptorFactory.fromBitmap(markerBitmap))
}
```

## Best Practices

- **Battery efficiency**: Use `PRIORITY_BALANCED_POWER_ACCURACY` in the background; only switch to `HIGH_ACCURACY` when the user is actively watching the map.
- **Permission rationale**: Always explain WHY the app needs location before requesting permission.
- **Clustering**: Use `MarkerClusteringManager` from Maps Compose for dense marker sets.
- **Map style**: Apply a custom JSON map style to match your app's brand.
- **Camera bounds**: Use `CameraUpdateFactory.newLatLngBounds()` to fit multiple markers on screen.
