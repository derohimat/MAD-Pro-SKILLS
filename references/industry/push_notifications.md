# Skill: Push Notifications (FCM)

Firebase Cloud Messaging (FCM) is the standard for Android push notifications.

## 🔔 Architecture: Data vs Notification Payloads

Always send **Data Payloads** from your backend, *never* Notification Payloads.

- Notification payloads are intercepted by the OS when the app is in the background and shown with a standard layout.
- **Data payloads** always wake up `FirebaseMessagingService`, allowing you to completely customize the UI and trigger background sync logic.

## 📨 Execution: FirebaseMessagingService

Process intense data syncs in `WorkManager` instead of holding up the `onMessageReceived` thread.

```kotlin
class AppFirebaseMessagingService : FirebaseMessagingService() {

    override fun onNewToken(token: String) {
        // Send to backend whenever token rotates
        TokenRepository.syncToken(token)
    }

    override fun onMessageReceived(message: RemoteMessage) {
        val type = message.data["type"]
        
        when (type) {
            "CHAT_MESSAGE" -> {
                // Instantly sync the DB
                val chatId = message.data["chatId"]
                val workRequest = OneTimeWorkRequestBuilder<SyncChatWorker>()
                    .setInputData(workDataOf("chatId" to chatId))
                    .build()
                WorkManager.getInstance(this).enqueue(workRequest)
                
                // Show custom notification
                showChatNotification(message.data)
            }
            "PROMO" -> showPromoNotification(message.data)
        }
    }
}
```

## 🔕 Notification Channels (Android 8+)

Group notifications properly so users can disable Promos without disabling Chat messages.

```kotlin
fun createChannels(context: Context) {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val manager = context.getSystemService(NotificationManager::class.java)
        
        val chatChannel = NotificationChannel(
            "channel_chat", "Chat Messages", NotificationManager.IMPORTANCE_HIGH
        ).apply { description = "Direct messages from users" }
        
        val promoChannel = NotificationChannel(
            "channel_promo", "Promotions", NotificationManager.IMPORTANCE_LOW
        ).apply { description = "Offers and discounts" }
        
        manager.createNotificationChannels(listOf(chatChannel, promoChannel))
    }
}
```
