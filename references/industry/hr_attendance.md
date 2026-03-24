# HR & Attendance App Skills

HR apps cover employee self-service: attendance check-in/out, leave management, payslip viewing, and performance tracking.

## 1. GPS-Based Clock In/Out

```kotlin
@Composable
fun AttendanceCheckInScreen(viewModel: AttendanceViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val locationPermissionState = rememberPermissionState(android.Manifest.permission.ACCESS_FINE_LOCATION)

    Column(modifier = Modifier.fillMaxSize(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.Center) {
        // Digital clock
        val currentTime by produceState(initialValue = LocalTime.now()) {
            while (true) { delay(1000); value = LocalTime.now() }
        }
        Text(text = currentTime.format(DateTimeFormatter.ofPattern("HH:mm:ss")), style = MaterialTheme.typography.displayMedium, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
        Text(LocalDate.now().format(DateTimeFormatter.ofPattern("EEEE, dd MMMM yyyy")), style = MaterialTheme.typography.bodyLarge, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(32.dp))
        // Location status
        state.currentAddress?.let {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.LocationOn, null, tint = if (state.isInsideOffice) Color(0xFF4CAF50) else Color(0xFFF44336))
                Spacer(Modifier.width(4.dp))
                Text(it, style = MaterialTheme.typography.bodyMedium)
            }
            if (!state.isInsideOffice) Text("You are outside the office radius", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
        }
        Spacer(Modifier.height(32.dp))
        // Check In / Out button
        val isCheckedIn = state.todayAttendance?.checkIn != null && state.todayAttendance.checkOut == null
        Button(
            onClick = {
                if (locationPermissionState.status.isGranted) {
                    if (isCheckedIn) viewModel.checkOut() else viewModel.checkIn()
                } else locationPermissionState.launchPermissionRequest()
            },
            modifier = Modifier.size(160.dp).clip(CircleShape),
            enabled = !state.isLoading && (state.isInsideOffice || BuildConfig.DEBUG),
            colors = ButtonDefaults.buttonColors(containerColor = if (isCheckedIn) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(if (isCheckedIn) Icons.Default.ExitToApp else Icons.Default.Login, null, modifier = Modifier.size(32.dp))
                Spacer(Modifier.height(4.dp))
                Text(if (isCheckedIn) "Check Out" else "Check In", fontWeight = FontWeight.Bold)
            }
        }
    }
}
```

## 2. Monthly Attendance Log

```kotlin
@Composable
fun AttendanceCalendar(records: Map<LocalDate, AttendanceRecord>) {
    val today = LocalDate.now()
    val dates = remember(today) { (1..today.lengthOfMonth()).map { today.withDayOfMonth(it) } }

    LazyVerticalGrid(columns = GridCells.Fixed(7), modifier = Modifier.fillMaxWidth()) {
        // Day headers
        listOf("M", "T", "W", "T", "F", "S", "S").forEach { day ->
            item { Text(day, textAlign = TextAlign.Center, style = MaterialTheme.typography.labelSmall, modifier = Modifier.padding(4.dp)) }
        }
        // Empty cells for first week offset
        val offset = dates.first().dayOfWeek.value - 1
        items(offset) { Spacer(Modifier.size(40.dp)) }
        // Date cells
        items(dates, key = { it }) { date ->
            val record = records[date]
            Box(modifier = Modifier.size(40.dp).padding(2.dp).clip(CircleShape).background(record?.statusColor ?: Color.Transparent), contentAlignment = Alignment.Center) {
                Text(date.dayOfMonth.toString(), style = MaterialTheme.typography.bodySmall, color = if (date == today) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface, fontWeight = if (date == today) FontWeight.Bold else FontWeight.Normal)
            }
        }
    }
}
```

## 3. Leave Request Submission

```kotlin
@Composable
fun LeaveRequestForm(viewModel: LeaveViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Request Leave", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        // Leave type selector
        ExposedDropdownMenuBox(expanded = state.isTypeMenuExpanded, onExpandedChange = viewModel::toggleTypeMenu) {
            OutlinedTextField(value = state.selectedType.displayName, onValueChange = {}, label = { Text("Leave Type") }, readOnly = true, trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = state.isTypeMenuExpanded) }, modifier = Modifier.fillMaxWidth().menuAnchor())
            ExposedDropdownMenu(expanded = state.isTypeMenuExpanded, onDismissRequest = { viewModel.toggleTypeMenu(false) }) {
                LeaveType.entries.forEach { type ->
                    DropdownMenuItem(text = { Text(type.displayName) }, onClick = { viewModel.selectLeaveType(type) })
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        // Date range picker
        DateRangePickerField(startDate = state.startDate, endDate = state.endDate, onDateRangeSelected = viewModel::onDateRangeSelected)
        Spacer(Modifier.height(12.dp))
        // Leave balance
        state.leaveBalance?.let {
            Text("Remaining ${state.selectedType.displayName}: ${it.remaining}/${it.total} days", style = MaterialTheme.typography.bodySmall, color = if (it.remaining > 0) Color(0xFF4CAF50) else MaterialTheme.colorScheme.error)
        }
        Spacer(Modifier.height(12.dp))
        OutlinedTextField(value = state.reason, onValueChange = viewModel::onReasonChange, label = { Text("Reason") }, modifier = Modifier.fillMaxWidth(), minLines = 3)
        Spacer(Modifier.height(24.dp))
        Button(onClick = viewModel::submitLeave, enabled = state.isFormValid, modifier = Modifier.fillMaxWidth()) { Text("Submit Request") }
    }
}
```

## 4. Payslip Viewer

```kotlin
@Composable
fun PayslipScreen(payslip: Payslip) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Header
        Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text(payslip.employeeName, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Text("${payslip.position} · ${payslip.department}", style = MaterialTheme.typography.bodyMedium)
                Text("Period: ${payslip.period}", style = MaterialTheme.typography.bodySmall)
            }
        }
        LazyColumn(contentPadding = PaddingValues(16.dp)) {
            item { PayslipSection("Earnings", payslip.earnings, isPositive = true) }
            item { PayslipSection("Deductions", payslip.deductions, isPositive = false) }
            item {
                Card(modifier = Modifier.fillMaxWidth(), colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)) {
                    Row(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        Text("Net Salary", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                        Text(payslip.formattedNetSalary, fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary)
                    }
                }
            }
            item {
                Spacer(Modifier.height(16.dp))
                OutlinedButton(onClick = { /* download PDF */ }, modifier = Modifier.fillMaxWidth()) {
                    Icon(Icons.Default.Download, null)
                    Spacer(Modifier.width(4.dp))
                    Text("Download PDF")
                }
            }
        }
    }
}
```

## 5. Face Recognition Check-In (ML Kit)

```kotlin
fun detectFaceForAttendance(bitmap: Bitmap, onFaceDetected: (Boolean) -> Unit) {
    val inputImage = InputImage.fromBitmap(bitmap, 0)
    val options = FaceDetectorOptions.Builder()
        .setPerformanceMode(FaceDetectorOptions.PERFORMANCE_MODE_ACCURATE)
        .setLandmarkMode(FaceDetectorOptions.LANDMARK_MODE_ALL)
        .setClassificationMode(FaceDetectorOptions.CLASSIFICATION_MODE_ALL)
        .build()
    FaceDetection.getClient(options).process(inputImage)
        .addOnSuccessListener { faces ->
            val isValidFace = faces.size == 1 && (faces.first().headEulerAngleY in -15f..15f) // Facing forward
            onFaceDetected(isValidFace)
        }
}
```

## Best Practices

- **Geofence vs GPS**: Use a 100–200m geofence radius to account for GPS drift indoors.
- **Offline check-in**: Cache check-in attempts locally and sync when network is available.
- **Device timezone**: Always record attendance timestamps in UTC and convert to local time for display.
- **Biometric fallback**: Offer PIN/password fallback if face recognition fails (lighting, occlusion).
- **Privacy**: Obtain consent before using face recognition for attendance. Store only embeddings, never raw images.
