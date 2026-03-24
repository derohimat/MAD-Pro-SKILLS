# App Shortcuts Skills

App shortcuts let users jump directly to key actions from the home screen launcher. They come in static, dynamic, and pinned variants.

## 1. Static Shortcuts

Declared in XML — ideal for fixed, common actions like "New Order", "Scan QR".

```xml
<!-- res/xml/shortcuts.xml -->
<shortcuts xmlns:android="http://schemas.android.com/apk/res/android">
    <shortcut
        android:shortcutId="new_order"
        android:enabled="true"
        android:icon="@drawable/ic_shortcut_order"
        android:shortcutShortLabel="@string/shortcut_new_order_short"
        android:shortcutLongLabel="@string/shortcut_new_order_long">
        <intent
            android:action="android.intent.action.VIEW"
            android:targetPackage="com.example.app"
            android:targetClass="com.example.app.MainActivity"
            android:data="myapp://orders/new" />
        <categories android:name="android.shortcut.conversation" />
    </shortcut>
</shortcuts>

<!-- In AndroidManifest.xml, inside your launcher <activity> -->
<!-- <meta-data
    android:name="android.app.shortcuts"
    android:resource="@xml/shortcuts" /> -->
```

## 2. Dynamic Shortcuts

Add/update shortcuts at runtime based on user behavior (e.g., recently viewed products, last chat contacts).

```kotlin
class ShortcutManager @Inject constructor(@ApplicationContext private val context: Context) {
    private val manager = context.getSystemService(ShortcutManager::class.java)

    fun updateRecentContacts(contacts: List<Contact>) {
        val shortcuts = contacts.take(4).map { contact ->
            ShortcutInfo.Builder(context, "contact_${contact.id}")
                .setShortLabel(contact.name)
                .setLongLabel("Message ${contact.name}")
                .setIcon(Icon.createWithAdaptiveBitmap(contact.avatarBitmap))
                .setIntent(
                    Intent(Intent.ACTION_VIEW, "myapp://chat/${contact.id}".toUri())
                        .setClass(context, MainActivity::class.java)
                )
                .setPersons(arrayOf(Person.Builder().setName(contact.name).build()))
                .build()
        }
        manager?.dynamicShortcuts = shortcuts
    }

    fun addRecentProduct(product: Product) {
        val shortcut = ShortcutInfo.Builder(context, "product_${product.id}")
            .setShortLabel(product.name)
            .setLongLabel("View ${product.name}")
            .setIcon(Icon.createWithResource(context, R.drawable.ic_product))
            .setIntent(Intent(Intent.ACTION_VIEW, "myapp://product/${product.id}".toUri()).setClass(context, MainActivity::class.java))
            .build()
        manager?.pushDynamicShortcut(shortcut) // pushDynamicShortcut respects the limit automatically
    }

    fun removeShortcut(id: String) = manager?.removeDynamicShortcuts(listOf(id))
}
```

## 3. Pinned Shortcuts

Ask the user to pin a specific action to their home screen (e.g., a saved address, a favorite contact).

```kotlin
fun pinShortcut(context: Context, label: String, deepLink: String) {
    val manager = context.getSystemService(ShortcutManager::class.java) ?: return
    if (!manager.isRequestPinShortcutSupported) return

    val shortcut = ShortcutInfo.Builder(context, "pinned_${System.currentTimeMillis()}")
        .setShortLabel(label)
        .setIcon(Icon.createWithResource(context, R.drawable.ic_pin))
        .setIntent(Intent(Intent.ACTION_VIEW, deepLink.toUri()).setClass(context, MainActivity::class.java))
        .build()

    val callback = manager.createShortcutResultIntent(shortcut)
    val successPendingIntent = PendingIntent.getBroadcast(context, 0, callback, PendingIntent.FLAG_IMMUTABLE)
    manager.requestPinShortcut(shortcut, successPendingIntent.intentSender)
}
```

## 4. Handling Shortcut Intents

Process the deep link from a shortcut intent in your NavHost.

```kotlin
@Composable
fun AppNavHost(navController: NavHostController, intent: Intent?) {
    // Handle shortcut deep link on launch
    LaunchedEffect(intent) {
        intent?.data?.let { uri ->
            navController.navigate(uri)
        }
    }
    NavHost(navController = navController, startDestination = "home") {
        composable("home") { HomeScreen() }
        composable("orders/new") { NewOrderScreen() }
        composable("product/{id}") { backStackEntry ->
            ProductDetailScreen(id = backStackEntry.arguments?.getString("id") ?: "")
        }
        composable("chat/{contactId}") { backStackEntry ->
            ChatScreen(contactId = backStackEntry.arguments?.getString("contactId") ?: "")
        }
    }
}
```

## 5. Shortcut Usage Reporting

Report shortcut usage so the system can learn and surface them intelligently.

```kotlin
fun reportShortcutUsed(context: Context, shortcutId: String) {
    context.getSystemService(ShortcutManager::class.java)?.reportShortcutUsed(shortcutId)
}
```

## Best Practices

- **Max 4 shortcuts**: The system enforces a limit; prioritize the most common actions.
- **Use `pushDynamicShortcut`**: Prefer `push` over `setDynamicShortcuts` to avoid clearing existing ones.
- **Deep links first**: Build your shortcut actions on top of your existing deep link infrastructure.
- **Ranking**: Dynamic shortcuts are ranked; put the most important ones first.
- **Icons**: Use adaptive vector icons (24dp) for consistent rendering across launchers.
