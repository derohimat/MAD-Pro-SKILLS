# Healthcare App Skills

Healthcare apps require strict data privacy, accessible UI, and careful handling of sensitive health information.

## 1. Appointment Booking

Multi-step booking: select doctor → choose date/time → confirm → payment.

```kotlin
@Composable
fun AppointmentDatePicker(
    availableSlots: Map<LocalDate, List<TimeSlot>>,
    onSlotSelected: (LocalDate, TimeSlot) -> Unit
) {
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    Column {
        CalendarView(
            availableDates = availableSlots.keys.toList(),
            selectedDate = selectedDate,
            onDateSelected = { selectedDate = it }
        )
        selectedDate?.let { date ->
            Spacer(modifier = Modifier.height(12.dp))
            Text("Available Times", style = MaterialTheme.typography.titleSmall)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(availableSlots[date] ?: emptyList()) { slot ->
                    FilterChip(
                        selected = false,
                        onClick = { onSlotSelected(date, slot) },
                        label = { Text(slot.formattedTime) }
                    )
                }
            }
        }
    }
}
```

## 2. Doctor & Specialist Listing

```kotlin
@Composable
fun DoctorCard(doctor: Doctor, onBook: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Row(modifier = Modifier.padding(16.dp)) {
            AsyncImage(model = doctor.photoUrl, contentDescription = doctor.name, modifier = Modifier.size(64.dp).clip(CircleShape))
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(doctor.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Text(doctor.specialization, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Star, null, tint = Color(0xFFFFC107), modifier = Modifier.size(14.dp))
                    Text("${doctor.rating} · ${doctor.totalReviews} reviews", style = MaterialTheme.typography.bodySmall)
                }
            }
            Button(onClick = onBook) { Text("Book") }
        }
    }
}
```

## 3. Health Metrics Dashboard

Display vitals (heart rate, blood pressure, weight) with charts.

```kotlin
@Composable
fun HealthMetricCard(metric: HealthMetric) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(metric.icon, contentDescription = metric.name, tint = metric.color, modifier = Modifier.size(24.dp))
                Spacer(Modifier.width(8.dp))
                Text(metric.name, style = MaterialTheme.typography.labelLarge)
            }
            Spacer(Modifier.height(8.dp))
            Text(
                text = "${metric.value} ${metric.unit}",
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold,
                color = when (metric.status) {
                    HealthStatus.NORMAL -> Color(0xFF4CAF50)
                    HealthStatus.WARNING -> Color(0xFFFFC107)
                    HealthStatus.CRITICAL -> Color(0xFFF44336)
                }
            )
            Spacer(Modifier.height(4.dp))
            Text(metric.lastUpdated, style = MaterialTheme.typography.bodySmall)
        }
    }
}
```

## 4. Teleconsultation / Video Call

Integrate WebRTC (via Twilio or Agora SDK) for in-app video consultations.

```kotlin
@Composable
fun ConsultationScreen(roomToken: String) {
    var isMuted by remember { mutableStateOf(false) }
    var isCameraOff by remember { mutableStateOf(false) }
    Box(modifier = Modifier.fillMaxSize()) {
        // Remote video (full screen)
        RemoteVideoView(modifier = Modifier.fillMaxSize())
        // Local video (PiP)
        LocalVideoView(
            modifier = Modifier.align(Alignment.TopEnd).size(120.dp, 160.dp)
                .padding(16.dp).clip(RoundedCornerShape(12.dp))
        )
        // Controls
        Row(modifier = Modifier.align(Alignment.BottomCenter).padding(24.dp)) {
            IconButton(onClick = { isMuted = !isMuted }) {
                Icon(if (isMuted) Icons.Default.MicOff else Icons.Default.Mic, null)
            }
            Spacer(Modifier.width(16.dp))
            FloatingActionButton(onClick = { /* end call */ }, containerColor = Color.Red) {
                Icon(Icons.Default.CallEnd, null, tint = Color.White)
            }
            Spacer(Modifier.width(16.dp))
            IconButton(onClick = { isCameraOff = !isCameraOff }) {
                Icon(if (isCameraOff) Icons.Default.VideocamOff else Icons.Default.Videocam, null)
            }
        }
    }
}
```

## 5. Prescription & Medical Records

```kotlin
@Composable
fun PrescriptionCard(prescription: Prescription) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Prescription", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Dr. ${prescription.doctorName}", style = MaterialTheme.typography.bodySmall)
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
            prescription.medications.forEach { med ->
                Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)) {
                    Text("• ${med.name}", modifier = Modifier.weight(1f))
                    Text(med.dosage, style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
```

## 6. HIPAA & Data Privacy

- **Minimize data collection**: Only collect health data you absolutely need.
- **Data encryption**: All health data at rest must be encrypted (AES-256).
- **Access control**: Implement role-based access so only the patient and treating physician see records.
- **Audit logs**: Log all data access events server-side.
- **Screenshot protection**: Use `FLAG_SECURE` on all screens containing health information.

## Best Practices

- **Accessible UI**: All health metrics must meet WCAG color contrast ratios.
- **Emergency contacts**: Provide quick access to emergency services (112/911) within the app.
- **Data portability**: Allow users to export their health records (PDF/HL7 FHIR).
- **Session management**: Auto-logout after short inactivity periods (5-10 minutes).
