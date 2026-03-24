# Skill: Maps & Location Services

Location-aware apps require careful usage of Google Play Services (FusedLocationProvider) to balance precision and battery life.

## 📍 Architecture: Foreground vs Background

- **Foreground**: The user is looking at the map. Use `Priority.PRIORITY_HIGH_ACCURACY`.
- **Background**: The app is closed, but you need to track a run/drive. You *must* use a Foreground Service with an ongoing notification.

## 🗺️ Compose: Google Maps Integration

Use the official `maps-compose` library. Never manually manage `MapView` lifecycle in Compose if you don't have to.

```kotlin
@Composable
fun LocationPickerMap(
    userLocation: LatLng?,
    onLocationSelected: (LatLng) -> Unit
) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(userLocation ?: defaultCity, 12f)
    }

    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        uiSettings = MapUiSettings(zoomControlsEnabled = false),
        onMapClick = onLocationSelected
    ) {
        userLocation?.let { loc ->
            Marker(
                state = MarkerState(position = loc),
                title = "Your Location"
            )
        }
    }
}
```

## 🔋 Battery Optimization: Fused Location

Never use `LocationManager` directly. Fused Location intelligently combines GPS, Wi-Fi, and Cell Towers.

```kotlin
@SuppressLint("MissingPermission") // Ensure you requested permissions first
fun getCurrentLocation(context: Context): Flow<Location> = callbackFlow {
    val client = LocationServices.getFusedLocationProviderClient(context)
    
    // First, try to get the fastest available cached location
    client.lastLocation.addOnSuccessListener { loc ->
        loc?.let { trySend(it) }
    }
    
    // Then, request a fresh location
    val request = CurrentLocationRequest.Builder().setPriority(Priority.PRIORITY_HIGH_ACCURACY).build()
    val token = CancellationTokenSource()
    
    client.getCurrentLocation(request, token.token).addOnSuccessListener { loc ->
        loc?.let { trySend(it) }
    }
    
    awaitClose { token.cancel() }
}
```
