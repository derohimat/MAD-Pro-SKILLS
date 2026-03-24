# Google Play Subscriptions Skills

Advanced Play Billing for monthly, yearly, free trial, intro-price, and multi-tier subscription implementations.

## 1. Subscription Product Structure

In Play Console, a **Subscription** has:

- **Base Plans**: billing period (monthly, yearly, weekly)
- **Offers**: free trial, introductory price, developer-managed

```kotlin
// Each ProductDetails returns SubscriptionOfferDetails per offer
data class SubscriptionPlan(
    val productDetails: ProductDetails,
    val offerDetails: ProductDetails.SubscriptionOfferDetails,
) {
    val offerId: String get() = offerDetails.offerId ?: ""
    val offerToken: String get() = offerDetails.offerToken
    val pricingPhases: List<ProductDetails.PricingPhase> get() = offerDetails.pricingPhases.pricingPhaseList
    val freeTrialDays: Int? get() = pricingPhases.firstOrNull { it.priceAmountMicros == 0L }?.let {
        it.billingPeriod.removePrefix("P").removeSuffix("D").toIntOrNull()
    }
    val introPrice: String? get() = pricingPhases.firstOrNull { it.priceAmountMicros > 0 && pricingPhases.size > 1 }?.formattedPrice
    val recurringPrice: String get() = pricingPhases.last().formattedPrice
    val billingPeriodLabel: String get() = when (pricingPhases.last().billingPeriod) {
        "P1M" -> "month"
        "P1Y" -> "year"
        "P1W" -> "week"
        else -> pricingPhases.last().billingPeriod
    }
}
```

## 2. Querying All Subscription Plans

```kotlin
@Singleton
class SubscriptionRepository @Inject constructor(
    private val billingClient: BillingClient,
    private val backendApi: BackendApi,
    private val dataStore: DataStore<Preferences>
) {
    companion object {
        val PRODUCT_IDS = listOf("premium_monthly", "premium_yearly", "premium_weekly")
        val ENTITLEMENT_KEY = booleanPreferencesKey("is_premium")
    }

    suspend fun getSubscriptionPlans(): List<SubscriptionPlan> {
        val params = QueryProductDetailsParams.newBuilder()
            .setProductList(PRODUCT_IDS.map {
                QueryProductDetailsParams.Product.newBuilder()
                    .setProductId(it)
                    .setProductType(BillingClient.ProductType.SUBS)
                    .build()
            }).build()

        val result = billingClient.queryProductDetailsAsync(params)
        if (result.billingResult.responseCode != BillingClient.BillingResponseCode.OK) return emptyList()

        return result.productDetailsList.flatMap { productDetails ->
            productDetails.subscriptionOfferDetails?.map { offerDetails ->
                SubscriptionPlan(productDetails, offerDetails)
            } ?: emptyList()
        }
    }

    suspend fun getActiveSubscription(): Purchase? {
        val params = QueryPurchasesParams.newBuilder()
            .setProductType(BillingClient.ProductType.SUBS).build()
        val result = billingClient.queryPurchasesAsync(params)
        return result.purchasesList.firstOrNull { it.purchaseState == Purchase.PurchaseState.PURCHASED }
    }
}
```

## 3. Paywall Screen with Plan Comparison

```kotlin
@Composable
fun SubscriptionPaywallScreen(viewModel: SubscriptionViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var selectedPlanIndex by remember { mutableIntStateOf(1) } // Default: yearly

    Column(modifier = Modifier.fillMaxSize()) {
        // Hero section
        PaywallHeroSection()

        // Plans
        Column(modifier = Modifier.weight(1f).verticalScroll(rememberScrollState()).padding(horizontal = 20.dp)) {
            Spacer(Modifier.height(24.dp))
            Text("Choose Your Plan", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Spacer(Modifier.height(16.dp))
            state.plans.forEachIndexed { index, plan ->
                SubscriptionPlanCard(
                    plan = plan,
                    isSelected = selectedPlanIndex == index,
                    isRecommended = plan.billingPeriodLabel == "year",
                    onClick = { selectedPlanIndex = index }
                )
                Spacer(Modifier.height(10.dp))
            }
            Spacer(Modifier.height(12.dp))
            // Feature list
            PremiumFeaturesList()
        }

        // CTA section
        Surface(shadowElevation = 8.dp) {
            Column(modifier = Modifier.padding(20.dp)) {
                state.plans.getOrNull(selectedPlanIndex)?.let { plan ->
                    SubscribeButton(plan = plan, isLoading = state.isLoading, onSubscribe = { viewModel.subscribe(plan) })
                    Spacer(Modifier.height(8.dp))
                    plan.freeTrialDays?.let {
                        Text("Start your ${it}-day free trial. Cancel anytime.", style = MaterialTheme.typography.bodySmall, textAlign = TextAlign.Center, modifier = Modifier.fillMaxWidth())
                    }
                }
                Spacer(Modifier.height(4.dp))
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.Center) {
                    TextButton(onClick = viewModel::restorePurchases) { Text("Restore Purchases") }
                    Text("·", modifier = Modifier.align(Alignment.CenterVertically))
                    TextButton(onClick = { /* open terms */ }) { Text("Terms") }
                    Text("·", modifier = Modifier.align(Alignment.CenterVertically))
                    TextButton(onClick = { /* open privacy */ }) { Text("Privacy") }
                }
            }
        }
    }
}
```

## 4. Subscription Plan Card

```kotlin
@Composable
fun SubscriptionPlanCard(plan: SubscriptionPlan, isSelected: Boolean, isRecommended: Boolean, onClick: () -> Unit) {
    val borderColor by animateColorAsState(if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline, label = "border")
    val containerColor by animateColorAsState(if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface, label = "bg")

    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        border = BorderStroke(if (isSelected) 2.dp else 1.dp, borderColor),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Column(modifier = Modifier.weight(1f)) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        Text(
                            plan.billingPeriodLabel.replaceFirstChar { it.uppercase() },
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        if (isRecommended) {
                            Badge(containerColor = MaterialTheme.colorScheme.primary) { Text("BEST VALUE") }
                        }
                    }
                    // Show free trial info
                    plan.freeTrialDays?.let {
                        Text("$it-day free trial, then", style = MaterialTheme.typography.bodySmall, color = Color(0xFF4CAF50), fontWeight = FontWeight.SemiBold)
                    }
                    // Show intro price info
                    plan.introPrice?.let {
                        Text("$it for first period, then", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.tertiary, fontWeight = FontWeight.SemiBold)
                    }
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text(plan.recurringPrice, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = MaterialTheme.colorScheme.primary)
                    Text("/${plan.billingPeriodLabel}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    // Show yearly per-month breakdown
                    if (plan.billingPeriodLabel == "year") {
                        val monthlyEquiv = plan.pricingPhases.last().priceAmountMicros / 12_000_000.0
                        Text("≈ %.2f/mo".format(monthlyEquiv), style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                    }
                }
            }
            // Radio indicator
            if (isSelected) {
                Spacer(Modifier.height(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(Icons.Default.CheckCircle, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(16.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Selected", style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary)
                }
            }
        }
    }
}
```

## 5. Subscribe Button with State

```kotlin
@Composable
fun SubscribeButton(plan: SubscriptionPlan, isLoading: Boolean, onSubscribe: () -> Unit) {
    Button(
        onClick = onSubscribe,
        modifier = Modifier.fillMaxWidth().height(56.dp),
        enabled = !isLoading
    ) {
        if (isLoading) {
            CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary, strokeWidth = 2.dp)
        } else {
            val ctaText = when {
                plan.freeTrialDays != null -> "Start Free Trial"
                plan.introPrice != null -> "Get Intro Price"
                else -> "Subscribe · ${plan.recurringPrice}/${plan.billingPeriodLabel}"
            }
            Text(ctaText, style = MaterialTheme.typography.titleMedium)
        }
    }
}
```

## 6. Launch Purchase Flow

```kotlin
@HiltViewModel
class SubscriptionViewModel @Inject constructor(
    private val repository: SubscriptionRepository,
    private val billingClient: BillingClient
) : ViewModel() {

    fun subscribe(plan: SubscriptionPlan) {
        val activity = activityProvider.currentActivity ?: return
        val params = BillingFlowParams.newBuilder()
            .setProductDetailsParamsList(
                listOf(
                    BillingFlowParams.ProductDetailsParams.newBuilder()
                        .setProductDetails(plan.productDetails)
                        .setOfferToken(plan.offerToken)
                        .build()
                )
            )
            .build()
        billingClient.launchBillingFlow(activity, params)
    }
}
```

## 7. Upgrade / Downgrade (Plan Switch)

```kotlin
fun upgradePlan(activity: Activity, newPlan: SubscriptionPlan, existingPurchaseToken: String) {
    val updateParams = BillingFlowParams.SubscriptionUpdateParams.newBuilder()
        .setOldPurchaseToken(existingPurchaseToken)
        .setSubscriptionReplacementMode(BillingFlowParams.SubscriptionUpdateParams.ReplacementMode.CHARGE_PRORATED_PRICE)
        // Modes: CHARGE_PRORATED_PRICE (upgrade), WITHOUT_PRORATION (downgrade), CHARGE_FULL_PRICE
        .build()

    val params = BillingFlowParams.newBuilder()
        .setProductDetailsParamsList(
            listOf(
                BillingFlowParams.ProductDetailsParams.newBuilder()
                    .setProductDetails(newPlan.productDetails)
                    .setOfferToken(newPlan.offerToken)
                    .build()
            )
        )
        .setSubscriptionUpdateParams(updateParams)
        .build()

    billingClient.launchBillingFlow(activity, params)
}
```

## 8. Subscription Lifecycle States UI

```kotlin
sealed class SubscriptionStatus {
    object NotSubscribed : SubscriptionStatus()
    data class Active(val renewalDate: Long, val productId: String) : SubscriptionStatus()
    data class FreeTrial(val trialEndsAt: Long, val productId: String) : SubscriptionStatus()
    data class GracePeriod(val gracePeriodEndsAt: Long) : SubscriptionStatus()
    data class OnHold(val message: String) : SubscriptionStatus()
    data class Paused(val resumeAt: Long) : SubscriptionStatus()
    object Expired : SubscriptionStatus()
    object Cancelled : SubscriptionStatus() // Still active until period end
}

@Composable
fun SubscriptionStatusBanner(status: SubscriptionStatus) {
    when (status) {
        is SubscriptionStatus.GracePeriod -> WarningBanner("Payment issue. Update your payment method before ${status.gracePeriodEndsAt.formatDate()} to avoid losing access.")
        is SubscriptionStatus.OnHold -> ErrorBanner("Your subscription is on hold. ${status.message}")
        is SubscriptionStatus.Paused -> InfoBanner("Subscription paused. Resumes on ${status.resumeAt.formatDate()}.")
        is SubscriptionStatus.FreeTrial -> SuccessBanner("Free trial active until ${status.trialEndsAt.formatDate()}. Enjoy!")
        is SubscriptionStatus.Cancelled -> WarningBanner("Subscription cancelled. Access continues until the end of your billing period.")
        else -> Unit
    }
}
```

## 9. Acknowledge & Server-Side Verification

```kotlin
suspend fun handlePurchase(purchase: Purchase) {
    when (purchase.purchaseState) {
        Purchase.PurchaseState.PURCHASED -> {
            // 1. Verify with backend (mandatory)
            val verified = backendApi.verifySubscription(
                purchaseToken = purchase.purchaseToken,
                productId = purchase.products.firstOrNull() ?: return
            )
            if (!verified) { Timber.w("Purchase verification failed"); return }

            // 2. Grant entitlement
            dataStore.edit { it[ENTITLEMENT_KEY] = true }

            // 3. Acknowledge (must within 3 days or auto-refunded)
            if (!purchase.isAcknowledged) {
                billingClient.acknowledgePurchase(
                    AcknowledgePurchaseParams.newBuilder().setPurchaseToken(purchase.purchaseToken).build()
                )
            }
        }
        Purchase.PurchaseState.PENDING -> {
            // Show "Payment processing" UI. Do NOT grant access yet.
        }
        else -> Unit
    }
}
```

## 10. Manage Subscription Deep Link

Let users manage their subscription directly in the Play Store.

```kotlin
fun openSubscriptionManagement(context: Context, productId: String, packageName: String = context.packageName) {
    val intent = Intent(Intent.ACTION_VIEW).apply {
        data = "https://play.google.com/store/account/subscriptions?sku=${productId}&package=${packageName}".toUri()
    }
    context.startActivity(intent)
}

@Composable
fun ManageSubscriptionButton(productId: String) {
    val context = LocalContext.current
    OutlinedButton(onClick = { openSubscriptionManagement(context, productId) }, modifier = Modifier.fillMaxWidth()) {
        Icon(Icons.Default.ManageAccounts, null)
        Spacer(Modifier.width(8.dp))
        Text("Manage Subscription")
    }
}
```

## 11. Offer Tag Filtering (Trial vs Paid)

When a product has multiple offers (e.g., a free trial offer and a base paid offer), select the right one.

```kotlin
fun ProductDetails.selectBestOffer(): ProductDetails.SubscriptionOfferDetails? {
    val offerDetails = subscriptionOfferDetails ?: return null
    // Prefer free trial offer, then intro price, then base plan
    return offerDetails.firstOrNull { offer ->
        offer.pricingPhases.pricingPhaseList.any { it.priceAmountMicros == 0L }
    } ?: offerDetails.firstOrNull { offer ->
        offer.pricingPhases.pricingPhaseList.size > 1
    } ?: offerDetails.firstOrNull()
}
```

## Best Practices

- **Acknowledge within 3 days**: Unacknowledged purchases are auto-refunded by Google. Always acknowledge after server verification.
- **Server-side verification**: Use Google Play Developer API (or a backend) to verify purchase tokens — never trust the client alone.
- **Handle all lifecycle states**: `GRACE_PERIOD`, `ON_HOLD`, `PAUSED`, and `CANCELLED` all require different UI treatment.
- **Restore purchases**: Call `queryPurchasesAsync(SUBS)` on every app launch (not `queryPurchaseHistoryAsync`) to check active entitlement.
- **Offer token required**: Subscriptions now require an `offerToken` in the `BillingFlowParams`. A missing token results in a `BILLING_UNAVAILABLE` error.
- **Free trial eligibility**: Google automatically enforces that a user can only get a free trial once per Google account per product. Do not implement this check yourself.
- **Proration mode**: Use `CHARGE_PRORATED_PRICE` for upgrades (charge immediately), `WITHOUT_PRORATION` for downgrades (take effect on renewal).
- **Test with test accounts**: Add tester emails in Play Console → License Testing. Test subscriptions renew every 5 minutes for faster validation.
