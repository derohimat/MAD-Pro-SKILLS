# Travel Booking App Skills

Travel apps combine flight/hotel search, seat selection, booking management, and boarding pass generation in a complex, multi-step flow.

## 1. Flight Search Screen

```kotlin
@Composable
fun FlightSearchScreen(viewModel: FlightSearchViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        // Trip type selector
        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            listOf("One Way", "Round Trip", "Multi-City").forEachIndexed { index, label ->
                SegmentedButton(selected = state.tripType.ordinal == index, onClick = { viewModel.setTripType(index) }, shape = SegmentedButtonDefaults.itemShape(index = index, count = 3)) {
                    Text(label)
                }
            }
        }
        Spacer(Modifier.height(12.dp))
        // Origin / Destination
        Card(modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.padding(16.dp)) {
                AirportPickerField("From", state.origin, onPick = viewModel::pickOrigin)
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                AirportPickerField("To", state.destination, onPick = viewModel::pickDestination)
            }
        }
        Spacer(Modifier.height(8.dp))
        // Date & Pax
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            DatePickerChip(label = "Depart", date = state.departDate, modifier = Modifier.weight(1f), onSelect = viewModel::setDepartDate)
            if (state.tripType == TripType.ROUND_TRIP) DatePickerChip(label = "Return", date = state.returnDate, modifier = Modifier.weight(1f), onSelect = viewModel::setReturnDate)
        }
        Spacer(Modifier.height(8.dp))
        PassengerCountRow(adults = state.adults, children = state.children, infants = state.infants, onUpdate = viewModel::updatePassengers)
        Spacer(Modifier.weight(1f))
        Button(onClick = viewModel::searchFlights, modifier = Modifier.fillMaxWidth().height(56.dp), enabled = state.canSearch) {
            Icon(Icons.Default.Search, null)
            Spacer(Modifier.width(8.dp))
            Text("Search Flights", style = MaterialTheme.typography.titleMedium)
        }
    }
}
```

## 2. Flight Results List

```kotlin
@Composable
fun FlightResultsScreen(viewModel: FlightSearchViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        topBar = { FlightResultsTopBar(route = "${state.origin?.code} → ${state.destination?.code}", date = state.departDate, onFilter = viewModel::openFilter) }
    ) { padding ->
        when {
            state.isLoading -> FlightResultsSkeleton()
            state.flights.isEmpty() -> EmptyFlightsState()
            else -> LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(padding)) {
                items(state.flights, key = { it.id }) { flight ->
                    FlightCard(flight = flight, onClick = { viewModel.selectFlight(flight) })
                }
            }
        }
    }
}

@Composable
fun FlightCard(flight: Flight, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(model = flight.airline.logoUrl, contentDescription = null, modifier = Modifier.size(36.dp))
                Spacer(Modifier.width(8.dp))
                Text(flight.airline.name, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.weight(1f))
                if (flight.isCheapest) Badge { Text("Best Price") }
            }
            Spacer(Modifier.height(12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column { Text(flight.departureTime, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold); Text(flight.origin, style = MaterialTheme.typography.bodySmall) }
                Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(flight.durationLabel, style = MaterialTheme.typography.bodySmall)
                    HorizontalDivider(modifier = Modifier.padding(vertical = 2.dp))
                    Text(if (flight.stops == 0) "Direct" else "${flight.stops} Stop", style = MaterialTheme.typography.labelSmall, color = if (flight.stops == 0) Color(0xFF4CAF50) else MaterialTheme.colorScheme.primary)
                }
                Column(horizontalAlignment = Alignment.End) { Text(flight.arrivalTime, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold); Text(flight.destination, style = MaterialTheme.typography.bodySmall) }
            }
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(flight.formattedPrice, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary, modifier = Modifier.weight(1f))
                OutlinedButton(onClick = onClick) { Text("Select") }
            }
        }
    }
}
```

## 3. Seat Picker

```kotlin
@Composable
fun SeatPickerScreen(seatMap: List<SeatRow>, selectedSeats: List<String>, onSeatSelected: (String) -> Unit) {
    Column(modifier = Modifier.fillMaxSize()) {
        // Seat legend
        Row(modifier = Modifier.padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SeatLegendItem(color = Color(0xFF4CAF50), label = "Available")
            SeatLegendItem(color = MaterialTheme.colorScheme.primary, label = "Selected")
            SeatLegendItem(color = Color.Gray, label = "Occupied")
        }
        // Plane body
        LazyColumn(contentPadding = PaddingValues(horizontal = 24.dp)) {
            items(seatMap, key = { it.rowNumber }) { row ->
                SeatRow(row = row, selectedSeats = selectedSeats, onSeatSelected = onSeatSelected)
            }
        }
    }
}

@Composable
fun SeatRow(row: SeatRow, selectedSeats: List<String>, onSeatSelected: (String) -> Unit) {
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp), verticalAlignment = Alignment.CenterVertically) {
        row.seats.take(3).forEach { seat -> SeatButton(seat = seat, isSelected = seat.id in selectedSeats, onSelect = { onSeatSelected(seat.id) }) }
        Text(row.rowNumber.toString(), modifier = Modifier.width(32.dp), textAlign = TextAlign.Center, style = MaterialTheme.typography.bodySmall)
        row.seats.drop(3).forEach { seat -> SeatButton(seat = seat, isSelected = seat.id in selectedSeats, onSelect = { onSeatSelected(seat.id) }) }
    }
}
```

## 4. Digital Boarding Pass

```kotlin
@Composable
fun BoardingPassScreen(booking: Booking) {
    Card(modifier = Modifier.fillMaxWidth().padding(16.dp), shape = RoundedCornerShape(20.dp)) {
        Column {
            // Header with airline branding
            Box(modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.primary).padding(24.dp)) {
                Column {
                    Text("BOARDING PASS", style = MaterialTheme.typography.labelLarge, color = Color.White.copy(0.7f))
                    Text("${booking.flight.origin} → ${booking.flight.destination}", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold, color = Color.White)
                }
            }
            // Flight details
            Column(modifier = Modifier.padding(24.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    BoardingPassDetail("PASSENGER", booking.passengerName)
                    BoardingPassDetail("CLASS", booking.seatClass)
                    BoardingPassDetail("SEAT", booking.seatNumber)
                }
                Spacer(Modifier.height(16.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    BoardingPassDetail("GATE", booking.gate)
                    BoardingPassDetail("BOARDING", booking.boardingTime)
                    BoardingPassDetail("DEPARTS", booking.flight.departureTime)
                }
            }
            // Dashed divider
            DashedDivider()
            // QR code
            Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                QrCodeDisplay(content = booking.bookingCode, modifier = Modifier.size(140.dp))
                Text(booking.bookingCode, style = MaterialTheme.typography.bodyMedium, fontFamily = FontFamily.Monospace, modifier = Modifier.padding(top = 150.dp))
            }
        }
    }
}
```

## Best Practices

- **Deep linking**: Each booking should be accessible via a deep link (e.g., `myapp://booking/{bookingCode}`) so push notifications can link directly to the boarding pass.
- **Offline boarding pass**: Cache the boarding pass in Room so it's accessible without internet at the airport.
- **Price freshness**: Flight prices change quickly; always re-validate price before final payment.
- **Baggage calculator**: Show a clear breakdown of baggage policies and fees at the fare selection step.
- **Timezone handling**: Always store and transmit flight times in UTC; display in the airport's local timezone.
