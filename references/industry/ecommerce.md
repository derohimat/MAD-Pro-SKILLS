# E-Commerce App Skills

Building e-commerce apps requires mastery of catalog browsing, cart management, checkout flows, and order lifecycle.

## 1. Product Grid & List Toggle

Allow users to switch between grid and list views for browsing products.

```kotlin
@Composable
fun ProductCatalogScreen(viewModel: CatalogViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    var isGridView by rememberSaveable { mutableStateOf(true) }

    Scaffold(
        topBar = {
            CatalogTopBar(
                isGridView = isGridView,
                onToggleView = { isGridView = !isGridView }
            )
        }
    ) { padding ->
        if (isGridView) {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp),
                modifier = Modifier.padding(padding)
            ) {
                items(state.products, key = { it.id }) { product ->
                    ProductGridCard(product = product, onAddToCart = viewModel::addToCart)
                }
            }
        } else {
            LazyColumn(contentPadding = PaddingValues(16.dp), modifier = Modifier.padding(padding)) {
                items(state.products, key = { it.id }) { product ->
                    ProductListCard(product = product, onAddToCart = viewModel::addToCart)
                }
            }
        }
    }
}
```

## 2. Cart Management

Use a shared `CartViewModel` (scoped to the NavGraph) to share cart state across screens.

```kotlin
data class CartUiState(
    val items: List<CartItem> = emptyList(),
    val subtotal: Double = 0.0,
    val discount: Double = 0.0,
    val total: Double = 0.0,
    val itemCount: Int = 0
)

// In ViewModel
fun addToCart(product: Product, quantity: Int = 1) {
    _uiState.update { state ->
        val existing = state.items.find { it.product.id == product.id }
        val updatedItems = if (existing != null) {
            state.items.map {
                if (it.product.id == product.id) it.copy(quantity = it.quantity + quantity) else it
            }
        } else {
            state.items + CartItem(product = product, quantity = quantity)
        }
        state.copy(items = updatedItems).recalculate()
    }
}
```

## 3. Checkout Stepper

Break the checkout into clear steps: Address → Shipping → Payment → Confirm.

```kotlin
@Composable
fun CheckoutStepper(currentStep: Int, steps: List<String>) {
    Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        steps.forEachIndexed { index, label ->
            val isDone = index < currentStep
            val isActive = index == currentStep
            StepNode(label = label, isDone = isDone, isActive = isActive)
            if (index < steps.lastIndex) {
                Divider(
                    modifier = Modifier.weight(1f),
                    color = if (isDone) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline
                )
            }
        }
    }
}
```

## 4. Order Tracking

Display order status with a timeline-style progress indicator.

```kotlin
enum class OrderStatus { PLACED, CONFIRMED, PACKED, SHIPPED, DELIVERED }

@Composable
fun OrderTimeline(currentStatus: OrderStatus) {
    Column(modifier = Modifier.padding(16.dp)) {
        OrderStatus.entries.forEachIndexed { index, status ->
            val isPast = status.ordinal <= currentStatus.ordinal
            OrderTimelineStep(
                label = status.displayName,
                isPast = isPast,
                isLast = index == OrderStatus.entries.lastIndex
            )
        }
    }
}
```

## 5. Wishlist

Persist wishlist locally with Room and sync with backend. Use a heart-toggle animation.

```kotlin
@Composable
fun WishlistButton(isWishlisted: Boolean, onToggle: () -> Unit) {
    val scale by animateFloatAsState(
        targetValue = if (isWishlisted) 1.2f else 1f,
        animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy)
    )
    IconButton(onClick = onToggle) {
        Icon(
            imageVector = if (isWishlisted) Icons.Filled.Favorite else Icons.Outlined.FavoriteBorder,
            contentDescription = "Wishlist",
            tint = if (isWishlisted) Color.Red else MaterialTheme.colorScheme.onSurface,
            modifier = Modifier.scale(scale)
        )
    }
}
```

## 6. Promo Code / Voucher

```kotlin
@Composable
fun PromoCodeField(onApply: (String) -> Unit) {
    var code by remember { mutableStateOf("") }
    Row(modifier = Modifier.fillMaxWidth()) {
        OutlinedTextField(
            value = code,
            onValueChange = { code = it.uppercase() },
            label = { Text("Promo Code") },
            modifier = Modifier.weight(1f)
        )
        Spacer(modifier = Modifier.width(8.dp))
        Button(onClick = { onApply(code) }, modifier = Modifier.align(Alignment.CenterVertically)) {
            Text("Apply")
        }
    }
}
```

## Best Practices

- **Optimistic UI**: Update cart count immediately on add; revert on API error.
- **Out of Stock**: Disable "Add to Cart" and show clear messaging for unavailable items.
- **Deep linking**: Support deep links to product detail pages (`/product/{id}`).
- **Image caching**: Use Coil with a disk cache for product images.
- **Pagination**: Use Paging 3 library for large product catalogs.
