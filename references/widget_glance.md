# Widget & Glance Skills

Android home screen and lock screen widgets built with Jetpack Glance — a Compose-based SDK for App Widgets.

## 1. Basic Glance Widget Setup

```kotlin
// Add to AndroidManifest.xml
// <receiver android:name=".widget.WeatherWidgetReceiver"
//     android:exported="true">
//     <intent-filter>
//         <action android:name="android.appwidget.action.APPWIDGET_UPDATE" />
//     </intent-filter>
//     <meta-data android:name="android.appwidget.provider"
//         android:resource="@xml/weather_widget_info" />
// </receiver>

class WeatherWidgetReceiver : GlanceAppWidgetReceiver() {
    override val glanceAppWidget = WeatherWidget()
}

class WeatherWidget : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        val prefs = currentState<Preferences>()
        provideContent {
            WeatherWidgetContent(prefs)
        }
    }
}
```

## 2. Widget UI with Glance Composables

```kotlin
@Composable
fun WeatherWidgetContent(prefs: Preferences) {
    val temperature = prefs[intPreferencesKey("temperature")] ?: 0
    val condition = prefs[stringPreferencesKey("condition")] ?: "Sunny"

    GlanceTheme {
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(GlanceTheme.colors.widgetBackground)
                .padding(16.dp)
                .cornerRadius(16.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = "$temperature°C",
                    style = TextStyle(fontSize = 36.sp, fontWeight = FontWeight.Bold),
                    maxLines = 1
                )
                Text(
                    text = condition,
                    style = TextStyle(fontSize = 14.sp)
                )
                Spacer(GlanceModifier.height(8.dp))
                Button(
                    text = "Open App",
                    onClick = actionStartActivity<MainActivity>()
                )
            }
        }
    }
}
```

## 3. Updating Widget Data

Use `GlanceAppWidgetManager` to update a widget's stored state.

```kotlin
// In your ViewModel or Worker
suspend fun updateWeatherWidget(context: Context, temperature: Int, condition: String) {
    val manager = GlanceAppWidgetManager(context)
    val glanceIds = manager.getGlanceIds(WeatherWidget::class.java)
    glanceIds.forEach { glanceId ->
        updateAppWidgetState(context, glanceId) { prefs ->
            prefs[intPreferencesKey("temperature")] = temperature
            prefs[stringPreferencesKey("condition")] = condition
        }
        WeatherWidget().update(context, glanceId)
    }
}
```

## 4. Configurable Widget (Configuration Activity)

Allow users to customize the widget on placement.

```kotlin
class WidgetConfigActivity : AppCompatActivity() {
    private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setResult(RESULT_CANCELED) // Default to canceled

        appWidgetId = intent?.extras?.getInt(
            AppWidgetManager.EXTRA_APPWIDGET_ID,
            AppWidgetManager.INVALID_APPWIDGET_ID
        ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

        if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) { finish(); return }

        // Show config UI, then when saving:
        setContent {
            WidgetConfigScreen(onSave = { config ->
                // Persist config and confirm
                val resultValue = Intent().apply { putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId) }
                setResult(RESULT_OK, resultValue)
                finish()
            })
        }
    }
}
```

## 5. Widget Sizes & Responsive Layout

Use `SizeMode.Responsive` to provide different layouts for different widget sizes.

```kotlin
class ResponsiveWidget : GlanceAppWidget() {
    companion object {
        private val SMALL = DpSize(100.dp, 100.dp)
        private val MEDIUM = DpSize(200.dp, 100.dp)
        private val LARGE = DpSize(300.dp, 200.dp)
    }
    override val sizeMode = SizeMode.Responsive(setOf(SMALL, MEDIUM, LARGE))

    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            val size = LocalSize.current
            when {
                size.width >= LARGE.width -> LargeWidgetContent()
                size.width >= MEDIUM.width -> MediumWidgetContent()
                else -> SmallWidgetContent()
            }
        }
    }
}
```

## 6. Widget with WorkManager Refresh

Schedule periodic background updates using WorkManager.

```kotlin
class WidgetRefreshWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val data = weatherRepository.fetchLatest()
        updateWeatherWidget(applicationContext, data.temperature, data.condition)
        return Result.success()
    }
}

fun scheduleWidgetRefresh(ctx: Context) {
    val request = PeriodicWorkRequestBuilder<WidgetRefreshWorker>(30, TimeUnit.MINUTES)
        .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
        .build()
    WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("widget_refresh", ExistingPeriodicWorkPolicy.KEEP, request)
}
```

## Best Practices

- **Keep it fast**: Widget UI must render in < 3 seconds. Avoid heavy computation on the main thread.
- **Minimal data**: Only show the most important info; widgets are glanceable, not detailed.
- **Deep link into app**: All interactive widget elements should deep link to the relevant screen in the app.
- **Dark mode**: Use `GlanceTheme` to automatically handle dark/light widget backgrounds.
- **Preview**: Define `android:previewImage` in widget info XML for a polished Play Store appearance.
