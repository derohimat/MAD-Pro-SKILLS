# Skill: In-App Payments & Billing

Integrating Google Play Billing requires strict adherence to purchase verification lifecycles.

## 💳 Architecture: The Billing Lifecycle

1. **Connect**: Initialize `BillingClient`.
2. **Query**: Fetch local-specific pricing for `ProductDetails`.
3. **Launch**: Show the Google Play bottom sheet.
4. **Verify**: When purchase succeeds on-device, send the token to your backend to verify with Google's API (prevent spoofing).
5. **Acknowledge**: You *must* acknowledge the purchase within 3 days, or Google refunds the user automatically.

## 🛠️ Execution: BillingClient Wrapper

Wrap the volatile `BillingClient` in a Flow/State-based architecture.

```kotlin
class BillingManager(context: Context) : PurchasesUpdatedListener {

    private val billingClient = BillingClient.newBuilder(context)
        .setListener(this)
        .enablePendingPurchases()
        .build()

    // 1. Connect
    fun startConnection() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    queryProducts()
                }
            }
            override fun onBillingServiceDisconnected() {
                // Implement exponential backoff retry
            }
        })
    }

    // 3. Purchase Result Callback
    override fun onPurchasesUpdated(result: BillingResult, purchases: List<Purchase>?) {
        if (result.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
            for (purchase in purchases) {
                verifyAndAcknowledge(purchase)
            }
        }
    }

    // 4 & 5. Verify and Acknowledge
    private fun verifyAndAcknowledge(purchase: Purchase) {
        if (purchase.purchaseState == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged) {
                // TODO: Send purchase.purchaseToken to your backend First!
                // If backend succeeds, then acknowledge:
                val params = AcknowledgePurchaseParams.newBuilder()
                    .setPurchaseToken(purchase.purchaseToken)
                    .build()
                billingClient.acknowledgePurchase(params) { /* Log success */ }
            }
        }
    }
}
```
