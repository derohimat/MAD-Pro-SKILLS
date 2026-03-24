# Ride-Hailing App Skills

Ride-hailing apps require real-time location tracking, map integration, booking flows, and live driver updates.

## 1. Google Maps Integration in Compose

Use `MapView` via `AndroidView` to embed Google Maps inside a Compose screen.

```kotlin
@Composable
fun RideMapScreen(driverLocation: LatLng?, userLocation: LatLng?) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(userLocation ?: LatLng(-6.2, 106.8), 15f)
    }

    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState
    ) {
        userLocation?.let {
            Marker(state = MarkerState(position = it), title = "You", icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_BLUE))
        }
        driverLocation?.let {
            Marker(state = MarkerState(position = it), title = "Driver")
        }
    }
}
```

## 2. Real-Time Driver Location

Subscribe to a WebSocket or Firebase Realtime Database to receive live location updates.

```kotlin
// Repository
fun observeDriverLocation(driverId: String): Flow<LatLng> = callbackFlow {
    val ref = FirebaseDatabase.getInstance().getReference("drivers/$driverId/location")
    val listener = ref.addValueEventListener(object : ValueEventListener {
        override fun onDataChange(snapshot: DataSnapshot) {
            val lat = snapshot.child("lat").getValue(Double::class.java) ?: return
            val lng = snapshot.child("lng").getValue(Double::class.java) ?: return
            trySend(LatLng(lat, lng))
        }
        override fun onCancelled(error: DatabaseError) { close(error.toException()) }
    })
    awaitClose { ref.removeEventListener(listener) }
}
```

## 3. Driver Card Bottom Sheet

Display driver info, vehicle details, and ETA in a draggable bottom sheet.

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DriverInfoSheet(driver: Driver, eta: String) {
    val sheetState = rememberStandardBottomSheetState()
    BottomSheet(sheetState = sheetState) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = driver.photoUrl, contentDescription = "Driver photo", modifier = Modifier.size(56.dp).clip(CircleShape))
                Spacer(modifier = Modifier.width(12.dp))
                Column {
                    Text(driver.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Text(driver.vehiclePlate, style = MaterialTheme.typography.bodyMedium)
                    RatingBar(rating = driver.rating)
                }
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(modifier = Modifier.fillMaxWidth()) {
                EtaChip(eta = eta, modifier = Modifier.weight(1f))
                Spacer(modifier = Modifier.width(8.dp))
                OutlinedButton(onClick = { /* call driver */ }, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Default.Phone, null)
                    Spacer(Modifier.width(4.dp))
                    Text("Call")
                }
            }
        }
    }
}
```

## 4. Booking Flow

```kotlin
sealed class BookingState {
    object SearchingDriver : BookingState()
    data class DriverFound(val driver: Driver, val eta: String) : BookingState()
    data class InProgress(val driver: Driver, val remainingMinutes: Int) : BookingState()
    data class Completed(val tripSummary: TripSummary) : BookingState()
    data class Cancelled(val reason: String) : BookingState()
}
```

## 5. Fare Estimation

```kotlin
@Composable
fun FareEstimationCard(estimate: FareEstimate) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Estimated Fare", style = MaterialTheme.typography.labelMedium)
            Text(
                text = estimate.formattedRange,
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text("${estimate.distanceKm} km · ~${estimate.durationMin} min", style = MaterialTheme.typography.bodySmall)
        }
    }
}
```

## 6. Polyline Route Drawing

Draw the route between pickup and destination on the map.

```kotlin
// After getting directions from Directions API
GoogleMap(...) {
    Polyline(
        points = routePoints,
        color = MaterialTheme.colorScheme.primary,
        width = 8f
    )
}
```

## Best Practices

- **Camera animation**: Smoothly animate the camera to follow the driver using `cameraPositionState.animate()`.
- **Battery optimization**: Use significant location changes for background tracking; switch to GPS when app is foregrounded.
- **Cancellation**: Always confirm before cancelling a booking; show any cancellation fees.
- **Offline handling**: Show a "reconnecting..." banner when the WebSocket drops.
- **Accessibility**: Announce driver ETA updates via `AccessibilityEvent`.
