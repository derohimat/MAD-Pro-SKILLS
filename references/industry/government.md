# Government & Public Sector App Skills

Government apps require strict accessibility compliance, multi-language support, robust authentication, and handling of public data at scale.

## 1. Citizen Authentication (eID / OAuth2 / OTP)

Public sector apps typically use national identity systems or government OAuth2 providers.

```kotlin
// OAuth2 with PKCE for secure government identity provider login
class GovAuthManager @Inject constructor(private val appAuthService: AppAuthService) {

    fun buildAuthRequest(issuerUrl: String, clientId: String, redirectUri: String): AuthorizationRequest {
        val serviceConfig = AuthorizationServiceConfiguration(
            Uri.parse("$issuerUrl/auth"),
            Uri.parse("$issuerUrl/token")
        )
        return AuthorizationRequest.Builder(
            serviceConfig, clientId,
            ResponseTypeValues.CODE,
            Uri.parse(redirectUri)
        )
            .setScopes("openid", "profile", "citizen_data")
            .setCodeVerifier(CodeVerifierUtil.generateRandomCodeVerifier())
            .build()
    }
}
```

## 2. Multi-Language / Localization

Government apps must support the national language(s) and regional dialects.

```kotlin
// strings.xml (values-id)
// <string name="app_name">Aplikasi Pemerintah</string>
// <string name="welcome_message">Selamat datang, %1$s</string>

// Composable
@Composable
fun WelcomeMessage(userName: String) {
    Text(text = stringResource(R.string.welcome_message, userName))
}

// Programmatic locale change
fun Context.setLocale(languageCode: String): Context {
    val locale = Locale(languageCode)
    Locale.setDefault(locale)
    val config = resources.configuration.apply { setLocale(locale) }
    return createConfigurationContext(config)
}
```

## 3. Public Services Dashboard

```kotlin
@Composable
fun PublicServicesDashboard(services: List<PublicService>) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(2),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        items(services, key = { it.id }) { service ->
            PublicServiceCard(service = service)
        }
    }
}

@Composable
fun PublicServiceCard(service: PublicService) {
    Card(
        modifier = Modifier.fillMaxWidth().aspectRatio(1f),
        colors = CardDefaults.cardColors(containerColor = service.color.copy(alpha = 0.1f))
    ) {
        Column(modifier = Modifier.fillMaxSize().padding(16.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
            Icon(service.icon, contentDescription = service.name, tint = service.color, modifier = Modifier.size(36.dp))
            Spacer(Modifier.height(8.dp))
            Text(service.name, style = MaterialTheme.typography.labelLarge, textAlign = TextAlign.Center)
        }
    }
}
```

## 4. Document Submission & Upload

```kotlin
@Composable
fun DocumentUploadScreen(viewModel: DocumentViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val filePicker = rememberLauncherForActivityResult(ActivityResultContracts.GetContent()) { uri ->
        uri?.let { viewModel.uploadDocument(it) }
    }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Text("Required Documents", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))
        state.requiredDocuments.forEach { doc ->
            DocumentUploadItem(
                document = doc,
                onUpload = { filePicker.launch("application/pdf,image/*") }
            )
            Spacer(Modifier.height(8.dp))
        }
        Spacer(Modifier.weight(1f))
        Button(
            onClick = viewModel::submitApplication,
            enabled = state.allDocumentsUploaded,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Submit Application")
        }
    }
}
```

## 5. Application Status Tracking

```kotlin
sealed class ApplicationStatus(val displayName: String, val step: Int) {
    object Submitted : ApplicationStatus("Submitted", 1)
    object UnderReview : ApplicationStatus("Under Review", 2)
    object AwaitingDocuments : ApplicationStatus("Awaiting Documents", 3)
    object Approved : ApplicationStatus("Approved", 4)
    object Rejected : ApplicationStatus("Rejected", -1)
}

@Composable
fun ApplicationStatusTracker(status: ApplicationStatus, applicationId: String) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text("Application ID:", style = MaterialTheme.typography.labelMedium)
                Spacer(Modifier.width(4.dp))
                Text(applicationId, style = MaterialTheme.typography.bodyMedium, fontFamily = FontFamily.Monospace)
            }
            Spacer(Modifier.height(16.dp))
            LinearProgressIndicator(progress = { status.step / 4f }, modifier = Modifier.fillMaxWidth())
            Spacer(Modifier.height(8.dp))
            Text(status.displayName, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold,
                color = if (status is ApplicationStatus.Rejected) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary)
        }
    }
}
```

## 6. WCAG Accessibility Compliance

Government apps are legally required to meet WCAG 2.1 AA (often AAA) standards.

```kotlin
@Composable
fun AccessibleActionButton(label: String, hint: String, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = Modifier.semantics {
            contentDescription = label
            stateDescription = hint
            role = Role.Button
        }
    ) {
        Text(label)
    }
}

// Color contrast must meet 4.5:1 ratio for normal text, 3:1 for large text.
// Test with: Accessibility Scanner or Android Lint
```

## 7. Offline-Capable Forms

Allow citizens to fill forms offline and sync when connected.

```kotlin
@Entity(tableName = "pending_submissions")
data class PendingSubmissionEntity(
    @PrimaryKey val localId: String = UUID.randomUUID().toString(),
    val formType: String,
    val payload: String, // JSON-serialized form data
    val createdAt: Long = System.currentTimeMillis(),
    val syncStatus: String = "PENDING" // PENDING, SYNCING, DONE, FAILED
)
```

## Best Practices

- **Data residency**: Government data must stay within national borders. Validate your cloud provider's regional compliance.
- **Audit logging**: Every form submission and data access must be logged server-side with a non-repudiable timestamp.
- **Session timeout**: Hard logout after 15 minutes of inactivity; no soft/re-authentication—force full re-login.
- **Encryption at rest**: All citizen PII must be encrypted at rest using device-backed keystore keys.
- **Penetration testing**: Government apps typically require certified security audits before go-live.
