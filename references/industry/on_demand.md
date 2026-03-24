# On-Demand App Skills

On-demand apps (delivery, services, freelance) center around order lifecycle management, real-time status, and in-app communication.

## 1. Order Lifecycle States

Model every possible state of an order as a sealed class.

```kotlin
sealed class OrderLifecycle {
    object Draft : OrderLifecycle()
    object Submitted : OrderLifecycle()
    object Accepted : OrderLifecycle()
    object InProgress : OrderLifecycle()
    data class OutForDelivery(val trackingUrl: String) : OrderLifecycle()
    data class Arrived(val arrivedAt: Long) : OrderLifecycle()
    data class Completed(val completedAt: Long) : OrderLifecycle()
    data class Cancelled(val reason: String, val refund: Boolean) : OrderLifecycle()
    data class Failed(val reason: String) : OrderLifecycle()
}
```

## 2. Real-Time Status via FCM

Push order status updates from the backend using FCM and handle them in a `FirebaseMessagingService`.

```kotlin
class OrderStatusMessagingService : FirebaseMessagingService() {
    override fun onMessageReceived(message: RemoteMessage) {
        val orderId = message.data["order_id"] ?: return
        val status = message.data["status"] ?: return
        // Broadcast to the running app
        LocalBroadcastManager.getInstance(this).sendBroadcast(
            Intent("ORDER_STATUS_UPDATE").apply {
                putExtra("order_id", orderId)
                putExtra("status", status)
            }
        )
    }
}
```

## 3. Status Timeline UI

```kotlin
@Composable
fun OrderStatusTimeline(steps: List<OrderStep>, currentStep: Int) {
    Column {
        steps.forEachIndexed { index, step ->
            val isCompleted = index <= currentStep
            Row(modifier = Modifier.fillMaxWidth()) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Box(
                        modifier = Modifier
                            .size(24.dp)
                            .clip(CircleShape)
                            .background(if (isCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isCompleted) Icon(Icons.Default.Check, null, tint = Color.White, modifier = Modifier.size(14.dp))
                    }
                    if (index < steps.lastIndex) {
                        Box(modifier = Modifier.width(2.dp).height(32.dp).background(if (isCompleted) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline))
                    }
                }
                Spacer(modifier = Modifier.width(12.dp))
                Column(modifier = Modifier.padding(bottom = 16.dp)) {
                    Text(step.title, fontWeight = if (isCompleted) FontWeight.SemiBold else FontWeight.Normal)
                    step.timestamp?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                }
            }
        }
    }
}
```

## 4. ETA Display with Countdown

```kotlin
@Composable
fun EtaCountdown(etaMillis: Long) {
    var remaining by remember { mutableLongStateOf(etaMillis - System.currentTimeMillis()) }
    LaunchedEffect(etaMillis) {
        while (remaining > 0) {
            delay(60_000L)
            remaining = etaMillis - System.currentTimeMillis()
        }
    }
    val minutes = (remaining / 60_000).coerceAtLeast(0)
    Text(
        text = if (minutes > 0) "Arriving in ~$minutes min" else "Arriving now",
        style = MaterialTheme.typography.titleMedium,
        color = MaterialTheme.colorScheme.primary
    )
}
```

## 5. Provider/Worker Rating

Show a post-completion rating screen using a star rating component.

```kotlin
@Composable
fun RatingSubmissionScreen(providerName: String, onSubmit: (Int, String) -> Unit) {
    var rating by remember { mutableIntStateOf(0) }
    var comment by remember { mutableStateOf("") }
    Column(modifier = Modifier.padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("How was $providerName?", style = MaterialTheme.typography.titleLarge)
        Spacer(modifier = Modifier.height(16.dp))
        StarRating(selected = rating, onRate = { rating = it })
        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = comment,
            onValueChange = { comment = it },
            label = { Text("Leave a comment (optional)") },
            modifier = Modifier.fillMaxWidth(),
            maxLines = 4
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = { onSubmit(rating, comment) }, enabled = rating > 0, modifier = Modifier.fillMaxWidth()) {
            Text("Submit Review")
        }
    }
}
```

## 6. Order History

Cache past orders in Room for offline access and fast reload.

```kotlin
@Entity(tableName = "orders")
data class OrderEntity(
    @PrimaryKey val id: String,
    val status: String,
    val createdAt: Long,
    val totalAmount: Double,
    val providerName: String,
    val providerPhotoUrl: String
)

@Dao
interface OrderDao {
    @Query("SELECT * FROM orders ORDER BY createdAt DESC")
    fun observeAll(): Flow<List<OrderEntity>>

    @Upsert
    suspend fun upsert(order: OrderEntity)
}
```

## Best Practices

- **Idempotent order submission**: Use a client-generated `requestId` to prevent duplicate orders on retry.
- **Connection banner**: Show a banner when the real-time connection drops so users know status may be stale.
- **Cancellation window**: Only allow cancellation within a defined time window after submission.
- **Notification channel**: Create a dedicated FCM notification channel for order updates.
