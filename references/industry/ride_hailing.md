# Industry: Ride Hailing & Mobility

Ride hailing apps demand intense real-time state synchronization, precise background location tracking, and highly responsive map UI.

## 🗺️ UI Execution: Real-time Maps

Integrating Google Maps inside Jetpack Compose requires careful lifecycle and state management. Avoid recomposing the entire map when only a marker moves.

```kotlin
@Composable
fun RideMapScreen(driverLocation: LatLng, route: List<LatLng>) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(driverLocation, 15f)
    }

    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState
    ) {
        // Driver Car Marker
        Marker(
            state = MarkerState(position = driverLocation),
            title = "Your Driver",
            icon = BitmapDescriptorFactory.fromResource(R.drawable.ic_car)
        )
        
        // Active Route
        Polyline(
            points = route,
            color = MaterialTheme.colorScheme.primary,
            width = 8f
        )
    }
}
```

## 📍 Architecture: Background Location Tracking

Use an Android Foreground Service tied to Kotlin Flows to emit location updates continuously even when the app is in the background.

```kotlin
class LocationTrackingService : Service() {
    private val locationClient by lazy { LocationServices.getFusedLocationProviderClient(this) }

    fun startTracking(): Flow<Location> = callbackFlow {
        val request = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 2000L).build()
        val callback = object : LocationCallback() {
            override fun onLocationResult(result: LocationResult) {
                result.lastLocation?.let { trySend(it) }
            }
        }
        
        locationClient.requestLocationUpdates(request, callback, Looper.getMainLooper())
        awaitClose { locationClient.removeLocationUpdates(callback) }
    }
}
```

## 🔄 Real-time Ride State Sync

Use WebSockets or Server-Sent Events (SSE) to sync the ride's core state (`SEARCHING`, `DRIVER_ASSIGNED`, `ARRIVING`, `IN_TRANSIT`).

```kotlin
sealed class RideStatus {
    object Searching : RideStatus()
    data class DriverAssigned(val driverId: String, val etaMinutes: Int) : RideStatus()
    object Arrived : RideStatus()
    object Completed : RideStatus()
}
```
