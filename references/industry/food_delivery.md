# Food Delivery App Skills

Food delivery apps combine restaurant discovery, menu browsing, customizable ordering, and real-time delivery tracking.

## 1. Restaurant Listing

```kotlin
@Composable
fun RestaurantCard(restaurant: Restaurant, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column {
            Box {
                AsyncImage(
                    model = restaurant.bannerUrl,
                    contentDescription = restaurant.name,
                    modifier = Modifier.fillMaxWidth().height(160.dp),
                    contentScale = ContentScale.Crop
                )
                if (restaurant.isPromo) {
                    Badge(modifier = Modifier.align(Alignment.TopStart).padding(8.dp)) {
                        Text("PROMO")
                    }
                }
            }
            Column(modifier = Modifier.padding(12.dp)) {
                Text(restaurant.name, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Filled.Star, null, tint = Color(0xFFFFC107), modifier = Modifier.size(14.dp))
                    Text(" ${restaurant.rating}", style = MaterialTheme.typography.bodySmall)
                    Text(" · ${restaurant.estimatedDeliveryTime} min · ${restaurant.deliveryFee}", style = MaterialTheme.typography.bodySmall)
                }
            }
        }
    }
}
```

## 2. Menu with Customization

Use a `ModalBottomSheet` to let users customize their order (size, add-ons, special instructions).

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuItemCustomizationSheet(
    item: MenuItem,
    onAddToCart: (CartItem) -> Unit,
    onDismiss: () -> Unit
) {
    var quantity by remember { mutableIntStateOf(1) }
    val selectedAddOns = remember { mutableStateListOf<AddOn>() }
    var specialInstructions by remember { mutableStateOf("") }

    ModalBottomSheet(onDismissRequest = onDismiss) {
        Column(modifier = Modifier.padding(16.dp)) {
            AsyncImage(model = item.imageUrl, contentDescription = item.name, modifier = Modifier.fillMaxWidth().height(200.dp), contentScale = ContentScale.Crop)
            Spacer(Modifier.height(12.dp))
            Text(item.name, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text(item.description, style = MaterialTheme.typography.bodyMedium)
            Spacer(Modifier.height(16.dp))
            Text("Add-ons", style = MaterialTheme.typography.titleSmall)
            item.addOns.forEach { addOn ->
                Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Checkbox(checked = addOn in selectedAddOns, onCheckedChange = { if (it) selectedAddOns.add(addOn) else selectedAddOns.remove(addOn) })
                    Text(addOn.name, modifier = Modifier.weight(1f))
                    Text("+${addOn.formattedPrice}")
                }
            }
            Spacer(Modifier.height(12.dp))
            OutlinedTextField(
                value = specialInstructions,
                onValueChange = { specialInstructions = it },
                label = { Text("Special instructions (optional)") },
                modifier = Modifier.fillMaxWidth(),
                maxLines = 3
            )
            Spacer(Modifier.height(16.dp))
            QuantitySelector(quantity = quantity, onIncrease = { quantity++ }, onDecrease = { if (quantity > 1) quantity-- })
            Spacer(Modifier.height(12.dp))
            Button(onClick = {
                onAddToCart(CartItem(menuItem = item, quantity = quantity, addOns = selectedAddOns.toList(), note = specialInstructions))
            }, modifier = Modifier.fillMaxWidth()) {
                Text("Add to Cart · ${item.totalPrice(selectedAddOns, quantity).formatted()}")
            }
        }
    }
}
```

## 3. Cart & Order Summary

```kotlin
@Composable
fun CartSummaryCard(cart: Cart) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            cart.items.forEach { item ->
                Row(modifier = Modifier.fillMaxWidth()) {
                    Text("${item.quantity}x ${item.menuItem.name}", modifier = Modifier.weight(1f))
                    Text(item.formattedTotal)
                }
            }
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
            PriceLine("Subtotal", cart.formattedSubtotal)
            PriceLine("Delivery Fee", cart.formattedDeliveryFee)
            PriceLine("Discount", "-${cart.formattedDiscount}", color = Color(0xFF4CAF50))
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
            PriceLine("Total", cart.formattedTotal, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        }
    }
}
```

## 4. Delivery Tracking Map

```kotlin
@Composable
fun DeliveryTrackingScreen(order: ActiveOrder) {
    Box(modifier = Modifier.fillMaxSize()) {
        GoogleMap(modifier = Modifier.fillMaxSize()) {
            Marker(state = MarkerState(order.restaurantLocation), title = "Restaurant")
            Marker(state = MarkerState(order.courierLocation), title = "Courier")
            Marker(state = MarkerState(order.deliveryLocation), title = "Your location")
            Polyline(points = order.routePoints, color = MaterialTheme.colorScheme.primary)
        }
        DeliveryStatusCard(
            modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
            order = order
        )
    }
}
```

## 5. Promo & Voucher System

```kotlin
data class Voucher(
    val code: String,
    val discountType: DiscountType, // PERCENTAGE or FIXED
    val discountValue: Double,
    val minimumOrder: Double,
    val expiresAt: Long
)

fun Cart.applyVoucher(voucher: Voucher): Cart {
    if (subtotal < voucher.minimumOrder) throw VoucherException("Minimum order not met")
    if (System.currentTimeMillis() > voucher.expiresAt) throw VoucherException("Voucher expired")
    val discount = when (voucher.discountType) {
        DiscountType.PERCENTAGE -> subtotal * (voucher.discountValue / 100)
        DiscountType.FIXED -> voucher.discountValue
    }
    return copy(discount = discount, appliedVoucher = voucher)
}
```

## 6. Reorder

Allow users to repeat a previous order with one tap, pre-populating the cart.

```kotlin
fun reorder(previousOrder: Order) = viewModelScope.launch {
    previousOrder.items.forEach { item ->
        cartRepository.addItem(item.toCartItem())
    }
    _events.emit(CartEvent.NavigateToCart)
}
```

## Best Practices

- **Real-time ETA**: Use the courier's live location to compute and update delivery ETA.
- **Out-of-stock items**: Clearly surface unavailable menu items and prevent adding to cart.
- **Minimum order**: Validate the minimum order amount before checkout.
- **Multiple restaurants**: Warn (or clear cart) when the user adds items from a different restaurant.
- **Photo quality**: Use high-quality, appetizing food photos with Coil's crossfade transition.
