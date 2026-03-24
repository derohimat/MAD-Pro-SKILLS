# Product Catalog Skills

Advanced techniques for building rich, performant product browsing experiences.

## 1. Paging 3 for Infinite Scroll

Use the Paging 3 library to efficiently load large product lists from a paginated API.

```kotlin
// DataSource
class ProductPagingSource(private val api: ProductApiService) : PagingSource<Int, Product>() {
    override suspend fun load(params: LoadParams<Int>): LoadResult<Int, Product> {
        val page = params.key ?: 1
        return try {
            val response = api.getProducts(page = page, pageSize = params.loadSize)
            LoadResult.Page(
                data = response.products,
                prevKey = if (page == 1) null else page - 1,
                nextKey = if (response.isLastPage) null else page + 1
            )
        } catch (e: Exception) {
            LoadResult.Error(e)
        }
    }
    override fun getRefreshKey(state: PagingState<Int, Product>) = state.anchorPosition
}

// ViewModel
val products: Flow<PagingData<Product>> = Pager(PagingConfig(pageSize = 20)) {
    ProductPagingSource(productApi)
}.flow.cachedIn(viewModelScope)
```

## 2. Filter & Sort Bottom Sheet

```kotlin
@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FilterBottomSheet(
    state: FilterUiState,
    onApply: (FilterUiState) -> Unit,
    onDismiss: () -> Unit
) {
    val sheetState = rememberModalBottomSheetState(skipPartiallyExpanded = true)
    ModalBottomSheet(onDismissRequest = onDismiss, sheetState = sheetState) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text("Filter & Sort", style = MaterialTheme.typography.titleLarge)
            Spacer(modifier = Modifier.height(12.dp))
            Text("Price Range")
            RangeSlider(
                value = state.priceRange,
                onValueChange = { /* update local state */ },
                valueRange = 0f..10_000_000f
            )
            Text("Category")
            CategoryChipGroup(selected = state.category, onSelect = { /* update */ })
            Spacer(modifier = Modifier.height(16.dp))
            Button(onClick = { onApply(state) }, modifier = Modifier.fillMaxWidth()) {
                Text("Apply Filters")
            }
        }
    }
}
```

## 3. Search with Debounce

Debounce the search query to avoid overwhelming the API with every keystroke.

```kotlin
// ViewModel
private val _searchQuery = MutableStateFlow("")
val searchResults = _searchQuery
    .debounce(300L)
    .distinctUntilChanged()
    .flatMapLatest { query ->
        if (query.isBlank()) flowOf(emptyList())
        else productRepository.search(query)
    }
    .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

// UI
SearchBar(
    query = searchQuery,
    onQueryChange = viewModel::onSearchQueryChange,
    onSearch = {},
    active = false,
    onActiveChange = {}
) { }
```

## 4. Product Image Gallery with Zoom

```kotlin
@Composable
fun ProductImageGallery(imageUrls: List<String>) {
    val pagerState = rememberPagerState(pageCount = { imageUrls.size })
    Column {
        HorizontalPager(state = pagerState, modifier = Modifier.fillMaxWidth().aspectRatio(1f)) { page ->
            ZoomableAsyncImage(model = imageUrls[page], contentDescription = "Product image ${page + 1}")
        }
        Spacer(modifier = Modifier.height(8.dp))
        // Dot indicator
        Row(
            Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.Center
        ) {
            repeat(imageUrls.size) { index ->
                val isSelected = pagerState.currentPage == index
                Box(
                    modifier = Modifier
                        .padding(2.dp)
                        .size(if (isSelected) 10.dp else 6.dp)
                        .clip(CircleShape)
                        .background(if (isSelected) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.outline)
                )
            }
        }
    }
}
```

## 5. Sticky Category Header

Combine a `LazyColumn` with `stickyHeader` to keep category labels visible while scrolling.

```kotlin
@Composable
fun GroupedProductList(grouped: Map<String, List<Product>>) {
    LazyColumn {
        grouped.forEach { (category, products) ->
            stickyHeader {
                Surface(color = MaterialTheme.colorScheme.surfaceVariant) {
                    Text(
                        text = category,
                        style = MaterialTheme.typography.labelLarge,
                        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp)
                    )
                }
            }
            items(products, key = { it.id }) { product ->
                ProductListCard(product = product)
            }
        }
    }
}
```

## 6. Skeleton Loading

Show skeleton placeholders while products are loading for a better perceived performance.

```kotlin
@Composable
fun ProductCardSkeleton() {
    val shimmerColor = MaterialTheme.colorScheme.surfaceVariant
    Card(modifier = Modifier.fillMaxWidth()) {
        Column {
            Box(modifier = Modifier.fillMaxWidth().aspectRatio(1f).background(shimmerColor))
            Column(modifier = Modifier.padding(12.dp)) {
                Box(modifier = Modifier.fillMaxWidth(0.7f).height(16.dp).background(shimmerColor))
                Spacer(modifier = Modifier.height(8.dp))
                Box(modifier = Modifier.fillMaxWidth(0.4f).height(14.dp).background(shimmerColor))
            }
        }
    }
}
```

## Best Practices

- **Stable keys**: Always use `key = { it.id }` in `LazyColumn`/`LazyGrid` to enable stable diffing.
- **Image placeholder**: Show a low-res placeholder before the full image loads.
- **Accessibility**: Add `contentDescription` to product images with product name.
- **Empty state**: Design a friendly empty state UI for zero search results.
