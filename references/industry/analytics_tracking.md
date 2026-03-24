# Analytics & Event Tracking Skills

Analytics help you understand user behavior and measure key business metrics across any industry app.

## 1. Firebase Analytics Event Naming Convention

Follow a consistent naming scheme: `snake_case`, noun_verb pattern.

```kotlin
object AnalyticsEvent {
    // E-commerce
    const val PRODUCT_VIEWED = "product_viewed"
    const val ADD_TO_CART = "add_to_cart"
    const val PURCHASE_COMPLETED = "purchase_completed"
    const val CHECKOUT_STARTED = "checkout_started"
    // Ride-hailing
    const val RIDE_BOOKING_STARTED = "ride_booking_started"
    const val DRIVER_ACCEPTED = "driver_accepted"
    const val RIDE_COMPLETED = "ride_completed"
    // Content
    const val CONTENT_VIEWED = "content_viewed"
    const val VIDEO_PLAYED = "video_played"
    const val SEARCH_PERFORMED = "search_performed"
    // Engagement
    const val NOTIFICATION_TAPPED = "notification_tapped"
    const val SHARE_TAPPED = "share_tapped"
    const val RATING_SUBMITTED = "rating_submitted"
}
```

## 2. Analytics Tracker Interface

Abstraction allows easy swapping of analytics backends or adding multiple providers.

```kotlin
interface AnalyticsTracker {
    fun track(event: String, params: Map<String, Any> = emptyMap())
    fun setUserProperty(key: String, value: String)
    fun setUserId(id: String?)
}

class FirebaseAnalyticsTracker(private val analytics: FirebaseAnalytics) : AnalyticsTracker {
    override fun track(event: String, params: Map<String, Any>) {
        val bundle = Bundle().apply {
            params.forEach { (key, value) ->
                when (value) {
                    is String -> putString(key, value)
                    is Int -> putInt(key, value)
                    is Double -> putDouble(key, value)
                    is Long -> putLong(key, value)
                    is Boolean -> putBoolean(key, value)
                }
            }
        }
        analytics.logEvent(event, bundle)
    }
    override fun setUserProperty(key: String, value: String) = analytics.setUserProperty(key, value)
    override fun setUserId(id: String?) = analytics.setUserId(id)
}
```

## 3. Tracking in ViewModel

```kotlin
@HiltViewModel
class ProductViewModel @Inject constructor(
    private val productRepo: ProductRepository,
    private val tracker: AnalyticsTracker
) : ViewModel() {

    fun onProductViewed(product: Product) {
        tracker.track(AnalyticsEvent.PRODUCT_VIEWED, mapOf(
            "product_id" to product.id,
            "product_name" to product.name,
            "product_category" to product.category,
            "price" to product.price
        ))
    }

    fun onAddToCart(product: Product, quantity: Int) {
        tracker.track(AnalyticsEvent.ADD_TO_CART, mapOf(
            "product_id" to product.id,
            "quantity" to quantity,
            "value" to (product.price * quantity)
        ))
    }
}
```

## 4. Screen Tracking

Track screen views automatically by observing navigation events.

```kotlin
@Composable
fun AnalyticsNavHost(navController: NavHostController, tracker: AnalyticsTracker) {
    val currentEntry by navController.currentBackStackEntryAsState()
    val currentRoute = currentEntry?.destination?.route

    LaunchedEffect(currentRoute) {
        currentRoute?.let { route ->
            tracker.track(FirebaseAnalytics.Event.SCREEN_VIEW, mapOf(
                FirebaseAnalytics.Param.SCREEN_NAME to route,
                FirebaseAnalytics.Param.SCREEN_CLASS to route
            ))
        }
    }
}
```

## 5. Funnel Tracking

Track each step of a multi-step flow (checkout, onboarding) to identify where users drop off.

```kotlin
sealed class CheckoutStep(val stepNumber: Int, val stepName: String) {
    object Address : CheckoutStep(1, "address")
    object Shipping : CheckoutStep(2, "shipping")
    object Payment : CheckoutStep(3, "payment")
    object Review : CheckoutStep(4, "review")
}

fun trackCheckoutStep(step: CheckoutStep, orderId: String) {
    tracker.track("checkout_step_viewed", mapOf(
        "step" to step.stepNumber,
        "step_name" to step.stepName,
        "order_id" to orderId
    ))
}
```

## 6. User Properties

Segment users by properties for targeted analysis.

```kotlin
fun setUserSegmentProperties(user: User) {
    tracker.setUserId(user.id)
    tracker.setUserProperty("subscription_tier", user.subscriptionTier)
    tracker.setUserProperty("account_age_days", user.accountAgeDays.toString())
    tracker.setUserProperty("preferred_category", user.preferredCategory)
    tracker.setUserProperty("country", user.country)
}
```

## Best Practices

- **Debug mode**: Use `adb shell setprop debug.firebase.analytics.app com.yourpackage` to see events in real time.
- **Don't over-track**: Focus on events that answer business questions. Fewer, meaningful events > hundreds of noisy ones.
- **PII**: Never log personally identifiable information (email, phone, full name) in event parameters.
- **Revenue events**: Use `FirebaseAnalytics.Event.PURCHASE` with `CURRENCY` and `VALUE` for revenue reporting.
- **BigQuery export**: Enable BigQuery export in Firebase console for raw event analysis.
