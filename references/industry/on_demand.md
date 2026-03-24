# Industry: On-Demand Services

On-demand services (cleaning, massage, handyman) combine e-commerce scheduling with live tracking elements.

## 📅 UI Execution: Slot Booking

Time slot selection is a critical component. Build a horizontal scrolling grid for dates, and a vertical grid for available times.

```kotlin
@Composable
fun TimeSlotSelector(
    availableSlots: List<TimeSlot>,
    selectedSlot: TimeSlot?,
    onSlotSelected: (TimeSlot) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(3),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(availableSlots) { slot ->
            val isSelected = slot == selectedSlot
            FilterChip(
                selected = isSelected,
                onClick = { onSlotSelected(slot) },
                label = { Text(slot.formattedTime) },
                colors = FilterChipDefaults.filterChipColors(
                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer
                )
            )
        }
    }
}
```

## 🏛️ Architecture: Dynamic Pricing & Availability

Prices in on-demand apps often surge based on availability. Never cache pricing locally for long periods.

1. **Check Availability Phase**: Query backend for slots.
2. **Locking Phase**: When user selects a slot, lock it temporarily on the backend (e.g., for 5 mins).
3. **Checkout Phase**: Verify the lock during payment.

```kotlin
suspend fun reserveSlot(slotId: String): Result<ReservationToken> {
    return api.post("/v1/slots/$slotId/reserve")
}
```
