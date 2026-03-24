# Point of Sale (POS) & Retail Skills

POS apps run on Android tablets/phones at checkout counters, managing transactions, inventory, receipts, and Bluetooth printer integration.

## 1. POS Checkout UI

```kotlin
@Composable
fun PosCheckoutScreen(viewModel: PosViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Row(modifier = Modifier.fillMaxSize()) {
        // Product catalog (left panel)
        ProductCatalogPanel(
            categories = state.categories,
            products = state.filteredProducts,
            onProductTap = viewModel::addToCart,
            modifier = Modifier.weight(1.6f).fillMaxHeight()
        )
        VerticalDivider()
        // Cart & payment (right panel)
        CartPanel(
            cartItems = state.cartItems,
            subtotal = state.subtotal,
            tax = state.tax,
            total = state.total,
            onQuantityChange = viewModel::updateQuantity,
            onRemove = viewModel::removeFromCart,
            onDiscount = viewModel::applyDiscount,
            onCharge = viewModel::proceedToPayment,
            modifier = Modifier.weight(1f).fillMaxHeight()
        )
    }
}
```

## 2. Cart Management

```kotlin
@Composable
fun CartPanel(cartItems: List<CartItem>, subtotal: Double, tax: Double, total: Double, onCharge: () -> Unit, modifier: Modifier = Modifier, ...) {
    Column(modifier = modifier.background(MaterialTheme.colorScheme.surfaceVariant)) {
        // Cart items
        LazyColumn(modifier = Modifier.weight(1f), contentPadding = PaddingValues(8.dp)) {
            items(cartItems, key = { it.id }) { item ->
                CartItemRow(
                    item = item,
                    onIncrease = { onQuantityChange(item.id, item.quantity + 1) },
                    onDecrease = { if (item.quantity > 1) onQuantityChange(item.id, item.quantity - 1) else onRemove(item.id) },
                    onRemove = { onRemove(item.id) }
                )
            }
        }
        HorizontalDivider()
        // Totals
        Column(modifier = Modifier.padding(16.dp)) {
            TotalRow("Subtotal", "Rp ${subtotal.formatCurrency()}")
            TotalRow("Tax (11%)", "Rp ${tax.formatCurrency()}")
            HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
            TotalRow("TOTAL", "Rp ${total.formatCurrency()}", isBold = true)
            Spacer(Modifier.height(12.dp))
            Button(onClick = onCharge, modifier = Modifier.fillMaxWidth().height(56.dp), enabled = cartItems.isNotEmpty()) {
                Icon(Icons.Default.Payment, null)
                Spacer(Modifier.width(8.dp))
                Text("Charge Rp ${total.formatCurrency()}", style = MaterialTheme.typography.titleMedium)
            }
        }
    }
}
```

## 3. Payment Method Selection

```kotlin
@Composable
fun PaymentMethodDialog(total: Double, onPaymentSelected: (PaymentMethod) -> Unit, onDismiss: () -> Unit) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Payment Method") },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                PaymentMethod.entries.forEach { method ->
                    Card(modifier = Modifier.fillMaxWidth().clickable { onPaymentSelected(method) }) {
                        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(method.icon, null, tint = MaterialTheme.colorScheme.primary)
                            Spacer(Modifier.width(12.dp))
                            Text(method.displayName, fontWeight = FontWeight.SemiBold)
                            Spacer(Modifier.weight(1f))
                            if (method == PaymentMethod.CASH) Text("Rp ${total.formatCurrency()}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }
        },
        confirmButton = {}
    )
}

enum class PaymentMethod(val displayName: String, val icon: ImageVector) {
    CASH("Cash", Icons.Default.Money),
    QRIS("QRIS", Icons.Default.QrCode),
    EDC("EDC / Card", Icons.Default.CreditCard),
    TRANSFER("Bank Transfer", Icons.Default.AccountBalance)
}
```

## 4. Bluetooth Receipt Printing

```kotlin
class ReceiptPrinter @Inject constructor() {
    private var bluetoothSocket: BluetoothSocket? = null

    fun connect(printerAddress: String): Boolean {
        return try {
            val device = BluetoothAdapter.getDefaultAdapter().getRemoteDevice(printerAddress)
            bluetoothSocket = device.createRfcommSocketToServiceRecord(UUID.fromString("00001101-0000-1000-8000-00805F9B34FB"))
            bluetoothSocket?.connect()
            true
        } catch (e: Exception) { false }
    }

    fun printReceipt(receipt: Receipt) {
        val outputStream = bluetoothSocket?.outputStream ?: return
        val esc = 0x1B.toByte(); val gs = 0x1D.toByte()
        val commands = buildList {
            // Center align + bold title
            add(byteArrayOf(esc, 'a'.code.toByte(), 1)) // Center
            add(byteArrayOf(esc, 'E'.code.toByte(), 1)) // Bold
            add("${receipt.storeName}\n".toByteArray(Charsets.UTF_8))
            add(byteArrayOf(esc, 'E'.code.toByte(), 0)) // Bold off
            add(byteArrayOf(esc, 'a'.code.toByte(), 0)) // Left align
            add("-".repeat(32).plus("\n").toByteArray())
            // Items
            receipt.items.forEach { item ->
                add("${item.name}\n${item.quantity}x ${item.price.formatCurrency().padStart(20)}\n".toByteArray())
            }
            add("-".repeat(32).plus("\n").toByteArray())
            add("TOTAL        Rp ${receipt.total.formatCurrency()}\n".toByteArray())
            add("-".repeat(32).plus("\n").toByteArray())
            add("Thank you!\n\n\n".toByteArray())
            // Cut paper
            add(byteArrayOf(gs, 'V'.code.toByte(), 66, 0))
        }
        commands.forEach { outputStream.write(it) }
        outputStream.flush()
    }

    fun disconnect() = bluetoothSocket?.close()
}
```

## 5. Inventory Management

```kotlin
@Composable
fun InventoryScreen(viewModel: InventoryViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Scaffold(
        floatingActionButton = { ExtendedFloatingActionButton(onClick = viewModel::addProduct, icon = { Icon(Icons.Default.Add, null) }, text = { Text("Add Product") }) }
    ) { padding ->
        LazyColumn(contentPadding = PaddingValues(16.dp), modifier = Modifier.padding(padding)) {
            // Low stock warning
            if (state.lowStockItems.isNotEmpty()) {
                item {
                    Card(colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.errorContainer), modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)) {
                        Text("⚠ ${state.lowStockItems.size} items are low on stock", modifier = Modifier.padding(12.dp), color = MaterialTheme.colorScheme.onErrorContainer)
                    }
                }
            }
            items(state.products, key = { it.id }) { product ->
                ProductInventoryItem(product = product, onEdit = { viewModel.editProduct(it) }, onAdjustStock = { viewModel.adjustStock(it) })
            }
        }
    }
}
```

## Best Practices

- **Offline-first**: POS must work without internet. Cache all products in Room and sync sales to the server when connected.
- **Transaction integrity**: Use database transactions when saving a sale to ensure cart items and stock updates are atomic.
- **Printer compatibility**: Test with common ESC/POS printer brands (Epson, Star Micronics, Goojprt).
- **Cash drawer trigger**: Send a specific ESC/POS command sequence to trigger connected cash drawers on successful payment.
- **Daily reports**: Pre-aggregate daily totals on the device to enable instant report generation without a server call.
