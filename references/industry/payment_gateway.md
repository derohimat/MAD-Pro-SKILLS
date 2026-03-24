# Industry: Payment Gateway Integration

A solid payment gateway requires extreme reliability, security, and careful state management.

## 🏛️ Architecture: Payment State Machine

Never rely solely on UI state for payments. Use a robust StateFlow that handles the entire transaction lifecycle.

```kotlin
sealed class PaymentState {
    object Idle : PaymentState()
    object Initializing : PaymentState()
    data class AwaitingUserAction(val clientSecret: String) : PaymentState()
    object Processing : PaymentState()
    data class Success(val transactionId: String) : PaymentState()
    data class Error(val message: String, val code: String) : PaymentState()
}
```

## 🔒 Security Best Practices

1. **No Sensitive Data on Device**: Never send credit card numbers directly to your backend. Always use the Payment Gateway's SDK to tokenize the card first.
2. **Certificate Pinning**: Prevent Man-In-The-Middle (MITM) attacks.
3. **Idempotency Keys**: Ensure retries don't result in double-charging.

```kotlin
// Example Ktor client with Idempotency
suspend fun chargeToken(token: String, amount: Long) = client.post("/v1/charge") {
    header("Idempotency-Key", UUID.randomUUID().toString())
    setBody(ChargeRequest(token = token, amount = amount))
}
```

## 🎯 UI Execution: The Payment Button

Payment buttons should clearly indicate processing state to prevent double-taps.

```kotlin
@Composable
fun SecurePaymentButton(
    state: PaymentState,
    onPayClicked: () -> Unit
) {
    Button(
        onClick = onPayClicked,
        enabled = state is PaymentState.Idle || state is PaymentState.Error,
        modifier = Modifier.fillMaxWidth().height(56.dp)
    ) {
        if (state is PaymentState.Processing) {
            CircularProgressIndicator(color = MaterialTheme.colorScheme.onPrimary)
        } else {
            Text("Pay Now Securely")
        }
    }
}
```
