# Skill: Analytics & Tracking

A scalable analytics architecture prevents business logic from being polluted with dozens of tracking SDK calls (Firebase, Mixpanel, Amplitude).

## 📊 Architecture: Analytics Event Bus

Never inject `FirebaseAnalytics` directly into a ViewModel or Composable.Create an `AnalyticsEngine` interface to centralize event routing.

```kotlin
// 1. Define standard events to guarantee type-safety
sealed class AnalyticsEvent(val eventName: String, val params: Map<String, Any> = emptyMap()) {
    data class ScreenAdded(val screenName: String) : AnalyticsEvent("screen_view", mapOf("screen" to screenName))
    data class ItemAddedToCart(val itemId: String, val price: Double) : AnalyticsEvent("add_to_cart", mapOf("item_id" to itemId, "price" to price))
    data class CheckoutCompleted(val total: Double) : AnalyticsEvent("checkout_completed", mapOf("total" to total))
}

// 2. Core Interface
interface AnalyticsEngine {
    fun trackEvent(event: AnalyticsEvent)
    fun setUserProperty(key: String, value: String)
}

// 3. Implementation routes to 3rd party SDKs
class DefaultAnalyticsEngine(
    private val firebase: FirebaseAnalytics,
    private val mixpanel: MixpanelAPI
) : AnalyticsEngine {
    
    override fun trackEvent(event: AnalyticsEvent) {
        val bundle = Bundle().apply { 
            event.params.forEach { (k, v) -> putString(k, v.toString()) }
        }
        
        firebase.logEvent(event.eventName, bundle)
        mixpanel.track(event.eventName, JSONObject(event.params))
    }
}
```

## 🎯 UI Execution: Compose Screen Tracking

Use `DisposableEffect` to automatically track screen entry/exit times.

```kotlin
@Composable
fun TrackScreenView(screenName: String, engine: AnalyticsEngine = LocalAnalytics.current) {
    DisposableEffect(screenName) {
        val startTime = System.currentTimeMillis()
        engine.trackEvent(AnalyticsEvent.ScreenAdded(screenName))
        
        onDispose {
            val durationInSeconds = (System.currentTimeMillis() - startTime) / 1000
            engine.trackEvent(AnalyticsEvent.ScreenExit(screenName, durationInSeconds))
        }
    }
}
```
