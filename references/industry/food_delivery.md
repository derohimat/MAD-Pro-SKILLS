# Industry: Food Delivery

Food delivery apps combine restaurant cataloging with ride-hailing style live tracking of couriers.

## 🛒 State Management: The Cart

The cart must be a single source of truth stored locally but periodically synced. Do not lose the cart if the app crashes.

```kotlin
@Entity(tableName = "cart_items")
data class CartItem(
    @PrimaryKey val itemId: String,
    val restaurantId: String,
    val quantity: Int,
    val price: Long,
    val specialInstructions: String?
)

// Repository using Flow for reactive UI updates
class CartRepository(private val dao: CartDao) {
    val currentCart: Flow<List<CartItem>> = dao.observeCart()
    
    suspend fun addItem(item: CartItem) {
        // Enforce single-restaurant cart rules
        val activeRestaurant = dao.getActiveRestaurantId()
        if (activeRestaurant != null && activeRestaurant != item.restaurantId) {
            throw CartConflictException("Clear cart to order from new restaurant")
        }
        dao.insertOrUpdate(item)
    }
}
```

## 🏍️ UI Execution: Courier Tracking

Smooth, animated marker movement using ValueAnimators is critical. Stuttering markers break trust.

```kotlin
fun animateMarkerTo(marker: Marker, targetPosition: LatLng, duration: Long = 1000) {
    val startPosition = marker.position
    val interpolator = FastOutSlowInInterpolator()
    
    ValueAnimator.ofFloat(0f, 1f).apply {
        this.duration = duration
        this.interpolator = interpolator
        addUpdateListener { animation ->
            val v = animation.animatedFraction
            val lng = v * targetPosition.longitude + (1 - v) * startPosition.longitude
            val lat = v * targetPosition.latitude + (1 - v) * startPosition.latitude
            marker.position = LatLng(lat, lng)
            
            // Calculate bearing
            marker.rotation = getRotation(startPosition, targetPosition)
        }
        start()
    }
}
```
