# Logistics & Fleet Management Skills

Fleet apps require real-time vehicle tracking, route optimization, delivery management, and driver communication.

## 1. Live Fleet Map

```kotlin
@Composable
fun FleetMapScreen(viewModel: FleetViewModel = hiltViewModel()) {
    val vehicles by viewModel.vehicles.collectAsStateWithLifecycle()
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(LatLng(-6.2, 106.8), 11f)
    }

    Box(modifier = Modifier.fillMaxSize()) {
        GoogleMap(modifier = Modifier.fillMaxSize(), cameraPositionState = cameraPositionState) {
            vehicles.forEach { vehicle ->
                Marker(
                    state = MarkerState(position = LatLng(vehicle.lat, vehicle.lng)),
                    title = vehicle.plateNumber,
                    snippet = "${vehicle.driverName} · ${vehicle.status.displayName}",
                    icon = vehicle.status.markerIcon
                )
            }
        }
        // Fleet status summary card
        FleetSummaryCard(
            vehicles = vehicles,
            modifier = Modifier.align(Alignment.TopCenter).padding(16.dp)
        )
    }
}

@Composable
fun FleetSummaryCard(vehicles: List<Vehicle>, modifier: Modifier = Modifier) {
    Card(modifier = modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.SpaceAround) {
            StatItem("Active", vehicles.count { it.status == VehicleStatus.ACTIVE }, Color(0xFF4CAF50))
            StatItem("Idle", vehicles.count { it.status == VehicleStatus.IDLE }, Color(0xFFFF9800))
            StatItem("Offline", vehicles.count { it.status == VehicleStatus.OFFLINE }, Color(0xFFF44336))
        }
    }
}
```

## 2. Driver Assignment & Dispatch

```kotlin
@Composable
fun DispatchOrderScreen(order: DeliveryOrder, availableDrivers: List<Driver>, onAssign: (Driver) -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OrderSummaryCard(order = order)
        Spacer(Modifier.height(16.dp))
        Text("Select Driver", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(8.dp))
        LazyColumn {
            items(availableDrivers, key = { it.id }) { driver ->
                DriverCard(driver = driver, onAssign = { onAssign(driver) })
            }
        }
    }
}

@Composable
fun DriverCard(driver: Driver, onAssign: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(model = driver.avatarUrl, contentDescription = null, modifier = Modifier.size(48.dp).clip(CircleShape))
            Spacer(Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(driver.name, fontWeight = FontWeight.SemiBold)
                Text("${driver.distanceKm} km away · ⭐ ${driver.rating}", style = MaterialTheme.typography.bodySmall)
                Text(driver.vehicleType, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
            }
            Button(onClick = onAssign) { Text("Assign") }
        }
    }
}
```

## 3. Route Optimization

```kotlin
data class DeliveryStop(val id: String, val address: String, val lat: Double, val lng: Double, val priority: Int, var sequenceNumber: Int = 0)

class RouteOptimizer {
    // Nearest neighbor heuristic for small routes (< 20 stops)
    fun optimize(depot: LatLng, stops: List<DeliveryStop>): List<DeliveryStop> {
        val result = mutableListOf<DeliveryStop>()
        val remaining = stops.toMutableList()
        var current = depot
        while (remaining.isNotEmpty()) {
            val nearest = remaining.minByOrNull { distanceBetween(current, LatLng(it.lat, it.lng)) }!!
            result.add(nearest.copy(sequenceNumber = result.size + 1))
            current = LatLng(nearest.lat, nearest.lng)
            remaining.remove(nearest)
        }
        return result
    }

    private fun distanceBetween(a: LatLng, b: LatLng): Float {
        val results = FloatArray(1)
        Location.distanceBetween(a.latitude, a.longitude, b.latitude, b.longitude, results)
        return results[0]
    }
}
```

## 4. Delivery Status Timeline

```kotlin
@Composable
fun DeliveryStatusTimeline(events: List<TrackingEvent>) {
    Column(modifier = Modifier.padding(16.dp)) {
        events.forEachIndexed { index, event ->
            Row {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(modifier = Modifier.size(12.dp).clip(CircleShape).background(if (index == 0) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline))
                    if (index < events.lastIndex) {
                        Box(modifier = Modifier.width(2.dp).height(40.dp).background(MaterialTheme.colorScheme.outline))
                    }
                }
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.padding(bottom = 16.dp)) {
                    Text(event.status, fontWeight = FontWeight.SemiBold)
                    Text(event.location, style = MaterialTheme.typography.bodySmall)
                    Text(event.timestamp, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.outline)
                }
            }
        }
    }
}
```

## 5. Proof of Delivery

```kotlin
@Composable
fun ProofOfDeliveryScreen(viewModel: PodViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Proof of Delivery", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        // Signature pad
        SignaturePad(onSignatureComplete = viewModel::onSignatureSaved, modifier = Modifier.fillMaxWidth().height(200.dp))
        Spacer(Modifier.height(16.dp))
        // Photo capture
        CapturePhotoButton(onCapture = viewModel::onPhotoCaptured, capturedUri = state.photoUri)
        Spacer(Modifier.height(16.dp))
        OutlinedTextField(value = state.recipientName, onValueChange = viewModel::onRecipientNameChange, label = { Text("Recipient Name") }, modifier = Modifier.fillMaxWidth())
        Spacer(Modifier.weight(1f))
        Button(onClick = viewModel::submitPod, enabled = state.isValid, modifier = Modifier.fillMaxWidth()) { Text("Submit Delivery") }
    }
}
```

## Best Practices

- **Real-time tracking**: Push vehicle positions via WebSocket or Firebase RTDB at 5–10 second intervals to conserve bandwidth.
- **Offline routes**: Cache the driver's assigned route in Room so they can view stops without internet.
- **Geofence arrival**: Auto-trigger arrival events using Geofence API when the driver is within 50m of a stop.
- **Battery optimization**: Use `FusedLocationProvider` with balanced power accuracy for background driver tracking.
- **Driver privacy**: Only share vehicle location with dispatchers; inform drivers that tracking is active.
