# Observability and App Health

An app isn't finished when it's released. You need to observe how it behaves in the real world to fix bugs and improve the user experience.

## 1. Crash Reporting: Firebase Crashlytics

The industry standard for catching and analyzing crashes.

- **Custom Keys**: Add state information to help reproduce crashes.
- **Custom Logs**: Log non-fatal exceptions to understand unexpected flows.
- **User IDs**: Associate crashes with a user ID (anonymized) for better support.

```kotlin
Firebase.crashlytics.setCustomKey("payment_method", "credit_card")
Firebase.crashlytics.log("Started checkout flow")
```

## 2. Remote Configuration

Change the behavior or appearance of your app without a new release.

- **Feature Toggles**: Safely roll out new features to a percentage of users.
- **Emergency Fixes**: Disable a broken feature instantly.
- **A/B Testing**: Compare two versions of a screen to see which performs better.

## 3. Performance Monitoring

Tracks the performance of specific parts of your app.

- **Trace Duration**: Measure how long a specific task takes (e.g., Image processing).
- **Network Performance**: Automatically monitor the latency and success rate of your API calls.
- **Frame Drop Tracking**: Identify screens where the UI is lagging.

## 4. User Analytics

Understand how users navigate your app.

- **Screen Tracking**: Monitor which screens are most popular.
- **Conversion Funnels**: Track where users drop off in a multi-step process (e.g., Sign-up).
- **Custom Events**: Track specific actions like "Added to cart" or "Shared content".

## 5. Privacy and Ethics

- **Anonymization**: Never send Personally Identifiable Information (PII).
- **Opt-out**: Provide users with the ability to disable tracking.
- **Data Minimization**: Only collect the data you actually need to improve the app.
