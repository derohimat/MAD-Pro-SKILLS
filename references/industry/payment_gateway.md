# Payment Gateway Integration

Integrating payment gateways requires careful handling of sensitive data, webhook events, and UI state transitions.

## 1. Payment Method Selection UI

Present available payment methods (credit card, bank transfer, e-wallet) clearly.

```kotlin
@Composable
fun PaymentMethodSelector(
    methods: List<PaymentMethod>,
    selected: PaymentMethod?,
    onSelect: (PaymentMethod) -> Unit
) {
    LazyColumn {
        items(methods) { method ->
            PaymentMethodItem(
                method = method,
                isSelected = method == selected,
                onClick = { onSelect(method) }
            )
        }
    }
}

@Composable
fun PaymentMethodItem(method: PaymentMethod, isSelected: Boolean, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .border(
                width = if (isSelected) 2.dp else 1.dp,
                color = if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline,
                shape = RoundedCornerShape(12.dp)
            )
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(model = method.iconUrl, contentDescription = method.name, modifier = Modifier.size(32.dp))
        Spacer(modifier = Modifier.width(12.dp))
        Text(text = method.name, modifier = Modifier.weight(1f))
        if (isSelected) Icon(Icons.Default.CheckCircle, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
    }
}
```

## 2. Credit Card Input

Use masked inputs and real-time card type detection.

```kotlin
@Composable
fun CardNumberField(value: String, onValueChange: (String) -> Unit) {
    val formatted = value.chunked(4).joinToString(" ")
    OutlinedTextField(
        value = formatted,
        onValueChange = { raw ->
            val digits = raw.filter { it.isDigit() }.take(16)
            onValueChange(digits)
        },
        label = { Text("Card Number") },
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        leadingIcon = { CardTypeIcon(value) },
        placeholder = { Text("1234 5678 9012 3456") }
    )
}
```

## 3. Payment Status Flow

Model the full payment lifecycle as a sealed class.

```kotlin
sealed class PaymentState {
    object Idle : PaymentState()
    object Processing : PaymentState()
    data class Awaiting3DS(val redirectUrl: String) : PaymentState()
    data class Success(val transactionId: String) : PaymentState()
    data class Failed(val reason: String, val retryable: Boolean) : PaymentState()
}
```

## 4. 3DS Web Redirect

Handle 3D Secure redirects using a `WebView` within a `BottomSheet` or a dedicated screen.

```kotlin
@Composable
fun ThreeDsWebView(url: String, onResult: (success: Boolean) -> Unit) {
    AndroidView(
        factory = { context ->
            WebView(context).apply {
                webViewClient = object : WebViewClient() {
                    override fun onPageFinished(view: WebView?, pageUrl: String?) {
                        if (pageUrl?.contains("payment/success") == true) onResult(true)
                        if (pageUrl?.contains("payment/failed") == true) onResult(false)
                    }
                }
                loadUrl(url)
            }
        },
        modifier = Modifier.fillMaxSize()
    )
}
```

## 5. Tokenization & Security

- **Never** send raw card details to your own server. Use the gateway's SDK to tokenize first.
- Store only the payment method token returned by the gateway.
- Always use HTTPS and certificate pinning for payment endpoints.

```kotlin
// Example: Using a gateway SDK to get a token
fun tokenizeCard(card: CardDetails, onToken: (String) -> Unit) {
    MidtransSDK.getInstance().cardRegistration(
        cardNumber = card.number,
        cvv = card.cvv,
        expMonth = card.expMonth,
        expYear = card.expYear,
        callback = object : CardRegistrationCallback {
            override fun onSuccess(response: CardRegistrationResponse) {
                onToken(response.savedTokenId)
            }
        }
    )
}
```

## 6. Polling Payment Status

For asynchronous methods (bank transfer, QRIS), poll the backend for status updates.

```kotlin
fun pollPaymentStatus(orderId: String): Flow<PaymentState> = flow {
    repeat(30) { // Poll up to 30 times
        val status = paymentRepository.getStatus(orderId)
        emit(status)
        if (status is PaymentState.Success || status is PaymentState.Failed) return@flow
        delay(3_000) // Wait 3 seconds between polls
    }
}
```

## Best Practices

- **Idempotency keys**: Include a unique key with each payment request to prevent duplicate charges.
- **Retry logic**: Only retry on network errors, not on payment declined responses.
- **Loading states**: Disable the pay button immediately on tap to prevent double submission.
- **Receipts**: Always show a transaction ID on the success screen so the user has a reference.
