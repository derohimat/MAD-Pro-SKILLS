# In-App Payments & Billing Skills

Implement Google Play Billing for subscriptions, one-time purchases, and consumable products.

## 1. BillingClient Setup

```kotlin
class BillingManager(private val context: Context) {
    private val _billingState = MutableStateFlow<BillingState>(BillingState.Disconnected)
    val billingState: StateFlow<BillingState> = _billingState

    private val billingClient = BillingClient.newBuilder(context)
        .setListener { billingResult, purchases ->
            if (billingResult.responseCode == BillingClient.BillingResponseCode.OK && purchases != null) {
                purchases.forEach { processPurchase(it) }
            }
        }
        .enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().enablePrepaidPlans().build())
        .build()

    fun connect() {
        billingClient.startConnection(object : BillingClientStateListener {
            override fun onBillingSetupFinished(result: BillingResult) {
                if (result.responseCode == BillingClient.BillingResponseCode.OK) {
                    _billingState.value = BillingState.Connected
                }
            }
            override fun onBillingServiceDisconnected() {
                _billingState.value = BillingState.Disconnected
            }
        })
    }

    fun disconnect() = billingClient.endConnection()
}
```

## 2. Querying Available Products

```kotlin
suspend fun BillingClient.queryProducts(productIds: List<String>, type: String): List<ProductDetails> {
    val params = QueryProductDetailsParams.newBuilder()
        .setProductList(productIds.map {
            QueryProductDetailsParams.Product.newBuilder().setProductId(it).setProductType(type).build()
        })
        .build()
    return queryProductDetailsAsync(params).productDetailsList ?: emptyList()
}

// Usage
val subs = billingClient.queryProducts(listOf("premium_monthly", "premium_annual"), BillingClient.ProductType.SUBS)
val iap = billingClient.queryProducts(listOf("extra_credits"), BillingClient.ProductType.INAPP)
```

## 3. Launching the Purchase Flow

```kotlin
fun launchPurchaseFlow(activity: Activity, productDetails: ProductDetails, offerToken: String? = null) {
    val offerDetails = offerToken?.let {
        BillingFlowParams.ProductDetailsParams.newBuilder()
            .setProductDetails(productDetails)
            .setOfferToken(it)
            .build()
    } ?: BillingFlowParams.ProductDetailsParams.newBuilder()
        .setProductDetails(productDetails)
        .build()

    val billingFlowParams = BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(listOf(offerDetails))
        .build()
    billingClient.launchBillingFlow(activity, billingFlowParams)
}
```

## 4. Acknowledging Purchases

All purchases must be acknowledged within 3 days or they will be refunded automatically.

```kotlin
suspend fun processPurchase(purchase: Purchase) {
    if (purchase.purchaseState != Purchase.PurchaseState.PURCHASED) return
    // Verify receipt with your backend first
    val isValid = backendRepository.verifyPurchase(purchase.purchaseToken)
    if (!isValid) return

    // Grant entitlement
    entitlementRepository.grantAccess(purchase.products)

    // Acknowledge
    if (!purchase.isAcknowledged) {
        val params = AcknowledgePurchaseParams.newBuilder()
            .setPurchaseToken(purchase.purchaseToken)
            .build()
        billingClient.acknowledgePurchase(params)
    }
}
```

## 5. Checking Entitlement

```kotlin
suspend fun BillingClient.isSubscribed(productId: String): Boolean {
    val params = QueryPurchasesParams.newBuilder()
        .setProductType(BillingClient.ProductType.SUBS)
        .build()
    val result = queryPurchasesAsync(params)
    return result.purchasesList.any { purchase ->
        purchase.products.contains(productId) && purchase.purchaseState == Purchase.PurchaseState.PURCHASED
    }
}
```

## 6. Paywall UI

```kotlin
@Composable
fun PaywallScreen(plans: List<ProductDetails>, onPurchase: (ProductDetails) -> Unit, onRestore: () -> Unit) {
    Column(modifier = Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Unlock Premium", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
        Text("Access all features with a subscription", style = MaterialTheme.typography.bodyMedium)
        Spacer(Modifier.height(32.dp))
        plans.forEach { plan ->
            PlanCard(plan = plan, isRecommended = plan.productId.contains("annual"), onClick = { onPurchase(plan) })
            Spacer(Modifier.height(12.dp))
        }
        Spacer(Modifier.weight(1f))
        TextButton(onClick = onRestore) { Text("Restore Purchases") }
    }
}
```

## Best Practices

- **Server-side verification**: Always verify purchase tokens server-side. Client-side checks alone are insecure.
- **Handle pending purchases**: The `PENDING` state is real (e.g., cash-pay kiosks). Do not grant access until `PURCHASED`.
- **Subscription states**: Handle `onHold`, `paused`, and `grace period` subscription states gracefully.
- **Test accounts**: Use Google Play test accounts with test product IDs to validate flows without real charges.
- **Restore purchases**: Always provide a "Restore Purchases" option for users who reinstall the app.
