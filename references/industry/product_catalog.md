# Industry: Product Catalog & E-Commerce

Catalog screens in E-Commerce need to handle massive, infinitely scrolling datasets with heavy imagery, filters, and dynamic pricing.

## 🏛️ Architecture: Paged Data & Caching

Use Android's Paging 3 library backed by Room Database for offline support and smooth scrolling.

```kotlin
@OptIn(ExperimentalPagingApi::class)
class ProductRemoteMediator(
    private val db: AppDatabase,
    private val api: CatalogApi
) : RemoteMediator<Int, ProductEntity>() {
    
    override suspend fun load(
        loadType: LoadType,
        state: PagingState<Int, ProductEntity>
    ): MediatorResult {
        // Handle pagination logic, clear DB on refresh, insert new network data
    }
}
```

## 🖼️ UI Execution: Fast Image Loading with Coil

Optimizing image loading is the single most important factor for an e-commerce catalog's performance.

```kotlin
@Composable
fun ProductCard(product: Product) {
    Card(onClick = { /* Navigate to detail */ }) {
        Column {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(product.imageUrl)
                    .crossfade(true)
                    .size(Size.ORIGINAL) // Or precise thumbnail size
                    .memoryCachePolicy(CachePolicy.ENABLED)
                    .diskCachePolicy(CachePolicy.ENABLED)
                    .build(),
                contentDescription = product.name,
                contentScale = ContentScale.Crop,
                modifier = Modifier.height(200.dp).fillMaxWidth()
            )
            Text(product.name, style = MaterialTheme.typography.titleMedium)
            Text(product.formattedPrice, style = MaterialTheme.typography.bodyLarge)
        }
    }
}
```

## 🔍 Filtering & Search

Manage complex filter states using a dedicated state holder.

```kotlin
data class CatalogFilterState(
    val categoryIds: Set<String> = emptySet(),
    val priceRange: ClosedFloatingPointRange<Float> = 0f..1000f,
    val sortBy: SortOption = SortOption.RELEVANCE
)
```
