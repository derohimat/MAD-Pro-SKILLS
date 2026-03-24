# Banking & Finance App Skills

Building fintech and banking applications requires bank-grade security, precise UI, and reliable data handling.

## 1. Account Dashboard UI

Display account balances, transaction summaries, and quick actions in a structured, accessible layout.

```kotlin
@Composable
fun AccountDashboard(state: BankingUiState) {
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        BalanceCard(
            balance = state.balance,
            accountNumber = state.maskedAccountNumber
        )
        Spacer(modifier = Modifier.height(16.dp))
        QuickActionsRow(actions = state.quickActions)
        Spacer(modifier = Modifier.height(16.dp))
        TransactionList(transactions = state.recentTransactions)
    }
}
```

## 2. Masked Sensitive Data

Always mask card numbers and account IDs in the UI. Only reveal on deliberate user action.

```kotlin
fun String.maskAccountNumber(): String =
    "•••• •••• •••• ${takeLast(4)}"

@Composable
fun MaskedCardNumber(cardNumber: String) {
    var isRevealed by remember { mutableStateOf(false) }
    Text(
        text = if (isRevealed) cardNumber else cardNumber.maskAccountNumber(),
        modifier = Modifier.clickable { isRevealed = !isRevealed }
    )
}
```

## 3. Transaction History

Use `LazyColumn` with grouped date headers and color-coded debit/credit amounts.

```kotlin
@Composable
fun TransactionItem(transaction: Transaction) {
    val amountColor = if (transaction.isCredit) Color(0xFF4CAF50) else Color(0xFFF44336)
    Row(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
        TransactionIcon(transaction.category)
        Column(modifier = Modifier.weight(1f).padding(horizontal = 12.dp)) {
            Text(text = transaction.description, style = MaterialTheme.typography.bodyLarge)
            Text(text = transaction.formattedDate, style = MaterialTheme.typography.bodySmall)
        }
        Text(
            text = transaction.formattedAmount,
            color = amountColor,
            style = MaterialTheme.typography.bodyLarge,
            fontWeight = FontWeight.SemiBold
        )
    }
}
```

## 4. PIN Entry & Biometric Auth

Protect sensitive actions (transfers, viewing full card) with PIN or biometrics.

```kotlin
fun authenticateWithBiometrics(
    activity: FragmentActivity,
    onSuccess: () -> Unit,
    onError: (String) -> Unit
) {
    val biometricPrompt = BiometricPrompt(activity, ContextCompat.getMainExecutor(activity),
        object : BiometricPrompt.AuthenticationCallback() {
            override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                onSuccess()
            }
            override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                onError(errString.toString())
            }
        }
    )
    val promptInfo = BiometricPrompt.PromptInfo.Builder()
        .setTitle("Authenticate")
        .setSubtitle("Confirm your identity to proceed")
        .setNegativeButtonText("Use PIN")
        .build()
    biometricPrompt.authenticate(promptInfo)
}
```

## 5. Balance Animation

Animate balance reveal for a premium feel.

```kotlin
@Composable
fun AnimatedBalance(targetBalance: Double) {
    val animatedValue by animateFloatAsState(
        targetValue = targetBalance.toFloat(),
        animationSpec = tween(durationMillis = 800, easing = EaseOutCubic)
    )
    Text(
        text = "Rp ${"%,.0f".format(animatedValue)}",
        style = MaterialTheme.typography.displaySmall,
        fontWeight = FontWeight.Bold
    )
}
```

## 6. Security Best Practices

- **FLAG_SECURE**: Prevent screenshots on sensitive screens.
- **Session Timeout**: Auto-logout after inactivity using `CountDownTimer` or WorkManager.
- **Certificate Pinning**: Use OkHttp `CertificatePinner` for all banking API calls.
- **Root Detection**: Integrate Play Integrity API to block rooted devices.
- **Encrypted Storage**: Store tokens in `EncryptedSharedPreferences`, never in plain DataStore.

```kotlin
override fun onResume() {
    super.onResume()
    window.setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE)
}
```

## 7. Transfer Flow UX

- Use a **stepper pattern** (step 1: recipient → step 2: amount → step 3: confirm → step 4: result).
- Show a confirmation sheet with all details before submission.
- Display a success/failure animation after the transfer completes.

## Best Practices

- **Never log sensitive data** (account numbers, tokens, PINs).
- **Input validation**: Validate IBAN/account numbers before making API calls.
- **Accessibility**: Ensure all monetary values have proper content descriptions.
- **Error states**: Map server error codes to meaningful user messages.
