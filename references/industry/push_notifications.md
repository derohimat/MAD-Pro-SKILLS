# Push Notifications Skills

Push notifications drive re-engagement, deliver order updates, chat messages, and time-sensitive alerts.

## 1. FCM Setup

Integrate Firebase Cloud Messaging into your Android app.

```kotlin
class AppMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        // Send the device token to your backend to register this device
        CoroutineScope(Dispatchers.IO).launch {
            userRepository.registerPushToken(token)
        }
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val title = message.notification?.title ?: message.data["title"] ?: return
        val body = message.notification?.body ?: message.data["body"] ?: return
        val type = message.data["type"]
        val targetId = message.data["target_id"]
        showNotification(title = title, body = body, type = type, targetId = targetId)
    }

    private fun showNotification(title: String, body: String, type: String?, targetId: String?) {
        val intent = NotificationDeepLinkHandler.buildIntent(this, type, targetId)
        val pendingIntent = PendingIntent.getActivity(this, 0, intent, PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        val notification = NotificationCompat.Builder(this, getChannelId(type))
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(title)
            .setContentText(body)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)
            .build()
        NotificationManagerCompat.from(this).notify(System.currentTimeMillis().toInt(), notification)
    }
}
```

## 2. Notification Channels

Create dedicated channels for different notification categories (required on Android 8+).

```kotlin
fun Context.createNotificationChannels() {
    val channels = listOf(
        NotificationChannelData(id = "orders", name = "Order Updates", importance = NotificationManager.IMPORTANCE_HIGH, description = "Real-time updates for your active orders"),
        NotificationChannelData(id = "messages", name = "Messages", importance = NotificationManager.IMPORTANCE_HIGH, description = "New chat messages"),
        NotificationChannelData(id = "promotions", name = "Promotions", importance = NotificationManager.IMPORTANCE_DEFAULT, description = "Deals, vouchers, and promotions"),
        NotificationChannelData(id = "reminders", name = "Reminders", importance = NotificationManager.IMPORTANCE_LOW, description = "Appointment and task reminders")
    )
    val manager = getSystemService(NotificationManager::class.java)
    channels.forEach { data ->
        val channel = NotificationChannel(data.id, data.name, data.importance).apply {
            description = data.description
        }
        manager.createNotificationChannel(channel)
    }
}
```

## 3. Notification Permission (Android 13+)

```kotlin
@Composable
fun NotificationPermissionRequest(onGranted: () -> Unit) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        val permissionState = rememberPermissionState(android.Manifest.permission.POST_NOTIFICATIONS)
        LaunchedEffect(permissionState.status) {
            if (permissionState.status.isGranted) onGranted()
        }
        if (!permissionState.status.isGranted) {
            AlertDialog(
                onDismissRequest = {},
                title = { Text("Enable Notifications") },
                text = { Text("Stay updated on your orders and messages.") },
                confirmButton = { Button(onClick = { permissionState.launchPermissionRequest() }) { Text("Enable") } },
                dismissButton = { TextButton(onClick = { /* dismiss */ }) { Text("Later") } }
            )
        }
    } else {
        onGranted()
    }
}
```

## 4. Deep Link from Notification

Route the user to the correct screen when they tap a notification.

```kotlin
object NotificationDeepLinkHandler {
    fun buildIntent(context: Context, type: String?, targetId: String?): Intent {
        val deepLink = when (type) {
            "order_update" -> "myapp://orders/$targetId"
            "new_message" -> "myapp://chat/$targetId"
            "promotion" -> "myapp://promos/$targetId"
            else -> "myapp://home"
        }
        return Intent(Intent.ACTION_VIEW, deepLink.toUri()).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
    }
}
```

## 5. In-App Notification Inbox

Store and display past notifications so users can review them.

```kotlin
@Composable
fun NotificationInboxScreen(viewModel: NotificationsViewModel = hiltViewModel()) {
    val notifications by viewModel.notifications.collectAsStateWithLifecycle()
    if (notifications.isEmpty()) {
        EmptyState(message = "You're all caught up!", icon = Icons.Outlined.Notifications)
    } else {
        LazyColumn {
            items(notifications, key = { it.id }) { notification ->
                NotificationItem(
                    notification = notification,
                    onTap = viewModel::markAsRead,
                    onDismiss = viewModel::dismiss
                )
            }
        }
    }
}
```

## 6. Topic-Based Subscriptions

Subscribe/unsubscribe users from broadcast topics (e.g., promo campaigns).

```kotlin
fun subscribeToTopic(topic: String) {
    FirebaseMessaging.getInstance().subscribeToTopic(topic)
        .addOnCompleteListener { task ->
            if (task.isSuccessful) Timber.d("Subscribed to $topic")
        }
}

fun unsubscribeFromTopic(topic: String) {
    FirebaseMessaging.getInstance().unsubscribeFromTopic(topic)
}
```

## Best Practices

- **Token refresh**: Handle `onNewToken()` for token rotation; devices get new tokens after app reinstall or cache clearing.
- **Data messages vs. notification messages**: Use data-only messages for full control over display logic in your `onMessageReceived`.
- **Silent notifications**: Use background data messages (no notification payload) to trigger silent data syncs.
- **Unsubscribe option**: Always give users granular control over their notification preferences in-app.
- **Badge count**: Update the app icon badge count when notifications arrive.
