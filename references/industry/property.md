# Property & Real Estate App Skills

Property apps require map-based browsing, rich media galleries, advanced filtering, and booking/inquiry flows.

## 1. Property Listing with Map pins

Combine a map view and a scrollable list that sync with each other.

```kotlin
@Composable
fun PropertySearchScreen(viewModel: PropertyViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var showMap by rememberSaveable { mutableStateOf(false) }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { showMap = !showMap }) {
                Icon(if (showMap) Icons.Default.List else Icons.Default.Map, contentDescription = "Toggle view")
            }
        }
    ) { padding ->
        if (showMap) {
            PropertyMapView(
                properties = state.properties,
                onPropertyClick = viewModel::selectProperty,
                modifier = Modifier.padding(padding)
            )
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp), modifier = Modifier.padding(padding)) {
                items(state.properties, key = { it.id }) { property ->
                    PropertyCard(property = property, onClick = { viewModel.selectProperty(property) })
                }
            }
        }
    }
}
```

## 2. Property Card

```kotlin
@Composable
fun PropertyCard(property: Property, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), shape = RoundedCornerShape(16.dp)) {
        Column {
            Box {
                AsyncImage(
                    model = property.mainImageUrl,
                    contentDescription = property.title,
                    modifier = Modifier.fillMaxWidth().height(180.dp),
                    contentScale = ContentScale.Crop
                )
                Row(
                    modifier = Modifier.align(Alignment.TopEnd).padding(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    PropertyBadge(text = property.type) // SELL / RENT
                    if (property.isNew) PropertyBadge(text = "NEW", color = Color(0xFF4CAF50))
                }
                WishlistButton(isWishlisted = property.isWishlisted, onToggle = { /* toggle */ }, modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp))
            }
            Column(modifier = Modifier.padding(12.dp)) {
                Text(property.formattedPrice, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                Text(property.title, style = MaterialTheme.typography.bodyLarge)
                Text(property.address, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                Spacer(Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    PropertySpec(icon = Icons.Default.Bed, value = "${property.bedrooms} Bed")
                    PropertySpec(icon = Icons.Default.Bathtub, value = "${property.bathrooms} Bath")
                    PropertySpec(icon = Icons.Default.SquareFoot, value = "${property.areaSqm} m²")
                }
            }
        }
    }
}
```

## 3. Advanced Filter

```kotlin
data class PropertyFilter(
    val priceRange: ClosedFloatingPointRange<Float> = 0f..5_000_000_000f,
    val propertyTypes: Set<PropertyType> = emptySet(),
    val minBedrooms: Int = 0,
    val minBathrooms: Int = 0,
    val minArea: Float = 0f,
    val facilities: Set<Facility> = emptySet()
)

@Composable
fun PropertyFilterSheet(filter: PropertyFilter, onApply: (PropertyFilter) -> Unit) {
    var localFilter by remember { mutableStateOf(filter) }
    ModalBottomSheet(onDismissRequest = { onApply(localFilter) }) {
        Column(modifier = Modifier.padding(16.dp).verticalScroll(rememberScrollState())) {
            Text("Filters", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))
            Text("Property Type")
            PropertyTypeChips(selected = localFilter.propertyTypes, onToggle = { type ->
                val updated = if (type in localFilter.propertyTypes) localFilter.propertyTypes - type else localFilter.propertyTypes + type
                localFilter = localFilter.copy(propertyTypes = updated)
            })
            Spacer(Modifier.height(12.dp))
            Text("Price Range (IDR)")
            RangeSlider(value = localFilter.priceRange, onValueChange = { localFilter = localFilter.copy(priceRange = it) }, valueRange = 0f..5_000_000_000f)
            Spacer(Modifier.height(12.dp))
            BedroomSelector(selected = localFilter.minBedrooms, onSelect = { localFilter = localFilter.copy(minBedrooms = it) })
            Spacer(Modifier.height(16.dp))
            Button(onClick = { onApply(localFilter) }, modifier = Modifier.fillMaxWidth()) { Text("Apply Filters") }
        }
    }
}
```

## 4. Virtual Tour (360° Image or WebView)

```kotlin
@Composable
fun VirtualTourScreen(tourUrl: String) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                settings.javaScriptEnabled = true
                settings.domStorageEnabled = true
                webViewClient = WebViewClient()
                loadUrl(tourUrl)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
```

## 5. Mortgage Calculator

```kotlin
fun calculateMonthlyPayment(principal: Double, annualRate: Double, termYears: Int): Double {
    val monthlyRate = annualRate / 100 / 12
    val totalMonths = termYears * 12
    return if (monthlyRate == 0.0) principal / totalMonths
    else principal * monthlyRate * (1 + monthlyRate).pow(totalMonths) /
            ((1 + monthlyRate).pow(totalMonths) - 1)
}

@Composable
fun MortgageCalculatorCard() {
    var principal by remember { mutableStateOf("") }
    var rate by remember { mutableStateOf("") }
    var term by remember { mutableStateOf("") }
    val monthly = remember(principal, rate, term) {
        runCatching { calculateMonthlyPayment(principal.toDouble(), rate.toDouble(), term.toInt()) }.getOrNull()
    }
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Mortgage Calculator", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        OutlinedTextField(value = principal, onValueChange = { principal = it }, label = { Text("Property Price (IDR)") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        OutlinedTextField(value = rate, onValueChange = { rate = it }, label = { Text("Annual Interest Rate (%)") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal))
        OutlinedTextField(value = term, onValueChange = { term = it }, label = { Text("Loan Term (years)") }, modifier = Modifier.fillMaxWidth(), keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number))
        monthly?.let {
            Spacer(Modifier.height(12.dp))
            Text("Monthly Payment: ${it.formatted()}", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
        }
    }
}
```

## 6. Booking Calendar

```kotlin
@Composable
fun VisitBookingScreen(availableDates: List<LocalDate>, onBook: (LocalDate, String) -> Unit) {
    var selectedDate by remember { mutableStateOf<LocalDate?>(null) }
    var selectedTime by remember { mutableStateOf<String?>(null) }
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Schedule a Visit", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        CalendarView(availableDates = availableDates, selectedDate = selectedDate, onDateSelected = { selectedDate = it; selectedTime = null })
        selectedDate?.let {
            Spacer(Modifier.height(12.dp))
            TimeSlotPicker(selectedTime = selectedTime, onSelect = { selectedTime = it })
        }
        Spacer(Modifier.weight(1f))
        Button(onClick = { onBook(selectedDate!!, selectedTime!!) }, enabled = selectedDate != null && selectedTime != null, modifier = Modifier.fillMaxWidth()) {
            Text("Confirm Visit")
        }
    }
}
```

## Best Practices

- **Map clustering**: Use marker clustering to avoid clutter when displaying many properties on the map.
- **Deep links**: Support sharing individual property listings via deep links.
- **Nearby amenities**: Show schools, hospitals, and transit within a configurable radius.
- **Price history**: Display a price trend chart on the property detail screen.
