# Advanced Performance Tools

While standard performance optimization focuses on code efficiency, advanced tools help you optimize the "experience" of the app (startup, smoothness, battery).

## 1. Baseline Profiles

Baseline Profiles tell the Android Runtime (ART) which methods should be pre-compiled to machine code. This can improve app startup time and smooth scrolling by up to 30%.

- **Generate**: Use the Benchmark library to record a "warmup profile".
- **Distribute**: Include the profile in your AAB (Android App Bundle).

## 2. Macrobenchmark Library

Use Macrobenchmark to measure large-scale interactions:

- **Startup Timing**: Cold, Warm, and Hot startup measurements.
- **Frame Timing**: Measure jank during scrolling or complex animations.

```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()

    @Test
    fun startup() = benchmarkRule.measureRepeated(
        packageName = "com.example.myapp",
        metrics = listOf(StartupTimingMetric()),
        iterations = 5,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait()
    }
}
```

## 3. App Startup Library

The App Startup library provides a straightforward, performant way to initialize components at application startup. Use this instead of multiple `ContentProviders`, which slow down the app launch.

## 4. Layout Inspector and Validation

- **Live Edit**: See changes in real-time without building.
- **Recomposition Counter**: Identify "dirty" components that recompose too often.
- **Color Blindness Check**: Verify UI contrast and accessibility colors.

## 5. APK Size Optimization

- **R8/ProGuard**: Shrink, obfuscate, and optimize your code.
- **Resource Shrinking**: Remove unused resources automatically.
- **Dynamic Delivery**: Only deliver code/resources needed for the specific device configuration.
