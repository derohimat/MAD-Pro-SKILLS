# Insurance App Skills

Insurance apps require policy management, claim submission with photo evidence, premium calculation, and trusted document handling.

## 1. Policy Dashboard

```kotlin
@Composable
fun PolicyDashboardScreen(viewModel: PolicyViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    LazyColumn(contentPadding = PaddingValues(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        item {
            Text("My Policies", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        }
        items(state.activePolicies, key = { it.id }) { policy ->
            PolicyCard(policy = policy, onClick = { viewModel.openPolicy(policy.id) })
        }
        if (state.expiredPolicies.isNotEmpty()) {
            item { Text("Expired", style = MaterialTheme.typography.labelLarge, color = MaterialTheme.colorScheme.outline, modifier = Modifier.padding(top = 8.dp)) }
            items(state.expiredPolicies, key = { it.id }) { policy ->
                PolicyCard(policy = policy, isExpired = true, onClick = { viewModel.openPolicy(policy.id) })
            }
        }
    }
}

@Composable
fun PolicyCard(policy: Policy, isExpired: Boolean = false, onClick: () -> Unit) {
    Card(modifier = Modifier.fillMaxWidth().clickable(onClick = onClick), colors = CardDefaults.cardColors(containerColor = if (isExpired) MaterialTheme.colorScheme.surfaceVariant else MaterialTheme.colorScheme.surface)) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(policy.type.icon, null, tint = policy.type.color, modifier = Modifier.size(32.dp))
                Spacer(Modifier.width(12.dp))
                Column(modifier = Modifier.weight(1f)) {
                    Text(policy.name, fontWeight = FontWeight.SemiBold)
                    Text(policy.policyNumber, style = MaterialTheme.typography.bodySmall, fontFamily = FontFamily.Monospace)
                }
                PolicyStatusBadge(status = policy.status)
            }
            HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                PolicyDetailItem("Coverage", policy.formattedCoverage)
                PolicyDetailItem("Premium", policy.formattedPremium)
                PolicyDetailItem("Expires", policy.expiryDate)
            }
        }
    }
}
```

## 2. Claim Submission Flow

```kotlin
// Step-based claim submission wizard
sealed class ClaimStep {
    object IncidentDetails : ClaimStep()
    object PhotoEvidence : ClaimStep()
    object DocumentUpload : ClaimStep()
    object Review : ClaimStep()
}

@Composable
fun ClaimSubmissionScreen(viewModel: ClaimViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize()) {
        // Progress stepper
        ClaimStepIndicator(currentStep = state.currentStep, totalSteps = 4)
        // Step content
        AnimatedContent(targetState = state.currentStep) { step ->
            when (step) {
                is ClaimStep.IncidentDetails -> IncidentDetailsForm(state = state, viewModel = viewModel)
                is ClaimStep.PhotoEvidence -> PhotoEvidenceCapture(state = state, viewModel = viewModel)
                is ClaimStep.DocumentUpload -> DocumentUploadStep(state = state, viewModel = viewModel)
                is ClaimStep.Review -> ClaimReviewScreen(state = state, onSubmit = viewModel::submitClaim)
            }
        }
    }
}
```

## 3. Photo Evidence Capture

```kotlin
@Composable
fun PhotoEvidenceCapture(state: ClaimUiState, viewModel: ClaimViewModel) {
    val imagePicker = rememberLauncherForActivityResult(ActivityResultContracts.PickMultipleVisualMedia(10)) { uris ->
        viewModel.addEvidencePhotos(uris)
    }
    Column(modifier = Modifier.padding(16.dp)) {
        Text("Add Evidence Photos", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Text("Minimum 2 photos required. Include damage from multiple angles.", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(Modifier.height(16.dp))
        LazyVerticalGrid(columns = GridCells.Fixed(3), modifier = Modifier.height(300.dp)) {
            items(state.evidenceUris) { uri ->
                Box(modifier = Modifier.padding(4.dp).aspectRatio(1f)) {
                    AsyncImage(model = uri, contentDescription = null, modifier = Modifier.fillMaxSize().clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
                    IconButton(onClick = { viewModel.removeEvidencePhoto(uri) }, modifier = Modifier.align(Alignment.TopEnd)) {
                        Icon(Icons.Default.Close, null, tint = Color.White)
                    }
                }
            }
            item {
                Box(modifier = Modifier.padding(4.dp).aspectRatio(1f).clip(RoundedCornerShape(8.dp)).background(MaterialTheme.colorScheme.surfaceVariant).clickable { imagePicker.launch(PickVisualMediaRequest(ActivityResultContracts.PickVisualMedia.ImageOnly)) }, contentAlignment = Alignment.Center) {
                    Icon(Icons.Default.AddPhotoAlternate, null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(32.dp))
                }
            }
        }
    }
}
```

## 4. Premium Calculator

```kotlin
data class InsuranceQuote(val baseRate: Double, val riskFactor: Double, val discounts: List<Discount>) {
    val annualPremium get() = baseRate * riskFactor * (1 - discounts.sumOf { it.percentage })
    val monthlyPremium get() = annualPremium / 12
}

@Composable
fun PremiumCalculatorScreen(viewModel: QuoteViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Get Your Quote", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        // Input fields
        AgeSlider(age = state.age, onAgeChange = viewModel::updateAge)
        Spacer(Modifier.height(12.dp))
        CoverageAmountPicker(amount = state.coverageAmount, onAmountChange = viewModel::updateCoverage)
        Spacer(Modifier.height(24.dp))
        // Quote result
        state.quote?.let { quote ->
            QuoteResultCard(quote = quote)
            Spacer(Modifier.height(16.dp))
            Button(onClick = viewModel::proceedToApplication, modifier = Modifier.fillMaxWidth()) { Text("Get This Plan") }
        }
    }
}
```

## 5. Digital Policy Card

```kotlin
@Composable
fun DigitalPolicyCard(policy: Policy) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
        shape = RoundedCornerShape(20.dp)
    ) {
        Column(modifier = Modifier.padding(24.dp)) {
            Row {
                Image(painterResource(R.drawable.ic_logo_white), null, modifier = Modifier.height(32.dp))
                Spacer(Modifier.weight(1f))
                Text(policy.type.name, color = Color.White.copy(0.7f), style = MaterialTheme.typography.labelLarge)
            }
            Spacer(Modifier.height(24.dp))
            Text(policy.holderName, color = Color.White, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            Text("Policy No: ${policy.policyNumber}", color = Color.White.copy(0.8f), fontFamily = FontFamily.Monospace)
            Spacer(Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
                Column { Text("VALID UNTIL", color = Color.White.copy(0.7f), style = MaterialTheme.typography.labelSmall); Text(policy.expiryDate, color = Color.White, fontWeight = FontWeight.SemiBold) }
                Column(horizontalAlignment = Alignment.End) { Text("COVERAGE", color = Color.White.copy(0.7f), style = MaterialTheme.typography.labelSmall); Text(policy.formattedCoverage, color = Color.White, fontWeight = FontWeight.SemiBold) }
            }
        }
    }
}
```

## Best Practices

- **E-signature**: Require legally binding e-signatures for policy acceptance with an audit trail.
- **Document encryption**: All uploaded policy documents and claim evidence must be encrypted at rest.
- **Claim fraud detection**: Flag claims with suspicious patterns (e.g., very recent policy + large claim) for manual review.
- **Push reminders**: Send renewal reminders 30, 15, and 7 days before policy expiry.
- **Regulatory compliance**: Insurance apps often require OJK/local regulator compliance; include mandatory disclosures.
